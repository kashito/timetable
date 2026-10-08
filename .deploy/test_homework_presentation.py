import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class HomeworkPresentationTests(unittest.TestCase):
    def test_live_refresh_concurrency_and_recovery(self):
        result = subprocess.run(["node", "--test", str(ROOT / ".deploy" / "homework-live.test.cjs")], cwd=ROOT, text=True, capture_output=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
    def test_overdue_homework_collection(self):
        result = subprocess.run(["node", "--test", str(ROOT / ".deploy" / "homework-overdue.test.cjs")], cwd=ROOT, text=True, capture_output=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def text(self, name):
        return (ROOT / name).read_text(encoding="utf-8")

    def test_homework_entry_is_split_into_explicit_checkbox_rows(self):
        for name in ["lesson_group.html", "lesson_records.html", "teacher2026summer.html", "teacher2026summer_vertical.html", "generator-tools.js"]:
            with self.subTest(name=name):
                self.assertIn("data-homework-items", self.text(name))
        script = self.text("homework-editor.js")
        self.assertIn('type="checkbox"', script)
        self.assertIn("homework-item-text", script)
        self.assertIn("rows.join('\\n')", script)
        self.assertIn("event.key==='Enter'", script)

    def test_timetable_editors_show_colored_homework_below_each_date(self):
        self.assertIn("data-homework-date", self.text("timetable-app.js"))
        self.assertIn("data-homework-date", self.text("schedule-generator.js"))
        self.assertIn("day-homework-summary.js", self.text("teacher2026summer.html"))
        self.assertIn("day-homework-summary.js", self.text("schedule_generator.php"))
        script = self.text("day-homework-summary.js")
        self.assertIn("lesson_record_api.php?action=homework", script)
        self.assertIn("whole-day-homework-item", script)
        css = self.text("whole-day-info.css")
        self.assertIn(".whole-day-homework", css)
        self.assertIn("color:#7c3f74", css)

    def test_student_top_homework_panel_tracks_count_completion_and_hidden_items(self):
        page = self.text("student.html")
        self.assertIn('id="studentHomeworkHub"', page)
        self.assertIn('id="studentHomeworkCount"', page)
        self.assertIn("homeworkHubByKey.set", page)
        script = self.text("student-homework-hub.js")
        for marker in ["localStorage.setItem", "data-homework-complete", "data-homework-hide", "data-homework-restore", "あと", "期限を過ぎています"]:
            self.assertIn(marker, script)
        css = self.text("student-homework-hub.css")
        self.assertIn("background:#d9253f", css)
        self.assertIn("color:#fff", css)

    def test_new_javascript_is_syntactically_valid(self):
        for name in ["homework-editor.js", "day-homework-summary.js", "student-homework-hub.js"]:
            with self.subTest(name=name):
                result = subprocess.run(["node", "--check", str(ROOT / name)], cwd=ROOT, text=True, capture_output=True, timeout=20)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
