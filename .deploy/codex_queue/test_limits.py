"""LEVEL limits and normal CLI gates. Synthetic inputs; no network or Git writes."""
import copy
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

import worker
from policy import ReviewRequired, apply_edits


def decision(level=1, clarify=False, edits=None, files=None):
    return dict(level=level, reason='依頼全体の判定', needsClarification=clarify,
                answer='検証専用の回答', files=files or ['a.css'], edits=edits or [])


class LimitTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='timetable-limit-tests-')
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        self.source=self.root/'source';self.source.mkdir()
        self.original={'a.css':b'h1{color:red}', 'a.js':b'let n=1;', 'b.css':b'b{color:red}'}
        for name,body in self.original.items():(self.source/name).write_bytes(body)
        self.config=dict(repo=str(self.source),workRoot=str(self.root/'runs'),max_level=1)
        self.job=dict(id='a'*24,memoId='b'*24,referenceCode='CM-'+'b'*24,token='c'*64,
                      snapshot=dict(id='b'*24,referenceCode='CM-'+'b'*24,text='見出しを赤から青に変更',pagePath='/a.html',images=[],updates=[]))
        self.transport=Mock();self.transport.call.return_value={'ok':True}
        self.model=Mock()
        self.edit=dict(path='a.css',before='red',after='blue')

    def execute(self,answers):
        self.model.ask.side_effect=answers
        with patch.object(worker,'source_snapshot',return_value=('1'*40,self.original)), \
             patch.object(worker,'validate_candidate',return_value=[dict(name='synthetic',passed=True)]) as tests, \
             patch.object(worker,'run') as command:
            result=worker.process_job(self.config,self.transport,self.job,model_factory=lambda *a:self.model)
            command.assert_not_called()  # No git commit/push or other command, even on a stopped job.
        self.assertEqual({p.name:p.read_bytes() for p in self.source.iterdir()},self.original)
        self.assertIsNone(result['commitSha']);self.assertIsNone(result['actionsRunId'])
        self.assertEqual(result['deploymentResult'],'not_requested')
        return result,tests

    def assert_stopped(self,result,tests,level,clarify=False,calls=1):
        self.assertEqual((result['status'],result['level'],result['needs_clarification']),('review',level,clarify))
        self.assertEqual(result['changedFiles'],[]);self.assertEqual(result['tests'],[])
        self.assertEqual(result['patchSha256'],'');tests.assert_not_called()
        self.assertEqual(self.model.ask.call_count,calls)
        directory=self.root/'runs'/self.job['id']
        for name in ('candidate','candidate.patch','manifest.json','http-fixture'):
            self.assertFalse((directory/name).exists(),name)
        self.assertEqual([c.args[0] for c in self.transport.call.call_args_list],['result'])
        self.assertEqual(self.transport.call.call_args.kwargs['result'],result)

    def test_level_one_proceeds_to_candidate_and_tests(self):
        result,tests=self.execute([decision(),decision(edits=[self.edit])])
        self.assertEqual(result['status'],'tested');tests.assert_called_once()
        self.assertEqual((self.root/'runs'/self.job['id']/'candidate/a.css').read_bytes(),b'h1{color:blue}')

    def test_level_two_stops_before_proposal(self):
        result,tests=self.execute([decision(2)])
        self.assert_stopped(result,tests,2);self.assertIn('LEVEL 1限定運用',result['error'])

    def test_level_three_stops_before_proposal(self):
        result,tests=self.execute([decision(3)])
        self.assert_stopped(result,tests,3);self.assertIn('LEVEL 1限定運用',result['error'])

    def test_ambiguous_request_stops_with_separate_flag(self):
        self.job['snapshot']['text']='上のスペースをもっと有効活用して'
        result,tests=self.execute([decision(1,clarify=True)])
        self.assert_stopped(result,tests,1,clarify=True)

    def test_composite_whole_request_reaches_triage_without_partial_execution(self):
        text='文字を黄色にして、太字機能も追加して'
        self.job['snapshot']['text']=text
        result,tests=self.execute([decision(2)])
        self.assert_stopped(result,tests,2)
        prompt=self.model.ask.call_args.args[0]
        self.assertIn(text,prompt);self.assertIn('部分実行は禁止',prompt)

    def test_followup_is_not_dropped_from_whole_request(self):
        self.job['snapshot']['updates']=[dict(text='さらに太字機能も追加して')]
        result,tests=self.execute([decision(2)])
        self.assert_stopped(result,tests,2)
        self.assertIn('さらに太字機能も追加して',self.model.ask.call_args.args[0])

    def test_proposal_escalation_stops_before_apply(self):
        with patch.object(worker,'apply_edits') as apply:
            result,tests=self.execute([decision(),decision(2,edits=[self.edit])])
        self.assert_stopped(result,tests,2,calls=2);apply.assert_not_called()

    def test_proposal_ambiguity_stops_before_apply(self):
        with patch.object(worker,'apply_edits') as apply:
            result,tests=self.execute([decision(),decision(1,clarify=True,edits=[self.edit])])
        self.assert_stopped(result,tests,1,clarify=True,calls=2);apply.assert_not_called()

    def test_policy_escalation_refuses_whole_batch_without_candidate(self):
        answers=[decision(files=['a.css','a.js']),decision(edits=[self.edit,dict(path='a.js',before='1',after='2')])]
        result,tests=self.execute(answers)
        self.assert_stopped(result,tests,2,calls=2)

    def test_server_limit_cannot_be_weakened_by_worker_config(self):
        self.config['max_level']=2;self.job['maxLevel']=1
        result,tests=self.execute([decision(2)])
        self.assert_stopped(result,tests,2)

    def test_legacy_default_keeps_level_two_candidate_behavior(self):
        del self.config['max_level']
        result,tests=self.execute([decision(2),decision(2,edits=[self.edit])])
        self.assertEqual(result['status'],'review');tests.assert_called_once()
        self.assertTrue((self.root/'runs'/self.job['id']/'candidate.patch').exists())

    def test_policy_multifile_and_html_upgrade_are_blocked(self):
        for original,edits in [
            (self.original,[self.edit,dict(path='b.css',before='red',after='blue')]),
            ({'a.html':b'<p>text</p>'},[dict(path='a.html',before='<p>',after='<p hidden>')])]:
            before=copy.deepcopy(original)
            with self.assertRaises(ReviewRequired) as caught:apply_edits(original,edits,1,max_level=1)
            self.assertEqual(caught.exception.level,2);self.assertEqual(original,before)


class CliTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='timetable-cli-limit-tests-');self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);self.path=self.root/'config.json'
        self.config=dict(enabled=True,repo=str(self.root/'repo'),workRoot=str(self.root/'runs'),transport='local',codex='unused',php='unused',node='unused',nodeModules='unused')
        self.reference='CM-'+'b'*24
        self.job=dict(id='a'*24,memoId='b'*24,referenceCode=self.reference,snapshot=dict(id='b'*24,referenceCode=self.reference))
        self.transport=Mock();self.transport.call.return_value=dict(ok=True,job=self.job)

    def invoke(self,*args):
        worker.write_json(self.path,self.config);before=self.path.read_bytes()
        with patch.object(worker,'Transport',return_value=self.transport) as create, \
             patch.object(worker,'source_snapshot',return_value=('1'*40,{})), \
             patch.object(worker,'process_job',return_value=dict(status='review')) as process, \
             patch.object(worker.time,'sleep') as sleep, contextlib.redirect_stdout(io.StringIO()):
            worker.main(['--config',str(self.path),*args])
        self.assertEqual(before,self.path.read_bytes());sleep.assert_not_called()
        return process,create

    def test_once_does_not_claim_second_job(self):
        process,_=self.invoke('--once','--max-level','1')
        self.transport.call.assert_called_once_with('claim',worker='local-codex-phase1',maxLevel=1)
        process.assert_called_once();self.assertEqual(process.call_args.args[0]['max_level'],1)

    def test_pinned_once_uses_distinct_action_only(self):
        process,_=self.invoke('--once','--memo',self.reference,'--max-level','1')
        self.transport.call.assert_called_once_with('claim_memo',worker='local-codex-phase1',maxLevel=1,memoId='b'*24)
        process.assert_called_once()

    def test_missing_target_does_not_fall_back(self):
        self.transport.call.return_value=dict(ok=True,job=None)
        process,_=self.invoke('--once','--memo',self.reference,'--max-level','1')
        process.assert_not_called();self.transport.call.assert_called_once()

    def test_old_server_failure_does_not_fall_back(self):
        self.transport.call.side_effect=RuntimeError('old server')
        with self.assertRaises(RuntimeError):self.invoke('--once','--memo',self.reference,'--max-level','1')
        self.transport.call.assert_called_once()

    def test_wrong_identity_is_rejected_before_model_or_processing(self):
        for key in ('memoId','referenceCode','snapshot'):
            wrong=copy.deepcopy(self.job);wrong[key]={} if key=='snapshot' else 'wrong'
            transport=Mock();transport.call.return_value=dict(job=wrong)
            with self.assertRaises(worker.Stopped):worker.claim_job(transport,1,self.reference)
            transport.call.assert_called_once()

    def test_config_limit_cannot_be_relaxed_by_cli(self):
        self.config['max_level']=1
        process,_=self.invoke('--once','--max-level','2')
        self.assertEqual(process.call_args.args[0]['max_level'],1)

    def test_disabled_config_never_creates_transport(self):
        self.config['enabled']=False;worker.write_json(self.path,self.config)
        with patch.object(worker,'Transport') as transport,self.assertRaises(ValueError):
            worker.main(['--config',str(self.path),'--once','--max-level','1'])
        transport.assert_not_called();self.assertFalse(json.loads(self.path.read_text())['enabled'])

    def test_invalid_limits_rejected_before_claim(self):
        for value in (0,3,True,'1',None):
            self.config['max_level']=value;worker.write_json(self.path,self.config)
            with patch.object(worker,'Transport') as transport,self.assertRaises(ValueError):worker.read_config(self.path)
            transport.assert_not_called()

    def test_memo_requires_once_and_valid_code(self):
        for args in [('--watch','--memo',self.reference),('--doctor','--memo',self.reference),('--once','--memo','invalid'),('--once','--max-level','3')]:
            with patch.object(worker,'Transport') as transport,contextlib.redirect_stderr(io.StringIO()),self.assertRaises(SystemExit):
                worker.main(['--config',str(self.path),*args])
            transport.assert_not_called()


if __name__=='__main__':unittest.main()
