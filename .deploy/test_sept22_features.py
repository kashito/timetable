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


if __name__ == "__main__":
    unittest.main(verbosity=2)
