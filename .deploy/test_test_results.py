"""Test results against real PHP, isolated synthetic lessons and accounts."""
import secrets
import shutil
import unittest
import test_lesson_creation as fixture


class TestResultsTests(unittest.TestCase):
    for name in ['setUpClass', 'tearDownClass', 'write', 'client', 'request', 'login']:
        locals()[name] = classmethod(getattr(fixture.LessonCreationTests, name).__func__)
    for name in ['post', 'snapshot', 'read', 'prepare_group', 'tearDown']:
        locals()[name] = getattr(fixture.LessonCreationTests, name)

    def setUp(self):
        fixture.LessonCreationTests.setUp(self)
        for name in ['test_results_api.php', 'test_results_data.php']:
            shutil.copyfile(fixture.ROOT/name, self.root/name)
        self.write('student_master.json', [{'生徒名': '検証生徒A', 'クラス': '検証クラス'}, {'生徒名': '検証生徒B', 'クラス': '検証クラス'}])
        self.write('directory_state.json', {})
        self.write('test_results.php', {'schema': 1, 'items': {}})
        self.group, _ = self.prepare_group(with_next=False)

    def payload(self, **kw):
        p = dict(action='save', key=self.group['key'], id='', version='', name='検証テスト', total=20,
                 scores={'検証生徒A': 15, '検証生徒B': None},
                 statuses={'検証生徒A': 'reported', '検証生徒B': 'ungraded'},
                 partialScores={'検証生徒A': 3, '検証生徒B': 0}, note='', requestId=secrets.token_hex(16))
        p.update(kw)
        return p

    def save(self, p):
        code, j = self.post('test_results_api.php', p)
        self.assertEqual(code, 200, j)
        return j['item']

    def test_partial_roundtrip_history_clear_and_pending(self):
        p = self.payload()
        r = self.save(p)
        self.assertEqual(r['scores']['検証生徒A'], 15)
        self.assertEqual(r['partialScores']['検証生徒A'], 3)
        self.assertEqual(r['pendingStudents'], [])
        code, j = self.post('test_results_api.php', p)
        self.assertTrue(j['duplicate'])
        # An old client omitting partialScores preserves existing triangles.
        old_client = self.payload(id=r['id'], version=r['version'])
        del old_client['partialScores']
        r = self.save(old_client)
        self.assertEqual(r['partialScores']['検証生徒A'], 3)
        r = self.save(self.payload(id=r['id'], version=r['version'], scores={'検証生徒A': None, '検証生徒B': 0},
                                  statuses={'検証生徒A': 'unreported', '検証生徒B': 'reported'},
                                  partialScores={'検証生徒A': 0, '検証生徒B': 0}))
        self.assertIsNone(r['scores']['検証生徒A'])
        self.assertEqual(r['scores']['検証生徒B'], 0)
        self.assertEqual(r['pendingStudents'], ['検証生徒A'])
        self.assertEqual(r['history'][-1]['previous']['partialScores']['検証生徒A'], 3)

    def test_invalid_partials_never_write(self):
        for partial in [-1, 6, 1.5, '3', None]:
            with self.subTest(partial=partial):
                before = self.snapshot()
                code, j = self.post('test_results_api.php', self.payload(partialScores={'検証生徒A': partial, '検証生徒B': 0}))
                self.assertEqual(code, 400, j)
                self.assertEqual(before, self.snapshot())
        for changes in [dict(partialScores={'検証生徒A': 3}), dict(partialScores={'検証生徒A': 3, '検証生徒B': 1}),
                        dict(scores={'検証生徒A': -1, '検証生徒B': None})]:
            before = self.snapshot()
            code, j = self.post('test_results_api.php', self.payload(**changes))
            self.assertEqual(code, 400, j)
            self.assertEqual(before, self.snapshot())

    def test_legacy_data_and_total_reduction(self):
        p = self.payload()
        del p['partialScores']
        del p['statuses']
        r = self.save(p)
        self.assertEqual(r['partialScores'], {'検証生徒A': 0, '検証生徒B': 0})
        r = self.save(self.payload(id=r['id'], version=r['version']))
        before = self.snapshot()
        code, j = self.post('test_results_api.php', self.payload(id=r['id'], version=r['version'], total=17))
        self.assertEqual(code, 400, j)
        self.assertEqual(before, self.snapshot())
        stale = self.payload(id=r['id'], version='stale')
        code, j = self.post('test_results_api.php', stale)
        self.assertEqual(code, 409, j)


if __name__ == '__main__':
    unittest.main()
