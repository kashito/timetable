<?php
require_once __DIR__.'/presence_data.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');
$actor=staffRequire();$method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))staffFail('Method not allowed',405);
$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力内容を確認してください。',400);$action=$in['action']??'overview';if(!in_array($action,['overview','lesson','links'],true)||($method==='POST'&&$action!=='links'))staffFail('操作を確認してください。',400);if($action==='links')staffRequire(true);
$rows=policyRows();$keys=[];$date=date('Y-m-d');
if($action==='lesson'){$keys=scKeys(json_decode($in['keys']??'[]',true),true);$wanted=[];foreach($keys as $k)$wanted[canonicalLessonKey($k)]=true;$target=array_values(array_filter($rows,fn($r)=>isset($wanted[canonicalLessonKey(policyKey($r))])));if(count($target)!==count($wanted))staffFail('授業が変更されました。詳細を開き直してください。',409);$date=str_replace('/','-',$target[0]['日付']);foreach($target as $r)if(str_replace('/','-',$r['日付'])!==$date)staffFail('同じ日の授業を選んでください。',400);}
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date))staffFail('授業の日付を確認してください。',400);
try{[$catalog,$latest,$events]=prSource($date);}catch(RuntimeException $e){staffFail($e->getMessage(),503);}
$ctx=prContext();$mappings=prMappings($ctx,$catalog);$version=prMappingVersion($ctx,$catalog);
if($method==='POST'){
 if(!is_string($in['version']??null)||!hash_equals($version,$in['version']))staffFail('生徒情報・対応表が更新されました。読み込み直して確認してください。',409);
 $changes=$in['links']??null;if(!is_array($changes)||count($changes)>5000)staffFail('対応する生徒を選んでください。',400);
 foreach($changes as $name=>$id){if(!array_key_exists($name,$ctx['names']))staffFail('生徒一覧が変更されました。',409);if($id==='auto'){unset($ctx['links']['links'][$name]);continue;}if($id==='none'){$ctx['links']['links'][$name]=null;continue;}if(!is_int($id)||!isset($catalog[$id]))staffFail('入退室側の生徒を選び直してください。',400);$r=$catalog[$id];$ctx['links']['links'][$name]=['externalId'=>$id,'number'=>$r['student_no'],'name'=>$r['name'],'at'=>date('c'),'by'=>$actor['name']];}
 $mapped=prMappings($ctx,$catalog);foreach($mapped as $m)if(!empty($m['conflict']))staffFail('同じ入退室の生徒を複数人に対応づけできません。対応を確認してください。',409);
 $ctx['links']['history'][]=['at'=>date('c'),'by'=>$actor['name'],'previous'=>prContext()['links']['links']];
 if(!safeJsonWriteAtomic(__DIR__.'/data/presence_links.php',$ctx['links']))staffFail('対応を保存できませんでした。',500);$mappings=$mapped;$version=prMappingVersion($ctx,$catalog);
}
if($action==='links'){$list=[];foreach($ctx['names'] as $name=>$number)$list[]=['name'=>$name,'number'=>$number,'hidden'=>!empty($ctx['directory']['hiddenStudents'][$name])]+$mappings[$name];$safeCatalog=[];foreach($catalog as $r)$safeCatalog[]=['id'=>$r['id'],'number'=>$r['student_no'],'name'=>$r['name']];echo json_encode(['ok'=>true,'students'=>$list,'catalog'=>$safeCatalog,'version'=>$version],JSON_UNESCAPED_UNICODE);exit;}
$sourceGroups=[];foreach(lessonGroups() as $g)if(!empty($g['active']))foreach($g['sources'] as $source)$sourceGroups[$source]=$g;
$items=[];foreach($ctx['names'] as $name=>$number){if(!empty($ctx['directory']['hiddenStudents'][$name]))continue;$eligible=prEligible($name,$rows,$ctx,$date);if($action==='lesson'){$eligible=array_values(array_filter($eligible,fn($r)=>isset($wanted[canonicalLessonKey(policyKey($r))])));if(!$eligible)continue;}
 $items[]=['name'=>$name,'presence'=>prStatus($mappings[$name],$catalog,$latest,$events,$date),'lessons'=>prLessons($name,$eligible,$ctx,$sourceGroups)];}
echo json_encode(['ok'=>true,'date'=>$date,'today'=>date('Y-m-d'),'checkedAt'=>date('c'),'items'=>$items],JSON_UNESCAPED_UNICODE);
