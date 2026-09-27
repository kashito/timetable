import json
import unittest
from pathlib import Path


class AiHubTest(unittest.TestCase):
    def test_index_resolves_every_local_guide(self):
        root = Path(__file__).resolve().parents[1] / "ai"
        index = json.loads((root / "ai-systems.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(index["systems"]), 6)
        for system in index["systems"]:
            fallback = root / "guides" / system["name"] / "ai-guide.json"
            self.assertTrue(fallback.is_file(), system["name"])
            guide = json.loads(fallback.read_text(encoding="utf-8"))
            self.assertEqual(system["name"], guide["system_name"])

    def test_search_includes_generated_display_rules_and_faq(self):
        root = Path(__file__).resolve().parents[1]
        guide = json.loads((root / "ai" / "guides" / "timetable" / "ai-guide.json").read_text(encoding="utf-8"))
        self.assertTrue(any(rule["message"] == "現在調整中" for rule in guide["display_rules"]))
        source = (root / "ai" / "api" / "ai-help.php").read_text(encoding="utf-8")
        self.assertIn("'faq' => $guide['faq'] ?? []", source)
        self.assertIn("'display_rule' => $guide['display_rules'] ?? []", source)
