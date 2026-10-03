from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TeacherVerticalDayStatusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / "teacher2026summer_vertical.html").read_text(encoding="utf-8")

    def test_reuses_student_day_status_rules_and_publication_settings(self):
        self.assertIn("student-schedule-model.js?v=20261003-teacher-status", self.source)
        self.assertIn("schedule-confirmed.js?v=20261003-teacher-status", self.source)
        self.assertIn("ScheduleConfirmed.loadSettings(true)", self.source)
        self.assertIn("StudentScheduleModel.dayState", self.source)

    def test_today_after_six_without_public_lesson_is_off(self):
        self.assertIn("currentJapan.hour>=6&&publicLessons.length===0", self.source)

    def test_private_dates_only_count_fixed_lessons_as_public(self):
        self.assertIn("window.LessonFixed?.isFixed(lessonKey(r))", self.source)
        self.assertIn("eventCount:publicLessons.length", self.source)

    def test_status_is_rendered_for_each_teacher_day(self):
        self.assertIn('teacher-mobile-day-state state-${esc2(dayState.tone)}', self.source)
        self.assertNotIn("else if(!dayLessons.length && !(ngForDate(d)&&ngForDate(d).allDay))", self.source)
        self.assertIn("last=dayLessons.length?dayLessons.reduce", self.source)


if __name__ == "__main__":
    unittest.main()
