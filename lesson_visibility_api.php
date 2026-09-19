<?php
require_once __DIR__.'/staff_security.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/data_safety.php';

$dir=__DIR__.'/data';
$file=$dir.'/lesson_visibility.json';
if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)){
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE);
  exit;
}
function lv_read($file){
  if(!is_file($file)) return [];
  $j=json_decode(@file_get_contents($file)?:'[]',true);
  if(!is_array($j)) return [];
  $src=isset($j['hidden'])&&is_array($j['hidden'])?$j['hidden']:$j;
  $out=[];
  foreach($src as $v){$v=trim((string)$v);if($v!==''&&!in_array($v,$out,true))$out[]=$v;}
  return $out;
}
if($_SERVER['REQUEST_METHOD']==='GET'){
  echo json_encode(['ok'=>true,'hidden'=>lv_read($file)],JSON_UNESCAPED_UNICODE);
  exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST'){
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE);
  exit;
}
$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)||!isset($in['hidden'])||!is_array($in['hidden'])){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'hidden配列が必要です'],JSON_UNESCAPED_UNICODE);
  exit;
}
$out=[];
foreach($in['hidden'] as $v){$v=trim((string)$v);if($v!==''&&!in_array($v,$out,true))$out[]=$v;}
if(!safeJsonWriteAtomic($file,['hidden'=>$out,'updatedAt'=>date('c')])){
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'表示設定を保存できません'],JSON_UNESCAPED_UNICODE);
  exit;
}
echo json_encode(['ok'=>true,'hidden'=>$out],JSON_UNESCAPED_UNICODE);
