"""Regression for CM-53f648bc5867da2b6593d36b; synthetic data only."""
from pathlib import Path
import shutil
import subprocess
import unittest


class GeneratorSaveTests(unittest.TestCase):
    def test_generator_date_and_viewport(self):
        self.run_node('generator-date.test.cjs')

    def test_saved_sections_and_unsaved_drafts(self):
        self.run_node('generator-save.test.cjs')

    def run_node(self, name):
        node = shutil.which('node')
        self.assertIsNotNone(node, 'Node.js is required for the generator regression')
        result = subprocess.run([node, '--test', str(Path(__file__).with_name(name))],
                                capture_output=True, text=True, encoding='utf-8', timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
