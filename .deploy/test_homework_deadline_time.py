"""Focused JST minute deadlines, optional/legacy values, and existing task identity."""
from datetime import datetime,timezone
import urllib.parse
import test_homework_materials as materials
import test_lesson_creation as fixture

class HomeworkDeadlineTimeTests(materials.HomeworkMaterialsTests):
    php_options=['-d','disable_functions=str_starts_with']
    def save_ref(self,ref,action='save',teacher=True):
        record=self.source_record();refs=record['homeworkTaskRefs']['next'];refs[0].update(ref)
        payload=dict(action=action,eventKey=fixture.key(self.rows[2]),memo='Deadline memo',homework='\n'.join(r['text'] for r in refs),homeworkTaskRefs={'next':refs},expectedRevision=record['_revision'])
        return self.request('lesson_record_api.php',payload,self.teacher if teacher else self.admin,self.teacher_csrf if teacher else self.csrf)
    def test_jst_time_save_reload_list_edit_and_clear_preserve_status_and_materials(self):
        old=self.common_check(self.task());self.assertEqual(self.upload(old['id'])[0],200)
        self.assertEqual(self.save_ref(dict(dueDate='2026-10-23',dueTime='00:00'))[0],200)
        task=self.task();self.assertEqual(task['dueAt'],'2026-10-23T00:00:00+09:00');self.assertEqual(datetime.fromisoformat(task['dueAt']).astimezone(timezone.utc).isoformat(),'2026-10-22T15:00:00+00:00');self.assertTrue(task['checked']);self.assertEqual(task['id'],old['id']);self.assertEqual(len(task['attachments']),1)
        self.assertEqual(self.source_record()['homeworkTaskRefs']['next'][0]['dueTime'],'00:00')
        self.assertEqual(self.save_ref(dict(dueTime='23:59'),action='edit')[0],200);self.assertEqual(self.task()['dueAt'],'2026-10-23T23:59:00+09:00')
        record=self.source_record();self.assertEqual(self.request('lesson_record_api.php',dict(action='edit',eventKey=fixture.key(self.rows[2]),memo='Memo-only legacy client',expectedRevision=record['_revision']),self.teacher,self.teacher_csrf)[0],200);self.assertEqual(self.task()['dueTime'],'23:59')
        self.assertEqual(self.save_ref(dict(dueTime=''))[0],200);self.assertEqual(self.task()['dueAt'],'2026-10-23T23:59:59+09:00')
        self.assertEqual(self.save_ref(dict(dueDate='',dueTime=''))[0],200);self.assertIsNone(self.task()['dueAt']);self.assertTrue(self.task()['checked']);self.assertEqual(len(self.task()['attachments']),1)
    def test_legacy_date_only_empty_and_invalid_time_are_lossless(self):
        self.assertIsNone(self.task()['dueAt']);self.assertEqual(self.save_ref(dict(dueDate='2026-10-23'))[0],200);self.assertEqual(self.task()['dueAt'],'2026-10-23T23:59:59+09:00')
        for value in ['24:00','12:60','7:00',None]:
            before=self.snapshot();code,j=self.save_ref(dict(dueTime=value));self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())
        before=self.snapshot();self.assertEqual(self.save_ref(dict(dueDate='',dueTime='12:30'))[0],400);self.assertEqual(before,self.snapshot())
        self.assertEqual(self.save_ref(dict(dueTime='12:30'))[0],200)
        record=self.source_record();refs=record['homeworkTaskRefs']['next'];refs[0].pop('dueTime');refs[0]['dueDate']=''
        self.assertEqual(self.save_source('\n'.join(r['text'] for r in refs),refs)[0],200);self.assertIsNone(self.task()['dueAt']);self.assertEqual(self.source_record()['homeworkTaskRefs']['next'][0]['dueTime'],'')
    def test_linked_direct_homework_time_is_shared_across_teacher_handoff(self):
        first=dict(self.rows[3]);first['終了']='18:20';self.rows[3]=first
        extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='deadline-time-linked',_sourceKey='ADD:deadline-time-linked');self.write('added_lessons.json',self.rows+[extra]);gid='e'*24;key='GROUP:'+gid
        self.write('lesson_groups.json',{gid:dict(id=gid,key=key,sources=[first['_sourceKey'],extra['_sourceKey']],snapshot=[first,extra],active=True,mealBreak=False)})
        self.write('lesson_records.json',{key:dict(eventKey=key,date=first['日付'],memo='Group memo',homework='',dueHomework='Timed preparation')})
        detail=self.request('lesson_group_api.php?action=detail&id='+gid)[1];refs=detail['record']['homeworkTaskRefs'];refs['due'][0].update(dueDate='2026-10-23',dueTime='18:30')
        code,j=self.request('lesson_group_api.php',dict(action='save',id=gid,version=detail['version'],memo='Group memo',homework='',dueHomework='Timed preparation',homeworkTaskRefs=refs,attendance={}),self.teacher,self.teacher_csrf);self.assertEqual(code,200,j)
        self.rows[4]['担当講師']='Replacement teacher';self.write('added_lessons.json',self.rows+[extra])
        detail=self.request('lesson_group_api.php?action=detail&id='+gid)[1];self.assertEqual(detail['record']['homeworkTaskRefs']['due'][0]['dueTime'],'18:30')
        tasks=[r for r in self.context(4)['items'] if r['text']=='Timed preparation'];self.assertEqual(len(tasks),1);self.assertEqual(tasks[0]['dueAt'],'2026-10-23T18:30:00+09:00');self.assertEqual(self.task('Timed preparation')['dueAt'],tasks[0]['dueAt'])

for name in vars(materials.HomeworkMaterialsTests):
    if name.startswith('test_'):setattr(HomeworkDeadlineTimeTests,name,None)
