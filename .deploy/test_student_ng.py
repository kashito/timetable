"""Actual isolated PHP: student NG, warning confirmation, atomic batch and permissions."""
import json,secrets,shutil,unittest,urllib.parse
import test_lesson_creation as fixture

class StudentNgTests(unittest.TestCase):
    setUpClass=classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass=classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write=classmethod(fixture.LessonCreationTests.write.__func__)
    client=classmethod(fixture.LessonCreationTests.client.__func__)
    request=classmethod(fixture.LessonCreationTests.request.__func__)
    login=classmethod(fixture.LessonCreationTests.login.__func__)
    snapshot=fixture.LessonCreationTests.snapshot
    tearDown=fixture.LessonCreationTests.tearDown
    post=fixture.LessonCreationTests.post
    read=fixture.LessonCreationTests.read
    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        for name in ['student_ng_api.php','state_api.php','student_manage_api.php','student_master_api.php','data_api.php','lesson_repeat_api.php','lesson_group_move_api.php','lesson_copy_api.php','week_copy_api.php']:shutil.copyfile(fixture.ROOT/name,self.root/name)
        self.date='2026-10-12';self.master=[{'生徒名':'検証A','クラス':'検証クラス'},{'生徒名':'検証B','クラス':'別クラス'}];self.write('student_master.json',self.master);self.write('teacher_ng.json',[]);self.write('student_ng.php',{'schema':1,'entries':{}});self.write('class_memos.json',{})
    def ng(self,name='検証A'):
        code,j=self.request('student_ng_api.php?student='+urllib.parse.quote(name));self.assertEqual(code,200,j);return j
    def register(self,name='検証A',start='2026-10-12T17:40',end='2026-10-12T18:20',**extra):
        payload=dict(action='save',student=name,version=self.ng(name)['version'],fromAt=start,untilAt=end,note='管理者だけの補足',**extra);code,j=self.post('student_ng_api.php',payload);self.assertEqual(code,200,j);return j
    def row(self,**extra):
        row=fixture.row(5);row['日付']=self.date;row.update(extra);return row
    def warning(self,endpoint,payload,client=None,csrf=None):
        before=self.snapshot();code,j=self.request(endpoint,payload,client,csrf or self.csrf);self.assertEqual(code,409,j);self.assertTrue(j.get('studentNgConflict'),j);self.assertNotIn('管理者だけの補足',j['error']);self.assertEqual(before,self.snapshot());return j
    def accept(self,endpoint,payload,issue,client=None,csrf=None):
        code,j=self.request(endpoint,dict(payload,overrideStudentNg=True,studentNgRevision=issue['studentNgRevision']),client,csrf or self.csrf);self.assertEqual(code,200,j);return j
    def test_registration_edit_duplicate_delete_and_protected_storage(self):
        before=self.snapshot();j=self.register();item=j['items'][0];self.assertEqual(self.register()['items'],j['items']);self.assertEqual(len(self.ng()['items']),1)
        code,k=self.post('student_ng_api.php',dict(action='save',student='検証A',id=item['id'],version=j['version'],fromAt=item['fromAt'],untilAt='2026-10-12T19:00',note='変更補足'));self.assertEqual(code,200,k);self.assertEqual(len(k['items']),1)
        code,k=self.post('student_ng_api.php',dict(action='delete',student='検証A',id=item['id'],version=k['version']));self.assertEqual(code,200,k);self.assertEqual(k['items'],[])
        self.assertTrue((self.root/'data/student_ng.php').read_text(encoding='utf8').startswith('<?php exit; ?>'));self.assertEqual(before['lesson_records.json'],self.snapshot()['lesson_records.json'])
    def test_permission_csrf_and_stale_revision(self):
        j=self.register();before=self.snapshot();path='student_ng_api.php?student='+urllib.parse.quote('検証A');self.assertEqual(self.request(path,client=self.teacher)[0],403);self.assertEqual(self.request(path,client=self.client())[0],401)
        payload=dict(action='delete',student='検証A',id=j['items'][0]['id'],version=j['version']);self.assertEqual(self.request('student_ng_api.php',payload,self.admin)[0],403);self.assertEqual(before,self.snapshot())
        updated=self.register(start='2026-10-13T17:40',end='2026-10-13T18:20');before=self.snapshot();self.assertEqual(self.post('student_ng_api.php',payload)[0],409);self.assertEqual(before,self.snapshot())
    def test_invalid_and_cross_day_ng_boundaries(self):
        before=self.snapshot()
        for start,end in [('2026-02-30T00:00','2026-03-01T00:00'),('2026-10-12T24:00','2026-10-13T01:00'),('2026-10-12T17:40','2026-10-12T17:40')]:
            code,j=self.post('student_ng_api.php',dict(student='検証A',version=self.ng()['version'],fromAt=start,untilAt=end));self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())
        self.register(start='2026-12-31T23:50',end='2027-01-01T00:10');self.warning('lesson_add_api.php',dict(action='add',row=self.row(日付='2027-01-01',開始='00:00',終了='00:40')))
    def test_add_warning_and_explicit_continue(self):
        self.register();payload=dict(action='add',row=self.row());j=self.warning('lesson_add_api.php',payload);self.assertIn('検証A',j['error']);self.assertNotIn('検証B',j['error']);saved=self.accept('lesson_add_api.php',payload,j);self.assertEqual(saved['row']['時間番号'],'⑥')
    def test_warning_is_reconfirmed_if_ng_changes(self):
        self.register();payload=dict(action='add',row=self.row());first=self.warning('lesson_add_api.php',payload);self.register(start='2026-10-12T17:50',end='2026-10-12T18:00');second=self.warning('lesson_add_api.php',dict(payload,overrideStudentNg=True,studentNgRevision=first['studentNgRevision']));self.assertNotEqual(first['studentNgRevision'],second['studentNgRevision']);self.accept('lesson_add_api.php',payload,second)
    def test_touching_boundaries_are_not_overlaps(self):
        self.register(start='2026-10-12T17:00',end='2026-10-12T17:40');code,j=self.post('lesson_add_api.php',dict(action='add',row=self.row()));self.assertEqual(code,200,j)
    def test_move_and_resize_warn_before_any_writes(self):
        row=self.row(開始='16:50',終了='17:30');row['_追加ID']='original';self.write('added_lessons.json',[row]);self.register();payload=dict(action='update',sourceKey='ADD:original',row=self.row(_追加ID='original'));issue=self.warning('lesson_add_api.php',payload);self.accept('lesson_add_api.php',payload,issue)
        self.register(start='2026-10-12T18:25',end='2026-10-12T18:40');payload=dict(sourceKey='ADD:original',edge='end',time='18:30',expectedStart='17:40',expectedEnd='18:20');self.warning('lesson_resize_api.php',payload)
    def test_invited_student_warning_before_public_note_write(self):
        self.register('検証B');row=self.row(_追加ID='invite');self.write('added_lessons.json',[row]);payload=dict(eventKey=fixture.key(row),publicNote='保存前のNG確認',invitedStudents=['検証B']);j=self.warning('state_api.php',payload,self.teacher,self.teacher_csrf);self.assertIn('検証B',j['error']);self.accept('state_api.php',payload,j,self.teacher,self.teacher_csrf)
    def test_inactive_and_exempt_members_are_excluded(self):
        self.master[0]['在籍期間']=[dict(from_ignored='',**{'from':'2026-10-01','until':'2026-10-12'})];self.write('student_master.json',self.master);self.register();code,j=self.post('lesson_add_api.php',dict(action='add',row=self.row()));self.assertEqual(code,200,j)
    def test_exemption_and_returning_attendance(self):
        self.master[0]['免除期間']=[{'from':self.date,'until':'2026-10-13'}];self.write('student_master.json',self.master);self.register();row=self.row(_追加ID='exempt');self.write('added_lessons.json',[row])
        self.assertEqual(self.post('state_api.php',dict(eventKey=fixture.key(row),publicNote='変更のみ'))[0],200)
        payload=dict(eventKey=fixture.key(row),attendance={'検証A':'出席'});j=self.warning('state_api.php',payload);self.accept('state_api.php',payload,j)
    def test_linking_existing_members_checks_union_of_invited_students(self):
        first=self.row(_追加ID='first');second=self.row(_追加ID='second',時間番号='⑦',開始='18:30',終了='19:10');self.write('added_lessons.json',[first,second]);self.write('class_state.json',{fixture.key(first):{'invitedStudents':['検証B']}});self.register('検証B',start=self.date+'T18:30',end=self.date+'T19:10')
        plan=self.request('lesson_group_api.php?action=candidates&sourceKey=ADD%3Afirst')[1];payload=dict(action='create',sources=['ADD:first','ADD:second'],version=plan['version'],mealBreak=False);j=self.warning('lesson_group_api.php',payload);self.accept('lesson_group_api.php',payload,j)
    def test_numeric_excel_time_is_normalized_like_timetable(self):
        self.register();payload=dict(action='add',row=self.row(開始=17.6666666667/24,終了=18.3333333333/24));self.warning('lesson_add_api.php',payload)
    def test_membership_change_warns(self):
        self.register('検証B');row=self.row(_追加ID='existing');self.write('added_lessons.json',[row]);new=[dict(r)for r in self.master];new[1]['クラス']='検証クラス';payload=dict(students=new);j=self.warning('student_master_api.php',payload);self.accept('student_master_api.php',payload,j)
    def test_bulk_import_compares_new_students_atomically(self):
        self.register('検証B');students=[dict(r)for r in self.master];students[1]['クラス']='検証クラス';payload=dict(schedule=[self.row()],students=students);j=self.warning('data_api.php',payload);self.accept('data_api.php',payload,j)
    def test_linked_creation_last_period_warns_without_partial_creation(self):
        self.register(start='2026-10-12T18:30',end='2026-10-12T19:10');payload=dict(row=self.row(終了='19:10'),count=2,mealBreak=False,requestId=secrets.token_hex(12));j=self.warning('lesson_create_group_api.php',payload);result=self.accept('lesson_create_group_api.php',payload,j);self.assertEqual(len(result['rows']),2)
    def test_batch_repeat_aggregates_future_ng(self):
        row=self.row(_追加ID='repeat');self.write('added_lessons.json',[row]);self.register(start='2026-10-13T17:40',end='2026-10-13T18:20');self.register(start='2026-10-14T17:40',end='2026-10-14T18:20');plan=self.request('lesson_repeat_api.php?sourceKey=ADD%3Arepeat')[1];payload=dict(sourceKey='ADD:repeat',dates=['2026-10-13','2026-10-14'],requestId=secrets.token_hex(12),version=plan['version']);issue=self.warning('lesson_repeat_api.php',payload);self.assertIn('2026-10-13',issue['error']);self.assertIn('2026-10-14',issue['error']);self.accept('lesson_repeat_api.php',payload,issue)

    def test_linked_move_warns_and_keeps_group_and_records_intact(self):
        first=self.row(_追加ID='move-first',日付='2026-10-11');second=self.row(_追加ID='move-second',日付='2026-10-11',時間番号='⑦',開始='18:30',終了='19:10');self.write('added_lessons.json',[first,second])
        plan=self.request('lesson_group_api.php?action=candidates&sourceKey=ADD%3Amove-first')[1];code,g=self.post('lesson_group_api.php',dict(action='create',sources=['ADD:move-first','ADD:move-second'],version=plan['version'],mealBreak=False));self.assertEqual(code,200,g)
        self.register(start='2026-10-12T18:30',end='2026-10-12T19:10');query='lesson_group_move_api.php?sourceKey=ADD%3Amove-first&date=2026-10-12&slot='+urllib.parse.quote('⑥')+'&room='+urllib.parse.quote('青');code,move=self.request(query);self.assertEqual(code,200,move)
        payload=dict(sourceKey='ADD:move-first',date=self.date,slot='⑥',room='青',version=move['version'],requestId=secrets.token_hex(12));issue=self.warning('lesson_group_move_api.php',payload);self.accept('lesson_group_move_api.php',payload,issue);self.assertEqual(len(self.read('added_lessons.json')),2);self.assertEqual(len(self.read('lesson_groups.json')),1)

    def test_copy_period_warns_without_creating_extra_lesson(self):
        row=self.row(_追加ID='copy');self.write('added_lessons.json',[row]);self.register(start='2026-10-12T18:30',end='2026-10-12T19:10');plan=self.request('lesson_copy_api.php?sourceKey=ADD%3Acopy')[1]
        payload=dict(sourceKey='ADD:copy',version=plan['version'],targets=[dict(date=self.date,slot='⑦',room='青')],link=False,requestId=secrets.token_hex(12));issue=self.warning('lesson_copy_api.php',payload);self.accept('lesson_copy_api.php',payload,issue)

    def test_copy_day_warns_before_batch_change_and_aggregates(self):
        row=self.row(_追加ID='day-copy',日付='2026-10-11');self.write('added_lessons.json',[row]);self.register();query='week_copy_api.php?from=2026-10-11&to=2026-10-12&mode=empty';plan=self.request(query)[1]
        payload=dict(**{'from':'2026-10-11','to':self.date},mode='empty',version=plan['version'],requestId=secrets.token_hex(12));issue=self.warning('week_copy_api.php',payload);self.accept('week_copy_api.php',payload,issue)

if __name__=='__main__':unittest.main()
