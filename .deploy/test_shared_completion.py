"""Actual APIs, screenshot text, independent clients and isolated synthetic learners."""
import shutil
import unittest
import urllib.parse
import test_lesson_creation as fixture

TEXT=['国語P18.19','国語P22.23①音読する②言葉の意味を調べてみよう③問いを考える','算数P9 発展問題A1〜8']
NEW=['P9 発展B','漢字プリント3枚','10/8実施の計算テストのなおし']
class SharedCompletionTests(unittest.TestCase):
    setUpClass=classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass=classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write=classmethod(fixture.LessonCreationTests.write.__func__)
    client=classmethod(fixture.LessonCreationTests.client.__func__)
    request=classmethod(fixture.LessonCreationTests.request.__func__)
    login=classmethod(fixture.LessonCreationTests.login.__func__)
    post=fixture.LessonCreationTests.post
    snapshot=fixture.LessonCreationTests.snapshot
    read=fixture.LessonCreationTests.read
    tearDown=fixture.LessonCreationTests.tearDown
    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        for name in ['homework_completion.php','student_homework_api.php','homework_revision_api.php']:
            shutil.copyfile(fixture.ROOT/name,self.root/name)
        self.rows=[]
        for date in ['2026-09-17','2026-09-24','2026-10-01','2026-10-08','2026-10-15']:
            row=fixture.row(5);row.update(日付=date,開始='17:40',終了='19:10',_追加ID=date,_sourceKey='ADD:'+date);self.rows.append(row)
        self.write('added_lessons.json',self.rows)
        self.write('student_master.json',[{'生徒名':'検証生徒A','クラス':'検証クラス'},{'生徒名':'検証生徒B','クラス':'検証クラス'}])
        self.write('directory_state.json',{})
        records={fixture.key(self.rows[2]):dict(homework='\n'.join(TEXT),date='2026-10-01'),fixture.key(self.rows[3]):dict(homework='\n'.join(NEW),date='2026-10-08')}
        self.write('lesson_records.json',records);self.write('student_homework_checks.php',{})
        self.a=self.client();_,auth=self.request('staff_auth_api.php',client=self.a);self.a_csrf=auth['csrf']
        self.b=self.client();_,auth=self.request('staff_auth_api.php',client=self.b);self.b_csrf=auth['csrf']
    def catalog(self,student='検証生徒A',client=None):
        code,j=self.request('student_homework_api.php?student='+urllib.parse.quote(student),client=client or self.a);self.assertEqual(code,200,j);return j['items']
    def previous(self,student='検証生徒A'):
        code,j=self.request('lesson_record_api.php?action=previous_homework&key='+urllib.parse.quote(fixture.key(self.rows[3]))+'&student='+urllib.parse.quote(student));self.assertEqual(code,200,j);return j
    def check(self,item,wanted,student='検証生徒A',client=None,csrf=None):
        return self.request('student_homework_api.php',dict(student=student,confirmedStudent=True,taskId=item['id'],checked=wanted,expectedRevision=item['revision']),client or self.a,csrf or self.a_csrf)
    def test_exact_three_checked_details_are_checked_at_top_without_writes(self):
        old=self.previous();records=self.read('lesson_records.json');records[fixture.key(self.rows[3])]['homeworkChecks']={item['id']:{'checked':True,'at':'2026-10-08T10:00:00+09:00'} for item in old['items']};self.write('lesson_records.json',records)
        before=self.snapshot();detail=self.previous();top=self.catalog();self.assertEqual(len(detail['items']),3)
        for text in TEXT:
            d=next(item for item in detail['items'] if item['text']==text);t=next(item for item in top if item['text']==text);self.assertTrue(d['checked']);self.assertTrue(t['checked']);self.assertEqual(d['canonicalId'],t['id']);self.assertEqual(t['dueAt'],'2026-10-08T17:40:00+09:00')
        self.assertEqual(before,self.snapshot())
        for text in NEW:
            task=next(item for item in top if item['text']==text);self.assertFalse(task['checked']);self.assertEqual(task['dueAt'],'2026-10-15T17:40:00+09:00')
    def test_up_and_down_check_uncheck_cross_clients_and_other_student(self):
        detail=self.previous()['items'][0];code,j=self.post('lesson_record_api.php',dict(action='homework_check',eventKey=fixture.key(self.rows[3]),student='検証生徒A',taskId=detail['id'],checked=True,expectedRevision=detail['revision']));self.assertEqual(code,200,j)
        top=next(item for item in self.catalog(client=self.b) if item['text']==detail['text']);self.assertTrue(top['checked']);self.assertFalse(next(item for item in self.catalog('検証生徒B') if item['text']==detail['text'])['checked'])
        self.assertEqual(self.check(top,False,client=self.b,csrf=self.b_csrf)[0],200);self.assertFalse(next(item for item in self.previous()['items'] if item['text']==detail['text'])['checked'])
        top=next(item for item in self.catalog() if item['text']==detail['text']);self.assertEqual(self.check(top,True)[0],200);self.assertTrue(next(item for item in self.previous()['items'] if item['text']==detail['text'])['checked'])
    def test_migration_never_overwrites_explicit_uncheck_and_is_scoped(self):
        item=self.catalog()[0];payload=dict(action='migrate',student='検証生徒A',confirmedStudent=True,completed=[item['id']]);self.assertEqual(self.request('student_homework_api.php',payload,self.a,self.a_csrf)[0],200)
        current=next(t for t in self.catalog() if t['id']==item['id']);self.assertTrue(current['checked']);self.assertEqual(self.check(current,False)[0],200);self.assertEqual(self.request('student_homework_api.php',payload,self.a,self.a_csrf)[0],200);self.assertFalse(next(t for t in self.catalog() if t['id']==item['id'])['checked']);self.assertFalse(next(t for t in self.catalog('検証生徒B') if t['id']==item['id'])['checked'])
    def test_stale_update_csrf_and_unknown_tasks_write_nothing(self):
        item=self.catalog()[0];self.assertEqual(self.check(item,True)[0],200);before=self.snapshot();self.assertEqual(self.check(item,False)[0],409);self.assertEqual(before,self.snapshot());self.assertEqual(self.request('student_homework_api.php',dict(student='検証生徒A',confirmedStudent=True,taskId=item['id'],checked=True),self.b)[0],403);self.assertEqual(before,self.snapshot())
    def test_same_text_on_different_assignment_dates_is_not_shared(self):
        records=self.read('lesson_records.json');records[fixture.key(self.rows[1])]={'homework':TEXT[0]};self.write('lesson_records.json',records);items=[item for item in self.catalog() if item['text']==TEXT[0]];self.assertEqual(len(items),2);self.assertNotEqual(items[0]['id'],items[1]['id']);self.check(items[0],True);items=[item for item in self.catalog() if item['text']==TEXT[0]];self.assertEqual(sum(item['checked'] for item in items),1)
    def test_link_unlink_relink_and_text_order_preserve_canonical_completion(self):
        item=next(item for item in self.catalog() if item['text']==TEXT[0]);self.assertEqual(self.check(item,True)[0],200)
        extra=dict(self.rows[2]);extra.update(時間番号='⑦',開始='18:30',_追加ID='extra',_sourceKey='ADD:extra');self.write('added_lessons.json',self.rows+[extra]);records=self.read('lesson_records.json');records[fixture.key(extra)]={'homework':'\n'.join(reversed(TEXT))};self.write('lesson_records.json',records)
        _,plan=self.request('lesson_group_api.php?action=candidates&sourceKey='+urllib.parse.quote(extra['_sourceKey']));code,j=self.post('lesson_group_api.php',dict(action='create',sources=[extra['_sourceKey'],self.rows[2]['_sourceKey']],version=plan['version'],mealBreak=False));self.assertEqual(code,200,j)
        current=next(t for t in self.catalog() if t['text']==TEXT[0]);self.assertEqual(current['id'],item['id']);self.assertTrue(current['checked'])
        group=j['group'];_,detail=self.request('lesson_group_api.php?action=detail&id='+group['id']);self.assertEqual(self.post('lesson_group_api.php',dict(action='unlink',id=group['id'],version=detail['version']))[0],200)
        current=next(t for t in self.catalog() if t['text']==TEXT[0]);self.assertEqual(current['id'],item['id']);self.assertTrue(current['checked'])
        _,plan=self.request('lesson_group_api.php?action=candidates&sourceKey='+urllib.parse.quote(extra['_sourceKey']));code,j=self.post('lesson_group_api.php',dict(action='create',sources=[self.rows[2]['_sourceKey'],extra['_sourceKey']],version=plan['version'],mealBreak=False));self.assertEqual(code,200,j)
        current=next(t for t in self.catalog() if t['text']==TEXT[0]);self.assertEqual(current['id'],item['id']);self.assertTrue(current['checked'])
    def test_legacy_check_survives_reordered_lines(self):
        old=self.previous()['items'][0];records=self.read('lesson_records.json');records[fixture.key(self.rows[3])]['homeworkChecks']={old['id']:{'checked':True}};records[fixture.key(self.rows[2])]['homework']='\n'.join(reversed(TEXT));self.write('lesson_records.json',records);self.assertTrue(next(t for t in self.catalog() if t['text']==old['text'])['checked']);self.assertTrue(next(t for t in self.previous()['items'] if t['text']==old['text'])['checked'])
    def test_exemption_and_class_alias_respect_membership(self):
        self.write('student_master.json',[{'生徒名':'検証生徒A','クラス':'旧クラス','免除期間':[{'from':'2026-10-01','until':'2026-10-02'}]}]);self.write('directory_state.json',{'classNameAliases':{'旧クラス':'検証クラス'}});items=self.catalog();self.assertFalse(any(t['assignedDate']=='2026-10-01' for t in items));self.assertTrue(any(t['text']==NEW[0] for t in items))

if __name__=='__main__':unittest.main()
