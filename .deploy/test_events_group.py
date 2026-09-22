"""Isolated calendar targeting, countdown slides and linked schedule edits."""
import json
import secrets
import shutil
import unittest
import urllib.parse
import test_lesson_creation as fixture

class EventsGroupTests(unittest.TestCase):
    setUpClass=classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass=classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write=classmethod(fixture.LessonCreationTests.write.__func__)
    client=classmethod(fixture.LessonCreationTests.client.__func__)
    request=classmethod(fixture.LessonCreationTests.request.__func__)
    login=classmethod(fixture.LessonCreationTests.login.__func__)
    post=fixture.LessonCreationTests.post
    snapshot=fixture.LessonCreationTests.snapshot
    read=fixture.LessonCreationTests.read
    prepare_group=fixture.LessonCreationTests.prepare_group
    tearDown=fixture.LessonCreationTests.tearDown

    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        for name in ['calendar_events.php','calendar_events_api.php','lesson_group_move_api.php','board_guides_api.php','schedule_confirmed_api.php']:
            shutil.copyfile(fixture.ROOT/name,self.root/name)
        self.write('student_master.json',[{'生徒名':'検証生徒A','クラス':'検証クラス'}, {'生徒名':'検証生徒B','クラス':'別クラス'}])
        self.write('directory_state.json',{});self.write('lesson_visibility.json',{'hidden':[]})
        self.write('student_profiles.php',{'検証生徒A':{'school':'検証学校A'},'検証生徒B':{'school':'検証学校B'}})
        self.write('calendar_events.php',{'schema':1,'schools':{c:{'id':c,'name':'検証学校'+c.upper(),'archived':False} for c in ['a','b']},'events':{}})
        self.write('board_guides.php',{'schema':1,'days':{}})
        self.write('schedule_confirmed.json',{'date':'2026-09-30'})

    def event(self,**kw):
        return dict(action='event_save',id='',requestId=secrets.token_hex(16),kind='school',schoolId='a',category='test',title='検証試験',startDate='2026-10-10',endDate='2026-10-11',body='検証用のお知らせ',published=True,archived=False,removeImage=False,**kw)

    def calendar(self,**kw):
        p=self.event();p.update(kw);code,j=self.post('calendar_events_api.php',p);self.assertEqual(code,200,j);return j['event'],p

    def public(self,name):
        code,j=self.request('calendar_events_api.php?student='+urllib.parse.quote(name),client=self.client());self.assertEqual(code,200,j);return j['events']

    def test_student_school_and_target_class_both_required(self):
        own,_=self.calendar(targetClasses=['検証クラス'])
        self.calendar(schoolId='b',targetClasses=['検証クラス'])
        self.calendar(targetClasses=['別クラス'])
        global_event,_=self.calendar(kind='notice',schoolId='',category='announcement')
        self.assertEqual({e['id'] for e in self.public('検証生徒A')},{own['id'],global_event['id']})

    def test_exam_mock_categories_targeting_and_no_profile_leak(self):
        exam,_=self.calendar(kind='notice',schoolId='',category='exam',targetClasses=['検証クラス'])
        mock,_=self.calendar(kind='notice',schoolId='',category='mock',targetClasses=['別クラス'])
        self.assertEqual([e['id'] for e in self.public('検証生徒A')],[exam['id']])
        self.assertEqual([e['id'] for e in self.public('検証生徒B')],[mock['id']])
        self.assertNotIn('検証生徒',json.dumps(self.public('検証生徒A'),ensure_ascii=False))

    def test_countdown_event_category_roundtrip(self):
        event,_=self.calendar(kind='notice',schoolId='',category='event',title='検証イベント')
        self.assertEqual(event['category'],'event')
        self.assertEqual([e['id'] for e in self.public('検証生徒A')],[event['id']])

    def test_private_start_update_preserves_confirmed_date(self):
        code,j=self.post('schedule_confirmed_api.php',{'privateFrom':'2026-10-15'})
        self.assertEqual(code,200,j)
        self.assertEqual(j['date'],'2026-09-30')
        self.assertEqual(j['privateFrom'],'2026-10-15')
        code,j=self.post('schedule_confirmed_api.php',{'date':'2026-10-01'})
        self.assertEqual(code,200,j)
        self.assertEqual(j['date'],'2026-10-01')
        self.assertEqual(j['privateFrom'],'2026-10-15')

    def test_ended_exempt_hidden_and_alias_memberships(self):
        self.calendar(kind='notice',schoolId='',category='exam',targetClasses=['検証クラス'])
        for field in ['在籍期間','免除期間']:
            periods=[{'from':'','until':'2026-10-01'}] if field=='在籍期間' else [{'from':'2026-10-01','until':''}]
            self.write('student_master.json',[{'生徒名':'検証生徒A','クラス':'検証クラス',field:periods}]);self.assertEqual(self.public('検証生徒A'),[])
        self.write('student_master.json',[{'生徒名':'検証生徒A','クラス':'旧クラス'}]);self.write('directory_state.json',{'classNameAliases':{'旧クラス':'検証クラス'}})
        self.assertEqual(len(self.public('検証生徒A')),1)
        self.write('directory_state.json',{'classNameAliases':{'旧クラス':'検証クラス'},'hiddenStudents':{'検証生徒A':True},'hiddenStudentFrom':{'検証生徒A':'2026-10-01'}})
        self.assertEqual(self.public('検証生徒A'),[])

    def test_hidden_class_not_offered_or_matched(self):
        self.calendar(kind='notice',schoolId='',category='exam',targetClasses=['検証クラス'])
        self.write('lesson_visibility.json',{'hidden':['検証クラス']})
        self.assertEqual(self.public('検証生徒A'),[])
        code,j=self.request('calendar_events_api.php?manage=1');self.assertEqual(code,200,j);self.assertNotIn('検証クラス',j['classes'])

    def test_draft_and_archived_events_not_public(self):
        self.calendar(published=False);self.calendar(archived=True);self.calendar(schoolId='b')
        before=self.snapshot();self.assertEqual(self.public('検証生徒A'),[]);self.assertEqual(before,self.snapshot())

    def test_invalid_target_and_category_write_nothing(self):
        for bad in [{'targetClasses':['不存在']},{'targetClasses':'検証クラス'},{'category':'script'}]:
            p=self.event();p.update(bad);before=self.snapshot();self.assertEqual(self.post('calendar_events_api.php',p)[0],400);self.assertEqual(before,self.snapshot())

    def test_legacy_client_keeps_targets_and_version_conflict_is_safe(self):
        r,p=self.calendar(targetClasses=['検証クラス']);p.update(id=r['id'],version=r['version'],title='変更後');p.pop('targetClasses')
        code,j=self.post('calendar_events_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['event']['targetClasses'],['検証クラス'])
        before=self.snapshot();self.assertEqual(self.post('calendar_events_api.php',p)[0],409);self.assertEqual(before,self.snapshot())

    def move_plan(self,rows,**kw):
        p=dict(sourceKey=rows[0]['_sourceKey'],date=rows[0]['日付'],slot=rows[0]['時間番号'],room='白',teacher='検証teacher');p.update(kw)
        code,j=self.request('lesson_group_move_api.php?'+urllib.parse.urlencode(p));self.assertEqual(code,200,j)
        return dict(p,version=j['version'],requestId=secrets.token_hex(16))

    def test_linked_teacher_room_change_keeps_all_records_and_two_periods(self):
        g,rows=self.prepare_group(False);k=fixture.key(rows[0]);records=self.read('lesson_records.json');records[g['key']].update(author='記録作成者',replies=[{'text':'返信'}]);records[k]={'memo':'元カルテ','author':'元作成者'}
        self.write('lesson_records.json',records);state={'attendance':{'検証生徒A':'出席'},'ready':True,'publicNote':'保持する連絡'};self.write('class_state.json',{k:state});self.write('student_attachments.json',[{'id':'file1','key':k}]);self.write('lesson_fixed.json',{k:{'fixed':True}})
        p=self.move_plan(rows);before=self.snapshot();code,j=self.post('lesson_group_move_api.php',p);self.assertEqual(code,409,j);self.assertTrue(j['fixedConflict']);self.assertEqual(before,self.snapshot())
        p['overrideFixed']=True;code,j=self.post('lesson_group_move_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['group']['teacher'],'検証teacher');self.assertEqual(j['group']['room'],'白');self.assertEqual(j['group']['slots'],'⑤⑥');self.assertEqual(len(j['group']['sources']),2)
        new={**rows[0],'担当講師':'検証teacher'};nk=fixture.key(new)
        self.assertEqual(self.read('class_state.json')[nk],state);self.assertEqual(self.read('lesson_records.json')[g['key']]['author'],'記録作成者');self.assertEqual(self.read('lesson_records.json')[g['key']]['teacher'],'検証teacher');self.assertEqual(self.read('lesson_records.json')[nk]['memo'],'元カルテ');self.assertEqual(self.read('student_attachments.json')[0]['key'],nk);self.assertEqual(self.read('lesson_fixed.json')[nk],{'fixed':True})
        after=self.snapshot();code,j=self.post('lesson_group_move_api.php',p);self.assertEqual(code,200,j);self.assertTrue(j['replayed']);self.assertEqual(after,self.snapshot())

    def test_existing_drag_move_without_teacher_stays_compatible(self):
        g,rows=self.prepare_group(False);p=self.move_plan(rows);p.pop('teacher')
        code,j=self.post('lesson_group_move_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['group']['teacher'],'検証講師')
        before=self.snapshot();code,j=self.post('lesson_group_move_api.php',p);self.assertEqual(code,200,j);self.assertTrue(j['replayed']);self.assertEqual(before,self.snapshot())

    def test_move_date_period_and_teacher_together(self):
        g,rows=self.prepare_group(False);p=self.move_plan(rows,date='2026-10-01',slot='⑦');code,j=self.post('lesson_group_move_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['group']['date'],'2026-10-01');self.assertEqual(j['group']['slots'],'⑦⑧');self.assertEqual(j['group']['start'],'18:30');self.assertEqual(j['group']['end'],'20:00')

    def test_new_teacher_ng_and_stale_version_stop_before_writes(self):
        g,rows=self.prepare_group(False);p=self.move_plan(rows);self.write('teacher_ng.json',[{'teacher':'検証teacher','date':'2026-09-25','slots':['⑤']}]);before=self.snapshot()
        code,j=self.post('lesson_group_move_api.php',p);self.assertEqual(code,409,j);self.assertTrue(j['ngConflict']);self.assertEqual(before,self.snapshot())
        p['version']='0'*64;p['overrideNg']=True;self.assertEqual(self.post('lesson_group_move_api.php',p)[0],409);self.assertEqual(before,self.snapshot())

    def test_destination_record_collision_preserves_data(self):
        g,rows=self.prepare_group(False);p=self.move_plan(rows);nk=fixture.key({**rows[0],'担当講師':'検証teacher'});self.write('class_state.json',{nk:{'attendance':{'検証生徒A':'欠席'}}});before=self.snapshot();self.assertEqual(self.post('lesson_group_move_api.php',p)[0],409);self.assertEqual(before,self.snapshot())

    def test_new_apis_require_admin_and_csrf(self):
        g,rows=self.prepare_group(False)
        for path,p in [('calendar_events_api.php',self.event()),('lesson_group_move_api.php',self.move_plan(rows)),('board_guides_api.php',{})]:
            before=self.snapshot()
            self.assertEqual(self.request(path,p,self.client())[0],401);self.assertEqual(self.request(path,p,self.teacher,self.teacher_csrf)[0],403);self.assertEqual(self.request(path,p)[0],403);self.assertEqual(before,self.snapshot())

    def test_countdown_slide_roundtrip_visibility_and_legacy_slide(self):
        code,j=self.request('board_guides_api.php?board=all&date=2026-09-25');self.assertEqual(code,200,j)
        slides=[dict(id=secrets.token_hex(16),kind='countdown',title='試験カウントダウン',body='',seconds=20,visible=True),dict(id=secrets.token_hex(16),title='以前の案内',body='保持する文章',seconds=10,visible=False)]
        p=dict(board='all',date='2026-09-25',mainSeconds=30,slides=slides,version=j['guide']['version'],requestId=secrets.token_hex(16));code,j=self.post('board_guides_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['guide']['slides'][0]['kind'],'countdown');self.assertEqual(j['guide']['slides'][1]['body'],'保持する文章')
        before=self.snapshot();code,j=self.request('board_guides_api.php?board=all&date=2026-09-25',client=self.client());self.assertEqual(len(j['guide']['slides']),1);self.assertEqual(before,self.snapshot())

if __name__=='__main__':unittest.main()
