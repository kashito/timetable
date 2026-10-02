from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class WorkspaceNavigationTests(unittest.TestCase):
    def test_daily_board_opens_in_new_tab_from_timetable_editors(self):
        source = (ROOT / "workspace-ui.js").read_text(encoding="utf-8")
        self.assertIn(
            "label==='今日の動き'&&['teacher2026summer.html','schedule_generator.php'].includes(page)",
            source,
        )
        self.assertIn('target="_blank" rel="noopener"', source)

    def test_editor_pages_load_the_updated_navigation(self):
        for name in ("teacher2026summer.html", "schedule_generator.php"):
            with self.subTest(name=name):
                source = (ROOT / name).read_text(encoding="utf-8")
                self.assertIn("workspace-ui.js?v=20261003-daily-tab", source)


if __name__ == "__main__":
    unittest.main()
