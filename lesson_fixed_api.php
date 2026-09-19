<?php
require_once __DIR__.'/lesson_policy.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$file=__DIR__.'/data/lesson_fixed.json';$all=readJsonStrict($file);
function fixedDatePlan($date,$all){
 if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))staffFail('日付が正しくありません。',400);
 $keys=[];foreach(policyRows() as $r){if(!empty($r['日区分']) || empty($r['クラス']) || empty($r['時間番号']))continue;$key=canonicalLessonKey(policyKey($r));if(explode('|',$key)[0]===$date)$keys[$key]=true;}
 $keys=array_keys($keys);sort($keys,SORT_STRING);$pending=0;foreach($keys as $key)if(empty($all[$key]['fixed']))$pending++;
 return ['date'=>$date,'keys'=>$keys,'total'=>count($keys),'pending'=>$pending,'token'=>hash('sha256',json_encode($keys))];
}
if($_SERVER['REQUEST_METHOD']==='GET'){
 $out=[];foreach(currentLessonEntries($all) as $k=>$v)$out[$k]=['fixed'=>!empty($v['fixed'])];$result=['ok'=>true,'lessons'=>$out];
 if(isset($_GET['date'])){$plan=fixedDatePlan((string)$_GET['date'],$all);unset($plan['keys']);$result['plan']=$plan;}
 echo json_encode($result,JSON_UNESCAPED_UNICODE);exit;
}
$actor=staffRequire(true);if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('Method not allowed',405);
$in=json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('JSON形式が不正です。',400);
if(($in['action']??'')==='fix_date'){
 $plan=fixedDatePlan((string)($in['date']??''),$all);
 if(!hash_equals($plan['token'],(string)($in['token']??'')))staffFail('この日の授業が変更されました。もう一度、一括固定ボタンを押して確認してください。',409);
 foreach($plan['keys'] as $key)if(empty($all[$key]['fixed']))$all[$key]=['fixed'=>true,'updatedAt'=>date('c'),'updatedBy'=>$actor['name']];
 if($plan['pending'] && !safeJsonWriteAtomic($file,$all))staffFail('固定状態を保存できません。',500);
 echo json_encode(['ok'=>true,'date'=>$plan['date'],'total'=>$plan['total'],'changed'=>$plan['pending'],'keys'=>$plan['keys']],JSON_UNESCAPED_UNICODE);exit;
}
$key=canonicalLessonKey(trim((string)($in['key']??'')));
$exists=false;foreach(policyRows() as $r)if(policyKey($r)===$key){$exists=true;break;}
if(!$exists)staffFail('授業が見つかりません。再読み込みしてください。',404);
$all[$key]=['fixed'=>!empty($in['fixed']),'updatedAt'=>date('c'),'updatedBy'=>$actor['name']];
if(!safeJsonWriteAtomic($file,$all))staffFail('固定状態を保存できません',500);
echo json_encode(['ok'=>true,'lesson'=>$all[$key]],JSON_UNESCAPED_UNICODE);
