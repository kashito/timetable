"""Focused optional deadlines and teacher-uploaded public teaching materials."""
import json, shutil, urllib.request, urllib.error, secrets
import test_explanation as existing
import test_lesson_creation as fixture
import test_shared_completion as shared

PDF=b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n'
class HomeworkMaterialsTests(existing.ExplanationTests):
    def setUp(self):
        super().setUp()
        for name in ['homework_material_api.php','student_attachment_api.php','student_file_download.php']:
            shutil.copyfile(fixture.ROOT/name,self.root/name)
    def upload(self,task,name='lesson.pdf',body=PDF,client=None,csrf=True,path='homework_material_api.php'):
        boundary='----'+secrets.token_hex(12)
        fields={'taskId':task,'action':'upload','key':'HOMEWORK:'+task}
        chunks=[]
        for key,value in fields.items():chunks.append(('--'+boundary+'\r\nContent-Disposition: form-data; name="'+key+'"\r\n\r\n'+value+'\r\n').encode())
        chunks.append(('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="'+name+'"\r\nContent-Type: application/octet-stream\r\n\r\n').encode()+body+b'\r\n')
        chunks.append(('--'+boundary+'--\r\n').encode());headers={'Content-Type':'multipart/form-data; boundary='+boundary}
        if csrf:headers['X-CSRF-Token']=self.teacher_csrf
        req=urllib.request.Request(self.url+'/'+path,data=b''.join(chunks),headers=headers)
        try:r=(client or self.teacher).open(req,timeout=8)
        except urllib.error.HTTPError as e:r=e
        with r:return r.status,json.loads(r.read())
    def save_date(self,value):
        refs=self.source_record()['homeworkTaskRefs']['next'];refs[0]['dueDate']=value
        return self.save_source('\n'.join(r['text'] for r in refs),refs)
    def test_optional_date_save_reload_clear_and_validation(self):
        self.assertIsNone(self.task()['dueAt']);original=self.common_check(self.task());private=(self.root/'data/student_homework_checks.php').read_bytes()
        self.assertEqual(self.save_date('2026-10-23')[0],200);item=self.task();self.assertEqual(item['dueAt'],'2026-10-23T23:59:59+09:00');self.assertEqual(item['id'],original['id']);self.assertTrue(item['checked'])
        self.assertEqual(self.source_record()['homeworkTaskRefs']['next'][0]['dueDate'],'2026-10-23')
        before=self.snapshot();self.assertEqual(self.save_date('2026-02-30')[0],400);self.assertEqual(before,self.snapshot())
        self.assertEqual(self.save_date('')[0],200);self.assertIsNone(self.task()['dueAt']);self.assertTrue(self.task()['checked']);self.assertEqual(private,(self.root/'data/student_homework_checks.php').read_bytes())
    def test_upload_download_handoff_and_expired_material_remains(self):
        item=self.common_check(self.task());self.assertEqual(self.save_date('2020-01-01')[0],200)
        code,j=self.upload(item['id']);self.assertEqual(code,200,j);file=j['attachment']
        self.rows[3]['担当講師']='Replacement teacher';self.write('added_lessons.json',self.rows)
        tasks=[i for i in self.context()['items'] if i['id']==item['id']];self.assertEqual(len(tasks),1);self.assertTrue(tasks[0]['checked']);self.assertEqual(tasks[0]['dueDate'],'2020-01-01');self.assertEqual(tasks[0]['attachments'][0]['id'],file['id'])
        self.assertEqual(self.task()['attachments'][0]['id'],file['id']);self.assertEqual(self.source_record()['homeworkTaskRefs']['next'][0]['attachments'][0]['id'],file['id'])
        with self.a.open(self.url+'/student_file_download.php?id='+file['id']) as r:self.assertEqual(r.status,200);self.assertEqual(r.read(),PDF)
    def test_upload_permissions_and_file_validation(self):
        task=self.task()['id'];before=self.read('student_attachments.json')
        self.assertEqual(self.upload(task,client=self.a,csrf=False)[0],401)
        self.assertEqual(self.upload(task,csrf=False)[0],403)
        self.assertIn(self.upload(task,client=self.a,csrf=False,path='student_attachment_api.php')[0],[401,403])
        for name,body in [('bad.php',PDF),('fake.pdf',b'plain text'),('empty.pdf',b''),('file.svg',b'<svg/>')]:
            code,j=self.upload(task,name,body);self.assertEqual(code,400,j)
        self.assertEqual(before,self.read('student_attachments.json'))
    def test_linked_due_assignment_preserves_files_date_and_shared_check(self):
        first=dict(self.rows[3]);first['終了']='18:20';self.rows[3]=first
        extra=dict(first,時間番号='⑦',開始='18:30',終了='19:10',_追加ID='materials-link',_sourceKey='ADD:materials-link');self.write('added_lessons.json',self.rows+[extra]);gid='e'*24;key='GROUP:'+gid
        self.write('lesson_groups.json',{gid:dict(id=gid,key=key,sources=[first['_sourceKey'],extra['_sourceKey']],snapshot=[first,extra],active=True,mealBreak=False)})
        self.write('lesson_records.json',{key:dict(eventKey=key,date=first['日付'],homework='',dueHomework='Linked preparation')})
        detail=self.request('lesson_group_api.php?action=detail&id='+gid)[1];refs=detail['record']['homeworkTaskRefs'];refs['due'][0]['dueDate']='2026-10-20';task=refs['due'][0]['id']
        code,j=self.post('lesson_group_api.php',dict(action='save',id=gid,version=detail['version'],homework='',dueHomework='Linked preparation',homeworkTaskRefs=refs,attendance={}));self.assertEqual(code,200,j)
        self.assertEqual(self.upload(task)[0],200);item=self.common_check(self.task('Linked preparation'))
        detail=self.request('lesson_group_api.php?action=detail&id='+gid)[1];self.assertEqual(detail['record']['homeworkTaskRefs']['due'][0]['dueDate'],'2026-10-20');self.assertEqual(len(detail['record']['homeworkTaskRefs']['due'][0]['attachments']),1)
        self.assertEqual(sum(i['id']==task for i in self.shared_catalog()),1);self.assertTrue(item['checked'])

for name in vars(existing.ExplanationTests):
    if name.startswith('test_'):setattr(HomeworkMaterialsTests,name,None)
