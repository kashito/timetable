from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TeacherAvailabilityTests(unittest.TestCase):
    def test_whole_schedule_shift_panel_stays_visible(self):
        script = (ROOT / "teacher-availability.js").read_text(encoding="utf-8")
        styles = (ROOT / "teacher-availability.css").read_text(encoding="utf-8")
        page = (ROOT / "teacher2026summer.html").read_text(encoding="utf-8")

        self.assertIn(".sticky-date,.sticky-date-line,.date-cell", script)
        self.assertIn("data-close-availability", script)
        self.assertIn("selectedDate='';render();", script)
        self.assertIn("position:sticky", styles)
        self.assertIn("var(--workspace-nav-height,0px)", styles)
        self.assertIn("max-height:min(46vh,430px)", styles)
        self.assertIn("teacher-availability.css?v=20260927-sticky-shift", page)
        self.assertIn("teacher-availability.js?v=20260927-sticky-shift", page)


if __name__ == "__main__":
    unittest.main()
