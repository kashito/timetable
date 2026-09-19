<?php
require_once __DIR__.'/staff_security.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/data_safety.php';
$dir=__DIR__.'/data';
$file=$dir.'/school_holidays.json';
if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)){http_response_code(500);echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE);exit;}
function readSchoolHolidays($file){
  if(!is_file($file)) return [];
  $x=json_decode(@file_get_contents($file),true);
  if(!is_array($x)) return [];
  $out=[];
  foreach($x as $k=>$v){ if($v && preg_match('/^\d{4}-\d{2}-\d{2}$/',(string)$k)) $out[(string)$k]=true; }
  return $out;
}
if($_SERVER['REQUEST_METHOD']==='GET'){
  echo json_encode(['ok'=>true,'holidays'=>readSchoolHolidays($file)],JSON_UNESCAPED_UNICODE);exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE);exit;}
$in=json_decode(file_get_contents('php://input'),true);
$date=trim((string)($in['date']??''));$enabled=!empty($in['enabled']);
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'日付が不正です'],JSON_UNESCAPED_UNICODE);exit;}
$items=readSchoolHolidays($file);
if($enabled)$items[$date]=true; else unset($items[$date]);
ksort($items);
if(!safeJsonWriteAtomic($file,$items)){http_response_code(500);echo json_encode(['ok'=>false,'error'=>'休講日を保存できません'],JSON_UNESCAPED_UNICODE);exit;}
echo json_encode(['ok'=>true,'date'=>$date,'enabled'=>$enabled],JSON_UNESCAPED_UNICODE);
