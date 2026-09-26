"""Regression checks for the 2026-09-22 schedule and display improvements."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class September22FeatureTests(unittest.TestCase):
    def text(self, name):
        return (ROOT / name).read_text(encoding="utf-8")

    def test_class_schedule_uses_numeric_date_and_slot_order(self):
        source = self.text("class-schedule.js")
        self.assertIn("function dateValue", source)
        self.assertIn("function slotValue", source)
        self.assertIn(".sort(compareSchedule)", source)
        self.assertNotIn("a['日付']+a['時間番号']", source)

    def test_private_schedule_setting_is_preserved_and_used(self):
        api = self.text("schedule_confirmed_api.php")
        client = self.text("schedule-confirmed.js")
        student = self.text("student.html")
        self.assertGreaterEqual(api.count("privateFrom"), 8)
        self.assertIn("setPrivateFrom", client)
        self.assertIn("生徒への非公開開始日", self.text("schedule_generator.php"))
        self.assertIn("生徒への非公開開始日", self.text("teacher2026summer.html"))
        self.assertIn("現在調整中", student)
        self.assertIn("LessonFixed?.isFixed", student)
        self.assertNotIn(".confirmed-date-bar{display:none", self.text("workspace-ui.css"))
        for page in ("schedule_generator.php", "teacher2026summer.html"):
            self.assertIn("workspace-ui.css?v=20260926-public-visibility", self.text(page))

    def test_countdown_supports_event_and_ten_readable_themes(self):
        api = self.text("calendar_events_api.php")
        editor = self.text("school-events.js")
        script = self.text("countdown.js")
        css = self.text("countdown.css")
        self.assertIn("'event'", api)
        self.assertIn("event:'カウントダウンイベント'", editor)
        self.assertIn("'event'", script)
        self.assertIn("'event'", self.text("calendar-view.js"))
        self.assertEqual(len(set(re.findall(r"\.countdown-theme-(\d+)\{", css))), 10)

    def test_both_daily_boards_show_seconds_clock(self):
        script = self.text("daily-board.js")
        self.assertIn('class="db-clock"', script)
        self.assertIn("setInterval(updateClock,1000)", script)
        self.assertIn("：", script)
        for page in ("daily_board.html", "room_board.html"):
            self.assertIn("20260922-clock", self.text(page))

    def test_generator_header_has_requested_breathing_room(self):
        css = self.text("whole-time-header.css")
        self.assertIn("padding:10px 3px 12px", css)
        self.assertIn("margin-top:12px", css)

    def test_student_cards_remove_duplicate_class_tag_and_group_actions(self):
        student = self.text("student.html")
        self.assertIn('id="student-readability-v73"', student)
        self.assertIn('class="student-card-actions"', student)
        self.assertIn('<span>前回の授業から</span>', student)
        self.assertNotIn('tag tag-class', student)
        self.assertIn('@media(max-width:520px)', student)

    def test_availability_headers_show_ten_minute_early_arrival(self):
        script = self.text("availability.js")
        page = self.text("availability.html")
        self.assertIn("const arrivalTimes=['13:20','14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40']", script)
        self.assertIn('class="ng-slot-arrival"', script)
        self.assertIn('（${arrivalTimes[i]}入）', script)
        self.assertIn('${arrivalTimes[slots.indexOf(s)]}入', script)
        self.assertIn('.ng-slot-arrival{', page)
        self.assertIn('availability.js?v=20260924-arrival', page)

    def test_linked_lesson_autosaves_and_shows_last_saved_time(self):
        script = self.text("lesson-group.js")
        page = self.text("lesson_group.html")
        css = self.text("lesson-detail-layout.css")
        self.assertIn('setInterval(autoSave,60000)', script)
        self.assertIn("message('自動保存中…')", script)
        self.assertIn("changeRevision===revision", script)
        self.assertIn("Object.hasOwn(current.attendance", script)
        self.assertIn("'groupSharedMemo'", script)
        self.assertIn('id="groupLastSaved"', page)
        self.assertIn('lesson-group.js?v=20260924-autosave', page)
        self.assertIn('lesson-detail-layout.css?v=20260924-autosave', page)
        self.assertIn('.group-last-saved{', css)


if __name__ == "__main__":
    unittest.main(verbosity=2)
