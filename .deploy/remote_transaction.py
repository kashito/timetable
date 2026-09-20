"""Private staging and recoverable PROGRAM-ONLY deployment, executed over SSH stdin.

The driver supplies excluded(), settings_status() and healthcheck() definitions
from the same reviewed source. No operational data is copied into the transaction.
"""
import contextlib
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import stat
import subprocess
import tempfile

LIVE = Path('/home/users/0/lolipop.jp-dp30304343/web/2026summer')
STORE = Path('/home/users/0/lolipop.jp-dp30304343/.timetable-deploy')
PHP = '/usr/local/bin/php7.4'


def must(ok, message):
    if not ok:
        raise RuntimeError(message)


def file_hash(path):
    with open(path, 'rb') as f:
        h = hashlib.sha256()
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
        return h.hexdigest()


def real_directory(path):
    must(path.is_dir() and path.resolve() == path, 'Directory missing or redirected')


def safe_target(name, rules):
    must(isinstance(name, str) and name and not name.startswith('/') and
         all(p not in ('', '.', '..') for p in name.split('/')) and
         not any(c in name for c in ('\\', ':', '|', '\r', '\n', '\x00')),
         'Unsafe deployment path')
    must(not excluded(name, rules), 'Protected path in transaction')
    real_directory(LIVE)
    target = LIVE / name
    cursor = LIVE
    for part in name.split('/'):
        cursor = cursor / part
        must(not cursor.is_symlink(), 'Destination symlink is prohibited')
        if cursor.exists():
            must(cursor.is_file() if cursor == target else cursor.is_dir(), 'Unexpected destination type')
    return target


def current_hash(path):
    return file_hash(path) if path.is_file() else None


def write_state(directory, state):
    # Only this new private transaction's state is replaced; backups are immutable.
    fd, name = tempfile.mkstemp(prefix='.state-', dir=str(directory))
    with os.fdopen(fd, 'w') as f:
        json.dump(state, f, ensure_ascii=True)
        f.flush()
        os.fsync(f.fileno())
    os.replace(name, str(directory / 'state.json'))


def transaction_dir(run_id):
    must(re.fullmatch(r'[0-9a-f]{12}-[0-9a-f]{32}', run_id), 'Invalid transaction ID')
    real_directory(STORE)
    directory = STORE / run_id
    real_directory(directory)
    return directory


@contextlib.contextmanager
def store_lock():
    import fcntl
    real_directory(STORE.parent)
    try:
        STORE.mkdir(mode=0o700)
    except FileExistsError:
        pass
    real_directory(STORE)
    must(STORE.stat().st_uid == os.geteuid() and stat.S_IMODE(STORE.stat().st_mode) == 0o700,
         'Private deploy store must be owned by SSH user with mode 700')
    lock = STORE / '.deploy.lock'
    fd = os.open(str(lock), os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'a') as handle:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def prepare(request):
    real_directory(LIVE)
    must(STORE.stat().st_dev == LIVE.stat().st_dev, 'Staging and live files must share a filesystem')
    must(settings_status(str(LIVE)) == 'valid', 'Private settings unavailable')
    run_id, files, rules = request['run_id'], request['files'], request['rules']
    must(re.fullmatch(r'[0-9a-f]{12}-[0-9a-f]{32}', run_id), 'Invalid transaction ID')
    must(files and len(files) <= 500, 'Unexpected update count')
    # An interrupted prior apply must be recovered before any subsequent release.
    for previous in STORE.glob('*/state.json'):
        status = json.loads(previous.read_text())['status']
        must(status not in ('applying', 'rolling_back', 'recovery_required'),
             'Previous transaction needs recovery; refusing a new deployment')
    for name, info in files.items():
        path = safe_target(name, rules)
        must(re.fullmatch(r'[0-9a-f]{64}', info['new']), 'Invalid source checksum')
        must(current_hash(path) == info['old'], 'Production code changed after preview')
    directory = STORE / run_id
    directory.mkdir(mode=0o700)  # Unique; never reuse another run or backup.
    (directory / 'incoming').mkdir(mode=0o700)
    (directory / 'previous').mkdir(mode=0o700)
    state = dict(request, status='prepared', applied=[], created_dirs=[])
    write_state(directory, state)
    return {'run_id': run_id, 'stage': str(directory / 'incoming'), 'status': 'prepared'}


def verify_stage(directory, state):
    actual = set()
    for path in (directory / 'incoming').rglob('*'):
        must(not path.is_symlink(), 'Staging symlink is prohibited')
        if path.is_file():
            actual.add(path.relative_to(directory / 'incoming').as_posix())
    must(actual == set(state['files']), 'Incomplete or unexpected staged files')
    for name, info in state['files'].items():
        path = directory / 'incoming' / name
        must(file_hash(path) == info['new'], 'Staged checksum mismatch')
        if name.endswith('.php'):
            result = subprocess.run([PHP, '-d', 'log_errors=0', '-l', str(path)],
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            must(result.returncode == 0, 'Production PHP syntax check failed: ' + name)


def rollback(directory, state):
    # Validate the WHOLE rollback first; never overwrite an unrelated later edit.
    for name, info in state['files'].items():
        target = safe_target(name, state['rules'])
        must(current_hash(target) in (info['old'], info['new']), 'Concurrent program edit: manual recovery needed')
        if info['old'] is not None:
            must(file_hash(directory / 'previous' / name) == info['old'], 'Backup integrity check failed')
    state['status'] = 'rolling_back'
    write_state(directory, state)
    for name, info in reversed(list(state['files'].items())):
        target = safe_target(name, state['rules'])
        if current_hash(target) == info['old']:
            continue
        if info['old'] is None:
            # This is only a new program file made by this transaction, never data.
            target.unlink()
        else:
            # Restore buffers, like backups, must remain outside the web root.
            fd, temporary = tempfile.mkstemp(prefix='.restore-', dir=str(directory))
            os.close(fd)
            try:
                shutil.copy2(str(directory / 'previous' / name), temporary)
                os.replace(temporary, str(target))
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
    for name in reversed(state.get('created_dirs', [])):
        try:
            (LIVE / name).rmdir()  # Empty directories CREATED BY THIS RUN only.
        except OSError:
            pass
    state['status'] = 'rolled_back'
    write_state(directory, state)
    return {'run_id': state['run_id'], 'status': 'rolled_back', 'programs_restored': len(state['files'])}


def apply(directory, state):
    must(state['status'] == 'prepared', 'Transaction cannot be applied in this state')
    must(settings_status(str(LIVE)) == 'valid', 'Private settings unavailable')
    verify_stage(directory, state)
    for name, info in state['files'].items():
        target = safe_target(name, state['rules'])
        must(current_hash(target) == info['old'], 'Production changed while staging')
        if info['old'] is not None:
            backup = directory / 'previous' / name
            backup.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            must(not backup.exists(), 'Backup already exists; refuse overwrite')
            shutil.copy2(str(target), str(backup))
            with open(backup, 'r+b') as durable:
                os.fsync(durable.fileno())
            must(file_hash(backup) == info['old'], 'Backup checksum mismatch')
            info['mode'] = stat.S_IMODE(target.stat().st_mode)
        else:
            info['mode'] = 0o644
    # Ensure there is no existing outage before touching any live program.
    healthcheck()
    state['status'] = 'applying'
    write_state(directory, state)
    try:
        for name, info in state['files'].items():
            target = safe_target(name, state['rules'])
            must(current_hash(target) == info['old'], 'Production changed before replacement')
            missing = []
            parent = target.parent
            while not parent.exists():
                missing.append(parent)
                parent = parent.parent
            for parent in reversed(missing):
                parent.mkdir(mode=0o755)
                state['created_dirs'].append(parent.relative_to(LIVE).as_posix())
            incoming = directory / 'incoming' / name
            os.chmod(str(incoming), info['mode'])
            os.replace(str(incoming), str(target))  # Atomic replacement of ONE verified program.
            state['applied'].append(name)
            write_state(directory, state)
        for name, info in state['files'].items():
            must(current_hash(safe_target(name, state['rules'])) == info['new'], 'Live checksum mismatch')
        checks = healthcheck(state.get('http_files'))
        state['status'] = 'applied'
        write_state(directory, state)
        return {'run_id': state['run_id'], 'status': 'applied', 'programs_updated': len(state['files']),
                'http_checks': checks, 'private_backup_retained': True}
    except BaseException:
        # Ignore further ordinary termination while restoring verified backups.
        for sig in (signal.SIGTERM, getattr(signal, 'SIGHUP', signal.SIGTERM)):
            signal.signal(sig, signal.SIG_IGN)
        try:
            rollback(directory, state)
        except BaseException:
            state['status'] = 'recovery_required'
            write_state(directory, state)
            raise RuntimeError('Automatic recovery could not finish; private backup retained') from None
        raise RuntimeError('Deployment failed; previous programs restored') from None


def dispatch(request):
    def interrupted(signum, frame):
        raise RuntimeError('Deployment interrupted')
    signal.signal(signal.SIGTERM, interrupted)
    if hasattr(signal, 'SIGHUP'):
        signal.signal(signal.SIGHUP, interrupted)
    with store_lock():
        if request['action'] == 'prepare':
            return prepare(request)
        directory = transaction_dir(request['run_id'])
        state = json.loads((directory / 'state.json').read_text())
        if request['action'] == 'apply':
            return apply(directory, state)
        if request['action'] == 'rollback':
            must(state['status'] in ('applied', 'applying', 'rolling_back', 'recovery_required'),
                 'Transaction does not need rollback')
            return rollback(directory, state)
        if request['action'] == 'status':
            return {'run_id': state['run_id'], 'status': state['status']}
        raise RuntimeError('Unknown transaction action')
