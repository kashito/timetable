<?php
require_once __DIR__.'/api_response.php';
require_once __DIR__.'/homework_explanation.php';require_once __DIR__.'/lesson_links.php';
$actor=staffRequire();header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST')staffFail('Method not allowed',405);
$in=json_decode(file_get_contents('php://input'),true);$id=$in['taskId']??'';
if(!is_array($in)||!is_string($id)||!is_bool($in['checked']??null))staffFail('授業・解説の完了を確認してください',400);
$known=null;foreach(homeworkSharedAssignments() as $item)if($item['id']===$id){$known=$item;break;}
if(!$known)staffFail('宿題が変更されています。最新の項目を確認してください',409);
if(!hash_equals($known['revision'],(string)($in['expectedRevision']??'')))staffFail('授業・解説の完了が更新されました。最新の状態を確認してください',409);
$states=homeworkExplanationStates();foreach($known['aliases'] as $alias)$states[$alias]=['checked'=>$in['checked'],'scope'=>'explanation','at'=>date('c'),'by'=>$actor['id']];
$captured=false;$records=readJsonStrict(__DIR__.'/data/lesson_records.json');$allRows=policyRows();foreach($allRows as $row)if(in_array(policyKey($row),$known['sourceKeys'],true)){$key=logicalRecordKey(policyKey($row));if(isset($records[$key])&&!isset($records[$key]['homeworkTaskRefs'])){$g=groupForSource($row['_sourceKey']);$before=$g?commonGroupRecord($g,$records,groupRows($g,$allRows)):$records[$key];$records[$key]=homeworkDecorateRecord($key,$before,$allRows);$records[$key]['_homeworkRefSeedRevision']=recordRevision($before);$captured=true;}}
if(!($captured?safeDataTransaction([__DIR__.'/data/lesson_records.json'=>$records,__DIR__.'/data/homework_explanation_checks.php'=>$states]):safeJsonWriteAtomic(__DIR__.'/data/homework_explanation_checks.php',$states)))staffFail('授業・解説の完了を保存できませんでした',500);
echo json_encode(['ok'=>true,'item'=>array_replace($known,homeworkExplanationState($known['aliases'],$states))],JSON_UNESCAPED_UNICODE);
