import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

HERE = Path(__file__).resolve().parent

class SyntaxTests(unittest.TestCase):
    def test_php_json_expression_and_real_js_errors(self):
        php = os.environ.get('TIMETABLE_TEST_PHP') or shutil.which('php')
        node = shutil.which('node')
        if not php or not node:
            self.skipTest('PHP and Node are required')
        with tempfile.TemporaryDirectory(prefix='timetable-queue-syntax-') as name:
            root = Path(name).resolve()
            self.assertEqual(root.parent, Path(tempfile.gettempdir()).resolve())
            file = root / 'fixture.php'
            template = '<script>const names = new Set(<?= json_encode(array()) ?>); %s </script>'
            file.write_text(template % 'console.log(names);', encoding='utf-8')
            def check():
                return subprocess.run([node, str(HERE/'syntax.cjs'), str(root), php], capture_output=True, timeout=30)
            result = check()
            self.assertEqual(result.returncode, 0, result.stdout)
            self.assertEqual(json.loads(result.stdout)['counts']['inline'], 1)
            file.write_text(template % 'const = broken;', encoding='utf-8')
            self.assertNotEqual(check().returncode, 0)
            file.write_text('<script>const value = <?php echo "1"; ?>;</script>', encoding='utf-8')
            self.assertNotEqual(check().returncode, 0)

if __name__ == '__main__':
    unittest.main()
