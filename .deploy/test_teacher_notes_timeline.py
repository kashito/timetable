"""Authenticated, read-only teacher-note timeline with isolated synthetic data."""
import shutil
import unittest
import urllib.parse
import test_lesson_creation as fixture


class TeacherNotesTimelineTests(unittest.TestCase):
    setUpClass = classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass = classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write = classmethod(fixture.LessonCreationTests.write.__func__)
    client = classmethod(fixture.LessonCreationTests.client.__func__)
    request = classmethod(fixture.LessonCreationTests.request.__func__)
    login = classmethod(fixture.LessonCreationTests.login.__func__)
    snapshot = fixture.LessonCreationTests.snapshot
    tearDown = fixture.LessonCreationTests.tearDown

    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        for name in ['shared_notes_api.php', 'shared_notes_data.php']:
            shutil.copyfile(fixture.ROOT/name, self.root/name)
        self.write('directory_state.json', {'classNameAliases': {'Old': 'Middle', 'Middle': 'Current'}})
        self.write('class_memos.json', {'Old': 'existing legacy', 'Current': '123', 'Other': 'other legacy'})
        self.write('class_state.json', {
            '__CLASS_MEMO__|Old': {'teacherMemo': 'existing legacy'},
            '__CLASS_MEMO__|Middle': {'teacherMemo': '123'},
            '__CLASS_MEMO__|Current': {'teacherMemo': 'undated legacy'},
            'lesson-only-state': {'teacherMemo': 'not a shared memo'},
        })
        self.notes = {
            'active': dict(id='active', className='Old', text='active message', author='Synthetic author', authorId='teacher',
                           createdAt='2026-11-07T08:00:00+09:00', done=False, todo=True,
                           recipientIds=['teacher'], recipientNames={'teacher': 'Synthetic teacher'}, reads={'teacher': 'private read'},
                           requestId='private-request', requestHash='private-hash', completionHistory=[]),
            'done': dict(id='done', className='Other', text='completed message', author='Synthetic admin', authorId='admin',
                         createdAt='2026-11-06T23:59:00+09:00', done=True, todo=False,
                         doneAt='2026-11-07T09:00:00+09:00', doneBy='Synthetic admin', completionHistory=[]),
            'persisted': dict(id='persisted', className='Middle', text='existing legacy', author=None, authorId=None,
                              createdAt=None, legacy=True, done=True, completionHistory=[]),
        }
        self.write('shared_notes.php', {'notes': self.notes})

    def timeline(self, client=None):
        code, result = self.request('shared_notes_api.php?timeline=1', client=client)
        self.assertEqual(code, 200, result)
        self.assertTrue(result['ok'])
        return result

    def test_authentication_both_roles_and_read_only_bytes(self):
        before = self.snapshot()
        code, _ = self.request('shared_notes_api.php?timeline=1', client=self.client())
        self.assertEqual(code, 401)
        for client in [self.admin, self.teacher]:
            with self.subTest(role=client):
                self.assertGreater(len(self.timeline(client)['notes']), 0)
        self.assertEqual(before, self.snapshot())

    def test_canonical_names_legacy_dedup_and_numeric_text(self):
        result = self.timeline()
        notes = result['notes']
        self.assertEqual(result['classNameAliases']['Old'], 'Middle')
        self.assertEqual(next(n for n in notes if n['id'] == 'active')['className'], 'Current')
        self.assertEqual(next(n for n in notes if n['id'] == 'persisted')['className'], 'Current')
        self.assertEqual(sum(n['text'] == 'existing legacy' for n in notes), 1)
        self.assertEqual(sum(n['text'] == '123' for n in notes), 1)
        self.assertEqual(len(notes), 6)
        self.assertNotIn('not a shared memo', [n['text'] for n in notes])
        for text in ['123', 'undated legacy', 'other legacy', 'existing legacy']:
            note = next(n for n in notes if n['text'] == text)
            self.assertIsNone(note['createdAt'])
            self.assertIsNone(note['author'])
            self.assertTrue(note['legacy'])
        self.assertTrue(next(n for n in notes if n['id'] == 'done')['done'])
        self.assertTrue(next(n for n in notes if n['id'] == 'persisted')['done'])

    def test_projection_contains_only_display_fields(self):
        allowed = {'id', 'className', 'text', 'author', 'createdAt', 'legacy', 'todo', 'done', 'doneAt', 'doneBy', 'assigneeNames'}
        result = self.timeline()
        self.assertEqual(set(result), {'ok', 'notes', 'classNameAliases'})
        for note in result['notes']:
            self.assertEqual(set(note), allowed)
            self.assertIsInstance(note['assigneeNames'], list)
            self.assertTrue(all(isinstance(name, str) for name in note['assigneeNames']))
        self.assertEqual(next(n for n in result['notes'] if n['id'] == 'active')['createdAt'], self.notes['active']['createdAt'])

    def test_existing_class_read_is_unchanged_and_scoped(self):
        before = self.snapshot()
        code, result = self.request('shared_notes_api.php?className='+urllib.parse.quote('Old'))
        self.assertEqual(code, 200, result)
        self.assertEqual(result['className'], 'Current')
        self.assertIn('staff', result)
        self.assertIn('classRecipients', result)
        self.assertEqual({n['text'] for n in result['notes']}, {'active message', 'existing legacy', '123', 'undated legacy'})
        self.assertTrue(all('version' in n for n in result['notes']))
        self.assertEqual(before, self.snapshot())

    def test_post_cannot_invoke_read_only_timeline(self):
        before = self.snapshot()
        code, _ = self.request('shared_notes_api.php?timeline=1', {}, self.teacher, self.teacher_csrf)
        self.assertGreaterEqual(code, 400)
        self.assertEqual(before, self.snapshot())


if __name__ == '__main__':
    unittest.main()