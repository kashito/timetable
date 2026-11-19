"""Single-period teacher changes against temporary synthetic PHP data only."""
import unittest
import urllib.parse
import test_lesson_creation as fixture


class SingleTeacherTests(unittest.TestCase):
    setUpClass = classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass = classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write = classmethod(fixture.LessonCreationTests.write.__func__)
    client = classmethod(fixture.LessonCreationTests.client.__func__)
    request = classmethod(fixture.LessonCreationTests.request.__func__)
    login = classmethod(fixture.LessonCreationTests.login.__func__)
    post = fixture.LessonCreationTests.post
    read = fixture.LessonCreationTests.read
    snapshot = fixture.LessonCreationTests.snapshot
    tearDown = fixture.LessonCreationTests.tearDown

    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        self.write('lesson_move_archive.json', {})
        self.source = 'ADD:single'
        self.original = dict(fixture.row(), **{'_追加ID': 'single'})
        self.other = dict(fixture.row(7), **{'_追加ID': 'other'})
        self.write('added_lessons.json', [self.original, self.other])
        self.target = '変更講師'

    def plan(self, source=None):
        code, data = self.request('lesson_add_api.php?sourceKey=' + urllib.parse.quote(source or self.source))
        self.assertEqual(code, 200, data)
        self.assertEqual(len(data['sourceVersion']), 64)
        return data

    def payload(self):
        plan = self.plan()
        return dict(action='update', sourceKey=self.source, sourceVersion=plan['sourceVersion'],
                    row=dict(plan['row'], **{'担当講師': self.target}))

    def reject_unchanged(self, payload, flag=None):
        before = self.snapshot()
        code, data = self.post('lesson_add_api.php', payload)
        self.assertEqual(code, 409, data)
        if flag:
            self.assertTrue(data.get(flag), data)
        self.assertEqual(before, self.snapshot())
        return data

    def test_added_teacher_change_only_target_occurrence(self):
        before = self.read('added_lessons.json')
        code, data = self.post('lesson_add_api.php', self.payload())
        self.assertEqual(code, 200, data)
        saved = self.plan()['row']
        for field, value in self.original.items():
            self.assertEqual(saved[field], self.target if field == '担当講師' else value)
        self.assertEqual(self.read('added_lessons.json'), before)
        self.assertEqual(list(self.read('edited_lessons.json')), [self.source])
        self.assertEqual(self.plan('ADD:other')['row'], self.other)

    def test_xlsx_teacher_change_preserves_other_occurrences(self):
        self.write('added_lessons.json', [])
        self.write('schedule_data.json', {'schedule': [self.original, self.other], 'students': []})
        self.source = 'XLSX:0|' + '|'.join([self.original['日付'].replace('-', '/'), self.original['時間番号'], self.original['クラス'], self.original['担当講師']])
        before = self.read('schedule_data.json')
        code, data = self.post('lesson_add_api.php', self.payload())
        self.assertEqual(code, 200, data)
        self.assertEqual(self.plan()['row']['担当講師'], self.target)
        self.assertEqual(self.read('schedule_data.json'), before)
        self.assertEqual(list(self.read('edited_lessons.json')), [self.source])

    def test_records_attendance_attachments_and_alias_move(self):
        old = fixture.key(self.original)
        new = fixture.key(dict(self.original, **{'担当講師': self.target}))
        self.write('lesson_records.json', {old: {'memo': '保持', 'homework': '保持宿題', 'teacher': self.original['担当講師']}, 'unrelated': {'memo': '別'}})
        self.write('class_state.json', {old: {'attendance': {'検証生徒': 'present'}, 'ready': True, 'publicNote': self.original['備考']}})
        self.write('student_attachments.json', [{'id': 'keep', 'key': old}])
        self.write('lesson_key_aliases.json', {'OLDER': old})
        code, data = self.post('lesson_add_api.php', self.payload())
        self.assertEqual(code, 200, data)
        records = self.read('lesson_records.json')
        self.assertNotIn(old, records)
        self.assertEqual(records[new]['memo'], '保持')
        self.assertEqual(records[new]['homework'], '保持宿題')
        self.assertEqual(records[new]['author'], self.original['担当講師'])
        self.assertEqual(records[new]['teacher'], self.target)
        self.assertEqual(records['unrelated'], {'memo': '別'})
        self.assertEqual(self.read('class_state.json')[new]['attendance'], {'検証生徒': 'present'})
        self.assertTrue(self.read('class_state.json')[new]['ready'])
        self.assertEqual(self.read('student_attachments.json')[0]['key'], new)
        self.assertEqual(self.read('lesson_key_aliases.json'), {'OLDER': new, old: new})

    def test_stale_source_version_rejects_without_changes(self):
        payload = self.payload()
        self.write('edited_lessons.json', {self.source: dict(self.original, **{'備考': '別の人の更新'})})
        self.reject_unchanged(payload)

    def test_fixed_requires_confirmation_and_moves_fixed_state(self):
        old = fixture.key(self.original)
        self.write('lesson_fixed.json', {old: {'fixed': True}})
        payload = self.payload()
        self.reject_unchanged(payload, 'fixedConflict')
        code, data = self.post('lesson_add_api.php', dict(payload, overrideFixed=True))
        self.assertEqual(code, 200, data)
        self.assertEqual(self.read('lesson_fixed.json'), {fixture.key(payload['row']): {'fixed': True}})

    def test_teacher_ng_requires_confirmation(self):
        self.write('teacher_ng.json', [{'teacher': self.target, 'date': self.original['日付'], 'slots': [self.original['時間番号']], 'note': '検証'}])
        payload = self.payload()
        self.reject_unchanged(payload, 'ngConflict')
        code, data = self.post('lesson_add_api.php', dict(payload, overrideNg=True))
        self.assertEqual(code, 200, data)

    def test_grouped_member_cannot_change_teacher_individually(self):
        self.write('lesson_groups.json', {'a' * 24: {'id': 'a' * 24, 'key': 'GROUP:' + 'a' * 24, 'sources': [self.source, 'ADD:other'], 'snapshot': [self.original, self.other], 'active': True}})
        self.reject_unchanged(self.payload())

    def test_existing_destination_lesson_cannot_be_overwritten(self):
        collision = dict(self.original, **{'担当講師': self.target, '_追加ID': 'collision'})
        self.write('added_lessons.json', [self.original, self.other, collision])
        payload = dict(self.payload(), overrideRoom=True)
        self.reject_unchanged(payload)

    def test_destination_records_require_confirmation_and_are_archived(self):
        payload = self.payload()
        new = fixture.key(payload['row'])
        self.write('lesson_records.json', {new: {'memo': '以前の記録'}})
        self.reject_unchanged(payload, 'recordConflict')
        code, data = self.post('lesson_add_api.php', dict(payload, archiveDestination=True))
        self.assertEqual(code, 200, data)
        archives = self.read('lesson_move_archive.json')
        self.assertEqual(len(archives), 1)
        archived = next(iter(archives.values()))
        self.assertEqual(archived['records']['lesson_records.json']['memo'], '以前の記録')


if __name__ == '__main__':
    unittest.main()
