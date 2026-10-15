"""Focused same-name continuity tests; synthetic learners only."""
import urllib.parse
import test_explanation as existing
import test_shared_completion as shared
import test_lesson_creation as fixture

class NameHandoffTests(existing.ExplanationTests):
    def swap_teacher(self,index=3):
        self.rows[index]['担当講師']='Replacement teacher'
        self.rows[index]['授業ID']='replacement-series'
        self.write('added_lessons.json',self.rows)
    def test_single_handoff_keeps_identity_due_date_and_completed_state(self):
        item=self.common_check(self.task());private=(self.root/'data/student_homework_checks.php').read_bytes()
        self.swap_teacher()
        current=self.task();self.assertEqual(current['id'],item['id']);self.assertTrue(current['checked']);self.assertIsNone(current['dueAt'])
        detail=self.context();self.assertTrue(next(i for i in detail['items'] if i['id']==item['id'])['checked']);self.assertEqual(sum(i['id']==item['id'] for i in detail['items']),1)
        self.assertEqual(private,(self.root/'data/student_homework_checks.php').read_bytes())
    def test_unseeded_task_identity_is_unchanged_by_new_matching_rule(self):
        item=self.task();self.swap_teacher();self.assertEqual(self.task()['id'],item['id']);self.assertFalse(self.task()['checked'])
        self.assertIn(shared.TEXT[0],[i['text'] for i in self.context()['items']])
    def test_different_name_does_not_inherit(self):
        self.swap_teacher();self.rows[3]['クラス']='Different lesson';self.write('added_lessons.json',self.rows)
        self.assertNotIn(shared.TEXT[0],[i['text'] for i in self.context()['items']])
    def test_linked_next_lesson_and_homework_follow_name_across_teachers(self):
        self.swap_teacher()
        first=dict(self.rows[3]);first['終了']='18:20';self.rows[3]=first
        extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='handoff-linked',_sourceKey='ADD:handoff-linked')
        self.write('added_lessons.json',self.rows+[extra]);gid='f'*24
        self.write('lesson_groups.json',{gid:dict(id=gid,key='GROUP:'+gid,sources=[first['_sourceKey'],extra['_sourceKey']],snapshot=[first,extra],active=True,mealBreak=False)})
        detail=self.request('lesson_group_api.php?action=detail&id='+gid)[1]
        self.assertEqual(detail['nextLesson']['date'],'2026-10-15')
        previous=self.request('lesson_record_api.php?action=previous_homework&key='+urllib.parse.quote('GROUP:'+gid))[1]
        self.assertEqual(sum(i['text']==shared.TEXT[0] for i in previous['items']),1)
        self.rows[4]['クラス']='Different lesson';self.write('added_lessons.json',self.rows+[extra])
        self.assertIsNone(self.request('lesson_group_api.php?action=detail&id='+gid)[1]['nextLesson'])

for name in vars(existing.ExplanationTests):
    if name.startswith('test_'):setattr(NameHandoffTests,name,None)
