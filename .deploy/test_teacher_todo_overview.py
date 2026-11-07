"""Assigned teacher ToDos: real PHP endpoints, isolated synthetic data only."""
from datetime import datetime, timedelta, timezone
import shutil
import subprocess
import unittest
import urllib.parse
import test_lesson_creation as fixture


class TeacherTodoOverviewTests(unittest.TestCase):
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
        self.today = datetime.now(timezone(timedelta(hours=9))).date()
        self.write('directory_state.json', {'classNameAliases': {'Old': 'Middle', 'Middle': 'Current'}})
        self.write('class_memos.json', {})
        self.write('student_master.json', [])
        self.rows = [self.lesson('near', 'Current', 1, 4, 'Math'),
                     self.lesson('later', 'Current', 3, 5, 'English'),
                     self.lesson('past', 'Past', -2, 6, 'Science')]
        self.write('added_lessons.json', self.rows)
        self.notes = {}
        for id, cls, recipients, todo, done in [
            ('mine', 'Old', ['teacher'], True, False),
            ('cross-subject', 'Past', ['teacher'], True, False),
            ('no-lesson', 'Missing', ['teacher'], True, False),
            ('completed', 'Current', ['teacher'], True, True),
            ('admin-only', 'Current', ['admin'], True, False),
            ('ordinary-note', 'Current', ['teacher'], False, False),
            ('unassigned', 'Current', [], True, False),
        ]:
            self.notes[id] = dict(id=id, className=cls, recipientIds=recipients,
                recipientNames={r: 'Synthetic '+r for r in recipients}, text='Text '+id,
                todo=todo, done=done, author='Synthetic admin', authorId='admin',
                createdAt='2026-11-07T08:00:00+09:00', reads={}, completionHistory=[])
        self.save_notes()

    def lesson(self, id, cls, offset, slot, subject):
        row = fixture.row(slot)
        row.update({'日付': (self.today+timedelta(days=offset)).isoformat(),
                    'クラス': cls, '科目': subject, '担当講師': 'Other instructor',
                    '_追加ID': id, '_sourceKey': 'ADD:'+id})
        return row

    def save_notes(self):
        self.write('shared_notes.php', {'notes': self.notes})

    def overview(self, client=None, scope='mine', extra=''):
        code, data = self.request('shared_notes_api.php?todos=1&scope='+scope+extra,
                                  client=client or self.teacher)
        self.assertEqual(code, 200, data)
        self.assertTrue(data['ok'])
        return data

    def item(self, id, client=None, scope='mine'):
        return next(r for r in self.overview(client, scope)['items'] if r['id'] == id)

    def test_authenticated_server_scope_and_staff_projection(self):
        before = self.snapshot()
        self.assertEqual(self.request('shared_notes_api.php?todos=1', client=self.client())[0], 401)
        data = self.overview(extra='&assignee=admin&teacher=admin')
        self.assertEqual(data['scope'], 'mine')
        self.assertEqual({r['id'] for r in data['items']}, {'mine', 'cross-subject', 'no-lesson', 'completed'})
        self.assertEqual(data['pending'], 3)
        self.assertEqual([r['id'] for r in data['staff']], ['teacher'])
        self.assertEqual(self.request('shared_notes_api.php?todos=1&scope=all', client=self.teacher)[0], 403)
        self.assertEqual(before, self.snapshot())

    def test_admin_mine_is_not_all_and_all_is_todos_only(self):
        mine = self.overview(self.admin)
        self.assertEqual({r['id'] for r in mine['items']}, {'admin-only'})
        data = self.overview(self.admin, 'all')
        self.assertEqual(data['scope'], 'all')
        self.assertEqual({r['id'] for r in data['items']}, set(self.notes)-{'ordinary-note'})
        self.assertEqual({r['id'] for r in data['staff']}, {'admin', 'teacher'})

    def test_alias_upcoming_single_and_recent_links(self):
        before = self.snapshot()
        item = self.item('mine')
        self.assertEqual(item['className'], 'Current')
        link = item['lessonDetail']
        self.assertEqual(link['relation'], 'upcoming')
        self.assertEqual(link['date'], self.rows[0]['日付'])
        self.assertEqual(link['subject'], 'Math')
        self.assertEqual(link['teacher'], 'Other instructor')
        url = urllib.parse.urlsplit(link['url'])
        self.assertEqual(url.path, 'teacher2026summer_vertical.html')
        query = urllib.parse.parse_qs(url.query)
        self.assertEqual(query['teacher'], ['Other instructor'])
        self.assertEqual(query['date'], [self.rows[0]['日付']])
        self.assertEqual(query['openSource'], ['ADD:near'])
        self.assertEqual(query['openKey'], [fixture.key(self.rows[0])])
        recent = self.item('cross-subject')['lessonDetail']
        self.assertEqual(recent['relation'], 'recent')
        self.assertEqual(recent['date'], self.rows[2]['日付'])
        self.assertIsNone(self.item('no-lesson')['lessonDetail'])
        self.assertEqual(before, self.snapshot())

    def test_active_linked_group_and_inactive_group_fallback(self):
        second = self.lesson('linked', 'Current', 1, 5, 'Math')
        self.write('added_lessons.json', self.rows+[second])
        group = dict(id='a'*24, key='GROUP:'+'a'*24, active=True, mealBreak=False,
                     sources=['ADD:near', 'ADD:linked'], snapshot=[self.rows[0], second])
        self.write('lesson_groups.json', {group['id']: group})
        before = self.snapshot()
        url = urllib.parse.urlsplit(self.item('mine')['lessonDetail']['url'])
        self.assertEqual(url.path, 'lesson_group.html')
        self.assertEqual(urllib.parse.parse_qs(url.query)['id'], [group['id']])
        self.assertEqual(before, self.snapshot())
        group['active'] = False
        self.write('lesson_groups.json', {group['id']: group})
        self.assertEqual(urllib.parse.urlsplit(self.item('mine')['lessonDetail']['url']).path,
                         'teacher2026summer_vertical.html')

    def test_deleted_lesson_is_skipped_and_effective_edit_is_used(self):
        deleted = dict(self.rows[0], _deleted=True)
        moved = dict(self.rows[1]); moved['日付'] = (self.today+timedelta(days=2)).isoformat()
        self.write('edited_lessons.json', {'ADD:near': deleted, 'ADD:later': moved})
        link = self.item('mine')['lessonDetail']
        self.assertEqual(link['date'], moved['日付'])
        self.assertEqual(urllib.parse.parse_qs(urllib.parse.urlsplit(link['url']).query)['openSource'], ['ADD:later'])

    def test_count_only_has_no_items_and_get_never_writes(self):
        before = self.snapshot()
        data = self.overview(extra='&countOnly=1')
        self.assertEqual(data['items'], [])
        self.assertEqual(data['pending'], 3)
        self.assertEqual(before, self.snapshot())

    def test_count_only_does_not_read_or_build_schedule_links(self):
        # Malformed schedule is deliberately isolated to this temporary fixture.
        # Counts must remain available without loading unrelated lesson data.
        (self.root/'data'/'schedule_data.json').write_text('{broken', encoding='utf-8')
        before = self.snapshot()
        self.assertEqual(self.overview(extra='&countOnly=1')['pending'], 3)
        self.assertEqual(before, self.snapshot())

    def test_invalid_scope_and_post_cannot_bypass_read_only_route(self):
        before = self.snapshot()
        self.assertEqual(self.request('shared_notes_api.php?todos=1&scope=teacher', client=self.teacher)[0], 400)
        code, _ = self.request('shared_notes_api.php?todos=1&scope=all', {}, self.teacher, self.teacher_csrf)
        self.assertGreaterEqual(code, 400)
        self.assertEqual(before, self.snapshot())

    def test_same_time_choice_is_deterministic_and_nonlesson_days_are_ignored(self):
        tie = self.lesson('aaa', 'Current', 1, 4, 'Tie subject')
        nonlesson = self.lesson('not-a-lesson', 'Current', 0, 0, 'Exclude')
        nonlesson['日区分'] = 'Holiday'
        rows = self.rows+[tie, nonlesson]
        self.write('added_lessons.json', rows)
        first = self.item('mine')['lessonDetail']
        self.write('added_lessons.json', list(reversed(rows)))
        second = self.item('mine')['lessonDetail']
        self.assertEqual(first, second)
        self.assertEqual(first['date'], tie['日付'])
        self.assertNotEqual(first['subject'], 'Exclude')

    def test_completion_permissions_csrf_and_stale_version(self):
        item = self.item('mine')
        payload = dict(action='done', className=item['className'], id=item['id'],
                       version=item['version'], done=True)
        before = self.snapshot()
        self.assertEqual(self.request('shared_notes_api.php', payload, self.teacher)[0], 403)
        other = self.item('admin-only', self.admin)
        forbidden = dict(action='done', className=other['className'], id=other['id'], version=other['version'], done=True)
        self.assertEqual(self.request('shared_notes_api.php', forbidden, self.teacher, self.teacher_csrf)[0], 403)
        self.assertEqual(before, self.snapshot())
        code, data = self.request('shared_notes_api.php', payload, self.teacher, self.teacher_csrf)
        self.assertEqual(code, 200, data)
        self.assertTrue(self.item('mine')['done'])
        self.assertEqual(self.overview()['pending'], 2)
        before = self.snapshot()
        payload['done'] = False
        self.assertEqual(self.request('shared_notes_api.php', payload, self.teacher, self.teacher_csrf)[0], 409)
        self.assertEqual(before, self.snapshot())
        payload['version'] = self.item('mine')['version']
        self.assertEqual(self.request('shared_notes_api.php', payload, self.teacher, self.teacher_csrf)[0], 200)
        self.assertFalse(self.item('mine')['done'])

    def test_scripts_parse_and_phone_entry_uses_dedicated_projection(self):
        for name in ['teacher-todos.js', 'teacher-todo-entry.js']:
            result = subprocess.run(['node', '--check', str(fixture.ROOT/name)], capture_output=True, text=True, timeout=20)
            self.assertEqual(result.returncode, 0, result.stdout+result.stderr)
        page = (fixture.ROOT/'shared_todos.html').read_text(encoding='utf-8')
        self.assertIn('teacher-todos.js?v=20261107-todo-overview', page)
        self.assertIn('teacher-todos.css?v=20261107-todo-overview', page)
        vertical = (fixture.ROOT/'teacher2026summer_vertical.html').read_text(encoding='utf-8')
        self.assertIn('teacher-todo-entry.js?v=20261107-todo-overview', vertical)
        script = (fixture.ROOT/'teacher-todos.js').read_text(encoding='utf-8')
        self.assertIn('shared_notes_api.php?todos=1&scope=', script)
        self.assertIn('lessonDetail', script)

    def test_existing_inbox_is_not_silently_restricted(self):
        before = self.snapshot()
        code, data = self.request('shared_notes_api.php?inbox=1', client=self.teacher)
        self.assertEqual(code, 200, data)
        self.assertEqual({r['id'] for r in data['items']}, set(self.notes))
        self.assertEqual(before, self.snapshot())


if __name__ == '__main__':
    unittest.main()
