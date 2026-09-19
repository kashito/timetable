<?php
require_once __DIR__.'/lesson_groups.php';
staffRequire(($_SERVER['REQUEST_METHOD']??'GET')!=='GET');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir=__DIR__.'/data';
$file=$dir.'/schedule_overrides.json';

if(!is_dir($dir)){
  if(!@mkdir($dir,0777,true) && !is_dir($dir)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE);
    exit;
  }
}

function readData($file){
  if(!file_exists($file)) return [];
  $j=json_decode(@file_get_contents($file)?:'{}',true);
  return is_array($j)?$j:[];
}

if($_SERVER['REQUEST_METHOD']==='GET'){
  echo json_encode(['ok'=>true,'overrides'=>readData($file)],JSON_UNESCAPED_UNICODE);
  exit;
}

if($_SERVER['REQUEST_METHOD']!=='POST'){
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE);
  exit;
}

$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Invalid JSON'],JSON_UNESCAPED_UNICODE);
  exit;
}

$key=trim((string)($in['key']??''));
if($key===''){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'keyがありません'],JSON_UNESCAPED_UNICODE);
  exit;
}

guardFixedLesson($key,$in);
foreach(policyRows() as $row){if(canonicalLessonKey(policyKey($row))===canonicalLessonKey($key)||$row['_sourceKey']===$key)guardGroupedSource($row['_sourceKey']);}
$data=readData($file);
$current=isset($data[$key])&&is_array($data[$key])?$data[$key]:[];

foreach(['教室','担当講師','種別','科目','開始','終了','備考'] as $field){
  if(array_key_exists($field,$in)){
    $current[$field]=$in[$field];
  }
}
$current['updatedAt']=date('c');
$data[$key]=$current;

$tmp=$file.'.tmp';
if(!safeJsonWriteAtomic($file,$data)){
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'変更内容を保存できません'],JSON_UNESCAPED_UNICODE);
  exit;
}

echo json_encode(['ok'=>true,'override'=>$current],JSON_UNESCAPED_UNICODE);
?>
