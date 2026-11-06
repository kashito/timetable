"""Withdrawal regression: synthetic local data only; no real students or production writes."""
import json
import shutil
import subprocess
import unittest
import test_lesson_creation as fixture

class WithdrawalTests(unittest.TestCase):
    setUpClass=classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass=classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write=classmethod(fixture.LessonCreationTests.write.__func__)
    client=classmethod(fixture.LessonCreationTests.client.__func__)
    request=classmethod(fixture.LessonCreationTests.request.__func__)
    login=classmethod(fixture.LessonCreationTests.login.__func__)
    post=fixture.LessonCreationTests.post
    read=fixture.LessonCreationTests.read
    snapshot=fixture.LessonCreationTests.snapshot
    tearDown=fixture.LessonCreationTests.tearDown
    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        for name in ['class_members_api.php','state_api.php','lesson_record_context.php']:
            shutil.copyfile(fixture.ROOT/name,self.root/name)
        self.write('student_master.json',[{'生徒名':'TestA','クラス':'ClassA'},{'生徒名':'TestB','クラス':'ClassA'}])
        self.write('directory_state.json',{})
    def change(self,withdrawn,expected=False,client=None,csrf=None):
        return self.request('class_members_api.php',dict(action='withdrawal',name='TestA',withdrawn=withdrawn,expectedWithdrawn=expected),client,csrf or self.csrf)
    def test_withdraw_restore_preserves_master_and_attendance(self):
        master=(self.root/'data/student_master.json').read_bytes()
        self.write('class_state.json',{'key':{'attendance':{'TestA':'出席'},'invitedStudents':['TestA']}})
        saved=(self.root/'data/class_state.json').read_bytes()
        code,j=self.change(True);self.assertEqual(200,code,j)
        d=j['directory'];self.assertTrue(d['withdrawnStudents']['TestA']);self.assertTrue(d['hiddenStudents']['TestA']);self.assertEqual('0001-01-01',d['hiddenStudentFrom']['TestA'])
        self.assertEqual(master,(self.root/'data/student_master.json').read_bytes());self.assertEqual(saved,(self.root/'data/class_state.json').read_bytes())
        code,j=self.change(False,True);self.assertEqual(200,code,j);self.assertFalse(j['directory']['hiddenStudents']['TestA']);self.assertFalse(j['directory']['withdrawnStudents']['TestA'])
        self.assertEqual(saved,(self.root/'data/class_state.json').read_bytes())
    def test_restore_previous_hidden_state(self):
        self.write('directory_state.json',{'hiddenStudents':{'TestA':True},'hiddenStudentFrom':{'TestA':'2026-09-01'}})
        self.assertEqual(200,self.change(True)[0]);code,j=self.change(False,True)
        self.assertTrue(j['directory']['hiddenStudents']['TestA']);self.assertEqual('2026-09-01',j['directory']['hiddenStudentFrom']['TestA'])
    def test_unauthorized_and_stale_rejected(self):
        self.assertEqual(403,self.change(True,client=self.teacher,csrf=self.teacher_csrf)[0])
        self.assertEqual(200,self.change(True)[0]);self.assertEqual(409,self.change(True)[0])
        code,j=self.request('class_members_api.php',dict(action='visibility',name='TestA',hidden=False),csrf=self.csrf)
        self.assertEqual(409,code,j)
    def test_unknown_and_invalid_state_rejected(self):
        for payload in [dict(action='withdrawal',name='missing',withdrawn=True,expectedWithdrawn=False),dict(action='withdrawal',name='TestA',withdrawn='true',expectedWithdrawn=False)]:
            self.assertEqual(400,self.request('class_members_api.php',payload,csrf=self.csrf)[0])
    def test_ordinary_save_keeps_withdrawn_attendance_and_invites(self):
        key='2026-09-25|⑦|ClassA|Teacher|授業|'
        self.write('class_state.json',{key:{'attendance':{'TestA':'出席','TestB':'欠席'},'invitedStudents':['TestA']}})
        self.assertEqual(200,self.change(True)[0])
        code,j=self.request('state_api.php',dict(eventKey=key,attendance={'TestB':'出席'},invitedStudents=[]),csrf=self.csrf)
        self.assertEqual(200,code,j)
        state=self.read('class_state.json')[key]
        self.assertEqual('出席',state['attendance']['TestA']);self.assertEqual(['TestA'],state['invitedStudents'])

    def test_saved_attendance_not_reintroduced_in_karte(self):
        row=fixture.row();row['クラス']='ClassA';row['_追加ID']='withdrawal-test';key=fixture.key(row)
        self.write('added_lessons.json',[row]);self.write('class_state.json',{key:{'attendance':{'TestA':'出席','TestB':'欠席'}}})
        self.assertEqual(200,self.change(True)[0])
        records={key:{'date':row['日付'],'className':'ClassA'}}
        code="require 'lesson_policy.php';require 'lesson_groups.php';require 'lesson_record_context.php';echo json_encode(recordAttendanceContext(json_decode(stream_get_contents(STDIN),true)));"
        result=subprocess.run([fixture.PHP,'-r',code],input=json.dumps(records).encode(),cwd=self.root,capture_output=True)
        self.assertEqual(0,result.returncode,result.stdout.decode()+result.stderr.decode())
        data=json.loads(result.stdout);self.assertNotIn('TestA',json.dumps(data));self.assertIn('TestB',json.dumps(data))

if __name__=='__main__': unittest.main()