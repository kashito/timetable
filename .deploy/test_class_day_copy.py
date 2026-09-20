"""Class creation and arbitrary-date copying against isolated synthetic PHP data."""
import secrets
import shutil
import urllib.parse
import unittest
import test_lesson_creation as fixture

class ClassDayCopyTests(unittest.TestCase):
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
        for n in ['class_manage_api.php','week_copy_api.php']:shutil.copyfile(fixture.ROOT/n,self.root/n)
        for n in ['directory_state.json','lesson_visibility.json','week_copy_receipts.json','lesson_move_archive.json']:self.write(n,{})
        self.write('student_master.json',[{'生徒名':'検証生徒','クラス':'既存クラス','優先度':'5'}])
        self.source=fixture.row();self.source['_追加ID']='source'
        self.write('added_lessons.json',[self.source])
        self.source_date='2026-09-25';self.dest='2026-11-03'

    def class_payload(self,name='新規検証クラス',names=None,action='create'):
        code,j=self.request('class_manage_api.php');self.assertEqual(code,200,j)
        return dict(action=action,sourceClass='既存クラス',name=name,names=names or [],date=self.dest,version=j['version'])

    def plan(self,mode='empty',to=None):
        p=dict(from_=self.source_date,to=to or self.dest);p['from']=p.pop('from_')
        code,j=self.request('week_copy_api.php?'+urllib.parse.urlencode(p));self.assertEqual(code,200,j)
        return dict(p,mode=mode,version=j['version'],requestId=secrets.token_hex(16)),j

    def test_empty_class_available_without_creating_lessons(self):
        before=self.read('added_lessons.json');p=self.class_payload();code,j=self.post('class_manage_api.php',p);self.assertEqual(code,200,j)
        self.assertEqual(before,self.read('added_lessons.json'))
        self.assertTrue(any(r['クラス']==p['name'] and r['生徒名']=='' for r in self.read('student_master.json')))
        _,j=self.request('class_manage_api.php');self.assertTrue(any(c['name']==p['name'] and c['lessons']==0 for c in j['classes']))

    def test_create_selected_members_and_keep_existing_memberships(self):
        old=self.read('student_master.json');p=self.class_payload(names=['検証生徒','新しい検証生徒'])
        self.assertEqual(self.post('class_manage_api.php',p)[0],200)
        rows=self.read('student_master.json');self.assertEqual(rows[:len(old)],old)
        new=[r for r in rows if r['クラス']==p['name']]
        self.assertEqual({r['生徒名'] for r in new},set(p['names']))
        self.assertTrue(all(r['在籍期間']==[{'from':self.dest,'until':''}] for r in new))

    def test_class_duplicate_and_stale_version_write_nothing(self):
        p=self.class_payload('既存クラス');before=self.snapshot();self.assertEqual(self.post('class_manage_api.php',p)[0],409);self.assertEqual(before,self.snapshot())
        p=self.class_payload();p['version']='stale';self.assertEqual(self.post('class_manage_api.php',p)[0],409);self.assertEqual(before,self.snapshot())

    def test_clone_still_uses_selected_members(self):
        p=self.class_payload(names=['検証生徒'],action='clone');self.assertEqual(self.post('class_manage_api.php',p)[0],200)
        self.assertEqual([r['生徒名'] for r in self.read('student_master.json') if r['クラス']==p['name']],['検証生徒'])

    def test_past_and_future_destinations_and_duplicate_retry(self):
        for to in ['2026-08-01',self.dest]:
            p,j=self.plan(to=to);before=self.snapshot();self.assertEqual(j['sourceCount'],1);self.assertEqual(j['targetCount'],0);self.assertEqual(j['fixedPreserved'],0)
            self.assertEqual(before,self.snapshot())
            code,j=self.post('week_copy_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['copied'],1)
            after=self.snapshot();self.assertEqual(self.post('week_copy_api.php',p)[1],j);self.assertEqual(after,self.snapshot())
        self.assertEqual(self.read('added_lessons.json')[0],self.source)

    def test_invalid_same_or_empty_dates_write_nothing(self):
        for to in ['2026-02-30',self.source_date,'',[], '2026-13-01']:
            before=self.snapshot();code,j=self.post('week_copy_api.php',{'from':self.source_date,'to':to});self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())

    def test_preview_is_readonly_and_missing_source_blocks(self):
        before=self.snapshot();self.plan();self.assertEqual(before,self.snapshot())
        code,j=self.request('week_copy_api.php?from=2026-08-02&to=2026-09-01');self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())

    def test_stale_preview_blocks_all_writes(self):
        p,_=self.plan();r=fixture.row(5);r['_追加ID']='other';self.write('added_lessons.json',[self.source,r]);before=self.snapshot()
        self.assertEqual(self.post('week_copy_api.php',p)[0],409);self.assertEqual(before,self.snapshot())

    def test_empty_skips_occupied_room_but_pc_allows_multiple(self):
        for room,expected in [('青',0),('PC',1)]:
            self.source['教室']=room;target={**self.source,'日付':self.dest,'クラス':'既存枠','_追加ID':'target'}
            self.write('added_lessons.json',[self.source,target]);p,_=self.plan();code,j=self.post('week_copy_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['copied'],expected)

    def test_replace_preserves_fixed_group_and_old_attendance(self):
        g,rows=self.prepare_group(False)
        for r in rows:r['日付']=self.dest
        self.write('added_lessons.json',[self.source]+rows);g['snapshot']=rows;self.write('lesson_groups.json',{g['id']:g})
        state={fixture.key(rows[0]):{'attendance':{'検証生徒':'出席'},'ready':True}};self.write('class_state.json',state)
        self.write('lesson_fixed.json',{fixture.key(rows[0]):{'fixed':True}})
        p,j=self.plan('replace');self.assertEqual(j['fixedPreserved'],2)
        code,j=self.post('week_copy_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['removed'],0);self.assertEqual(j['fixedPreserved'],2)
        self.assertEqual(self.read('class_state.json')[fixture.key(rows[0])],state[fixture.key(rows[0])]);self.assertTrue(self.read('lesson_groups.json')[g['id']]['active'])

    def test_append_room_conflict_requires_confirmation(self):
        target={**self.source,'日付':self.dest,'クラス':'既存枠','_追加ID':'target'}
        self.write('added_lessons.json',[self.source,target]);p,_=self.plan('append');before=self.snapshot()
        code,j=self.post('week_copy_api.php',p);self.assertEqual(code,409,j);self.assertTrue(j['roomConflict']);self.assertEqual(before,self.snapshot())
        p['overrideRoom']=True;code,j=self.post('week_copy_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['copied'],1);self.assertEqual(j['removed'],0)
        self.assertIn(target,self.read('added_lessons.json'))

    def test_teacher_ng_requires_confirmation_on_arbitrary_date(self):
        self.write('teacher_ng.json',[{'date':self.dest,'teacher':self.source['担当講師'],'allDay':True}])
        p,_=self.plan();before=self.snapshot();code,j=self.post('week_copy_api.php',p)
        self.assertEqual(code,409,j);self.assertTrue(j['ngConflict']);self.assertEqual(before,self.snapshot())
        p['overrideNg']=True;code,j=self.post('week_copy_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['copied'],1)

    def test_copy_complete_linked_group_keeps_break_not_records(self):
        g,rows=self.prepare_group(False);g['mealBreak']=True;self.write('lesson_groups.json',{g['id']:g});source_state={fixture.key(rows[0]):{'attendance':{'検証生徒':'欠席'},'ready':True}};self.write('class_state.json',source_state)
        p,_=self.plan();code,j=self.post('week_copy_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['copied'],2);self.assertEqual(j['linked'],1)
        new=[v for k,v in self.read('lesson_groups.json').items() if k!=g['id']][0];self.assertTrue(new['mealBreak']);self.assertEqual(len(new['sources']),2)
        self.assertEqual(self.read('lesson_records.json')[g['key']]['memo'],'共通カルテ');self.assertFalse(self.read('lesson_records.json')[new['key']].get('memo'))
        self.assertEqual(self.read('class_state.json')[fixture.key(rows[0])],source_state[fixture.key(rows[0])])

    def test_replace_archives_records_when_reusing_same_lesson_key(self):
        target={**self.source,'日付':self.dest,'_追加ID':'target'};self.write('added_lessons.json',[self.source,target]);key=fixture.key(target)
        record={'memo':'以前の記録','homework':'宿題'};state={'attendance':{'検証生徒':'出席'},'ready':True}
        self.write('lesson_records.json',{key:record});self.write('class_state.json',{key:state})
        p,_=self.plan('replace');code,j=self.post('week_copy_api.php',p);self.assertEqual(code,200,j);self.assertEqual(j['removed'],1)
        archives=self.read('lesson_move_archive.json');self.assertEqual(len(archives),1);archive=next(iter(archives.values()))
        self.assertEqual(archive['records']['lesson_records.json'],record);self.assertEqual(archive['records']['class_state.json'],state)
        self.assertFalse(self.read('class_state.json')[key].get('attendance'))

    def test_teacher_and_anonymous_cannot_write(self):
        p,_=self.plan();cp=self.class_payload();before=self.snapshot()
        for endpoint,data in [('week_copy_api.php',p),('class_manage_api.php',cp)]:
            self.assertEqual(self.request(endpoint,data,self.teacher,self.teacher_csrf)[0],403)
            self.assertEqual(self.request(endpoint,data,self.client())[0],401)
        self.assertEqual(before,self.snapshot())

if __name__=='__main__':unittest.main()
