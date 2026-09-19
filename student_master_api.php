<?php
require_once __DIR__.'/staff_security.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$dir=__DIR__.'/data';
$masterFile=$dir.'/student_master.json';
$scheduleFile=$dir.'/schedule_data.json';
if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)){
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE); exit;
}
function readArrayFile($file,$default=[]){
 return readJsonStrict($file,$default);
}
function writeJsonAtomic($file,$value){
 return safeJsonWriteAtomic($file,$value);
}
function normalizeStudents($rows){
  $out=[];
  foreach($rows as $r){
    if(!is_array($r)) continue;
    $cls=trim((string)($r['クラス']??''));
    if($cls==='') continue;
    $out[]=array_merge($r,['生徒名'=>trim((string)($r['生徒名']??'')),'クラス'=>$cls,'優先度'=>trim((string)($r['優先度']??'0'))]);
  }
  return $out;
}
if($_SERVER['REQUEST_METHOD']==='GET'){
  if(file_exists($masterFile)){
    echo json_encode(['ok'=>true,'initialized'=>true,'students'=>normalizeStudents(readArrayFile($masterFile,[]))],JSON_UNESCAPED_UNICODE); exit;
  }
  if(file_exists($scheduleFile)){
    $d=readArrayFile($scheduleFile,[]); $rows=(isset($d['students'])&&is_array($d['students']))?$d['students']:[];
    echo json_encode(['ok'=>true,'initialized'=>true,'students'=>normalizeStudents($rows)],JSON_UNESCAPED_UNICODE); exit;
  }
  echo json_encode(['ok'=>true,'initialized'=>false,'students'=>[]],JSON_UNESCAPED_UNICODE); exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST'){
  http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE); exit;
}
$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)||!isset($in['students'])||!is_array($in['students'])){
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'students が不正です'],JSON_UNESCAPED_UNICODE); exit;
}
$students=normalizeStudents($in['students']);
if(!writeJsonAtomic($masterFile,$students)){
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'生徒マスタを保存できません'],JSON_UNESCAPED_UNICODE); exit;
}
$scheduleUpdated=false;
if(file_exists($scheduleFile)){
  $data=readArrayFile($scheduleFile,[]);
  $data['students']=$students; $data['updatedAt']=date('c');
  if(!writeJsonAtomic($scheduleFile,$data)){
    http_response_code(500); echo json_encode(['ok'=>false,'error'=>'生徒マスタ本体との同期に失敗しました'],JSON_UNESCAPED_UNICODE); exit;
  }
  $scheduleUpdated=true;
}
echo json_encode(['ok'=>true,'students'=>$students,'scheduleDataUpdated'=>$scheduleUpdated],JSON_UNESCAPED_UNICODE);
?>
