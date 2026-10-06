"""Direct homework assignments roundtrip through real APIs with isolated data."""
import unittest
import test_lesson_creation as fixture


class DueHomeworkTests(unittest.TestCase):
    setUpClass = classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass = classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write = classmethod(fixture.LessonCreationTests.write.__func__)
    client = classmethod(fixture.LessonCreationTests.client.__func__)
    request = classmethod(fixture.LessonCreationTests.request.__func__)
    login = classmethod(fixture.LessonCreationTests.login.__func__)
    setUp = fixture.LessonCreationTests.setUp
    tearDown = fixture.LessonCreationTests.tearDown
    post = fixture.LessonCreationTests.post
    snapshot = fixture.LessonCreationTests.snapshot
    read = fixture.LessonCreationTests.read
    prepare_group = fixture.LessonCreationTests.prepare_group

    def test_single_assignment_roundtrip_dedup_clear_and_legacy_preservation(self):
        row = fixture.row()
        self.write('schedule_data.json', {'schedule': [row], 'students': []})
        key = fixture.key(row)
        record = dict(eventKey=key, date=row['日付'], memo='既存カルテ', homework='次回分', replies=[{'text': '保持'}], reads={'講師': {'at': '2026-10-06'}})
        self.write('lesson_records.json', {key: record})
        payload = dict(eventKey=key, date=row['日付'], dueHomework=' 予習A\n予習A\n予習B ')
        code, result = self.post('lesson_record_api.php', payload)
        self.assertEqual(code, 200, result)
        self.assertEqual(result['record']['dueHomework'], '予習A\n予習B')
        for field in ['memo', 'homework', 'replies', 'reads']:
            self.assertEqual(result['record'][field], record[field])
        code, public = self.request('lesson_record_api.php?action=homework', client=self.client())
        self.assertEqual(code, 200, public)
        self.assertEqual(public['records'][key], {'homework': '次回分', 'dueHomework': '予習A\n予習B'})
        # Older clients omit the new field; they must not erase it.
        code, result = self.post('lesson_record_api.php', dict(eventKey=key, memo='更新カルテ'))
        self.assertEqual(result['record']['dueHomework'], '予習A\n予習B')
        code, result = self.post('lesson_record_api.php', dict(eventKey=key, homework='次回分', dueHomework=''))
        self.assertEqual(result['record']['dueHomework'], '')

    def test_group_assignment_is_common_and_stale_save_cannot_overwrite(self):
        group, rows = self.prepare_group(with_next=False, deleted=False)
        code, detail = self.request('lesson_group_api.php?action=detail&id=' + group['id'])
        payload = dict(action='save', id=group['id'], version=detail['version'], memo='共通カルテ', homework='次回分', dueHomework='予習A\n予習A', attendance={})
        code, result = self.post('lesson_group_api.php', payload)
        self.assertEqual(code, 200, result)
        code, public = self.request('lesson_record_api.php?action=homework', client=self.client())
        self.assertEqual(public['records'][group['key']]['dueHomework'], '予習A')
        for row in rows:
            self.assertEqual(public['records'][fixture.key(row)]['dueHomework'], '予習A')
        records = self.read('lesson_records.json')
        self.assertEqual(list(records), [group['key']])
        before = self.snapshot()
        code, result = self.post('lesson_group_api.php', payload)
        self.assertEqual(code, 409, result)
        self.assertEqual(before, self.snapshot())

    def test_link_creation_merges_direct_assignments_without_duplicate_records(self):
        rows = [fixture.row(4), fixture.row(5)]
        for i, row in enumerate(rows):
            row['_追加ID'] = 'due-' + str(i)
            row['_sourceKey'] = 'ADD:' + row['_追加ID']
        self.write('added_lessons.json', rows)
        self.write('lesson_records.json', {fixture.key(row): dict(dueHomework='予習A', homework='次回分') for row in rows})
        code, candidates = self.request('lesson_group_api.php?action=candidates&sourceKey=' + rows[0]['_sourceKey'])
        code, created = self.post('lesson_group_api.php', dict(action='create', sources=[r['_sourceKey'] for r in rows], version=candidates['version'], mealBreak=False))
        self.assertEqual(code, 200, created)
        common = self.read('lesson_records.json')[created['group']['key']]
        self.assertEqual(common['dueHomework'], '予習A')
        self.assertEqual(common['homework'], '次回分')


if __name__ == '__main__':
    unittest.main()
