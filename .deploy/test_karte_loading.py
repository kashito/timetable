"""Read-only record list optimisation, synthetic fixtures only."""
import json,shutil,subprocess,time,urllib.parse
import test_lesson_creation as fixture

class KarteLoadingTests(fixture.LessonCreationTests):
    def setUp(self):
        super().setUp();shutil.copyfile(fixture.ROOT/'lesson_record_context.php',self.root/'lesson_record_context.php')
    def test_bulk_decoration_matches_legacy_and_measure(self):
        rows=[];records={}
        for i in range(180):
            r=fixture.row();r.update({'クラス':'架空授業'+str(i),'_追加ID':str(i),'_sourceKey':'ADD:'+str(i)})
            rows.append(r);k=fixture.key(r);records[k]=dict(eventKey=k,date=r['日付'],className=r['クラス'],teacher=r['担当講師'],homework='教材1\n教材2',dueHomework='前回課題')
        self.write('added_lessons.json',rows);self.write('lesson_records.json',records)
        self.write('student_attachments.json',[dict(id='fake-material',key='HOMEWORK:unused',name='架空資料',size=10)])
        # Includes fallback owners, linked and inactive group records, stored refs and aliases.
        group={'id':'b'*24,'key':'GROUP:'+'b'*24,'sources':['ADD:0','ADD:1'],'snapshot':rows[:2],'active':False}
        self.write('lesson_groups.json',{group['id']:group});records[group['key']]=dict(eventKey=group['key'],homework='連結課題',sourceRecords=[dict(homeworkTaskRefs={'next':[dict(id='stored-ref',text='連結課題')]})]);records['deleted-key']=dict(eventKey='deleted-key',date='2026-09-24',className='削除済み架空授業',homework='保存課題')
        self.write('lesson_records.json',records);before=self.snapshot()
        code="require 'homework_explanation.php';$r=readJsonStrict(__DIR__.'/data/lesson_records.json');$rows=policyRows();$t=microtime(true);$old=[];foreach($r as $k=>$v)$old[$k]=homeworkDecorateRecord($k,$v,$rows);$a=microtime(true)-$t;$t=microtime(true);$new=homeworkDecorateRecords($r,$rows);echo json_encode(['equal'=>$old===$new,'legacySeconds'=>$a,'bulkSeconds'=>microtime(true)-$t,'count'=>count($r)]);"
        result=json.loads(subprocess.check_output([fixture.PHP,'-r',code],cwd=self.root));print('DECORATION_BENCHMARK',json.dumps(result));self.assertTrue(result['equal']);self.assertEqual(self.snapshot(),before)
        legacy=(fixture.ROOT/'lesson_record_api.php').read_text(encoding='utf8').replace('$all=homeworkDecorateRecords($all);', '$ownerRows=policyRows();foreach($all as $recordKey=>&$item)$item=homeworkDecorateRecord($recordKey,$item,$ownerRows);unset($item);').encode('utf8')
        (self.root/'legacy_record_api.php').write_bytes(legacy)
        started=time.perf_counter();code,old=self.request('legacy_record_api.php?includeTiming=1');old_time=time.perf_counter()-started;self.assertEqual(code,200,old)
        started=time.perf_counter();code,new=self.request('lesson_record_api.php?includeTiming=1');new_time=time.perf_counter()-started;self.assertEqual(code,200,new);self.assertEqual(new,old)
        print('LIST_API_BENCHMARK',json.dumps(dict(legacySeconds=old_time,bulkSeconds=new_time,count=len(new['records']))));self.assertEqual(self.snapshot(),before)
    def test_context_is_authenticated_bounded_and_only_requested_group(self):
        group,rows=self.prepare_group(with_next=False,deleted=False)
        self.write('lesson_records.json',{group['key']:dict(eventKey=group['key'],groupId=group['id'],date=rows[0]['日付'],className=rows[0]['クラス'],teacher=rows[0]['担当講師'],slot='⑤⑥',memo='架空連結カルテ')})
        self.write('class_state.json',{fixture.key(rows[0]):{'attendance':{'架空生徒':'出席'}}})
        query='lesson_record_api.php?action=list_context&keys='+urllib.parse.quote(json.dumps([group['key'],'deleted-key']))
        before=self.snapshot();code,j=self.request(query);self.assertEqual(code,200,j);self.assertEqual(list(j['attendance']),[group['key']]);self.assertEqual(len(j['attendance'][group['key']]),2)
        code,j=self.request(query,client=self.client());self.assertEqual(code,401,j)
        for keys in [[1],list(map(str,range(101))),{'bad':'shape'}]:
            code,j=self.request('lesson_record_api.php?action=list_context&keys='+urllib.parse.quote(json.dumps(keys)));self.assertEqual(code,400,j)
        code,j=self.request('lesson_record_api.php?includeTiming=1');self.assertEqual(code,200,j);self.assertNotIn('attendance',j);self.assertIn(group['key'],j['timings']);self.assertEqual(self.snapshot(),before)

for name in vars(fixture.LessonCreationTests):
    if name.startswith('test_'):setattr(KarteLoadingTests,name,None)
