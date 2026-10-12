"""Validate actual PHP output on abnormal runtime paths, without a database."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
PHP=os.environ.get('TIMETABLE_TEST_PHP','php')

class ApiResponseTests(unittest.TestCase):
    def run_php(self,body,method='POST',memory='128M'):
        source="<?php $_SERVER['REQUEST_METHOD']="+json.dumps(method)+";$_SERVER['SCRIPT_NAME']='synthetic_api.php';require "+json.dumps(str(ROOT/'api_response.php').replace('\\','/'))+";"+body
        with tempfile.TemporaryDirectory(prefix='timetable-json-test-') as directory:
            script=Path(directory)/'synthetic.php';script.write_text(source,encoding='utf-8')
            result=subprocess.run([PHP,'-d','display_errors=0','-d','memory_limit='+memory,str(script)],capture_output=True,timeout=10)
        return json.loads(result.stdout),result.stderr.decode(errors='replace')

    def test_empty_write_is_unknown_not_success(self):
        j,log=self.run_php('');self.assertFalse(j['ok']);self.assertTrue(j['outcomeUnknown']);self.assertIn(j['reference'],log)

    def test_html_response_is_replaced(self):
        j,_=self.run_php("echo '<html>upstream error</html>';");self.assertFalse(j['ok']);self.assertTrue(j['outcomeUnknown'])

    def test_exception_discards_partial_response(self):
        j,log=self.run_php("echo '{partial';throw new RuntimeException('synthetic secret payload');")
        self.assertFalse(j['ok']);self.assertTrue(j['outcomeUnknown']);self.assertNotIn('synthetic secret payload',log)

    def test_memory_fatal_remains_json(self):
        j,_=self.run_php("$x=str_repeat('x',64*1024*1024);",memory='8M');self.assertFalse(j['ok']);self.assertTrue(j['outcomeUnknown'])

    def test_known_conflict_is_preserved(self):
        j,_=self.run_php("http_response_code(409);echo json_encode(['ok'=>false,'ngConflict'=>true,'error'=>'test']);")
        self.assertEqual(j,dict(ok=False,ngConflict=True,error='test'))

    def test_read_failure_does_not_imply_a_write(self):
        j,_=self.run_php('',method='GET');self.assertFalse(j['outcomeUnknown'])
