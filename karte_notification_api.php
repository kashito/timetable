<?php
require_once __DIR__.'/staff_security.php';
$actor=staffRequire();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/data_safety.php';
$dir=__DIR__.'/data';
$file=$dir.'/karte_notification_seen.json';
if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)){
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE); exit;
}
if(!file_exists($file)){ @file_put_contents($file,'{}'); @chmod($file,0664); }
function kn_read($file){ $raw=@file_get_contents($file); $j=json_decode($raw?:'{}',true); return is_array($j)?$j:[]; }
function kn_clean($v){ return trim((string)$v); }
$all=kn_read($file);
if($_SERVER['REQUEST_METHOD']==='GET'){
  $teacher=$actor['name'];
  if($teacher===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'先生名がありません'],JSON_UNESCAPED_UNICODE); exit; }
  $row=(isset($all[$teacher])&&is_array($all[$teacher]))?$all[$teacher]:[];
  echo json_encode(['ok'=>true,'teacher'=>$teacher,'seenAt'=>(string)($row['seenAt']??'')],JSON_UNESCAPED_UNICODE); exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST'){ http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE); exit; }
$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'JSON形式が不正です'],JSON_UNESCAPED_UNICODE); exit; }
$teacher=$actor['name'];
if($teacher===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'先生名がありません'],JSON_UNESCAPED_UNICODE); exit; }
$seenAt=kn_clean($in['seenAt']??'');
if($seenAt==='') $seenAt=date('c');
$all[$teacher]=['seenAt'=>$seenAt];
if(!safeJsonWriteAtomic($file,$all)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'通知確認状態の保存に失敗しました'],JSON_UNESCAPED_UNICODE); exit; }
echo json_encode(['ok'=>true,'teacher'=>$teacher,'seenAt'=>$seenAt],JSON_UNESCAPED_UNICODE);
