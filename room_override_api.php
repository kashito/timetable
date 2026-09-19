<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_policy.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir=__DIR__.'/data';
$file=$dir.'/room_overrides.json';

if(!is_dir($dir)){
  if(!@mkdir($dir,0777,true) && !is_dir($dir)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE);
    exit;
  }
}

function readOverrides($file){
  if(!file_exists($file)) return [];
  $raw=@file_get_contents($file);
  $j=json_decode($raw?:'{}',true);
  return is_array($j)?$j:[];
}

if($_SERVER['REQUEST_METHOD']==='GET'){
  echo json_encode(['ok'=>true,'overrides'=>readOverrides($file)],JSON_UNESCAPED_UNICODE);
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
$room=trim((string)($in['room']??''));

if($key===''){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'授業キーがありません'],JSON_UNESCAPED_UNICODE);
  exit;
}

$key=canonicalLessonKey($key);
foreach(policyRows() as $r)if(policyKey($r)===$key&&($r['教室']??'')!==$room){guardGroupedSource($r['_sourceKey']);guardFixedLesson($key,$in);$r['教室']=$room;guardRoomSharing($r,$r['_sourceKey'],$in);break;}
$data=readOverrides($file);
$data[$key]=[
  'room'=>$room,
  'updatedAt'=>date('c')
];

$tmp=$file.'.tmp';
$json=json_encode($data,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);

if(!safeJsonWriteAtomic($file,$data)){
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'教室変更を保存できません'],JSON_UNESCAPED_UNICODE);
  exit;
}

echo json_encode(['ok'=>true,'room'=>$room],JSON_UNESCAPED_UNICODE);
?>