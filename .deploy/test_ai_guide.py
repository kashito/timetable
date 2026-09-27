import json
import re
import unittest
from pathlib import Path
from urllib.parse import urlparse


class AiGuideTest(unittest.TestCase):
    def test_guide_is_safe_and_current(self):
        root = Path(__file__).resolve().parents[1]
        guide = json.loads((root / "ai-guide.json").read_text(encoding="utf-8"))
        self.assertEqual("timetable", guide["system_name"])
        self.assertEqual("production", guide["status"])
        self.assertTrue(guide["operations"])
        for page in guide["pages"]:
            parsed = urlparse(page["url"])
            self.assertEqual("https", parsed.scheme)
            self.assertEqual("224236.com", parsed.netloc)
            local = root / parsed.path.removeprefix("/2026summer/")
            self.assertTrue(local.is_file(), page["url"])
        text = json.dumps(guide, ensure_ascii=False)
        self.assertIsNone(re.search(r"PRIVATE KEY|(?i:api[_-]?key|password|secret|token)\s*[:=]", text))

    def test_generated_student_display_rules_are_current(self):
        root = Path(__file__).resolve().parents[1]
        import subprocess
        import sys
        result = subprocess.run(
            [sys.executable, str(root / ".deploy" / "generate_ai_guide_states.py")],
            cwd=root,
            capture_output=True,
            text=True,
        )
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)

        guide = json.loads((root / "ai-guide.json").read_text(encoding="utf-8"))
        rules = {item["id"]: item for item in guide["display_rules"]}
        self.assertIn("student-currently-adjusting-private-window", rules)
        self.assertIn("student-currently-adjusting-empty-day", rules)
        self.assertTrue(any(item["question"].startswith("生徒・保護者画面で「現在調整中」") for item in guide["faq"]))
