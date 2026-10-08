"""Shared record keys, safe legacy history, independent PHP clients; synthetic data only."""
import json
import shutil
import urllib.error
import urllib.request
import urllib.parse
import unittest
import test_lesson_creation as fixture

class CommonHomeworkTests(unittest.TestCase):
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
        shutil.copyfile(fixture.ROOT/'homework_revision_api.php',self.root/'homework_revision_api.php')
        self.g,self.rows=self.prepare_group(deleted=False)
        self.keys=[fixture.key(r) for r in self.rows[:2]]
        self.original={k:dict(eventKey=k,memo='原本'+str(i),homework='旧宿題'+str(i),dueHomework='元予習'+str(i),replies=[dict(id='r'+str(i),author='講師',text='返信'+str(i))],reads={'講師'+str(i):{'at':'2026-09-25'}}) for i,k in enumerate(self.keys)}
        self.write('lesson_records.json',{self.g['key']:dict(eventKey=self.g['key'],memo='共通本文',homework='最新宿題',dueHomework='最新予習'),**self.original})
    def get(self,key):
        code,j=self.request('lesson_record_api.php?key='+urllib.parse.quote(key));self.assertEqual(code,200,j);return j['record']
    def test_all_member_entries_share_latest_record_and_preserved_history(self):
        records=[self.get(k) for k in self.keys+[self.g['key']]]
        self.assertTrue(all(r==records[0] for r in records))
        self.assertEqual(records[0]['sourceRecords'],self.original)
        self.assertEqual(len(records[0]['replies']),2)
        self.assertEqual(set(records[0]['reads']),{'講師0','講師1'})
        before=self.snapshot();code,j=self.request('lesson_record_api.php?action=homework',client=self.client())
        self.assertEqual(code,200,j)
        for key in self.keys:self.assertEqual(j['records'][key],dict(homework='最新宿題',dueHomework='最新予習'))
        self.assertEqual(self.snapshot(),before)
    def test_edit_from_other_member_and_stale_client_conflict(self):
        old=self.get(self.keys[0]);code,j=self.post('lesson_record_api.php',dict(action='edit',eventKey=self.keys[1],memo='変更本文',homework='更新宿題',expectedRevision=old['_revision']))
        self.assertEqual(code,200,j);self.assertEqual(self.get(self.keys[0])['homework'],'更新宿題')
        self.assertEqual(self.read('lesson_records.json')[self.keys[0]],self.original[self.keys[0]])
        before=self.snapshot();code,j=self.post('lesson_record_api.php',dict(action='edit',eventKey=self.keys[0],memo='古い本文',homework='旧宿題',expectedRevision=old['_revision']))
        self.assertEqual(code,409,j);self.assertEqual(before,self.snapshot())
        self.assertEqual(self.get(self.keys[1])['sourceRecords'],self.original)
    def test_reply_and_read_from_member_go_to_common(self):
        self.assertEqual(self.post('lesson_record_api.php',dict(action='reply',eventKey=self.keys[1],text='共通返信'))[0],200)
        self.assertEqual(self.post('lesson_record_api.php',dict(action='read',eventKey=self.keys[0]))[0],200)
        current=self.get(self.g['key']);self.assertEqual(len(current['replies']),3);self.assertIn('検証admin',current['reads'])
        self.assertEqual(self.get(self.keys[1]),current)
    def test_unlink_relink_keeps_current_and_original_data(self):
        code,d=self.request('lesson_group_api.php?action=detail&id='+self.g['id']);self.assertEqual(code,200,d)
        self.assertTrue(all(m['record']==d['record'] for m in d['members']))
        self.assertEqual(self.post('lesson_group_api.php',dict(action='unlink',id=self.g['id'],version=d['version']))[0],200)
        for k in self.keys:self.assertEqual(self.get(k)['homework'],'最新宿題');self.assertEqual(self.get(k)['sourceRecords'],self.original)
        code,plan=self.request('lesson_group_api.php?action=candidates&sourceKey='+urllib.parse.quote(self.rows[0]['_sourceKey']));self.assertEqual(code,200,plan)
        code,j=self.post('lesson_group_api.php',dict(action='create',sources=[r['_sourceKey'] for r in reversed(self.rows[:2])],version=plan['version'],mealBreak=False));self.assertEqual(code,200,j)
        current=self.get(self.keys[0]);self.assertEqual(current['homework'],'最新宿題');self.assertEqual(len(current['replies']),2);self.assertEqual(current['memo'].count('共通本文'),1);self.assertEqual(current['sourceRecords'],self.original);self.assertTrue(current['recordHistory'])
    def test_other_class_and_lesson_are_not_merged(self):
        record=dict(eventKey='other',memo='他生徒本文',homework='他宿題');all=self.read('lesson_records.json');all['other']=record;self.write('lesson_records.json',all)
        self.assertEqual(self.get('other')['homework'],'他宿題');self.assertNotIn('他宿題',json.dumps(self.get(self.keys[0]),ensure_ascii=False))
    def test_revision_is_readonly_conditional_and_detects_same_second_updates(self):
        client=self.client();before=self.snapshot()
        with client.open(self.url+'/homework_revision_api.php') as response:
            revision=response.headers['ETag'];self.assertEqual(json.load(response),dict(ok=True,revision=revision))
        self.assertEqual(self.snapshot(),before)
        request=urllib.request.Request(self.url+'/homework_revision_api.php',headers={'If-None-Match':revision})
        with self.assertRaises(urllib.error.HTTPError) as result:client.open(request)
        self.assertEqual(result.exception.code,304)
        all=self.read('lesson_records.json');all[self.g['key']]['homework']='連続更新';self.write('lesson_records.json',all)
        with client.open(request) as response:self.assertNotEqual(response.headers['ETag'],revision)

if __name__=='__main__':unittest.main()
