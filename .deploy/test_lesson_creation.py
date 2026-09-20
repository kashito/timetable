"""Real PHP endpoints against isolated synthetic data; never production data."""
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
import urllib.parse
import urllib.request

ROOT = Path(os.environ.get('LESSON_TEST_SOURCE', Path(__file__).resolve().parents[1]))
PHP = os.environ.get('TIMETABLE_TEST_PHP', 'php')
FILES = ['data_safety.php', 'staff_security.php', 'staff_auth_api.php', 'lesson_policy.php',
         'lesson_groups.php', 'lesson_links.php', 'lesson_add_api.php',
         'lesson_group_lengthen_api.php', 'lesson_create_group_api.php']
SLOTS = list('①②③④⑤⑥⑦⑧⑨⑩⑪')
TIMES = [('13:30','14:10'),('14:20','15:00'),('15:10','15:50'),('16:00','16:40'),
         ('16:50','17:30'),('17:40','18:20'),('18:30','19:10'),('19:20','20:00'),
         ('20:10','20:50'),('21:00','21:40'),('21:50','22:30')]

def row(slot=6):
    return {'日付':'2026-09-25','時間番号':SLOTS[slot],'クラス':'検証クラス','担当講師':'検証講師',
            '種別':'授業','科目':'','教室':'青','給与区分':'','開始':TIMES[slot][0],
            '終了':TIMES[slot][1],'備考':'持ち物のテスト'}

def key(r):
    return '|'.join(r.get(f,'') for f in ['日付','時間番号','クラス','担当講師','種別','科目'])

class LessonCreationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='timetable-lessons-test-')
        cls.root = Path(cls.temp.name).resolve()
        for name in FILES: shutil.copyfile(ROOT/name, cls.root/name)
        (cls.root/'data').mkdir(); (cls.root/'sessions').mkdir()
        cls.password = secrets.token_urlsafe(20)
        hashed = subprocess.check_output([PHP,'-r','echo password_hash(stream_get_contents(STDIN), PASSWORD_DEFAULT);'],input=cls.password.encode()).decode()
        cls.write('staff_accounts.php', {name:dict(id=name,name='検証'+name,role=name,active=True,version=1,mustChange=False,passwordHash=hashed) for name in ['admin','teacher']})
        cls.write('site_private_settings.php', dict(schema=1,initialAdminName='検証管理者',payrollExcludedNames=[],teacherToneRules=[]))
        with socket.socket() as sock: sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
        cls.url='http://127.0.0.1:'+str(port)
        cls.log=(cls.root/'server.log').open('wb')
        cls.server=subprocess.Popen([PHP,'-d','session.save_path='+str(cls.root/'sessions'),'-S','127.0.0.1:'+str(port),'-t',str(cls.root)],stdout=cls.log,stderr=cls.log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        for _ in range(100):
            try:
                with socket.create_connection(('127.0.0.1',port),timeout=.1): break
            except OSError: time.sleep(.05)
        cls.admin,cls.csrf=cls.login('admin'); cls.teacher,cls.teacher_csrf=cls.login('teacher')

    @classmethod
    def write(cls, name, value):
        (cls.root/'data'/name).write_text(('<?php exit; ?>\n' if name.endswith('.php') else '')+json.dumps(value,ensure_ascii=False),encoding='utf-8')

    @classmethod
    def client(cls): return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    @classmethod
    def request(cls, path, data=None, client=None, csrf=None):
        headers={'Content-Type':'application/json'}
        if csrf: headers['X-CSRF-Token']=csrf
        request=urllib.request.Request(cls.url+'/'+path, data=json.dumps(data,ensure_ascii=False).encode() if data is not None else None, headers=headers)
        try: response=(client or cls.admin).open(request,timeout=8)
        except urllib.error.HTTPError as e: response=e
        with response: return response.status,json.loads(response.read())

    @classmethod
    def login(cls, user):
        client=cls.client(); _,j=cls.request('staff_auth_api.php',client=client)
        code,j=cls.request('staff_auth_api.php',dict(action='login',id=user,password=cls.password),client,j['csrf'])
        assert code==200, j
        return client,j['csrf']

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate();cls.server.wait(8);cls.log.close()
        assert cls.root.parent==Path(tempfile.gettempdir()).resolve() and cls.root.name.startswith('timetable-lessons-test-')
        cls.temp.cleanup()

    def setUp(self):
        for name in ['added_lessons.json','edited_lessons.json','lesson_groups.json','lesson_records.json','class_state.json','lesson_fixed.json','room_overrides.json','student_attachments.json','teacher_ng.json','lesson_key_aliases.json']:
            self.write(name, [] if name in ['added_lessons.json','student_attachments.json','teacher_ng.json'] else {})
        self.write('schedule_data.json', {'schedule':[], 'students':[]})
        self.account_hash=self.snapshot()['staff_accounts.php']

    def tearDown(self): self.assertEqual(self.snapshot()['staff_accounts.php'],self.account_hash)

    def snapshot(self):
        return {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (self.root/'data').iterdir() if p.is_file() and p.name!='.write.lock'}

    def read(self,name): return json.loads((self.root/'data'/name).read_text(encoding='utf-8'))
    def post(self,path,data): return self.request(path,data,csrf=self.csrf)
    def payload(self,count=3,slot=6):
        r=row(slot);r['終了']=TIMES[min(slot+count-1,10)][1]
        return dict(row=r,count=count,mealBreak=True,requestId=secrets.token_hex(16))
    def create(self, payload=None):return self.post('lesson_create_group_api.php',payload or self.payload())
    def prepare_group(self, with_next=True, deleted=True):
        rows=[]
        for slot in ([4,5,6] if with_next else [4,5]):
            r=row(slot);r['_追加ID']='fixture-'+str(slot);r['_sourceKey']='ADD:'+r['_追加ID'];rows.append(r)
        self.write('added_lessons.json', rows)
        group={'id':'a'*24,'key':'GROUP:'+'a'*24,'sources':[r['_sourceKey'] for r in rows[:2]],'snapshot':rows[:2],'active':True,'mealBreak':False}
        self.write('lesson_groups.json', {group['id']:group})
        self.write('lesson_records.json', {group['key']:{'memo':'共通カルテ','homework':'共通宿題'}})
        if with_next and deleted:
            code,j=self.post('lesson_add_api.php',dict(action='delete',sourceKey=rows[2]['_sourceKey']))
            self.assertEqual(code,200,j)
        return group, rows
    def plan(self,g): return self.request('lesson_group_lengthen_api.php?id='+g['id'])
    def lengthen(self,g,plan,**extra):return self.post('lesson_group_lengthen_api.php',dict(id=g['id'],version=plan['version'],requestId=secrets.token_hex(16),mealBreak=True,**extra))

    def test_create_three_linked_periods_atomically(self):
        code,j=self.create();self.assertEqual(code,200,j)
        self.assertEqual(j['group']['slots'],'⑦⑧⑨');self.assertTrue(j['group']['mealBreak'])
        self.assertEqual([(r['開始'],r['終了']) for r in j['rows']],TIMES[6:9])
        self.assertEqual(len(self.read('added_lessons.json')),3) # payroll still has three real periods
        self.assertEqual(len(self.read('lesson_records.json')),1)
        self.assertEqual(len(self.read('class_state.json')),3)
        self.assertTrue(all(s['publicNote']=='持ち物のテスト' and not s['attendance'] and not s['ready'] for s in self.read('class_state.json').values()))

    def test_same_request_replayed_without_duplicate(self):
        p=self.payload();code,j=self.create(p);self.assertEqual(code,200,j)
        before=self.snapshot();code,k=self.create(p)
        self.assertEqual(code,200,k);self.assertTrue(k['replayed']);self.assertEqual(k['group']['id'],j['group']['id']);self.assertEqual(before,self.snapshot())
        p['mealBreak']=False;code,j=self.create(p);self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

    def test_last_slot_conflict_does_not_partially_create(self):
        r=row(8);r['_追加ID']='occupied';self.write('added_lessons.json',[r]);before=self.snapshot()
        code,j=self.create();self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

    def test_existing_records_never_overwritten_by_new_group(self):
        self.write('class_state.json',{key(row(8)):{'attendance':{'検証生徒':'出席'}}});before=self.snapshot()
        code,j=self.create();self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

    def test_invalid_period_count_dates_and_times_leave_data_unchanged(self):
        for edit in [dict(count=12),dict(count=1),dict(count='3'),dict(row={**row(),'日付':'2026-02-31'}),dict(row={**row(),'時間番号':'⑪'}),dict(row={**row(),'開始':'20:00'})]:
            with self.subTest(edit=edit):
                p=self.payload();p.update(edit);before=self.snapshot();code,j=self.create(p);self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())

    def test_room_and_ng_conflicts_require_confirmation(self):
        r=row(7);r['クラス']='別の検証クラス';r['_追加ID']='occupied';self.write('added_lessons.json',[r])
        p=self.payload();before=self.snapshot();code,j=self.create(p);self.assertEqual(code,409,j);self.assertTrue(j['roomConflict']);self.assertEqual(before,self.snapshot())
        self.write('teacher_ng.json',[dict(teacher='検証講師',date='2026-09-25',slots=['⑧'])]);p['overrideRoom']=True
        before=self.snapshot();code,j=self.create(p);self.assertEqual(code,409,j);self.assertTrue(j['ngConflict']);self.assertEqual(before,self.snapshot())
        p['overrideNg']=True;code,j=self.create(p);self.assertEqual(code,200,j)

    def test_pc_room_sharing_remains_allowed(self):
        r=row(7);r['クラス']='別の検証クラス';r['教室']='PC';r['_追加ID']='occupied';self.write('added_lessons.json',[r])
        p=self.payload();p['row']['教室']='PC';code,j=self.create(p);self.assertEqual(code,200,j)

    def test_end_of_day_two_periods(self):
        code,j=self.create(self.payload(2,9));self.assertEqual(code,200,j);self.assertEqual(j['group']['slots'],'⑩⑪')

    def test_admin_auth_and_csrf_required(self):
        for endpoint,payload in [('lesson_create_group_api.php',self.payload()),('lesson_group_lengthen_api.php',{'id':'a'*24})]:
            before=self.snapshot()
            self.assertEqual(self.request(endpoint,payload,self.client())[0],401)
            self.assertEqual(self.request(endpoint,payload,self.teacher,self.teacher_csrf)[0],403)
            self.assertEqual(self.request(endpoint,payload)[0],403)
            self.assertEqual(before,self.snapshot())

    def test_deleted_period_with_note_can_be_extended_without_losing_state(self):
        g,rows=self.prepare_group();state={key(rows[2]):{'publicNote':'消さない連絡','ready':False}}
        self.write('class_state.json',state);before=self.snapshot();code,p=self.plan(g)
        self.assertEqual(code,200,p);self.assertEqual(p['mode'],'recover');self.assertEqual(before,self.snapshot())
        code,j=self.lengthen(g,p);self.assertEqual(code,200,j);self.assertEqual(j['group']['slots'],'⑤⑥⑦');self.assertTrue(j['group']['mealBreak'])
        self.assertEqual(self.read('class_state.json'),state);self.assertEqual(self.read('edited_lessons.json')[rows[2]['_sourceKey']]['_deleted'],True)

    def test_recovery_preserves_rich_records_fixed_and_attachments(self):
        g,rows=self.prepare_group();k=key(rows[2]);records=self.read('lesson_records.json')
        records[k]={'memo':'以前のカルテ','homework':'以前の宿題','replies':[{'text':'以前の返信'}]};self.write('lesson_records.json',records)
        state={k:{'attendance':{'検証生徒':'出席'},'ready':True,'publicNote':'以前の連絡'}};self.write('class_state.json',state)
        self.write('lesson_fixed.json',{k:{'fixed':True}});files=[dict(id='fixture',key=k)];self.write('student_attachments.json',files)
        code,p=self.plan(g);self.assertEqual(code,200,p);before=self.snapshot();code,j=self.lengthen(g,p);self.assertEqual(code,409,j);self.assertTrue(j['fixedConflict']);self.assertEqual(before,self.snapshot())
        data=dict(id=g['id'],version=p['version'],requestId=secrets.token_hex(16),mealBreak=False,overrideFixed=True)
        code,j=self.post('lesson_group_lengthen_api.php',data);self.assertEqual(code,200,j)
        self.assertEqual(self.read('class_state.json'),state);self.assertEqual(self.read('student_attachments.json'),files)
        self.assertEqual(self.read('lesson_records.json')[k],records[k]);self.assertEqual(self.read('lesson_fixed.json'),{k:{'fixed':True}})
        self.assertIn('以前のカルテ',self.read('lesson_records.json')[g['key']]['memo'])
        before=self.snapshot();code,j=self.post('lesson_group_lengthen_api.php',data);self.assertEqual(code,200,j);self.assertTrue(j['replayed']);self.assertEqual(before,self.snapshot())

    def test_stale_recovery_preview_stops_before_any_write(self):
        g,rows=self.prepare_group();code,p=self.plan(g);self.assertEqual(code,200,p)
        self.write('class_state.json',{key(rows[2]):{'publicNote':'別の保存'}});before=self.snapshot();code,j=self.lengthen(g,p)
        self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

    def test_moved_history_alias_is_still_rejected(self):
        g,rows=self.prepare_group();self.write('lesson_key_aliases.json',{key(rows[2]):key(rows[0])});before=self.snapshot()
        code,j=self.plan(g);self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

    def test_existing_next_period_is_joined_not_duplicated(self):
        g,rows=self.prepare_group(deleted=False);code,p=self.plan(g);self.assertEqual(code,200,p);self.assertEqual(p['mode'],'join')
        code,j=self.lengthen(g,p);self.assertEqual(code,200,j);self.assertEqual(len(self.read('added_lessons.json')),3)

    def test_empty_next_period_is_created(self):
        g,rows=self.prepare_group(with_next=False);code,p=self.plan(g);self.assertEqual(code,200,p);self.assertEqual(p['mode'],'create')
        code,j=self.lengthen(g,p);self.assertEqual(code,200,j);self.assertEqual(len(self.read('added_lessons.json')),3)

    def test_incompatible_historical_room_is_not_silently_changed(self):
        g,rows=self.prepare_group();self.write('room_overrides.json',{key(row()):{'room':'黄'}});before=self.snapshot()
        code,j=self.plan(g);self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

if __name__=='__main__':unittest.main()
