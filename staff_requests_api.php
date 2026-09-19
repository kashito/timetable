<?php
require_once __DIR__.'/staff_security.php';$actor=staffRequire();
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$file=__DIR__.'/data/staff_requests.json';$items=readJsonStrict($file);
if($_SERVER['REQUEST_METHOD']==='GET'){echo json_encode(['ok'=>true,'items'=>array_values(array_filter($items,function($x)use($actor){return empty($x['targetRole'])||$actor['role']===$x['targetRole'];}))],JSON_UNESCAPED_UNICODE);exit;}
if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('Method not allowed',405);
$in=json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);
$action=$in['action']??'add';$id=(string)($in['id']??'');
if($action==='add'){
  $text=trim((string)($in['text']??''));if($text===''||strlen($text)>12000)staffFail('要望を入力してください（長文の場合は分割してください）。',400);
  $id=bin2hex(random_bytes(12));$items[$id]=['id'=>$id,'text'=>$text,'className'=>trim((string)($in['className']??'')),'author'=>$actor['name'],'authorId'=>$actor['id'],'createdAt'=>date('c'),'done'=>false];
}elseif($action==='toggle'){
  if(!isset($items[$id]))staffFail('要望が見つかりません',404);
  if(($items[$id]['targetRole']??'')==='admin'&&$actor['role']!=='admin')staffFail('管理者が確認する通知です。');
  $items[$id]['done']=!empty($in['done']);$items[$id]['resolvedBy']=$actor['name'];$items[$id]['resolvedAt']=date('c');
}else staffFail('不明な操作です',400);
if(!safeJsonWriteAtomic($file,$items))staffFail('保存できませんでした',500);
echo json_encode(['ok'=>true,'item'=>$items[$id]],JSON_UNESCAPED_UNICODE);
