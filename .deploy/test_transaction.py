"""Fault-injection tests on temporary LOCAL files; never calls production."""
import hashlib
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
import deploy
spec = importlib.util.spec_from_file_location('transaction', HERE / 'remote_transaction.py')
tx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tx)
tx.excluded = deploy.excluded
digest = lambda data: hashlib.sha256(data).hexdigest()


class TransactionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        tx.LIVE = self.root / 'live'
        tx.STORE = self.root / 'private'
        tx.LIVE.mkdir()
        tx.STORE.mkdir()
        (tx.LIVE / 'data').mkdir()
        self.private = tx.LIVE / 'data/site_private_settings.php'
        self.private.write_bytes(b'PROTECTED fixture')
        self.protected_before = (self.private.read_bytes(), self.private.stat().st_mtime_ns)
        tx.settings_status = lambda root: 'valid'
        tx.healthcheck = lambda expected=None: [{'fixture': 'healthy'}]
        self.counter = 0

    def tearDown(self):
        self.assertEqual((self.private.read_bytes(), self.private.stat().st_mtime_ns), self.protected_before)
        self.temp.cleanup()

    def prepared(self, files=None):
        files = files or {'one.js': (b'old-one', b'new-one'), 'two.js': (b'old-two', b'new-two')}
        self.counter += 1
        run_id = 'a' * 12 + '-' + format(self.counter, '032x')
        info = {}
        for name, (old, new) in files.items():
            if old is not None:
                target = tx.LIVE / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(old)
            info[name] = {'old': digest(old) if old is not None else None, 'new': digest(new)}
        tx.prepare({'action': 'prepare', 'run_id': run_id, 'commit': 'a' * 40,
                    'files': info, 'rules': deploy.load_rules(), 'http_files': {}})
        directory = tx.STORE / run_id
        for name, (_, new) in files.items():
            path = directory / 'incoming' / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(new)
        state = json.loads((directory / 'state.json').read_text())
        return directory, state

    def test_success_and_manual_recovery_preserve_data_and_backups(self):
        directory, state = self.prepared()
        self.assertEqual(tx.apply(directory, state)['status'], 'applied')
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'new-one')
        self.assertEqual((directory / 'previous/one.js').read_bytes(), b'old-one')
        self.assertEqual(tx.rollback(directory, state)['status'], 'rolled_back')
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'old-one')
        self.assertTrue((directory / 'previous/one.js').exists())

    def test_incomplete_transfer_never_touches_live(self):
        directory, state = self.prepared()
        (directory / 'incoming/two.js').unlink()
        with self.assertRaisesRegex(RuntimeError, 'Incomplete'):
            tx.apply(directory, state)
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'old-one')

    def test_wrong_hash_never_touches_live(self):
        directory, state = self.prepared()
        (directory / 'incoming/two.js').write_bytes(b'corrupt')
        with self.assertRaisesRegex(RuntimeError, 'checksum'):
            tx.apply(directory, state)
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'old-one')

    def test_existing_outage_stops_before_replacement(self):
        directory, state = self.prepared()
        tx.healthcheck = lambda expected=None: (_ for _ in ()).throw(RuntimeError('HTTP failure'))
        with self.assertRaisesRegex(RuntimeError, 'HTTP failure'):
            tx.apply(directory, state)
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'old-one')

    def test_partial_apply_failure_restores_previous_programs(self):
        directory, state = self.prepared()
        real_replace = os.replace
        def fail_second(src, dst):
            if Path(src) == directory / 'incoming/two.js':
                raise OSError('injected disk/rename failure')
            return real_replace(src, dst)
        with patch.object(tx.os, 'replace', side_effect=fail_second):
            with self.assertRaisesRegex(RuntimeError, 'previous programs restored'):
                tx.apply(directory, state)
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'old-one')
        self.assertEqual((tx.LIVE / 'two.js').read_bytes(), b'old-two')

    def test_failed_post_http_restores_and_removes_only_new_program(self):
        directory, state = self.prepared({'one.js': (b'old', b'new'), 'new-folder/new.js': (None, b'new')})
        count = [0]
        def health(expected=None):
            count[0] += 1
            if count[0] > 1:
                raise RuntimeError('post-deploy HTTP failure')
            return []
        tx.healthcheck = health
        with self.assertRaisesRegex(RuntimeError, 'previous programs restored'):
            tx.apply(directory, state)
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'old')
        self.assertFalse((tx.LIVE / 'new-folder/new.js').exists())

    def test_concurrent_program_edit_is_not_overwritten(self):
        directory, state = self.prepared()
        (tx.LIVE / 'one.js').write_bytes(b'someone else edited')
        with self.assertRaisesRegex(RuntimeError, 'changed while staging'):
            tx.apply(directory, state)
        self.assertEqual((tx.LIVE / 'one.js').read_bytes(), b'someone else edited')

    def test_later_edit_prevents_destructive_rollback(self):
        directory, state = self.prepared()
        tx.apply(directory, state)
        (tx.LIVE / 'one.js').write_bytes(b'later edit')
        with self.assertRaisesRegex(RuntimeError, 'Concurrent program edit'):
            tx.rollback(directory, state)
        self.assertEqual((tx.LIVE / 'two.js').read_bytes(), b'new-two')

    def test_protected_path_never_accepted(self):
        request = {'run_id': 'b' * 12 + '-' + 'c' * 32, 'rules': deploy.load_rules(),
                   'files': {'data/site_private_settings.php': {'old': digest(b'PROTECTED fixture'), 'new': digest(b'hack')}}}
        with self.assertRaisesRegex(RuntimeError, 'Protected'):
            tx.prepare(request)

    def test_previous_interruption_blocks_new_release(self):
        directory, state = self.prepared()
        state['status'] = 'applying'
        tx.write_state(directory, state)
        with self.assertRaisesRegex(RuntimeError, 'needs recovery'):
            self.prepared({'next.js': (None, b'next')})

    def test_remote_php_lint_blocks_invalid_program(self):
        directory, state = self.prepared({'example.php': (b'old', b'<?php invalid')})
        with patch.object(tx.subprocess, 'run', return_value=subprocess.CompletedProcess([], 1)):
            with self.assertRaisesRegex(RuntimeError, 'PHP syntax'):
                tx.apply(directory, state)
        self.assertEqual((tx.LIVE / 'example.php').read_bytes(), b'old')


if __name__ == '__main__':
    unittest.main(verbosity=2)
