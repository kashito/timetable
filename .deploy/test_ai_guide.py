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

