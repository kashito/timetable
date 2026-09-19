<?php
require_once __DIR__.'/test_results_data.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
if($_SERVER['REQUEST_METHOD']!=='GET')staffFail('操作を確認してください。',405);
$name=$_GET['name']??'';if(!is_string($name)||strlen($name)>300||trim($name)==='')staffFail('生徒名を確認してください。',400);
$dir=__DIR__.'/data';$students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$directory=readJsonStrict($dir.'/directory_state.json');
if(!in_array($name,array_column($students,'生徒名'),true)||!empty($directory['hiddenStudents'][$name]))staffFail('生徒が見つかりません。',404);
$items=[];foreach(trReadData()['items'] as $r)if(in_array($name,trPendingNames($r,$directory),true))$items[]=['id'=>$r['id'],'date'=>$r['date'],'className'=>$r['className'],'testName'=>$r['name']];
usort($items,fn($a,$b)=>strcmp($a['date'],$b['date'])?:strcmp($a['id'],$b['id']));
echo json_encode(['ok'=>true,'items'=>$items],JSON_UNESCAPED_UNICODE);
