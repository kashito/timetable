"""Deployment safety tests. Uses a temporary local fixture; never connects to SSH."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location('deploy', HERE / 'deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)
spec2 = importlib.util.spec_from_file_location('remote_probe', HERE / 'remote_probe.py')
remote_probe = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(remote_probe)

PROTECTED = [
    'data/site_private_settings.php', 'data/.htaccess', 'data/lesson_records.json',
    'api/data/members.php', 'api/_auth_recovery/session_example.php',
    'uploads/photo.jpg', 'api/uploads/a.png', 'student_uploads/a.jpg',
    'calendar_images/a.jpg', 'board_guide_images/a.jpg', 'codex_memo_images/a.jpg',
    'imports/students.csv', 'exports/students.csv', 'staff_setup_key.php',
    'api/password-config.php', 'setup.local.php', '.secrets/key', '.ssh/id_rsa',
    'secrets/value', 'credentials/value', '.env', '.env.production', '.env.example',
    'api/.env', '.htpasswd', '.netrc', '.npmrc', '.pypirc', 'credentials.json',
    'service-account-prod.json', 'service_account_prod.json', 'a.pem', 'a.key',
    'a.ppk', 'a.p12', 'a.pfx', 'id_rsa', 'id_ed25519', 'lolipop_known_hosts',
    'lolipop_github_actions_runtime', 'sessions/session', 'api/cache/item',
    'logs/access.log', 'api/error_log', 'error_log.1', 'access_log', 'a.log.1',
    'sess_123', 'cookies.txt', 'cookies1.json', '.write.lock', 'a.lock.php',
    'a.pid', 'a.pid.lock', 'a.tmp', 'a.tmp.1', 'a.temp', 'a.swp', 'a.swo', 'a~',
    'schedule.xlsx', 'schedule-test.xls', 'a.sqlite', 'a.sqlite3-wal', 'a.db',
    'a.db-shm', 'a.dump', 'a.dump.sql', 'a.sql.gz', 'backup2026.sql', 'dump2026.sql',
    'backup/a.php', 'api/backups/a.php', '_backup/a.php', '_system_backups/a.php',
    'recovery_hold_20260915/a.php', 'cleanup_20260915.php', 'a.bak', 'a.bak.1',
    'a.backup', 'a.backup.1', 'a.orig', 'a.zip', 'a.7z', 'a.rar', 'a.tar',
    'a.tar.gz', 'a.tgz', 'a.tar.bz2', 'a.tar.xz', '.git/config', '.github/a.yml',
    '.deploy/a.py', '.tools/a.exe', '_deploy/a.php', '.codex/a.json', '.vscode/a.json',
    '.idea/a.json', '.gitignore', '.gitattributes', 'DEPLOYMENT.md', 'README.md', 'AGENTS.md',
    'snippet1.txt', '.DS_Store', 'Thumbs.db', 'Desktop.ini',
]
PUBLIC = ['index.php', 'staff_security.php', 'staff_auth_api.php', 'backup_api.php',
          'assets/example.png', 'api/members.php', 'water-data/example.geojson',
          'vendor/example.js', 'package-lock.json', 'composer.lock']


class SafetyTests(unittest.TestCase):
    def test_target(self):
        self.assertEqual(deploy.load_config()['APP_NAME'], 'timetable')

    def test_protected_paths(self):
        rules = deploy.load_rules()
        for path in PROTECTED:
            with self.subTest(path=path):
                self.assertTrue(deploy.excluded(path, rules))
        for path in PUBLIC:
            with self.subTest(path=path):
                self.assertFalse(deploy.excluded(path, rules))

    def test_case_variants_blocked(self):
        self.assertTrue(deploy.excluded('DATA/secret.php', deploy.load_rules()))

    def test_required_exclusion_cannot_be_removed(self):
        text = (HERE / 'lolipop-excludes.txt').read_text().replace('**/data/***', '')
        with patch.object(Path, 'read_text', return_value=text):
            with self.assertRaisesRegex(RuntimeError, 'Mandatory'):
                deploy.load_rules()

    def test_tampered_payload_blocked(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp)
            payload = output / 'payload'
            payload.mkdir()
            app = payload / 'index.php'
            app.write_bytes(b'expected')
            deploy.write_json(output / 'manifest.json', {
                'policy_sha256': deploy.policy_hash(), 'files': {'index.php': deploy.sha(b'expected')}})
            deploy.validate_payload(output)
            app.write_bytes(b'tampered')
            with self.assertRaisesRegex(RuntimeError, 'changed'):
                deploy.validate_payload(output)
            app.write_bytes(b'expected')
            (payload / 'data').mkdir()
            (payload / 'data' / 'secret.php').write_text('fixture')
            with self.assertRaisesRegex(RuntimeError, 'Protected'):
                deploy.validate_payload(output)

    def test_path_traversal(self):
        for path in ('../data/a', '/data/a', 'a/../b', 'a\\b', 'a:b', 'a|b', 'a\nb', 'a//b'):
            with self.subTest(path=path), self.assertRaises(RuntimeError):
                deploy.safe_path(path)

    def test_rsync_filters_agree_with_build(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for p in PROTECTED + PUBLIC:
                path = root / 'source' / p
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('fixture')
            (root / 'destination').mkdir()
            (root / 'excludes.txt').write_bytes((HERE / 'lolipop-excludes.txt').read_bytes())
            subprocess.run([os.environ.get('RSYNC_BIN', 'rsync'), '--recursive',
                            '--exclude-from=excludes.txt', 'source/', 'destination/'],
                           cwd=root, check=True, capture_output=True)
            actual = {p.relative_to(root / 'destination').as_posix()
                      for p in (root / 'destination').rglob('*') if p.is_file()}
            self.assertEqual(actual, set(PUBLIC))

    def test_rsync_never_deletes_or_changes_permissions(self):
        with patch.object(deploy, 'ssh_command', return_value=['ssh']):
            run_id = 'a' * 12 + '-' + 'b' * 32
            stage = '/home/users/0/lolipop.jp-dp30304343/.timetable-deploy/' + run_id + '/incoming'
            for args in (deploy.rsync_args(Path('.'), True), deploy.stage_args(Path('.'), stage, run_id)):
                self.assertFalse(any(a.startswith(('--delete', '--remove-source', '--chmod')) for a in args))
                self.assertNotIn('--archive', args)
                self.assertIn('--checksum', args)
                self.assertIn('--no-perms', args)
            with self.assertRaisesRegex(RuntimeError, 'Direct production'):
                deploy.rsync_args(Path('.'), False)

    def test_disabled_deploy_never_opens_ssh(self):
        with patch.dict(os.environ, {'LOLIPOP_DEPLOY_ENABLED': 'false'}), \
                patch.object(deploy, 'probe') as probe:
            with self.assertRaisesRegex(RuntimeError, 'disabled'):
                deploy.deploy(Path('does-not-exist'), '')
            probe.assert_not_called()

    def test_confirmation_required_before_ssh(self):
        with patch.dict(os.environ, {'LOLIPOP_DEPLOY_ENABLED': 'true'}), \
                patch.object(deploy, 'validate_payload', return_value={'commit': 'a' * 40}), \
                patch.object(deploy, 'probe') as probe:
            with self.assertRaisesRegex(RuntimeError, 'confirmation'):
                deploy.deploy(Path('.'), 'b' * 40)
            probe.assert_not_called()

    def test_missing_private_settings_blocks_real_transfer(self):
        with patch.dict(os.environ, {'LOLIPOP_DEPLOY_ENABLED': 'true'}), \
                patch.object(deploy, 'validate_payload', return_value={'commit': 'a' * 40}), \
                patch.object(deploy, 'preview', return_value=({}, {}, {'ready_for_deploy': False})), \
                patch.object(deploy, 'run') as run:
            with self.assertRaisesRegex(RuntimeError, 'settings'):
                deploy.deploy(Path('.'), 'a' * 40)
            run.assert_not_called()

    def test_reject_unexpected_or_protected_transfers(self):
        manifest = {'files': {'index.php': 'hash'}}
        for line in (b'*deleting  |index.php\n', b'<f+++++++++|data/secret.php\n',
                     b'<f+++++++++|extra.php\n', b'.f...p.....|index.php\n', b'>fcsT......|index.php\n'):
            with self.subTest(line=line), self.assertRaises(RuntimeError):
                deploy.parse_changes(line, manifest)
        self.assertEqual(deploy.parse_changes(b'<fcsT......|index.php\n', manifest), ['index.php'])

    def test_rsync_diagnostics_do_not_expose_unknown_names(self):
        with self.assertRaisesRegex(RuntimeError, '"item": ".f...p....."') as error:
            deploy.parse_changes(b'.f...p.....|index.php\n', {'files': {'index.php': 'hash'}})
        self.assertIn('index.php', str(error.exception))
        with self.assertRaises(RuntimeError) as error:
            deploy.parse_changes(b'<f+++++++++|private-personal-name.php\n', {'files': {}})
        self.assertNotIn('private-personal-name', str(error.exception))
        self.assertIn('unknown-sha256:', str(error.exception))

    def test_private_setting_validation_and_read_only_probe(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp).resolve()
            data = root / 'data'
            data.mkdir()
            (root / 'index.php').write_text('application')
            self.assertEqual(remote_probe.settings_status(str(root)), 'missing')
            setting = data / 'site_private_settings.php'
            setting.write_text('invalid')
            self.assertEqual(remote_probe.settings_status(str(root)), 'invalid')
            setting.write_text('<?php exit; ?>\n' + json.dumps({
                'schema': 1, 'initialAdminName': 'Test admin',
                'payrollExcludedNames': [], 'teacherToneRules': []}))
            self.assertEqual(remote_probe.settings_status(str(root)), 'valid')
            before = {p: (p.read_bytes(), p.stat().st_mtime_ns) for p in root.rglob('*') if p.is_file()}
            first = remote_probe.probe(str(root), ['index.php'])
            second = remote_probe.probe(str(root), ['index.php'])
            after = {p: (p.read_bytes(), p.stat().st_mtime_ns) for p in root.rglob('*') if p.is_file()}
            self.assertEqual(before, after)
            self.assertEqual(first, second)
            self.assertEqual(first['retained_count'], 1)

    @unittest.skipIf(os.name == 'nt', 'Symlink creation requires special Windows privilege')
    def test_destination_symlink_blocked(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp).resolve()
            (root / 'data').mkdir()
            (root / 'app').symlink_to(root / 'data', target_is_directory=True)
            with self.assertRaisesRegex(RuntimeError, 'symlink'):
                remote_probe.probe(str(root), ['app/index.php'])

    def test_destination_symlink_guard_on_all_platforms(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp).resolve()
            actual = os.path.islink
            with patch.object(os.path, 'islink', side_effect=lambda p:
                              Path(p) == root / 'app' or actual(p)):
                with self.assertRaisesRegex(RuntimeError, 'symlink'):
                    remote_probe.probe(str(root), ['app/index.php'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
