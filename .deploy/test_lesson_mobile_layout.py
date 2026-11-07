"""Shared lesson layout contracts; synthetic browser coverage is in the companion cjs."""
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]

class LessonMobileLayoutTests(unittest.TestCase):
    def test_common_entry_points_keep_the_shared_layout(self):
        for name in ['teacher2026summer.html','teacher2026summer_vertical.html','lesson_group.html','schedule_generator.php']:
            with self.subTest(name=name):
                source=(ROOT/name).read_text(encoding='utf-8')
                self.assertIn('lesson-detail-layout.js?v=20261107-mobile-details',source)
                self.assertIn('lesson-detail-common.css?v=20261107-mobile-details',source)
        source=(ROOT/'lesson-detail-layout.js').read_text(encoding='utf-8')
        for marker in ["'このコマまでの宿題'", "'カルテ（この授業の記録）'", "'次回までの宿題'", "'先生への連絡'", 'lesson-detail-records', 'field._homeworkItems?.root']:
            self.assertIn(marker,source)

    def test_japanese_composition_does_not_append_homework(self):
        source=(ROOT/'homework-editor.js').read_text(encoding='utf-8')
        self.assertIn("event.key==='Enter'&&!event.isComposing&&event.keyCode!==229",source)
        self.assertIn('homework-item-options',source)
        self.assertIn("current?.attachments?.length",source)

    def test_detail_scripts_parse(self):
        for name in ['lesson-detail-layout.js','homework-editor.js','recording-tools.js','shared-notes.js','lesson-group.js','staff-auth.js']:
            with self.subTest(name=name):
                result=subprocess.run(['node','--check',str(ROOT/name)],capture_output=True,text=True,timeout=20)
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)

if __name__=='__main__': unittest.main()