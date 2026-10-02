import json
import os
import re
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class StudentScheduleUiTest(unittest.TestCase):
    def test_schedule_model_scenarios(self):
        result = subprocess.run(
            ["node", "--test", str(ROOT / ".deploy" / "student-schedule-model.test.cjs")],
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=30,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_priority_ui_assets_load_after_legacy_inline_styles(self):
        source = (ROOT / "student.html").read_text(encoding="utf-8")
        self.assertGreater(source.index("student-schedule-v2.css"), source.index("student-card-send-v67"))
        self.assertIn('student-display-settings.js?v=20260927-priority-ui', source)
        self.assertIn('class="day-overview"', source)
        self.assertIn('class="student-other-info"', source)
        self.assertIn('class="student-materials-view"', source)
        self.assertIn('class="student-card-send-btn"', source)
        self.assertNotIn('宿題なし', source)

    def test_material_empty_and_failure_are_distinct(self):
        source = (ROOT / "student.html").read_text(encoding="utf-8")
        self.assertIn("この授業の資料はまだありません。", source)
        self.assertIn("資料を読み込めませんでした。再読み込みしてください。", source)
        self.assertIn("取得失敗", source)

    def test_each_lesson_shows_its_student_message_below_time_header(self):
        source = (ROOT / "student.html").read_text(encoding="utf-8")
        start = source.index('html += `<article class="event-card')
        end = source.index("html += '</section>'", start)
        card = source[start:end]
        message = '先生から生徒へのメッセージ'
        self.assertGreater(card.index(message), card.index('class="event-time"'))
        self.assertLess(card.index(message), card.index('${optionalNote(r)}'))
        self.assertIn("top.insertAdjacentElement('afterend',box)", source)

    def test_twenty_local_themes_with_reset(self):
        source = (ROOT / "student-display-settings.js").read_text(encoding="utf-8")
        ids = re.findall(r"\['([a-z]+)','[^']+','[0-9a-f]+','[0-9a-f]+','[0-9a-f]+'\]", source)
        self.assertEqual(len(ids), 20)
        self.assertEqual(len(set(ids)), 20)
        self.assertIn("student-schedule-theme-v1", source)
        self.assertIn("localStorage.setItem", source)
        self.assertIn("localStorage.getItem", source)
        self.assertIn("apply('standard')", source)

    def test_mobile_rules_and_semantic_state_colors_exist(self):
        css = (ROOT / "student-schedule-v2.css").read_text(encoding="utf-8")
        self.assertIn("@media(max-width:620px)", css)
        self.assertIn("@media(max-width:390px)", css)
        self.assertIn(".day-state.state-pending", css)
        self.assertIn(".day-state.state-off", css)
        self.assertIn(".shared-public-note", css)


if __name__ == "__main__":
    unittest.main()
