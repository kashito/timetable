"""Regression for CM-53f648bc5867da2b6593d36b; synthetic data only."""
from pathlib import Path
import shutil
import subprocess
import unittest


class GeneratorSaveTests(unittest.TestCase):
    def test_saved_sections_and_unsaved_drafts(self):
        node = shutil.which('node')
        self.assertIsNotNone(node, 'Node.js is required for the generator regression')
        result = subprocess.run([node, '--test', str(Path(__file__).with_name('generator-save.test.cjs'))],
                                capture_output=True, text=True, encoding='utf-8', timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
