<?php
require_once __DIR__.'/staff_security.php';$actor=staffRequire();
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET')staffFail('Method not allowed',405);
require_once __DIR__.'/lesson_policy.php';require_once __DIR__.'/teacher_shift.php';
$input=$_GET['dates']??'';if(!is_string($input))staffFail('日付を確認してください。',400);$dates=array_values(array_unique(explode(',',$input)));if(count($dates)>31)staffFail('31日以内で確認してください。',400);
foreach($dates as $date){$d=DateTimeImmutable::createFromFormat('!Y-m-d',$date);if(!$d||$d->format('Y-m-d')!==$date)staffFail('日付を確認してください。',400);}
$entries=readJsonStrict(__DIR__.'/data/teacher_ng.json');$rows=policyRows();$days=[];foreach($dates as $date)$days[$date]=teacherOpenSlots($date,$entries,$rows,$actor);
echo json_encode(['ok'=>true,'scope'=>$actor['role']==='admin'?'all':'self','days'=>$days],JSON_UNESCAPED_UNICODE);
