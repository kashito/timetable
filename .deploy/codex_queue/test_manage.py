import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

import manage
import worker


class ManageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.path = self.root / 'config.json'
        self.config = dict(enabled=False, max_level=2, repo=str(self.root / 'repo'),
            workRoot=str(self.root / 'runs'), transport='local', codex='unused',
            php='unused', node='unused', nodeModules='unused', sshKey='unchanged-path')
        worker.write_json(self.path, self.config)

    def invoke(self, action):
        with contextlib.redirect_stdout(io.StringIO()):
            manage.main([action, '--config', str(self.path)])

    def test_stop_only_changes_enable_and_limit(self):
        with patch.object(manage.subprocess, 'Popen') as spawn:
            self.invoke('stop')
        spawn.assert_not_called()
        self.assertEqual(json.loads(self.path.read_text()), dict(self.config, enabled=False, max_level=1))

    def test_start_uses_one_sequential_level_one_worker(self):
        process = Mock(); process.poll.return_value = None
        with patch.object(manage, 'running', return_value=False), patch.object(worker, 'main') as doctor, \
             patch.object(manage.subprocess, 'Popen', return_value=process) as spawn, patch.object(manage.time, 'sleep'):
            self.invoke('start')
        doctor.assert_called_once_with(['--config', str(self.path), '--doctor'])
        args = spawn.call_args.args[0]
        self.assertEqual(args[-3:], ['--watch', '--max-level', '1'])
        self.assertEqual(json.loads(self.path.read_text()), dict(self.config, enabled=True, max_level=1))

    def test_duplicate_start_does_not_enable_or_spawn(self):
        before = self.path.read_bytes()
        with patch.object(manage, 'running', return_value=True), patch.object(manage.subprocess, 'Popen') as spawn:
            self.invoke('start')
        spawn.assert_not_called(); self.assertEqual(before, self.path.read_bytes())

    def test_failed_start_returns_disabled(self):
        with patch.object(manage, 'running', return_value=False), patch.object(worker, 'main'), \
             patch.object(manage.subprocess, 'Popen', side_effect=OSError('fixture')):
            with self.assertRaises(OSError): self.invoke('start')
        self.assertFalse(json.loads(self.path.read_text())['enabled'])

    def test_watch_stops_before_second_claim_after_disabled(self):
        self.config.update(enabled=True, max_level=1); worker.write_json(self.path, self.config)
        transport = Mock(); transport.call.return_value = dict(job=dict(referenceCode='CM-'+'a'*24))
        def complete(*args):
            manage.configure(self.path, False)
            return dict(status='tested')
        with patch.object(worker, 'Transport', return_value=transport), \
             patch.object(worker, 'source_snapshot', return_value=('a'*40, {})), \
             patch.object(worker, 'process_job', side_effect=complete) as process, \
             patch.object(worker.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
            worker.main(['--config', str(self.path), '--watch', '--max-level', '1'])
        transport.call.assert_called_once_with('claim', worker='local-codex-phase1', maxLevel=1)
        process.assert_called_once()

    def test_invalid_live_config_stops_before_claim(self):
        self.config.update(enabled=True, max_level=1); worker.write_json(self.path, self.config)
        transport = Mock()
        def preflight(*args): self.path.write_text('{invalid')
        with patch.object(worker, 'Transport', return_value=transport), \
             patch.object(worker, 'source_snapshot', side_effect=preflight), self.assertRaises(ValueError):
            worker.main(['--config', str(self.path), '--watch', '--max-level', '1'])
        transport.call.assert_not_called()
