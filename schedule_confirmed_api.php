<?php
require_once __DIR__.'/staff_security.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') { if($_SERVER['REQUEST_METHOD']!=='POST') staffFail('Method not allowed',405); staffRequire(true); }
header('Content-Type: application/json; charset=utf-8');
$dir=__DIR__.'/data'; $file=$dir.'/schedule_confirmed.json';
if(!is_dir($dir)) @mkdir($dir,0775,true);
function out($x,$c=200){http_response_code($c);echo json_encode($x,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
if($_SERVER['REQUEST_METHOD']==='GET'){
  $d=['date'=>'','privateFrom'=>'']; if(is_file($file)){ $j=json_decode((string)file_get_contents($file),true); if(is_array($j)) $d=array_merge($d,$j); }
  out(['ok'=>true,'date'=>(string)($d['date']??''),'privateFrom'=>(string)($d['privateFrom']??'')]);
}
$raw=file_get_contents('php://input'); $j=json_decode($raw?:'{}',true); if(!is_array($j)) $j=$_POST;
$date=trim((string)($j['date']??''));
$privateFrom=trim((string)($j['privateFrom']??''));
foreach([$date,$privateFrom] as $value)if($value!==''&&!preg_match('/^\d{4}-\d{2}-\d{2}$/',$value)) out(['ok'=>false,'error'=>'invalid date'],400);
$current=['date'=>'','privateFrom'=>''];if(is_file($file)){$saved=json_decode((string)file_get_contents($file),true);if(is_array($saved))$current=array_merge($current,$saved);}
if(!array_key_exists('date',$j))$date=(string)($current['date']??'');
if(!array_key_exists('privateFrom',$j))$privateFrom=(string)($current['privateFrom']??'');
$next=['date'=>$date,'privateFrom'=>$privateFrom,'updatedAt'=>date(DATE_ATOM)];
if(!safeJsonWriteAtomic($file,$next))out(['ok'=>false,'error'=>'save failed'],500);
out(['ok'=>true,'date'=>$date,'privateFrom'=>$privateFrom]);
