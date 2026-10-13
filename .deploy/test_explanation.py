"""Shared teaching/explanation completion; real PHP, isolated synthetic students."""
import json,secrets,shutil,unittest,urllib.parse
import test_shared_completion as shared
import test_lesson_creation as fixture

class ExplanationTests(shared.SharedCompletionTests):
    # Keep this suite focused: inherited private-history tests remain in their own suite.
    def setUp(self):
        shared.SharedCompletionTests.setUp(self)
        shutil.copyfile(fixture.ROOT/'homework_explanation_api.php',self.root/'homework_explanation_api.php')
        self.write('homework_explanation_checks.php',{})
    def shared_catalog(self,student='検証生徒A',client=None):
        code,j=self.request('student_homework_api.php?student='+urllib.parse.quote(student),client=client or self.a);self.assertEqual(code,200,j);return j['items']
    def context(self,index=3):
        code,j=self.request('lesson_record_api.php?action=previous_homework&key='+urllib.parse.quote(fixture.key(self.rows[index])));self.assertEqual(code,200,j);return j
    def task(self,text=None):return next(i for i in self.shared_catalog() if i['text']==(text or shared.TEXT[0]))
    def complete(self,item,wanted=True,client=None,csrf=None):
        return self.request('homework_explanation_api.php',dict(taskId=item['id'],checked=wanted,expectedRevision=item['revision']),client or self.teacher,csrf or self.teacher_csrf)
    def common_check(self,item,wanted=True):
        code,j=self.complete(item,wanted);self.assertEqual(code,200,j);return j['item']
    def source_record(self,index=2):
        return self.request('lesson_record_api.php?key='+urllib.parse.quote(fixture.key(self.rows[index])))[1]['record']
    def save_source(self,homework,refs,index=2,**extra):
        return self.post('lesson_record_api.php',dict(eventKey=fixture.key(self.rows[index]),homework=homework,homeworkTaskRefs={'next':refs},**extra))

    def test_shared_without_person_selection_and_unrelated_task_unchanged(self):
        item=self.task();self.common_check(item)
        for name in ['検証生徒A','検証生徒B']:
            items=self.shared_catalog(name);self.assertTrue(next(i for i in items if i['id']==item['id'])['checked']);self.assertFalse(next(i for i in items if i['text']==shared.TEXT[1])['checked'])
        detail=self.context();self.assertEqual(detail['students'],[]);self.assertEqual(detail['student'],'');self.assertTrue(next(i for i in detail['items'] if i['id']==item['id'])['checked'])

    def test_personal_and_legacy_completion_never_become_explanation(self):
        private=next(i for i in self.catalog() if i['text']==shared.TEXT[0]);self.assertEqual(self.check(private,True)[0],200)
        records=self.read('lesson_records.json');old=shared.SharedCompletionTests.previous(self)['items'][0];records[fixture.key(self.rows[3])]['homeworkChecks']={old['id']:{'checked':True,'by':'検証teacher'}};self.write('lesson_records.json',records)
        before=(self.root/'data/student_homework_checks.php').read_bytes();self.assertFalse(self.task()['checked']);self.common_check(self.task());self.assertEqual((self.root/'data/student_homework_checks.php').read_bytes(),before)
        self.assertTrue(self.read('lesson_records.json')[fixture.key(self.rows[3])]['homeworkChecks'][old['id']]['checked'])

    def test_shared_cancel_returns_to_carry_and_syncs_both_students(self):
        item=self.common_check(self.task());self.common_check(item,False)
        self.assertFalse(self.task()['checked']);self.assertFalse(next(i for i in self.shared_catalog('検証生徒B') if i['id']==item['id'])['checked']);self.assertFalse(next(i for i in self.context(4)['items'] if i['id']==item['id'])['checked'])

    def test_concurrent_teacher_update_rejects_stale_revision(self):
        item=self.task();self.common_check(item);before=self.snapshot();code,j=self.complete(item,False,self.admin,self.csrf);self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

    def test_anonymous_and_missing_csrf_cannot_change_common(self):
        item=self.task();payload=dict(taskId=item['id'],checked=True,expectedRevision=item['revision']);before=self.snapshot()
        self.assertEqual(self.request('homework_explanation_api.php',payload,self.a,self.a_csrf)[0],401);self.assertEqual(self.request('homework_explanation_api.php',payload,self.teacher)[0],403);self.assertEqual(before,self.snapshot())

    def test_typo_edit_keeps_identity_and_completed_state(self):
        item=self.common_check(self.task());record=self.source_record();refs=record['homeworkTaskRefs']['next'];refs[0]['text']='国語P18.19 修正';code,j=self.save_source('\n'.join(i['text'] for i in refs),refs);self.assertEqual(code,200,j)
        task=self.task('国語P18.19 修正');self.assertEqual(task['id'],item['id']);self.assertTrue(task['checked']);self.assertTrue(next(i for i in self.context()['items'] if i['id']==item['id'])['checked'])

    def test_reordering_insertion_removal_do_not_transfer_completion(self):
        item=self.common_check(self.task());refs=self.source_record()['homeworkTaskRefs']['next'];refs=[refs[2],dict(id='hwx_'+secrets.token_hex(16),text='新しい宿題'),refs[0]];code,j=self.save_source('\n'.join(i['text'] for i in refs),refs);self.assertEqual(code,200,j)
        self.assertTrue(self.task()['checked']);self.assertFalse(self.task('新しい宿題')['checked']);self.assertFalse(any(i['text']==shared.TEXT[1] for i in self.shared_catalog()))

    def test_remove_and_readd_same_text_is_a_new_unfinished_task(self):
        old=self.common_check(self.task());refs=self.source_record()['homeworkTaskRefs']['next'];removed=[i for i in refs if i['id']!=old['id']];self.assertEqual(self.save_source('\n'.join(i['text'] for i in removed),removed)[0],200)
        new=dict(id='hwx_'+secrets.token_hex(16),text=old['text']);refs=removed+[new];self.assertEqual(self.save_source('\n'.join(i['text'] for i in refs),refs)[0],200);current=self.task();self.assertNotEqual(current['id'],old['id']);self.assertFalse(current['checked']);self.assertTrue(old['id'] in self.read_guarded('homework_explanation_checks.php'))

    def read_guarded(self,name):return json.loads((self.root/'data'/name).read_text(encoding='utf-8').split('?>',1)[1])

    def test_unknown_or_foreign_identifier_cannot_be_applied(self):
        self.common_check(self.task());refs=self.source_record()['homeworkTaskRefs']['next'];refs[0]['id']='hwc_'+'0'*24;before=self.snapshot();code,j=self.save_source('\n'.join(i['text'] for i in refs),refs);self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

    def test_read_only_catalog_does_not_migrate_personal_history(self):
        before=self.snapshot();self.shared_catalog();self.context();self.assertEqual(before,self.snapshot());self.assertFalse((self.root/'data/homework_explanation_checks.php').read_text(encoding='utf-8').find('<?php exit; ?>')!=0)

    def test_direct_assignment_carries_and_clears_consistently(self):
        code,j=self.post('lesson_record_api.php',dict(eventKey=fixture.key(self.rows[3]),dueHomework='直接の予習'));self.assertEqual(code,200,j);item=self.task('直接の予習');self.assertEqual(item['kind'],'due');self.assertTrue(any(i['id']==item['id'] for i in self.context(4)['items']));self.common_check(item);self.assertTrue(self.task('直接の予習')['checked'])

    def test_duplicate_direct_and_previous_assignment_is_one_task(self):
        code,j=self.post('lesson_record_api.php',dict(eventKey=fixture.key(self.rows[3]),dueHomework=shared.TEXT[0]));self.assertEqual(code,200,j);self.assertEqual(len([i for i in self.context()['items'] if i['text']==shared.TEXT[0]]),1);self.assertEqual(len([i for i in self.shared_catalog() if i['text']==shared.TEXT[0]]),1)

    def test_seeding_identity_does_not_invalidate_open_record_editor(self):
        before=self.source_record();self.common_check(self.task());code,j=self.post('lesson_record_api.php',dict(action='edit',eventKey=fixture.key(self.rows[2]),memo='元の画面から保存',expectedRevision=before['_revision']));self.assertEqual(code,200,j)

    def test_other_date_identical_text_is_not_marked_complete(self):
        self.common_check(self.task());code,j=self.post('lesson_record_api.php',dict(eventKey=fixture.key(self.rows[3]),homework=shared.TEXT[0]));self.assertEqual(code,200,j);items=[i for i in self.shared_catalog() if i['text']==shared.TEXT[0]];self.assertEqual(len(items),2);self.assertEqual(sum(i['checked'] for i in items),1)

    def test_private_completion_store_is_php_guarded(self):
        self.common_check(self.task());self.assertTrue((self.root/'data/homework_explanation_checks.php').read_text(encoding='utf-8').startswith('<?php exit; ?>'))

    def test_link_unlink_relink_preserves_shared_identity_and_member_records(self):
        original=self.common_check(self.task());first=dict(self.rows[2]);first['終了']='18:20';self.rows[2]=first;extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='link-extra',_sourceKey='ADD:link-extra');self.write('added_lessons.json',self.rows+[extra]);sources=[first['_sourceKey'],extra['_sourceKey']]
        def link():
            plan=self.request('lesson_group_api.php?action=candidates&sourceKey='+urllib.parse.quote(sources[0]))[1];code,j=self.post('lesson_group_api.php',dict(action='create',sources=sources,version=plan['version'],mealBreak=False));self.assertEqual(code,200,j);return j['group']
        group=link();self.assertTrue(self.task()['checked']);self.assertEqual(self.task()['id'],original['id']);detail=self.request('lesson_group_api.php?action=detail&id='+group['id'])[1];self.assertEqual(self.post('lesson_group_api.php',dict(action='unlink',id=group['id'],version=detail['version']))[0],200);self.assertTrue(self.task()['checked']);link();self.assertTrue(self.task()['checked']);self.assertEqual(len([i for i in self.shared_catalog() if i['text']==shared.TEXT[0]]),1)

    def test_completion_does_not_invalidate_open_group_editor(self):
        first=dict(self.rows[3]);first['終了']='18:20';self.rows[3]=first;extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='open-group',_sourceKey='ADD:open-group');self.write('added_lessons.json',self.rows+[extra]);sources=[first['_sourceKey'],extra['_sourceKey']];plan=self.request('lesson_group_api.php?action=candidates&sourceKey='+urllib.parse.quote(sources[0]))[1];code,g=self.post('lesson_group_api.php',dict(action='create',sources=sources,version=plan['version'],mealBreak=False));self.assertEqual(code,200,g)
        code,created=self.post('lesson_record_api.php',dict(eventKey=g['group']['key'],dueHomework='直接予習',expectedRevision=self.request('lesson_record_api.php?key='+urllib.parse.quote(g['group']['key']))[1]['record']['_revision']));self.assertEqual(code,200,created);detail=self.request('lesson_group_api.php?action=detail&id='+g['group']['id'])[1];self.common_check(self.task('直接予習'));code,j=self.post('lesson_group_api.php',dict(action='save',id=g['group']['id'],version=detail['version'],memo='入力維持',homework='次回課題',attendance={}));self.assertEqual(code,200,j)

    def test_schedule_move_preserves_completed_assignment_identity(self):
        item=self.common_check(self.task());source=dict(self.rows[2]);source['開始']='17:45';code,j=self.post('lesson_add_api.php',dict(action='update',sourceKey=source['_sourceKey'],row=source));self.assertEqual(code,200,j);self.assertEqual(self.task()['id'],item['id']);self.assertTrue(self.task()['checked'])

    def test_manual_series_identifier_does_not_complete_another_class(self):
        rows=[dict(r,授業ID='同じ手動ID') for r in self.rows];other=dict(rows[2],クラス='別クラス',_追加ID='other-class',_sourceKey='ADD:other-class');self.write('added_lessons.json',rows+[other]);self.write('student_master.json',[{'生徒名':'検証生徒A','クラス':'検証クラス'},{'生徒名':'検証生徒B','クラス':'別クラス'}]);records=self.read('lesson_records.json');records[fixture.key(other)]=dict(homework=shared.TEXT[0]);self.write('lesson_records.json',records)
        self.common_check(self.task());item=next(i for i in self.shared_catalog('検証生徒B') if i['text']==shared.TEXT[0]);self.assertFalse(item['checked'])

    def test_old_group_identity_seed_keeps_open_editor_version(self):
        first=dict(self.rows[3]);first['終了']='18:20';self.rows[3]=first;extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='old-group',_sourceKey='ADD:old-group');self.write('added_lessons.json',self.rows+[extra]);gid='d'*24;self.write('lesson_groups.json',{gid:dict(id=gid,key='GROUP:'+gid,sources=[first['_sourceKey'],extra['_sourceKey']],snapshot=[first,extra],active=True,mealBreak=False)});records=self.read('lesson_records.json');records['GROUP:'+gid]=dict(eventKey='GROUP:'+gid,date=first['日付'],memo='既存の共通本文',dueHomework='旧グループ予習',homework='次回分');self.write('lesson_records.json',records)
        detail=self.request('lesson_group_api.php?action=detail&id='+gid)[1];self.common_check(self.task('旧グループ予習'));code,j=self.post('lesson_group_api.php',dict(action='save',id=gid,version=detail['version'],memo='保持して保存',homework='次回分',attendance={}));self.assertEqual(code,200,j)

    def test_two_unlinked_lessons_with_same_text_keep_separate_completion(self):
        first=dict(self.rows[2]);first['終了']='18:20';self.rows[2]=first;extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='separate-task',_sourceKey='ADD:separate-task');self.write('added_lessons.json',self.rows+[extra]);records=self.read('lesson_records.json');records[fixture.key(extra)]=dict(eventKey=fixture.key(extra),homework=shared.TEXT[0]);self.write('lesson_records.json',records)
        candidates=[i for i in self.shared_catalog() if i['text']==shared.TEXT[0]];self.assertEqual(len(candidates),2);self.common_check(candidates[0]);self.assertEqual(sum(i['checked'] for i in self.shared_catalog() if i['text']==shared.TEXT[0]),1)

    def test_linked_text_edit_keeps_completed_identifier(self):
        first=dict(self.rows[3]);first['終了']='18:20';self.rows[3]=first;extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='typed-group',_sourceKey='ADD:typed-group');self.write('added_lessons.json',self.rows+[extra]);gid='e'*24;self.write('lesson_groups.json',{gid:dict(id=gid,key='GROUP:'+gid,sources=[first['_sourceKey'],extra['_sourceKey']],snapshot=[first,extra],active=True,mealBreak=False)});records=self.read('lesson_records.json');records['GROUP:'+gid]=dict(eventKey='GROUP:'+gid,date=first['日付'],memo='共通本文',dueHomework='グループ予習',homework='次回分');self.write('lesson_records.json',records)
        task=self.common_check(self.task('グループ予習'));detail=self.request('lesson_group_api.php?action=detail&id='+gid)[1];refs=detail['record']['homeworkTaskRefs'];refs['due'][0]['text']='グループ予習 修正';code,j=self.post('lesson_group_api.php',dict(action='save',id=gid,version=detail['version'],memo='共通本文',homework='次回分',dueHomework='グループ予習 修正',homeworkTaskRefs=refs,attendance={}));self.assertEqual(code,200,j);updated=self.task('グループ予習 修正');self.assertEqual(updated['id'],task['id']);self.assertTrue(updated['checked'])

# Do not rerun inherited private-history cases as new shared-scope tests.
for name in vars(shared.SharedCompletionTests):
    if name.startswith('test_'):setattr(ExplanationTests,name,None)
