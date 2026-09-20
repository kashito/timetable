"""Safe adaptation of brain's lolipop-ssh-deploy template (Python stdlib only).

Build only Git blobs, preview with actual rsync --dry-run, and gate every write.
Default command is preview. Local reports/payloads must live outside the repo.
"""
import argparse
import fnmatch
import hashlib
import io
import inspect
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import subprocess
import sys
import tarfile
import uuid

from healthcheck import healthcheck

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
EXPECTED_ROOT = '/home/users/0/lolipop.jp-dp30304343/web/2026summer'
EXPECTED_HOST = 'ssh.lolipop.jp'
EXPECTED_USER = 'lolipop.jp-dp30304343'
REMOTE_PYTHON = '/usr/local/bin/python3'
MANDATORY = {'**/data/***', '**/uploads/***', '**/student_uploads/***',
             '**/calendar_images/***', '**/board_guide_images/***', '**/codex_memo_images/***',
             '**/backup/***', '**/backups/***', '**/_backup/***', '**/_system_backups/***',
             '**/recovery_hold_*/***', '**/.secrets/***', '**/.ssh/***',
             '**/secrets/***', '**/credentials/***', '**/_auth_recovery/***',
             '**/sessions/***', '**/logs/***', '**/cache/***',
             'site_private_settings.php', 'staff_setup_key.php', 'password-config.php',
             '.env', '.env.*', '*.key', '*.pem', '*.log', '*.sqlite*', '*.db',
             '*.bak', '*.bak.*', '*.backup', '*.backup.*', '*.zip',
             'schedule*.xlsx', 'schedule*.xls', '**/.git/***', '**/.github/***', '**/.deploy/***'}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def run(args, **kwargs):
    result = subprocess.run([str(x) for x in args], capture_output=True, **kwargs)
    require(result.returncode == 0, 'Command failed: ' + Path(str(args[0])).name
            + '\n' + result.stderr.decode('utf-8', errors='replace')[:3000])
    return result.stdout


def git(*args):
    # git archive also applies core.autocrlf. Force stable bytes on Windows/Linux
    # without changing the user's Git configuration, then verify every blob below.
    return run(['git', '-c', 'safe.directory=' + REPO.as_posix(),
                '-c', 'core.autocrlf=false', '-c', 'core.eol=lf', '-C', REPO, *args])


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_config():
    config = {}
    for line in (HERE / 'lolipop-config.env').read_text(encoding='utf-8').splitlines():
        if not line or line.startswith('#'):
            continue
        key, value = line.split('=', 1)
        require(key not in config, 'Duplicate setting')
        config[key] = value
    require(config == {'APP_NAME': 'timetable', 'REMOTE_PATH': EXPECTED_ROOT,
                       'SSH_PORT': '2222', 'HEALTHCHECK_URL': 'https://224236.com/2026summer/'},
            'Unexpected application target; refusing to continue')
    return config


def load_rules():
    rules = [s.strip() for s in (HERE / 'lolipop-excludes.txt').read_text(encoding='utf-8').splitlines()
             if s.strip() and not s.lstrip().startswith('#')]
    require(MANDATORY.issubset(rules), 'Mandatory server-data exclusions are missing')
    for rule in rules:
        require('..' not in rule and not any(c.isspace() for c in rule)
                and ('/' not in rule or rule.startswith('/') or
                     (rule.startswith('**/') and rule.endswith('/***'))), 'Unsupported exclusion rule')
    return rules


def excluded(path, rules):
    # Deliberately limited grammar, shared with rsync and covered by fixture tests.
    # Case-insensitive here as an additional conservative source-side protection.
    path = path.casefold()
    parts = path.split('/')
    for raw in rules:
        rule = raw.casefold()
        if rule.startswith('**/') and rule.endswith('/***'):
            if any(fnmatch.fnmatchcase(p, rule[3:-4]) for p in parts):
                return True
        elif rule.startswith('/'):
            if fnmatch.fnmatchcase(path, rule[1:]):
                return True
        elif any(fnmatch.fnmatchcase(p, rule) for p in parts):
            return True
    return False


def safe_path(path):
    p = PurePosixPath(path)
    require(path and not p.is_absolute() and str(p) == path and
            not any(x in ('', '.', '..') for x in path.split('/')) and
            not any(c in path for c in ('\\', ':', '|', '\r', '\n', '\x00')),
            'Unsafe repository path')


def policy_hash():
    return sha(b'\x00'.join((HERE / name).read_bytes() for name in
                           ('deploy.py', 'remote_probe.py', 'remote_transaction.py', 'healthcheck.py',
                            'lolipop-config.env', 'lolipop-excludes.txt')))


def build(output, ref):
    load_config()
    rules = load_rules()
    require(not output.exists(), 'Use a new output directory; existing results are never erased')
    commit = git('rev-parse', '--verify', ref + '^{commit}').decode().strip()
    require(re.fullmatch('[0-9a-f]{40}', commit), 'Invalid commit')
    # Reading a Git archive cannot accidentally include untracked/ignored live data.
    archive = git('archive', '--format=tar', commit)
    blobs = {}
    for row in git('ls-tree', '-r', '-z', commit).split(b'\0'):
        if row:
            metadata, name = row.split(b'\t', 1)
            blobs[name.decode('utf-8')] = metadata.split()[2].decode()
    files, skipped = {}, []
    with tarfile.open(fileobj=io.BytesIO(archive), mode='r:') as tar:
        for entry in tar.getmembers():
            path = entry.name.rstrip('/')
            safe_path(path)
            require(entry.isdir() or entry.isfile(), 'Symlinks and special files cannot be deployed')
            if entry.isdir():
                continue
            if excluded(path, rules):
                skipped.append(path)
                continue
            data = tar.extractfile(entry).read()
            blob_id = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
            require(blob_id == blobs[path], 'Archive changed Git blob bytes; check Git filters/attributes')
            files[path] = data
    require(files, 'Empty deployment payload')
    # Defense in depth: forced additions of ignored data must not enter a payload.
    ignored = subprocess.run(['git', '-c', 'safe.directory=' + REPO.as_posix(), '-C', str(REPO),
                              'check-ignore', '--no-index', '-z', '--stdin'],
                             input=b'\0'.join(p.encode() for p in files) + b'\0', capture_output=True)
    require(ignored.returncode in (0, 1) and not ignored.stdout,
            'A Git-ignored path entered the payload; review protection rules')
    output.mkdir(parents=True)
    payload = output / 'payload'
    payload.mkdir()
    for name, data in files.items():
        dest = payload / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    manifest = {'commit': commit, 'policy_sha256': policy_hash(),
                'files': {p: sha(b) for p, b in sorted(files.items())}, 'excluded_tracked': sorted(skipped)}
    write_json(output / 'manifest.json', manifest)
    print('Built {} source files from {} ({} tracked paths excluded)'.format(len(files), commit, len(skipped)))
    return manifest


def validate_payload(output):
    load_config()
    rules = load_rules()
    manifest = json.loads((output / 'manifest.json').read_text(encoding='utf-8'))
    require(manifest['policy_sha256'] == policy_hash(), 'Policy changed since build; rebuild preview')
    found = {}
    for path in (output / 'payload').rglob('*'):
        require(not path.is_symlink(), 'Payload symlink found')
        if not path.is_file():
            continue
        rel = path.relative_to(output / 'payload').as_posix()
        safe_path(rel)
        require(not excluded(rel, rules), 'Protected path entered payload')
        found[rel] = sha(path.read_bytes())
    require(found == manifest['files'] and found, 'Payload changed since build')
    return manifest


def ssh_command():
    require(os.environ.get('SSH_HOST') == EXPECTED_HOST and
            os.environ.get('SSH_USER') == EXPECTED_USER, 'Unexpected SSH destination')
    key = Path(os.environ.get('SSH_KEY_FILE', ''))
    known = Path(os.environ.get('SSH_KNOWN_HOSTS_FILE', ''))
    require(key.is_file() and known.is_file(), 'SSH key and pinned known_hosts files are required')
    return [os.environ.get('SSH_BIN', 'ssh'), '-p', '2222', '-i', key.as_posix(),
            '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
            '-o', 'UserKnownHostsFile=' + known.as_posix(), '-o', 'ConnectTimeout=20',
            '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=4']


def probe(manifest):
    source = (HERE / 'remote_probe.py').read_text(encoding='utf-8')
    source += '\nprint(json.dumps(probe(' + repr(EXPECTED_ROOT) + ', ' + repr(list(manifest['files'])) + ')))\n'
    response = run(ssh_command() + [EXPECTED_USER + '@' + EXPECTED_HOST, REMOTE_PYTHON + ' -'],
                   input=source.encode(), timeout=300)
    return json.loads(response)


def rsync_args(output, dry_run):
    require(dry_run, 'Direct production rsync writes are prohibited; use private staging')
    args = [os.environ.get('RSYNC_BIN', 'rsync'), '--recursive', '--checksum', '--itemize-changes',
            '--out-format=%i|%n', '--no-perms', '--no-owner', '--no-group', '--omit-dir-times',
            '--exclude-from=' + (HERE / 'lolipop-excludes.txt').as_posix()]
    if dry_run:
        args.append('--dry-run')
    args += ['-e', shlex.join(ssh_command()), 'payload/',
             EXPECTED_USER + '@' + EXPECTED_HOST + ':' + EXPECTED_ROOT + '/']
    # No --delete, --delete-excluded, --remove-source-files, --inplace or chmod.
    return args


def remote_transaction(request):
    source = 'import fnmatch\n' + inspect.getsource(excluded) + '\n'
    source += (HERE / 'remote_probe.py').read_text(encoding='utf-8') + '\n'
    source += (HERE / 'healthcheck.py').read_text(encoding='utf-8').split("\nif __name__ ==")[0] + '\n'
    source += (HERE / 'remote_transaction.py').read_text(encoding='utf-8') + '\n'
    source += 'print(json.dumps(dispatch(' + repr(request) + ')))\n'
    return json.loads(run(ssh_command() + [EXPECTED_USER + '@' + EXPECTED_HOST, REMOTE_PYTHON + ' -'],
                          input=source.encode(), timeout=300))


def stage_args(output, stage, run_id):
    expected = '/home/users/0/lolipop.jp-dp30304343/.timetable-deploy/' + run_id + '/incoming'
    require(stage == expected and re.fullmatch(r'[0-9a-f]{12}-[0-9a-f]{32}', run_id), 'Unsafe staging target')
    args = rsync_args(output, True)
    args.remove('--dry-run')
    args.insert(1, '--files-from=' + (output / 'transfer-files.txt').as_posix())
    args[-1] = EXPECTED_USER + '@' + EXPECTED_HOST + ':' + stage + '/'
    return args


def parse_changes(raw, manifest):
    changes = []
    dirs = {str(parent) + '/' for p in manifest['files'] for parent in PurePosixPath(p).parents
            if str(parent) != '.'}
    for line in raw.decode('utf-8').splitlines():
        if not line:
            continue
        require(len(line) > 12 and line[11] == '|', 'Unexpected rsync output; refusing deployment')
        code, path = line[:11], line[12:]
        require(not code.startswith('*'), 'Deletion is prohibited')
        if path in dirs and code == 'cd+++++++++':
            continue
        # In a push, rsync marks files sent TO the server with '<'.
        if not (path in manifest['files'] and code.startswith('<f')):
            # Only source-owned names may appear in public Actions logs.
            target = path if path in manifest['files'] or path in dirs or path == './' else 'unknown-sha256:' + sha(path.encode())[:16]
            raise RuntimeError('Unexpected rsync target: ' + json.dumps({'item': code, 'target': target}, ensure_ascii=True))
        require(not excluded(path, load_rules()), 'Protected rsync target')
        changes.append(path)
    require(len(changes) == len(set(changes)), 'Duplicate transfer path')
    return sorted(changes)


def preview(output):
    manifest = validate_payload(output)
    before = probe(manifest)
    write_json(output / 'remote-before.json', before)
    raw = run(rsync_args(output, True), cwd=output, timeout=300)
    (output / 'rsync-dry-run.txt').write_bytes(raw)
    changes = parse_changes(raw, manifest)
    expected = sorted(p for p, digest in manifest['files'].items() if before['files'].get(p) != digest)
    require(changes == expected, 'SSH content comparison and rsync dry-run disagree')
    after = probe(manifest)
    unchanged = before['all_digest'] == after['all_digest']
    result = {'commit': manifest['commit'], 'source_files': len(manifest['files']),
              'changed_files': changes, 'new_files': sorted(set(changes) - set(before['files'])),
              'protected_transfers': 0, 'deletions': 0, 'remote_files': before['file_count'],
              'retained_files': before['retained_count'], 'server_unchanged': unchanged,
              'private_settings': after['private_settings'],
              'ready_for_deploy': unchanged and after['private_settings'] == 'valid'}
    write_json(output / 'remote-after-preview.json', after)
    write_json(output / 'preview.json', result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    require(unchanged, 'Production changed during preview; inspect and retry. No writes performed.')
    return manifest, after, result


def deploy(output, confirmed_commit):
    # These checks happen BEFORE even opening the SSH connection.
    require(os.environ.get('LOLIPOP_DEPLOY_ENABLED') == 'true', 'Production deployment is disabled')
    manifest = validate_payload(output)
    require(confirmed_commit == manifest['commit'], 'Exact commit confirmation is required')
    manifest, before, result = preview(output)
    require(result['ready_for_deploy'], 'Private site settings missing/invalid; no files transferred')
    healthcheck()  # Do not deploy over an existing outage.
    changed = result['changed_files']
    require(len(changed) <= 500, 'Unexpectedly large program update; review before deploying')
    run_id = None
    applied = False
    if changed:
        run_id = manifest['commit'][:12] + '-' + uuid.uuid4().hex
        write_json(output / 'transaction.json', {'run_id': run_id, 'commit': manifest['commit']})
        prepared = remote_transaction({'action': 'prepare', 'run_id': run_id, 'commit': manifest['commit'],
            'rules': load_rules(), 'http_files': manifest['files'],
            'files': {p: {'old': before['files'].get(p), 'new': manifest['files'][p]} for p in changed}})
        (output / 'transfer-files.txt').write_text('\n'.join(changed) + '\n', encoding='utf-8')
        raw = run(stage_args(output, prepared['stage'], run_id), cwd=output, timeout=300)
        require(parse_changes(raw, manifest) == sorted(changed), 'Unexpected staging transfer')
        # The remote apply rolls back independently if its checks fail or SSH is interrupted.
        applied_result = remote_transaction({'action': 'apply', 'run_id': run_id})
        write_json(output / 'apply-result.json', applied_result)
        applied = True
    try:
        after = probe(manifest)
        require(after['files'] == manifest['files'], 'Post-deploy source verification failed')
        require(before['retained_digest'] == after['retained_digest'],
                'Server-owned files changed during deployment; data will never be restored/overwritten')
        checks = healthcheck(manifest['files'])  # Independent external HTTP check from the runner.
    except BaseException:
        if applied:
            restored = remote_transaction({'action': 'rollback', 'run_id': run_id})
            write_json(output / 'rollback-result.json', restored)
        raise
    write_json(output / 'deployed.json', {'commit': manifest['commit'], 'source_verified': True,
        'retained_files_unchanged': True, 'updated_programs': len(changed), 'deletions': 0,
        'run_id': run_id, 'http_checks': checks})
    print(json.dumps({'commit': manifest['commit'], 'updated_programs': len(changed),
                      'protected_transfers': 0, 'deletions': 0, 'run_id': run_id,
                      'http_checks_passed': len(checks)}, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('build', 'preview', 'deploy', 'rollback', 'status'), nargs='?', default='preview')
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--ref', default='HEAD')
    parser.add_argument('--confirm-commit', default='')
    parser.add_argument('--transaction', default='')
    args = parser.parse_args()
    output = args.output.resolve()
    require(output != REPO and REPO not in output.parents, 'Output must be outside the repository')
    if args.command == 'build':
        build(output, args.ref)
    elif args.command == 'preview':
        preview(output)
    elif args.command == 'deploy':
        deploy(output, args.confirm_commit)
    else:
        require(re.fullmatch(r'[0-9a-f]{12}-[0-9a-f]{32}', args.transaction), 'Transaction ID required')
        result = remote_transaction({'action': args.command, 'run_id': args.transaction})
        print(json.dumps(result))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, ValueError, subprocess.TimeoutExpired) as error:
        print('STOP: ' + str(error), file=sys.stderr)
        sys.exit(1)
