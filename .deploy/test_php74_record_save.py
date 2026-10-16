"""Exercise record saves without PHP 8-only prefix functions (production is PHP 7.4)."""
import urllib.parse
import test_lesson_creation as fixture

class Php74RecordSaveTests(fixture.LessonCreationTests):
    php_options=['-d','disable_functions=str_starts_with']
    def test_single_saves_as_teacher_and_admin_then_reloads(self):
        row=fixture.row(5);row.update(_追加ID='php74-single',_sourceKey='ADD:php74-single');self.write('added_lessons.json',[row]);key=fixture.key(row)
        for client,csrf,name in [(self.teacher,self.teacher_csrf,'teacher'),(self.admin,self.csrf,'admin')]:
            code,j=self.request('lesson_record_api.php',dict(eventKey=key,memo='PHP74 '+name,homework='',dueHomework=''),client,csrf);self.assertEqual(code,200,j)
            code,j=self.request('lesson_record_api.php?key='+urllib.parse.quote(key),client=client);self.assertEqual(code,200,j);self.assertEqual(j['record']['memo'],'PHP74 '+name)
    def test_group_revision_guard_still_rejects_missing_and_stale_revision(self):
        group,rows=self.prepare_group(with_next=False,deleted=False);key=group['key'];path='lesson_record_api.php?key='+urllib.parse.quote(key)
        old=self.request(path)[1]['record'];payload=dict(eventKey=key,memo='PHP74 common memo',homework='common homework')
        before=self.snapshot();code,j=self.request('lesson_record_api.php',payload,self.teacher,self.teacher_csrf);self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())
        payload['expectedRevision']=old['_revision'];code,j=self.request('lesson_record_api.php',payload,self.teacher,self.teacher_csrf);self.assertEqual(code,200,j);self.assertEqual(self.request(path)[1]['record']['memo'],'PHP74 common memo')
        before=self.snapshot();code,j=self.request('lesson_record_api.php',payload,self.teacher,self.teacher_csrf);self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())

for name in vars(fixture.LessonCreationTests):
    if name.startswith('test_'):setattr(Php74RecordSaveTests,name,None)
