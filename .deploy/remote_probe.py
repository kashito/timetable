"""Read-only preflight, sent to python3 over SSH stdin; never installed remotely.

No PHP execution, temporary files, directory creation, chmod or data writes.
Only source file hashes and aggregate runtime hashes leave the server.
"""
import hashlib
import json
import os
import stat


def settings_status(root):
    path = os.path.join(root, 'data', 'site_private_settings.php')
    if not os.path.isfile(path):
        return 'missing'
    if os.path.islink(os.path.join(root, 'data')) or os.path.islink(path):
        return 'unsafe'
    try:
        with open(path, 'rb') as f:
            raw = f.read()
        # Require the same non-executable JSON storage envelope used by this app.
        prefix = b'<?php exit; ?>'
        if not raw.startswith(prefix):
            return 'invalid'
        data = json.loads(raw[len(prefix):].decode('utf-8').strip())
        if (type(data.get('schema')) is not int or data['schema'] != 1
                or not isinstance(data.get('initialAdminName'), str)
                or not data['initialAdminName'].strip()
                or not isinstance(data.get('payrollExcludedNames'), list)
                or not isinstance(data.get('teacherToneRules'), list)):
            return 'invalid'
        if any(not isinstance(n, str) or not n.strip()
               for n in data['payrollExcludedNames']):
            return 'invalid'
        tones = {'tone-pink', 'tone-blue', 'tone-orange', 'tone-yellow',
                 'tone-lime', 'tone-purple', 'tone-gray'}
        for rule in data['teacherToneRules']:
            if (not isinstance(rule, dict) or rule.get('match') not in ('exact', 'prefix')
                    or not isinstance(rule.get('name'), str) or not rule['name'].strip()
                    or rule.get('tone') not in tones):
                return 'invalid'
        return 'valid'
    except (OSError, ValueError, AttributeError, TypeError):
        return 'invalid'


def probe(root, paths):
    if os.path.realpath(root) != root or not os.path.isdir(root):
        raise RuntimeError('Destination must be the existing real application directory')
    wanted = set(paths)
    # Do not let an existing destination symlink redirect a source file into data/.
    for rel in wanted:
        parts = rel.split('/')
        if rel.startswith('/') or any(p in ('', '.', '..') for p in parts):
            raise RuntimeError('Unsafe source path')
        for i in range(1, len(parts) + 1):
            path = os.path.join(root, *parts[:i])
            if os.path.islink(path):
                raise RuntimeError('Destination symlink on an application path')
            if os.path.lexists(path):
                mode = os.lstat(path).st_mode
                if (i < len(parts) and not stat.S_ISDIR(mode)) or (
                        i == len(parts) and not stat.S_ISREG(mode)):
                    raise RuntimeError('Unexpected destination file type')
    all_entries, kept_entries, source_files = [], [], {}
    file_count = 0
    for base, dirs, files in os.walk(root, followlinks=False):
        dirs.sort()
        files.sort()
        for name in sorted(dirs + files):
            path = os.path.join(base, name)
            rel = os.path.relpath(path, root).replace(os.sep, '/')
            before = os.lstat(path)
            item = [rel, stat.S_IMODE(before.st_mode), before.st_mtime_ns]
            if stat.S_ISLNK(before.st_mode):
                item += ['symlink', os.readlink(path)]
            elif stat.S_ISDIR(before.st_mode):
                # File creation legitimately changes the parent directory mtime.
                item = [rel, stat.S_IMODE(before.st_mode), 'directory']
            elif stat.S_ISREG(before.st_mode):
                h = hashlib.sha256()
                with open(path, 'rb') as f:
                    for block in iter(lambda: f.read(1024 * 1024), b''):
                        h.update(block)
                after = os.stat(path)
                if (before.st_size, before.st_mtime_ns, before.st_ino) != (
                        after.st_size, after.st_mtime_ns, after.st_ino):
                    raise RuntimeError('Server data changed during inspection; retry later')
                item += ['file', before.st_size, h.hexdigest()]
                file_count += 1
                if rel in wanted:
                    source_files[rel] = h.hexdigest()
            else:
                raise RuntimeError('Unsupported server file type')
            all_entries.append(item)
            if rel not in wanted and not stat.S_ISDIR(before.st_mode):
                kept_entries.append(item)
    digest = lambda entries: hashlib.sha256(json.dumps(
        sorted(entries), separators=(',', ':'), ensure_ascii=True).encode()).hexdigest()
    return {'files': source_files, 'file_count': file_count,
            'retained_count': len(kept_entries), 'retained_digest': digest(kept_entries),
            'all_digest': digest(all_entries), 'private_settings': settings_status(root)}
