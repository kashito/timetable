"""Selected-date placement with synthetic data only; verify all-or-nothing writes."""
import json
import secrets
import shutil
import unittest
import urllib.parse
import test_lesson_creation as f

class LessonRepeatTests(unittest.TestCase):
    setUpClass=classmethod(f.LessonCreationTests.setUpClass.__func__)
    tearDownClass=classmethod(f.LessonCreationTests.tearDownClass.__func__)
    write=classmethod(f.LessonCreationTests.write.__func__)
    client=classmethod(f.LessonCreationTests.client.__func__)
    request=classmethod(f.LessonCreationTests.request.__func__)
    login=classmethod(f.LessonCreationTests.login.__func__)
    post=f.LessonCreationTests.post
    snapshot=f.LessonCreationTests.snapshot
    read=f.LessonCreationTests.read
    prepare_group=f.LessonCreationTests.prepare_group
    tearDown=f.LessonCreationTests.tearDown

    def setUp(self):
        f.LessonCreationTests.setUp(self)
        shutil.copyfile(f.ROOT/'lesson_repeat_api.php',self.root/'lesson_repeat_api.php')
        self.source={**f.row(),'_追加ID':'source','開始':'18:35','終了':'19:00'}
        self.write('added_lessons.json',[self.source]);self.source_key='ADD:source'
        self.dates=['2026-09-28','2026-10-02']

    def plan(self):return self.request('lesson_repeat_api.php?'+urllib.parse.urlencode({'sourceKey':self.source_key}))
    def payload(self):
        code,j=self.plan();self.assertEqual(code,200,j)
        return dict(sourceKey=self.source_key,dates=self.dates,version=j['version'],requestId=secrets.token_hex(16))
    def repeat(self,p=None):return self.post('lesson_repeat_api.php',p or self.payload())

    def test_readonly_plan_and_exact_time_copy(self):
        before=self.snapshot();p=self.payload();self.assertEqual(before,self.snapshot())
        code,j=self.repeat(p);self.assertEqual(code,200,j);self.assertEqual(j['count'],2)
        rows=self.read('added_lessons.json');self.assertEqual(rows[0],self.source)
        self.assertEqual([r['日付'] for r in rows[1:]],self.dates)
        self.assertTrue(all((r['開始'],r['終了'],r['時間番号'],r['教室'])==('18:35','19:00','⑦','青') for r in rows))

    def test_existing_records_preserved_and_not_copied(self):
        key=f.key(self.source);state={key:{'attendance':{'検証生徒':'欠席'},'ready':True,'publicNote':'最新の連絡'}}
        record={key:{'memo':'元の記録','homework':'元の宿題','replies':[{'text':'元の返信'}]}}
        self.write('class_state.json',state);self.write('lesson_records.json',record);self.write('lesson_fixed.json',{key:{'fixed':True}})
        before=self.snapshot();code,j=self.repeat();self.assertEqual(code,200,j)
        after=self.snapshot();self.assertEqual({k:v for k,v in before.items() if k not in ['added_lessons.json','class_state.json']},{k:v for k,v in after.items() if k not in ['added_lessons.json','class_state.json']})
        states=self.read('class_state.json');self.assertEqual(states[key],state[key])
        for r in self.read('added_lessons.json')[1:]:
            s=states[f.key(r)];self.assertEqual(s['attendance'],[]);self.assertFalse(s['ready']);self.assertEqual(s['publicNote'],'最新の連絡');self.assertEqual(r['備考'],'最新の連絡')

    def test_linked_group_created_per_date_not_across_dates(self):
        g,rows=self.prepare_group(False);g['mealBreak']=True;self.write('lesson_groups.json',{g['id']:g});self.source_key=rows[1]['_sourceKey']
        before=self.read('lesson_records.json');code,j=self.repeat();self.assertEqual(code,200,j);self.assertEqual(j['count'],4)
        groups=self.read('lesson_groups.json');self.assertEqual(groups[g['id']],g);self.assertEqual(len(groups),3)
        added=self.read('added_lessons.json');self.assertEqual(added[:2],rows)
        for new in groups.values():
            if new['id']==g['id']:continue
            self.assertTrue(new['mealBreak']);self.assertEqual(len(new['sources']),2)
            copied=[r for r in added if r.get('_sourceKey') in new['sources']]
            self.assertEqual(len({r['日付'] for r in copied}),1)
            rec=self.read('lesson_records.json')[new['key']];self.assertEqual(rec['memo'],'');self.assertEqual(rec['homework'],'');self.assertEqual(rec['replies'],[])
        self.assertTrue(all(self.read('lesson_records.json')[k]==v for k,v in before.items()))

    def test_last_date_conflict_prevents_partial_save(self):
        r={**self.source,'日付':self.dates[-1],'_追加ID':'occupied'};self.write('added_lessons.json',[self.source,r])
        self.write('class_state.json',{f.key(r):{'publicNote':'','ready':False,'attendance':[]}})
        p=self.payload();before=self.snapshot()
        code,j=self.repeat(p);self.assertEqual(code,409,j);self.assertIn('同じ授業がすでにあります',j['error']);self.assertEqual(before,self.snapshot())

    def test_empty_state_left_by_deleted_lesson_does_not_block_placement(self):
        self.dates=['2026-11-22','2026-11-23']
        dest={**self.source,'日付':self.dates[-1],'_追加ID':'deleted'}
        deleted={'ADD:deleted':{'_deleted':True}}
        self.write('added_lessons.json',[self.source,dest]);self.write('edited_lessons.json',deleted)
        states={f.key(dest):{'publicNote':'','ready':False,'attendance':[],'updatedAt':'old','updatedBy':'test'},
                f.key({**self.source,'日付':'2026-11-24'}):{'publicNote':'別日の記録'}}
        self.write('class_state.json',states)
        code,j=self.repeat();self.assertEqual(code,200,j);self.assertEqual(j['count'],2)
        self.assertEqual(self.read('edited_lessons.json'),deleted)
        self.assertEqual(self.read('added_lessons.json')[:2],[self.source,dest])
        self.assertEqual(self.read('class_state.json')[f.key(dest)]['publicNote'],self.source['備考'])
        self.assertEqual(self.read('class_state.json')[f.key({**self.source,'日付':'2026-11-24'})],{'publicNote':'別日の記録'})
        self.assertTrue(any(old.read_text(encoding='utf-8')==json.dumps(states,ensure_ascii=False)
                            for old in (self.root/'data'/'_backup').glob('class_state.json.*')))

    def test_empty_state_for_linked_repeat_allowed_on_every_period(self):
        g,rows=self.prepare_group(False);self.source_key=rows[0]['_sourceKey']
        self.dates=['2026-11-23']
        self.write('class_state.json',{f.key({**r,'日付':self.dates[0]}):{} for r in rows})
        code,j=self.repeat();self.assertEqual(code,200,j);self.assertEqual(j['count'],2)
        self.assertEqual(len(self.read('lesson_groups.json')),2)

    def test_four_period_repeat_over_empty_invitation_state(self):
        source_date='2026-11-23'
        self.dates=['2026-11-24','2026-11-25','2026-11-26']
        rows=[{**f.row(i),'日付':source_date,'担当講師':'','教室':'自宅可',
               '_追加ID':f'repeat-invites-{i}','_sourceKey':f'ADD:repeat-invites-{i}'}
              for i in range(6,10)]
        self.source_key=rows[0]['_sourceKey']
        gid='b'*24
        group={'id':gid,'key':'GROUP:'+gid,'sources':[r['_sourceKey'] for r in rows],
               'snapshot':rows,'active':True,'mealBreak':False}
        self.write('added_lessons.json',rows)
        self.write('lesson_groups.json',{gid:group})
        self.write('class_state.json',{
            f.key({**r,'日付':self.dates[-1]}):{'publicNote':'','invitedStudents':[],
                'updatedAt':'2026-11-20T10:00:00+09:00','updatedBy':'検証管理者'} for r in rows
        })
        code,j=self.repeat();self.assertEqual(code,200,j);self.assertEqual(j['count'],12)
        self.assertEqual(self.read('added_lessons.json')[:4],rows)
        self.assertEqual([r['日付'] for r in self.read('added_lessons.json')[4:]],
                         [date for date in self.dates for _ in rows])
        self.assertEqual(len(self.read('lesson_groups.json')),4)


    def test_meaningful_or_unknown_class_state_blocks_entire_batch(self):
        dest=f.key({**self.source,'日付':self.dates[-1]})
        for state in [{'publicNote':'連絡を保持'}, {'attendance':{'検証生徒':'欠席'}},
                      {'ready':True}, {'futureData':[]}, {'invitedStudents':['検証追加生徒']},
                      {'invitedStudents':None}, {'invitedStudents':'unexpected'}, 'unexpected']:
            with self.subTest(state=state):
                self.write('class_state.json',{dest:state});p=self.payload();before=self.snapshot()
                code,j=self.repeat(p);self.assertEqual(code,409,j);self.assertIn(self.dates[-1],j['error']);self.assertIn('保存済みの記録',j['error'])
                self.assertEqual(before,self.snapshot())

    def test_records_aliases_and_attachments_block_without_overwrite(self):
        dest=f.key({**self.source,'日付':self.dates[-1]})
        for name,value in [('class_state.json',{dest:{'ready':True}}),('lesson_records.json',{dest:{'memo':'keep'}}),('lesson_fixed.json',{dest:{'fixed':True}}),('room_overrides.json',{dest:{'room':'黄'}}),('lesson_key_aliases.json',{dest:'old-key'}),('student_attachments.json',[{'key':dest,'id':'keep-file'}])]:
            with self.subTest(name=name):
                self.write(name,value);p=self.payload();before=self.snapshot();self.assertEqual(self.repeat(p)[0],409);self.assertEqual(before,self.snapshot());self.write(name,[] if name=='student_attachments.json' else {})

    def test_stale_source_and_message_block(self):
        p=self.payload();self.write('class_state.json',{f.key(self.source):{'publicNote':'changed'}});before=self.snapshot()
        self.assertEqual(self.repeat(p)[0],409);self.assertEqual(before,self.snapshot())

    def test_invalid_dates_and_count_block(self):
        for dates in [[],['2026-02-30'],['2026-09-25'],['2026-09-28']*2,['2026/09/28'],[None],['2026-10-%02d'%i for i in range(1,32)]+['2026-11-01'],{'a':'2026-09-28'}]:
            p=self.payload();p['dates']=dates;before=self.snapshot();self.assertEqual(self.repeat(p)[0],400);self.assertEqual(before,self.snapshot())

    def test_request_replay_never_duplicates_and_changed_payload_blocked(self):
        p=self.payload();self.assertEqual(self.repeat(p)[0],200);before=self.snapshot()
        p['dates']=list(reversed(p['dates']));code,j=self.repeat(p);self.assertEqual(code,200,j);self.assertTrue(j['replayed']);self.assertEqual(before,self.snapshot())
        p['dates']=['2026-10-05'];self.assertEqual(self.repeat(p)[0],409);self.assertEqual(before,self.snapshot())

    def test_new_request_for_same_dates_is_blocked(self):
        self.assertEqual(self.repeat()[0],200);before=self.snapshot();self.assertEqual(self.repeat()[0],409);self.assertEqual(before,self.snapshot())

    def test_ng_and_room_conflicts_need_confirmation(self):
        r={**self.source,'日付':self.dates[-1],'クラス':'別クラス','_追加ID':'other'};self.write('added_lessons.json',[self.source,r])
        p=self.payload();before=self.snapshot();code,j=self.repeat(p);self.assertEqual(code,409);self.assertTrue(j['roomConflict']);self.assertEqual(before,self.snapshot())
        self.write('teacher_ng.json',[dict(teacher=self.source['担当講師'],date=self.dates[0],allDay=True)]);p['overrideRoom']=True;before=self.snapshot()
        code,j=self.repeat(p);self.assertEqual(code,409);self.assertTrue(j['ngConflict']);self.assertEqual(before,self.snapshot())
        p['overrideNg']=True;self.assertEqual(self.repeat(p)[0],200)

    def test_other_class_outside_room_and_time_does_not_block_date(self):
        self.dates=['2026-11-23']
        other={**f.row(5),'日付':self.dates[0],'クラス':'別クラス','_追加ID':'other'}
        self.write('added_lessons.json',[self.source,other])
        code,j=self.repeat();self.assertEqual(code,200,j);self.assertEqual(j['count'],1)
        self.assertEqual(self.read('added_lessons.json')[:2],[self.source,other])

    def test_pc_sharing_is_allowed(self):
        self.source['教室']='PC';r={**self.source,'日付':self.dates[0],'クラス':'別クラス','_追加ID':'other'};self.write('added_lessons.json',[self.source,r]);self.assertEqual(self.repeat()[0],200)

    def test_incomplete_group_and_changed_members_block(self):
        g,rows=self.prepare_group(False);self.source_key=rows[0]['_sourceKey'];p=self.payload()
        self.write('edited_lessons.json',{rows[1]['_sourceKey']:{**rows[1],'_deleted':True}});before=self.snapshot()
        self.assertEqual(self.plan()[0],409);self.assertEqual(self.repeat(p)[0],409);self.assertEqual(before,self.snapshot())

    def test_unauthenticated_teacher_and_csrf_rejected(self):
        p=self.payload();before=self.snapshot()
        self.assertEqual(self.request('lesson_repeat_api.php',p,self.client())[0],401)
        self.assertEqual(self.request('lesson_repeat_api.php',p,self.teacher,self.teacher_csrf)[0],403)
        self.assertEqual(self.request('lesson_repeat_api.php',p)[0],403)
        self.assertEqual(self.request('lesson_repeat_api.php?sourceKey=ADD:source',client=self.teacher)[0],403)
        self.assertEqual(before,self.snapshot())

    def test_31_dates_allowed_and_original_never_moved(self):
        p=self.payload();p['dates']=['2026-10-%02d'%i for i in range(1,32)]
        code,j=self.repeat(p);self.assertEqual(code,200,j);self.assertEqual(j['count'],31);self.assertEqual(self.read('added_lessons.json')[0],self.source)

if __name__=='__main__':unittest.main()
