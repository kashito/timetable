<?php
require_once __DIR__.'/presence_data.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
if($_SERVER['REQUEST_METHOD']!=='GET')staffFail('Method not allowed',405);
$name=$_GET['name']??'';if(!is_string($name)||strlen($name)>300||trim($name)==='')staffFail('生徒名を確認してください。',400);
$ctx=prContext();$viewer=staffCurrent();
if(!array_key_exists($name,$ctx['names'])||(!empty($ctx['directory']['hiddenStudents'][$name])&&(!$viewer||$viewer['role']!=='admin')))staffFail('生徒が見つかりません。',404);
$numbers=prRegistrationNumbers($ctx);$profile=readJsonStrict(__DIR__.'/data/student_profiles.php')[$name]??[];
$number=$numbers['numbers'][$name]??(string)($profile['registrationNumber']??'');
echo json_encode(['ok'=>true,'name'=>$name,'registrationNumber'=>$number,'numberSource'=>isset($numbers['numbers'][$name])?'attendance':($number!==''?'profile':''),'numberStatus'=>$numbers['status']],JSON_UNESCAPED_UNICODE);
