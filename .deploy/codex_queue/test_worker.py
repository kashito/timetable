import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import worker

class FakeTransport:
    def __init__(self):self.calls=[]
    def call(self,action,**payload):
        self.calls.append((action,payload));return {'ok':True,'item':{}}

class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='timetable-queue-controller-tests-');self.root=Path(self.temp.name).resolve()
        self.assertEqual(self.root.parent,Path(tempfile.gettempdir()).resolve())
        self.config={'workRoot':str(self.root/'runs'),'repo':str(self.root/'source')}
        self.job={'id':'a'*24,'referenceCode':'CM-'+'b'*24,'token':'c'*64,'snapshot':{'text':'見出しの色を変更','pagePath':'/a.html','updates':[],'images':[]},'previousResponses':[]}
        self.transport=FakeTransport();self.original={'a.css':b'h1{color:red}','a.html':b'<html><title>fixture</title></html>'}
    def tearDown(self):
        self.assertEqual(self.root.parent,Path(tempfile.gettempdir()).resolve());self.temp.cleanup()
    def model(self,proposal=None,clarify=False):
        class Model:
            def __init__(self,*args):self.count=0
            def ask(self,prompt):
                self.count+=1
                return dict(level=1,reason='色だけ',needsClarification=clarify,answer='修正案です',files=['a.css'],edits=[] if self.count==1 else proposal or [{'path':'a.css','before':'red','after':'blue'}])
        return Model
    def execute(self,model,passed=True):
        with patch.object(worker,'source_snapshot',return_value=('1'*40,self.original)),patch.object(worker,'validate_candidate',return_value=[dict(name='fixture',passed=passed,detail='synthetic')]):
            return worker.process_job(self.config,self.transport,self.job,model_factory=model)
    def test_candidate_and_result_only_no_git_actions(self):
        result=self.execute(self.model());self.assertEqual(result['status'],'tested')
        self.assertIn('検査はすべて成功しました。',result['answer'])
        directory=self.root/'runs'/self.job['id']
        self.assertEqual((directory/'candidate/a.css').read_bytes(),b'h1{color:blue}')
        self.assertTrue((directory/'candidate.patch').is_file());self.assertIsNone(result['commitSha'])
        self.assertEqual([a for a,_ in self.transport.calls],['heartbeat','progress','progress','result'])
        self.assertNotIn(self.job['token'],(directory/'request.json').read_text(encoding='utf-8'))
    def test_test_failure_is_reported_without_commit(self):
        result=self.execute(self.model(),passed=False);self.assertEqual(result['status'],'failed');self.assertIsNone(result['commitSha'])
        self.assertIn('失敗または未実施',result['answer'])
    def test_sensitive_request_never_calls_model(self):
        self.job['snapshot']['text']='ログインを不要にする'
        def unexpected(*args):self.fail('Model must not be invoked')
        result=self.execute(unexpected);self.assertEqual(result['level'],3);self.assertEqual(result['status'],'review')
        self.assertFalse((self.root/'runs'/self.job['id']/'candidate').exists())
    def test_malicious_generated_edit_rejected_before_candidate_write(self):
        result=self.execute(self.model([dict(path='a.css',before='red',after='url(https://example.com)')]))
        self.assertEqual(result['status'],'review');self.assertEqual(result['changedFiles'],[])
        self.assertFalse((self.root/'runs'/self.job['id']/'candidate').exists())
    def test_unclear_request_stops_without_edits(self):
        result=self.execute(self.model(clarify=True));self.assertEqual(result['status'],'review');self.assertEqual(result['level'],1)
    def test_result_delivery_retry_is_identical(self):
        original=self.transport.call;attempts=[]
        def intermittent(action,**payload):
            if action=='result':
                attempts.append(payload)
                if len(attempts)==1:raise RuntimeError('connection interrupted')
            return original(action,**payload)
        self.transport.call=intermittent
        with patch.object(worker.time,'sleep'):
            result=self.execute(self.model())
        self.assertEqual(result['status'],'tested');self.assertEqual(attempts[0],attempts[1])
    def test_local_transport_rejects_real_repository(self):
        with self.assertRaises(ValueError):worker.Transport(dict(transport='local',repo=str(self.root),fixtureRoot=str(self.root),php='php'))

if __name__=='__main__':unittest.main()
