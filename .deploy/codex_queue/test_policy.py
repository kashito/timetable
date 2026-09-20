import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from policy import ReviewRequired, apply_edits, request_risk, safe_path

class PolicyTests(unittest.TestCase):
    def test_cosmetic_css_is_level_one(self):
        data,names,level=apply_edits({'board.css':b'h1{color:red}'},[{'path':'board.css','before':'color:red','after':'color:blue'}],1)
        self.assertEqual(data['board.css'],b'h1{color:blue}');self.assertEqual(level,1)
    def test_javascript_and_multifile_are_level_two(self):
        original={'a.js':b'const size=2;','a.css':b'a{color:red}'}
        _,_,level=apply_edits(original,[{'path':'a.js','before':'size=2','after':'size=3'},{'path':'a.css','before':'red','after':'blue'}],1)
        self.assertEqual(level,2)
    def test_html_script_edit_cannot_be_cosmetic(self):
        _,_,level=apply_edits({'a.html':b'<script>const x=1;</script>'},[{'path':'a.html','before':'x=1','after':'x=2'}],1)
        self.assertEqual(level,2)
    def test_protected_paths_and_traversal(self):
        for path in ('data/records.php','staff_auth_api.php','.deploy/deploy.py','.github/workflows/a.yml','payroll.php','../a.css','C:/a.css','a/../../a.css','uploads/a.php','schedule.xlsx','codex_queue_lib.php','a\\b.css'):
            with self.subTest(path=path),self.assertRaises(ReviewRequired):safe_path(path)
    def test_secret_external_network_and_database_edits_blocked(self):
        for text in ('fetch("https://example.com")','DROP TABLE lessons','password="longprivatevalue"','url(https://example.com)','file_put_contents("x","y")'):
            with self.subTest(text=text),self.assertRaises(ReviewRequired):apply_edits({'x.js':b'old'},[{'path':'x.js','before':'old','after':text}],2)
    def test_deleted_file_or_ambiguous_match_blocked(self):
        for before,after in [('red',''),('x','red'),('','new')]:
            with self.subTest(before=before),self.assertRaises(ReviewRequired):apply_edits({'a.css':b'xx red'},[{'path':'a.css','before':before,'after':after}],1)
    def test_risky_memo_and_followup_detected(self):
        self.assertTrue(request_risk({'text':'余白の修正','updates':[{'text':'ログインを不要にして'}]}))
        self.assertFalse(request_risk({'text':'見出しの色を変更','updates':[]}))
    def test_level_three_never_applies(self):
        with self.assertRaises(ReviewRequired):apply_edits({'x.css':b'a'},[{'path':'x.css','before':'a','after':'b'}],3)

if __name__=='__main__':unittest.main()
