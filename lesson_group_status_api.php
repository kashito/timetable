<?php
require_once __DIR__.'/lesson_groups.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');
$actor=staffRequire();if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST')staffFail('保存にはPOSTを使用してください。',405);
$in=json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式を確認してください。',400);
$field=$in['field']??'';if(!in_array($field,['fixed','ready'],true)||!isset($in['value'])||!is_bool($in['value']))staffFail('確定・準備の指定を確認してください。',400);
if($field==='fixed')staffRequire(true);
$id=$in['id']??'';if(!is_string($id))staffFail('連結した授業を選び直してください。',400);
$group=lessonGroups()[$id]??null;if(!$group||empty($group['active']))staffFail('連結が変更・解除されました。再読み込みしてください。',409);
$rows=groupRows($group);if(count($rows)!==count($group['sources']??[])||count($rows)<2)staffFail('連結した授業が変更されました。再読み込みしてください。',409);
$keys=[];foreach($rows as $row){if(!empty($row['日区分'])||!lgCompatible($rows[0],$row))staffFail('連結した授業を確認できません。再読み込みしてください。',409);$keys[]=canonicalLessonKey(policyKey($row));}
$expected=$in['expected']??null;if(!is_array($expected))staffFail('状態を読み直してから操作してください。',400);
$given=array_keys($expected);sort($given,SORT_STRING);$sorted=$keys;sort($sorted,SORT_STRING);
if($given!==$sorted||count(array_unique($keys))!==count($keys))staffFail('連結したコマが変更されました。再読み込みしてください。',409);
$file=__DIR__.'/data/'.($field==='fixed'?'lesson_fixed.json':'class_state.json');$all=readJsonStrict($file);
foreach($keys as $key){if(!is_bool($expected[$key]))staffFail('状態の形式を確認してください。',400);if($expected[$key]!==!empty($all[$key][$field]))staffFail('別の画面で状態が更新されています。再読み込みしてから操作してください。',409);}
$changed=0;$now=date('c');foreach($keys as $key){if(!empty($all[$key][$field])===$in['value'])continue;$all[$key]=array_replace($all[$key]??[],[$field=>$in['value'],'updatedAt'=>$now,'updatedBy'=>$actor['name']]);$changed++;}
// One atomic write updates every member, preserving attendance, notes and other lessons.
if($changed&&!safeJsonWriteAtomic($file,$all))staffFail('連結した授業の状態を保存できませんでした。',500);
echo json_encode(['ok'=>true,'id'=>$id,'field'=>$field,'value'=>$in['value'],'keys'=>$keys,'changed'=>$changed],JSON_UNESCAPED_UNICODE);
