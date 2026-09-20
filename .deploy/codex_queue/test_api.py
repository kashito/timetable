"""Synthetic-only HTTP/CLI integration. Never connects to the production site."""
import base64
import hashlib
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request

SOURCE=Path(__file__).resolve().parents[2]
PHP=os.environ.get('TIMETABLE_TEST_PHP','php')
FILES=['data_safety.php','staff_security.php','staff_auth_api.php','staff_login.html','codex_memo_responses.php','codex_memos_api.php','codex_memos.php','codex_queue_lib.php','codex_queue_api.php','codex_queue_worker.php','codex_queue.php','codex-queue.js','codex-queue.css','staff-auth.js','workspace-ui.js','workspace-ui.css','codex-memos.js','codex-memos.css']
MEMO='a1'*12
IMAGE='c3'*12
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV1cAAAAASUVORK5CYII=')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None

class QueueApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory(prefix='timetable-codex-queue-tests-');cls.root=Path(cls.temp.name).resolve()
        assert cls.root.parent==Path(tempfile.gettempdir()).resolve() and cls.root.name.startswith('timetable-codex-queue-tests-')
        for name in FILES:shutil.copy2(SOURCE/name,cls.root/name)
        (cls.root/'data/codex_memo_images').mkdir(parents=True);(cls.root/'sessions').mkdir();(cls.root/'.codex-queue-test-fixture').write_text('synthetic')
        (cls.root/'fixture.html').write_text('<!doctype html><html lang="ja"><head><title>合成テスト</title></head><body>検証専用画面</body></html>')
        cls.password=secrets.token_urlsafe(20)
        hashed=subprocess.check_output([PHP,'-r','echo password_hash(stream_get_contents(STDIN), PASSWORD_DEFAULT);'],input=cls.password.encode()).decode()
        cls.accounts={key:dict(id=key,name='検証専用'+key,role=role,active=True,version=1,mustChange=change,passwordHash=hashed) for key,role,change in [('fixture_admin','admin',False),('fixture_teacher','teacher',False),('fixture_change','admin',True)]}
        cls.write_data('staff_accounts.php',cls.accounts)
        cls.write_data('site_private_settings.php',{'schema':1,'initialAdminName':'検証専用管理者','payrollExcludedNames':[],'teacherToneRules':[]})
        with socket.socket() as sock:sock.bind(('127.0.0.1',0));cls.port=sock.getsockname()[1]
        cls.url='http://127.0.0.1:'+str(cls.port)
        cls.log=(cls.root/'server.log').open('wb');cls.server=subprocess.Popen([PHP,'-d','session.save_path='+str(cls.root/'sessions'),'-S','127.0.0.1:'+str(cls.port),'-t',str(cls.root)],stdout=cls.log,stderr=cls.log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        for _ in range(100):
            try:
                with socket.create_connection(('127.0.0.1',cls.port),timeout=.1):break
            except OSError:time.sleep(.05)
        cls.admin,cls.csrf=cls.login('fixture_admin');cls.teacher,cls.teacher_csrf=cls.login('fixture_teacher');cls.change,cls.change_csrf=cls.login('fixture_change')

    @classmethod
    def write_data(cls,name,value):
        (cls.root/'data'/name).write_text('<?php exit; ?>\n'+json.dumps(value,ensure_ascii=False),encoding='utf-8')

    @classmethod
    def client(cls):return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),NoRedirect())

    @classmethod
    def request(cls,client,path,payload=None,csrf=None):
        headers={}
        if payload is not None:headers['Content-Type']='application/json'
        if csrf:headers['X-CSRF-Token']=csrf
        req=urllib.request.Request(cls.url+'/'+path,data=json.dumps(payload,ensure_ascii=False).encode() if payload is not None else None,headers=headers)
        try:r=client.open(req,timeout=8)
        except urllib.error.HTTPError as error:r=error
        with r:return r.code,r.read(),r.headers

    @classmethod
    def login(cls,key):
        c=cls.client();_,body,_=cls.request(c,'staff_auth_api.php');csrf=json.loads(body)['csrf']
        status,body,_=cls.request(c,'staff_auth_api.php',{'action':'login','id':key,'password':cls.password},csrf)
        assert status==200
        return c,json.loads(body)['csrf']

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate();cls.server.wait(8);cls.log.close()
        assert cls.root.parent==Path(tempfile.gettempdir()).resolve() and cls.root.name.startswith('timetable-codex-queue-tests-')
        cls.temp.cleanup()

    def setUp(self):
        queue=self.root/'data/codex_queue.php'
        if queue.exists():queue.unlink()  # Only this synthetic fixture's generated queue.
        self.memo={'id':MEMO,'kind':'request','text':'見出しの色を変更','pageTitle':'合成テスト','pagePath':'/fixture.html','context':'','images':[{'id':IMAGE,'mime':'image/png','ext':'png','size':len(PNG)}],
            'createdAt':'2026-09-20T12:00:00+09:00','updatedAt':'2026-09-20T12:00:00+09:00','createdBy':'検証専用管理者','createdById':'fixture_admin','doneAt':None,'doneBy':None,'history':[],'requestId':'f'*32,'requestHash':'e'*64}
        self.write_data('codex_memos.php',{'schema':1,'items':{MEMO:self.memo}})
        (self.root/'data/codex_memo_images'/f'{IMAGE}.php').write_bytes(b'<?php exit; ?>\n'+PNG)
        self.memo_before=(self.root/'data/codex_memos.php').read_bytes()
        self.accounts_before=(self.root/'data/staff_accounts.php').read_bytes()

    def tearDown(self):self.assertEqual(self.accounts_before,(self.root/'data/staff_accounts.php').read_bytes())
    def api(self,payload=None,client=None,csrf=True,path='codex_queue_api.php'):
        status,body,_=self.request(client or self.admin,path,payload,self.csrf if csrf else None)
        return status,json.loads(body)
    def memo_public(self):return self.api(path='codex_memos_api.php?id='+MEMO)[1]['items'][0]
    def enqueue(self):return self.api({'action':'enqueue','memoId':MEMO,'memoVersion':self.memo_public()['version']})[1]['item']
    def worker(self,action,job=None,**args):
        payload=dict(args,action=action)
        if job:payload.update(id=job['id'],token=job['token'])
        p=subprocess.run([PHP,self.root/'codex_queue_worker.php'],input=json.dumps(payload).encode(),capture_output=True,timeout=15)
        return json.loads(p.stdout)
    def claim(self):return self.worker('claim',worker='fixture-worker')['job']
    def result(self,**extra):
        value=dict(status='tested',level=1,levelReason='文言のみ',answer='合成テストで修正しました。',error='',changedFiles=['fixture.html'],tests=[dict(name='fixture test',passed=True,detail='synthetic')],candidateId='fixture-candidate',baseCommit='1'*40,patchSha256='2'*64,commitSha=None,actionsRunId=None,deploymentResult='not_requested')
        value.update(extra);return value

    def second_memo(self):
        other='b2'*12
        self.write_data('codex_memos.php',{'schema':1,'items':{MEMO:self.memo,other:dict(self.memo,id=other)}})
        version=self.api(path='codex_memos_api.php?id='+other)[1]['items'][0]['version']
        return self.api({'action':'enqueue','memoId':other,'memoVersion':version})[1]['item']

    def queue_data(self):return json.loads((self.root/'data/codex_queue.php').read_text(encoding='utf-8').split('?>',1)[1])

    def test_pinned_claim_selects_exact_code_not_oldest_job(self):
        first=self.enqueue();second=self.second_memo();before=self.queue_data()['jobs'][first['id']]
        job=self.worker('claim_memo',memoId=second['memoId'],maxLevel=1)['job']
        self.assertEqual((job['id'],job['memoId'],job['maxLevel']),(second['id'],second['memoId'],1))
        self.assertEqual(self.queue_data()['jobs'][first['id']],before)

    def test_missing_pinned_memo_leaves_other_queue_untouched(self):
        self.enqueue();before=(self.root/'data/codex_queue.php').read_bytes()
        self.assertIsNone(self.worker('claim_memo',memoId='f'*24,maxLevel=1)['job'])
        self.assertEqual((self.root/'data/codex_queue.php').read_bytes(),before)

    def test_stale_pinned_memo_never_falls_back_to_other(self):
        first=self.enqueue();second=self.second_memo();before=self.queue_data()['jobs'][second['id']]
        data=json.loads((self.root/'data/codex_memos.php').read_text(encoding='utf-8').split('?>',1)[1]);data['items'][MEMO]['text']='変更済み';self.write_data('codex_memos.php',data)
        reply=self.worker('claim_memo',memoId=MEMO,maxLevel=1)
        self.assertIsNone(reply['job']);self.assertEqual(reply['reviewId'],first['id'])
        self.assertEqual(self.queue_data()['jobs'][second['id']],before)

    def test_generic_claim_stale_first_does_not_advance_to_second(self):
        self.enqueue();second=self.second_memo();before=self.queue_data()['jobs'][second['id']]
        data=json.loads((self.root/'data/codex_memos.php').read_text(encoding='utf-8').split('?>',1)[1]);data['items'][MEMO]['text']='変更済み';self.write_data('codex_memos.php',data)
        self.assertIsNone(self.worker('claim',maxLevel=1)['job'])
        self.assertEqual(self.queue_data()['jobs'][second['id']],before)

    def test_pinned_claim_does_not_expire_unrelated_job(self):
        self.enqueue();second=self.second_memo();job=self.claim()
        data=self.queue_data();data['jobs'][job['id']]['leaseUntil']='2000-01-01T00:00:00+09:00';self.write_data('codex_queue.php',data)
        before=(self.root/'data/codex_queue.php').read_bytes()
        self.assertTrue(self.worker('claim_memo',memoId=second['memoId'],maxLevel=1)['busy'])
        self.assertEqual((self.root/'data/codex_queue.php').read_bytes(),before)

    def test_pinned_duplicate_queue_and_invalid_input_fail_closed(self):
        first=self.enqueue();data=self.queue_data();data['jobs']['f'*24]=dict(data['jobs'][first['id']],id='f'*24);self.write_data('codex_queue.php',data)
        before=(self.root/'data/codex_queue.php').read_bytes()
        self.assertFalse(self.worker('claim_memo',memoId=MEMO,maxLevel=1)['ok'])
        for args in [dict(memoId='../other'),dict(memoId=MEMO,maxLevel=3),dict(memoId=MEMO,maxLevel=True)]:
            self.assertFalse(self.worker('claim_memo',**args)['ok'])
        self.assertEqual((self.root/'data/codex_queue.php').read_bytes(),before)

    def test_limit_enforced_on_server_progress_and_results(self):
        self.enqueue();job=self.worker('claim_memo',memoId=MEMO,maxLevel=1)['job']
        for level in (2,3):
            self.assertFalse(self.worker('progress',job,status='fixed',level=level)['ok'])
            self.assertFalse(self.worker('result',job,result=self.result(status='review',level=level))['ok'])
        result=self.result(status='review',level=2,changedFiles=[],tests=[],patchSha256='',error='要確認：LEVEL 1限定運用のため自動処理対象外')
        self.assertTrue(self.worker('result',job,result=result)['ok'])
        self.assertIn('LEVEL 1限定運用',self.memo_public()['responses'][-1]['text'])
        self.assertEqual(self.memo_before,(self.root/'data/codex_memos.php').read_bytes())

    def test_clarification_flag_persisted_and_overlaid_without_memo_write(self):
        self.enqueue();job=self.worker('claim_memo',memoId=MEMO,maxLevel=1)['job']
        result=self.result(status='review',level=1,needs_clarification=True,changedFiles=[],tests=[],patchSha256='')
        self.assertFalse(self.worker('result',job,result=dict(result,needs_clarification='true'))['ok'])
        self.assertFalse(self.worker('result',job,result=dict(result,changedFiles=['fixture.html']))['ok'])
        self.assertTrue(self.worker('result',job,result=result)['item']['needs_clarification'])
        self.assertIn('needs_clarification=true',self.memo_public()['responses'][-1]['text'])
        self.assertEqual(self.memo_before,(self.root/'data/codex_memos.php').read_bytes())

    def normal_cli(self,level):
        import contextlib,io
        from unittest.mock import patch
        import worker
        from test_limits import decision
        first=self.enqueue();second=self.second_memo();other_before=self.queue_data()['jobs'][second['id']]
        memos_before=(self.root/'data/codex_memos.php').read_bytes()
        with tempfile.TemporaryDirectory(prefix='timetable-normal-cli-') as temp:
            root=Path(temp);config=root/'config.json'
            worker.write_json(config,dict(enabled=True,max_level=1,repo=str(root/'source'),workRoot=str(root/'runs'),transport='local',fixtureRoot=str(self.root),php=PHP,codex='unused',node='unused',nodeModules='unused'))
            before=config.read_bytes();original={'fixture.css':b'h1{color:red}'}
            answers=[decision(level,files=['fixture.css'])]
            if level==1:answers.append(decision(edits=[dict(path='fixture.css',before='red',after='blue')],files=['fixture.css']))
            with patch.object(worker,'source_snapshot',return_value=('1'*40,original)), \
                 patch.object(worker.CodexModel,'ask',side_effect=answers) as model, \
                 patch.object(worker,'validate_candidate',return_value=[dict(name='synthetic',passed=True)]) as tests, \
                 contextlib.redirect_stdout(io.StringIO()):
                worker.main(['--config',str(config),'--once','--memo','CM-'+MEMO,'--max-level','1'])
            self.assertEqual(config.read_bytes(),before)
            self.assertEqual(model.call_count,2 if level==1 else 1)
            self.assertEqual(tests.call_count,1 if level==1 else 0)
            directory=root/'runs'/first['id']
            self.assertEqual((directory/'candidate').exists(),level==1)
            self.assertEqual((directory/'candidate.patch').exists(),level==1)
        self.assertEqual(self.queue_data()['jobs'][second['id']],other_before)
        self.assertEqual(self.memo_public()['automation']['status'],'tested' if level==1 else 'review')
        self.assertEqual(self.queue_data()['jobs'][first['id']]['level'],level)
        self.assertEqual((self.root/'data/codex_memos.php').read_bytes(),memos_before)

    def test_normal_cli_pinned_level_one_end_to_end(self):self.normal_cli(1)
    def test_normal_cli_pinned_level_two_end_to_end(self):self.normal_cli(2)
    def test_normal_cli_pinned_level_three_end_to_end(self):self.normal_cli(3)

    def test_access_csrf_and_cli_not_public(self):
        self.assertEqual(self.api(client=self.client())[0],401)
        self.assertEqual(self.api(client=self.teacher)[0],403)
        self.assertEqual(self.api(client=self.change)[0],403)
        self.assertEqual(self.api({'action':'enqueue'},csrf=False)[0],403)
        self.assertEqual(self.api(path='codex_queue_api.php?action=claim')[0],405)
        self.assertEqual(self.request(self.client(),'codex_queue_worker.php')[0],404)
        self.assertEqual(self.request(self.client(),'codex_queue.php')[0],303)
        self.assertEqual(self.request(self.admin,'codex_queue.php')[0],200)

    def test_duplicate_submission_and_single_worker(self):
        a=self.enqueue();b=self.enqueue();self.assertEqual(a['id'],b['id'])
        job=self.claim();self.assertIsNotNone(job)
        self.assertTrue(self.worker('claim',worker='another')['busy'])
        public=self.api()[1]['items'][0];self.assertNotIn('leaseHash',public);self.assertNotIn('snapshot',public)
        self.assertEqual(self.memo_before,(self.root/'data/codex_memos.php').read_bytes())

    def test_full_result_writeback_and_idempotence_without_original_memo_write(self):
        self.enqueue();job=self.claim()
        self.assertTrue(self.worker('progress',job,status='fixed',level=1,levelReason='文言')['ok'])
        self.assertTrue(self.worker('progress',job,status='testing',level=1,levelReason='文言')['ok'])
        result=self.result();reply=self.worker('result',job,result=result);self.assertTrue(reply['ok'])
        self.assertTrue(self.worker('result',job,result=result)['duplicate'])
        memo=self.memo_public();self.assertEqual(memo['responses'][-1]['kind'],'Codex処理結果');self.assertIn('本番反映はしていません',memo['responses'][-1]['text'])
        self.assertEqual(memo['automation']['status'],'tested');self.assertIsNone(memo['doneAt'])
        self.assertEqual(self.memo_before,(self.root/'data/codex_memos.php').read_bytes())
        self.assertEqual(self.request(self.client(),'data/codex_queue.php')[1],b'')

    def test_failed_tests_and_fake_deploy_cannot_finish(self):
        self.enqueue();job=self.claim()
        self.assertFalse(self.worker('result',job,result=self.result())['ok'])
        self.assertFalse(self.worker('result',job,result=self.result(status='deployed'))['ok'])
        self.assertFalse(self.worker('result',job,result=self.result(status='review',commitSha='a'*40))['ok'])
        self.worker('progress',job,status='fixed',level=1,levelReason='x');self.worker('progress',job,status='testing',level=1,levelReason='x')
        self.assertFalse(self.worker('result',job,result=self.result(tests=[dict(name='bad',passed=False)]))['ok'])

    def test_level_two_and_three_must_stop_for_review(self):
        self.enqueue();job=self.claim()
        self.assertFalse(self.worker('progress',job,status='fixed',level=3,levelReason='危険')['ok'])
        self.assertTrue(self.worker('result',job,result=self.result(level=3,status='review',changedFiles=[],tests=[]))['ok'])
        self.assertEqual(self.api()[1]['items'][0]['status'],'review')
        self.assertEqual(self.api({'action':'approve','id':job['id']})[0],409)
        self.assertEqual(self.api({'action':'deploy','id':job['id']})[0],409)

    def test_cancel_rejects_late_results(self):
        self.enqueue();job=self.claim();public=self.api()[1]['items'][0]
        self.assertEqual(self.api({'action':'stop','id':job['id'],'version':public['version']})[0],200)
        self.assertFalse(self.worker('heartbeat',job)['ok'])
        self.assertFalse(self.worker('result',job,result=self.result(status='review'))['ok'])

    def test_level_two_cannot_be_downgraded_or_marked_tested(self):
        self.enqueue();job=self.claim()
        self.assertTrue(self.worker('progress',job,status='fixed',level=2,levelReason='JS change')['ok'])
        self.assertFalse(self.worker('progress',job,status='testing',level=1,levelReason='lower')['ok'])
        self.assertTrue(self.worker('progress',job,status='testing',level=2,levelReason='JS change')['ok'])
        self.assertFalse(self.worker('result',job,result=self.result(level=1))['ok'])
        self.assertFalse(self.worker('result',job,result=self.result(level=2))['ok'])
        self.assertTrue(self.worker('result',job,result=self.result(level=2,status='review'))['ok'])

    def test_stale_submission_and_invalid_worker_token_are_rejected(self):
        old=self.memo_public()['version'];self.memo['text']='更新された依頼'
        self.write_data('codex_memos.php',{'schema':1,'items':{MEMO:self.memo}})
        self.assertEqual(self.api({'action':'enqueue','memoId':MEMO,'memoVersion':old})[0],409)
        self.enqueue();job=self.claim();job['token']='0'*64
        self.assertFalse(self.worker('heartbeat',job)['ok'])
        self.assertFalse(self.worker('result',job,result=self.result(status='review'))['ok'])

    def test_changed_memo_invalidates_running_result(self):
        self.enqueue();job=self.claim();self.memo['text']='追記後の新しい内容';self.write_data('codex_memos.php',{'schema':1,'items':{MEMO:self.memo}})
        self.assertFalse(self.worker('heartbeat',job)['ok'])
        self.assertEqual(self.api()[1]['items'][0]['status'],'review')

    def test_expired_lease_does_not_reprocess_same_memo(self):
        self.enqueue();job=self.claim();data=json.loads((self.root/'data/codex_queue.php').read_text(encoding='utf-8').split('?>',1)[1]);data['jobs'][job['id']]['leaseUntil']='2000-01-01T00:00:00+09:00';self.write_data('codex_queue.php',data)
        self.assertIsNone(self.worker('claim')['job']);self.assertEqual(self.api()[1]['items'][0]['status'],'review')

    def test_attachment_is_restricted_to_claimed_memo(self):
        self.enqueue();job=self.claim();image=self.worker('image',job,imageId=IMAGE)
        self.assertEqual(base64.b64decode(image['base64']),PNG)
        self.assertFalse(self.worker('image',job,imageId='0'*24)['ok'])
        self.assertFalse(self.worker('image',job,imageId='../staff_accounts')['ok'])

    def test_corrupt_queue_is_not_overwritten_and_memos_still_load(self):
        raw=b'<?php exit; ?>\nBROKEN';(self.root/'data/codex_queue.php').write_bytes(raw)
        self.assertEqual(self.api()[0],500);self.assertEqual(self.memo_public()['id'],MEMO)
        self.assertEqual((self.root/'data/codex_queue.php').read_bytes(),raw)

    def test_retry_new_job_and_confirm_does_not_mark_deployed(self):
        first=self.enqueue();job=self.claim();self.worker('result',job,result=self.result(status='review',level=3,changedFiles=[],tests=[]))
        public=self.api()[1]['items'][0]
        self.assertEqual(self.api({'action':'complete','id':job['id'],'version':public['version']})[0],200)
        result=self.api({'action':'retry','memoId':MEMO,'memoVersion':self.memo_public()['version']})[1]['item']
        self.assertNotEqual(result['id'],first['id']);self.assertEqual(result['status'],'queued')
        self.assertEqual(self.memo_before,(self.root/'data/codex_memos.php').read_bytes())

if __name__=='__main__':unittest.main()
