"""Real PHP, synthetic data: confirmed shifts, assignments and existing permissions."""
import json,shutil,unittest,urllib.parse
import test_lesson_creation as fixture

class OpenTeacherSlotsTests(unittest.TestCase):
    setUpClass=classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass=classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write=classmethod(fixture.LessonCreationTests.write.__func__)
    client=classmethod(fixture.LessonCreationTests.client.__func__)
    request=classmethod(fixture.LessonCreationTests.request.__func__)
    login=classmethod(fixture.LessonCreationTests.login.__func__)
    post=fixture.LessonCreationTests.post
    snapshot=fixture.LessonCreationTests.snapshot
    tearDown=fixture.LessonCreationTests.tearDown
    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        for name in ['teacher_ng_api.php','teacher_open_slots_api.php']:shutil.copyfile(fixture.ROOT/name,self.root/name)
        self.date='2026-10-12'
    def entry(self,teacher='検証teacher',slots=None,**extra):
        return dict(id='shift-test-'+teacher,teacher=teacher,date=self.date,allDay=False,slots=slots or [],availabilitySubmitted=True,**extra)
    def get(self,client=None,dates=None):
        code,j=self.request('teacher_open_slots_api.php?dates='+urllib.parse.quote(dates or self.date),client=client);self.assertEqual(code,200,j);return j
    def test_unsubmitted_and_empty_legacy_are_not_ok(self):
        self.write('teacher_ng.json',[dict(teacher='空欄',date=self.date,slots=[],allDay=False)])
        self.assertEqual(self.get()['days'][self.date],[])
    def test_all_ok_submission_is_retained_and_ng_rules_unchanged(self):
        before=self.snapshot();code,j=self.request('teacher_ng_api.php',dict(action='grid',teacher='検証teacher',days=[dict(date=self.date,slots=[],note='')]),self.teacher,self.teacher_csrf)
        self.assertEqual(code,200,j);self.assertTrue(j['entries'][0]['availabilitySubmitted']);self.assertEqual(j['entries'][0]['slots'],[])
        item=self.get()['days'][self.date][0];self.assertEqual(len(item['slots']),11)
        self.assertEqual(before['lesson_records.json'],self.snapshot()['lesson_records.json'])
        # Confirming an unchanged all-OK day is not an NG change notification.
        self.assertFalse(j['notified'])
    def test_legacy_partial_ng_and_all_day_ng(self):
        self.write('teacher_ng.json',[dict(teacher='甲',date=self.date,slots=['①','②']),dict(teacher='乙',date=self.date,slots=[],allDay=True)])
        rows=self.get()['days'][self.date];self.assertEqual(len(rows),1);self.assertEqual(rows[0]['teacher'],'甲');self.assertNotIn('①',rows[0]['slots']);self.assertEqual(len(rows[0]['slots']),9)
    def test_time_overlap_rooms_group_members_and_deleted_rows(self):
        self.write('teacher_ng.json',[self.entry('甲')]);a=fixture.row(3);a.update(日付=self.date,担当講師='甲',開始='16:00',終了='18:00',教室='PC');b=fixture.row(6);b.update(日付=self.date,担当講師='甲',教室='青');deleted=fixture.row(8);deleted.update(日付=self.date,担当講師='甲',_追加ID='deleted')
        self.write('schedule_data.json',dict(schedule=[a,b],students=[]));self.write('added_lessons.json',[deleted]);self.write('edited_lessons.json',{'ADD:deleted':{'_deleted':True}})
        slots=self.get()['days'][self.date][0]['slots'];self.assertFalse(set(['④','⑤','⑥','⑦'])&set(slots));self.assertIn('⑨',slots)
    def test_actual_add_move_delete_refreshes_without_changing_records(self):
        self.write('teacher_ng.json',[self.entry('甲')]);self.write('lesson_records.json',{'unrelated':{'memo':'保持するカルテ','homework':'保持する宿題','homeworkChecks':{'existing':{'checked':True}}}});record_before=json.loads((self.root/'data/lesson_records.json').read_text(encoding='utf8'));row=fixture.row(5);row.update(日付=self.date,担当講師='甲');code,j=self.post('lesson_add_api.php',dict(action='add',row=row));self.assertEqual(code,200,j)
        self.assertNotIn('⑥',self.get()['days'][self.date][0]['slots'])
        added=json.loads((self.root/'data/added_lessons.json').read_text(encoding='utf8'))[0];source='ADD:'+added['_追加ID'];moved=dict(added);moved.update(時間番号='⑦',開始='18:30',終了='19:10')
        code,j=self.post('lesson_add_api.php',dict(action='update',sourceKey=source,row=moved));self.assertEqual(code,200,j);slots=self.get()['days'][self.date][0]['slots'];self.assertIn('⑥',slots);self.assertNotIn('⑦',slots)
        code,j=self.post('lesson_add_api.php',dict(action='delete',sourceKey=source));self.assertEqual(code,200,j);self.assertIn('⑦',self.get()['days'][self.date][0]['slots']);self.assertEqual(record_before,json.loads((self.root/'data/lesson_records.json').read_text(encoding='utf8')))
    def test_shift_changes_refresh_and_teacher_only_sees_self(self):
        self.write('teacher_ng.json',[self.entry(),self.entry('別の先生')]);j=self.get(self.teacher);self.assertEqual(j['scope'],'self');self.assertEqual([r['teacher'] for r in j['days'][self.date]],['検証teacher'])
        code,j=self.request('teacher_ng_api.php',dict(action='grid',teacher='検証teacher',days=[dict(date=self.date,slots=['⑥'])]),self.teacher,self.teacher_csrf);self.assertEqual(code,200,j);self.assertNotIn('⑥',self.get(self.teacher)['days'][self.date][0]['slots'])
        self.assertEqual(self.request('teacher_ng_api.php',dict(action='grid',teacher='別の先生',days=[dict(date=self.date,slots=[])]),self.teacher,self.teacher_csrf)[0],403)
    def test_anonymous_denied_and_read_only(self):
        self.write('teacher_ng.json',[self.entry()]);before=self.snapshot();self.assertEqual(self.request('teacher_open_slots_api.php?dates='+self.date,client=self.client())[0],401);self.get();self.assertEqual(before,self.snapshot());self.assertEqual(self.post('teacher_open_slots_api.php',{})[0],405);self.assertEqual(before,self.snapshot())
    def test_invalid_submission_is_not_saved_as_all_ok(self):
        before=self.snapshot()
        for day in [dict(date=self.date),dict(date=self.date,slots=['不明'])]:
            code,j=self.post('teacher_ng_api.php',dict(action='grid',teacher='甲',days=[day]));self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())
    def test_calendar_boundaries_invalid_input_and_malformed_shift(self):
        self.write('teacher_ng.json',[self.entry('壊れた入力',slots=['不明']),self.entry('__custom__')]);self.assertEqual(self.get()['days'][self.date],[])
        self.assertEqual(set(self.get(dates='2026-10-31,2026-11-01,2026-12-31,2027-01-01')['days']),{'2026-10-31','2026-11-01','2026-12-31','2027-01-01'})
        self.assertEqual(self.request('teacher_open_slots_api.php?dates=2026-02-30')[0],400)
        dates=','.join('2026-10-%02d'%i for i in range(1,32))+',2026-11-01';self.assertEqual(self.request('teacher_open_slots_api.php?dates='+dates)[0],400)

if __name__=='__main__':unittest.main()
