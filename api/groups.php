<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
define('HISTORY_MEMBER_API_V58',true);
require_once __DIR__.'/groups-store-v58.php';
function hg58_result(array $data): void {echo json_encode(['ok'=>true]+$data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
$member=hm58_current();if(!$member)hm58_fail('ログインしてください。',401);$id=$member['id'];$action=$_GET['action']??'mine';
if(($_SERVER['REQUEST_METHOD']??'')==='GET'){
 if($action==='mine')hg58_result(['groups'=>hg58_mine($id)]);
 $g=hg58_group(is_string($_GET['groupId']??null)?$_GET['groupId']:'');hg58_admin($g,$id);
 if($action==='members'){$rows=[];foreach($g['members'] as $mid=>$rel){$m=hm58_read(hm58_dir('accounts').'/'.$mid.'.php');if($m)$rows[]=['id'=>$mid,'displayName'=>$m['displayName'],'role'=>$rel['role'],'joinedAt'=>$rel['joinedAt']];}hg58_result(['members'=>$rows,'group'=>['id'=>$g['id'],'name'=>$g['name']]]);}
 if($action==='records'){$target=is_string($_GET['memberId']??null)?$_GET['memberId']:'';$rel=$g['members'][$target]??null;if(!$rel)hm58_fail('この所属のユーザーではありません。',403);$m=hm58_read(hm58_dir('accounts').'/'.$target.'.php');if(!$m)hm58_fail('ユーザーが見つかりません。',404);hg58_result(hm58_records($m,$_GET,['groupId'=>$g['id'],'joinedAt'=>$rel['joinedAt']]));}
 hm58_fail('操作を確認してください。');
}
hm58_check_post();$raw=file_get_contents('php://input',false,null,0,8001);if($raw===false||strlen($raw)>8000)hm58_fail('送信内容が大きすぎます。',413);$body=json_decode($raw,true);if(!is_array($body))hm58_fail('入力内容を確認してください。');
hm58_limit('groups:'.$id,80,900);$lock=hm58_lock(hm58_dir().'/groups.lock.php');
if($action==='create'){
 $name=$body['name']??'';if(!is_string($name)||!preg_match('/^.{1,60}$/usD',$name)||preg_match('/[\p{C}]/u',$name)||trim($name)==='')hm58_fail('所属名は1〜60文字で入力してください。');
 $code=bin2hex(random_bytes(12));$g=['id'=>'g'.bin2hex(random_bytes(16)),'name'=>trim($name),'inviteCode'=>$code,'createdAt'=>gmdate('c'),'members'=>[$id=>['role'=>'admin','joinedAt'=>gmdate('c')]]];hg58_save($g);hm58_write(hm58_dir('invites').'/'.hash('sha256',$code).'.php',['groupId'=>$g['id']]);hg58_index($id,$g['id'],true);
}elseif($action==='join'){
 $code=$body['code']??'';if(!is_string($code))hm58_fail('招待コードを確認してください。');$code=strtolower(preg_replace('/[\s-]+/','',$code));if(!preg_match('/^[a-f0-9]{24}$/D',$code))hm58_fail('招待コードを確認してください。');$r=hm58_read(hm58_dir('invites').'/'.hash('sha256',$code).'.php');if(!$r)hm58_fail('招待コードを確認してください。',404);$g=hg58_group($r['groupId']);if(!hash_equals($g['inviteCode'],$code))hm58_fail('この招待コードは無効です。',404);if(!isset($g['members'][$id]))$g['members'][$id]=['role'=>'member','joinedAt'=>gmdate('c')];hg58_save($g);hg58_index($id,$g['id'],true);
}else{
 $g=hg58_group(is_string($body['groupId']??null)?$body['groupId']:'');
 if($action==='leave'){$target=$id;if(!isset($g['members'][$id]))hm58_fail('この所属のユーザーではありません。',403);}
 else{hg58_admin($g,$id);$target=is_string($body['memberId']??null)?$body['memberId']:'';}
 if($action==='rotate'){$g['inviteCode']=bin2hex(random_bytes(12));hg58_save($g);hm58_write(hm58_dir('invites').'/'.hash('sha256',$g['inviteCode']).'.php',['groupId'=>$g['id']]);}
 elseif(in_array($action,['leave','remove','role'],true)){
  if(!isset($g['members'][$target]))hm58_fail('所属ユーザーを確認してください。');$role=$body['role']??'member';if($action==='role'&&!in_array($role,['admin','member'],true))hm58_fail('権限を確認してください。');
  $admins=count(array_filter($g['members'],fn($m)=>$m['role']==='admin'));if($g['members'][$target]['role']==='admin'&&$admins===1&&($action!=='role'||$role!=='admin'))hm58_fail('先に別のユーザーを管理者に指定してください。');
  if($action==='role')$g['members'][$target]['role']=$role;else unset($g['members'][$target]);hg58_save($g);if($action!=='role')hg58_index($target,$g['id'],false);
 }else hm58_fail('操作を確認してください。');
}
hm58_unlock($lock);hg58_result(['groups'=>hg58_mine($id)]);
