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

