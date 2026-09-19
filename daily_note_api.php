<?php
require_once __DIR__.'/staff_security.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') staffRequire();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/data_safety.php';
$dir=__DIR__.'/data';
$file=$dir.'/daily_notes.json';
if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)){http_response_code(500);echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE);exit;}
function readNotes($file){if(!is_file($file))return []; $x=json_decode(@file_get_contents($file),true);return is_array($x)?$x:[];}
if($_SERVER['REQUEST_METHOD']==='GET'){echo json_encode(['ok'=>true,'notes'=>readNotes($file)],JSON_UNESCAPED_UNICODE);exit;}
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE);exit;}
$in=json_decode(file_get_contents('php://input'),true);
$date=trim((string)($in['date']??''));$text=(string)($in['text']??'');
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'日付が不正です'],JSON_UNESCAPED_UNICODE);exit;}
$notes=readNotes($file);
if($text===''){unset($notes[$date]);}else{$notes[$date]=$text;}
if(!safeJsonWriteAtomic($file,$notes)){http_response_code(500);echo json_encode(['ok'=>false,'error'=>'メモを保存できません'],JSON_UNESCAPED_UNICODE);exit;}
echo json_encode(['ok'=>true],JSON_UNESCAPED_UNICODE);
?>
