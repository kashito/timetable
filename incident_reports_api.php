<?php
require_once __DIR__.'/staff_security.php';$actor=staffRequire();
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
$file=__DIR__.'/data/incident_reports.php';$data=readJsonStrict($file,['schema'=>1,'reports'=>[]]);
if(!isset($data['reports'])||!is_array($data['reports']))staffFail('報告データの形式を確認してください。上書きせず停止しました。',500);
$reports=$data['reports'];
function irVisible($r,$actor){if(!empty($r['hidden'])&&$actor['role']!=='admin')return false;return ($r['visibility']??'private')==='staff'||$actor['role']==='admin'||($r['authorId']??'')===$actor['id'];}
function irEditable($r,$actor){return $actor['role']==='admin'||($r['authorId']??'')===$actor['id'];}
function irVersion($r){return hash('sha256',json_encode($r,JSON_UNESCAPED_UNICODE));}
function irText($in,$name,$max,$required=false){$value=$in[$name]??'';if(!is_string($value))staffFail('入力内容を確認してください',400);$value=trim($value);if(($required&&$value==='')||strlen($value)>$max)staffFail('必須項目と入力文字数を確認してください',400);return $value;}
function irChoice($in,$name,$values){$v=$in[$name]??null;if(!is_string($v)||!in_array($v,$values,true))staffFail('種類・対応状況・閲覧範囲を確認してください',400);return $v;}
function irFields($in){
 $when=irText($in,'occurredAt',16,true);$date=DateTimeImmutable::createFromFormat('!Y-m-d\TH:i',$when,new DateTimeZone('Asia/Tokyo'));
 if(!$date||$date->format('Y-m-d\TH:i')!==$when)staffFail('発生日時を確認してください',400);
 return ['title'=>irText($in,'title',480,true),'category'=>irChoice($in,'category',['trouble','visitor','parent','facility','other','tuition']),
  'occurredAt'=>$when,'location'=>irText($in,'location',600),'people'=>irText($in,'people',1200),'description'=>irText($in,'description',30000,true),'initialAction'=>irText($in,'initialAction',18000),
  'priority'=>irChoice($in,'priority',['normal','important']),'status'=>irChoice($in,'status',['open','in_progress','resolved','information']),'visibility'=>irChoice($in,'visibility',['staff','private'])];
}
function irToken($in){$token=$in['requestId']??'';if(!is_string($token)||!preg_match('/^[a-zA-Z0-9_-]{16,80}$/',$token))staffFail('画面を開き直してください',400);return $token;}
function irProjection($r,$actor,$detail=false){
 $out=array_intersect_key($r,array_flip(['id','title','category','occurredAt','location','people','description','initialAction','priority','status','visibility','authorId','author','createdAt','updatedAt','updatedBy']));
 $out['hidden']=!empty($r['hidden']);$out['read']=($GLOBALS['data']['reads'][$r['id']][$actor['id']]??'')===irVersion($r);$out['version']=irVersion($r);$out['canEdit']=irEditable($r,$actor)&&(($r['category']??'')!=='tuition'||$actor['role']==='admin');$out['commentCount']=count($r['comments']??[]);
 if($detail){$out['comments']=array_map(function($comment){unset($comment['requestId'],$comment['requestHash']);return $comment;},$r['comments']??[]);$out['history']=$r['history']??[];}
 else{preg_match('/\A.{0,160}/us',$r['description']??'',$m);$out['preview']=$m[0]??'';unset($out['description'],$out['initialAction']);}
 return $out;
}
if($_SERVER['REQUEST_METHOD']==='GET'){
 $id=(string)($_GET['id']??'');
 if($id!==''){if(!isset($reports[$id])||!irVisible($reports[$id],$actor))staffFail('報告が見つからないか、閲覧できません。',404);echo json_encode(['ok'=>true,'report'=>irProjection($reports[$id],$actor,true)],JSON_UNESCAPED_UNICODE);exit;}
 $visible=array_values(array_filter($reports,fn($r)=>irVisible($r,$actor)&&(empty($r['hidden'])||($actor['role']==='admin'&&($_GET['includeHidden']??'')==='1'))));
 $unread=count(array_filter($visible,fn($r)=>empty($r['hidden'])&&($data['reads'][$r['id']][$actor['id']]??'')!==irVersion($r)));if(!empty($_GET['countOnly'])){echo json_encode(['ok'=>true,'unread'=>$unread]);exit;}$counts=['total'=>count($visible),'open'=>0,'important'=>0];
 foreach($visible as $r){if(in_array($r['status'],['open','in_progress'],true)){$counts['open']++;if($r['priority']==='important')$counts['important']++;}}
 $q=trim((string)($_GET['q']??''));$category=(string)($_GET['category']??'');$status=(string)($_GET['status']??'');$from=(string)($_GET['from']??'');$to=(string)($_GET['to']??'');
 $list=array_values(array_filter($visible,function($r)use($q,$category,$status,$from,$to){
  if($category!==''&&$r['category']!==$category)return false;
  if($status==='pending'&&!in_array($r['status'],['open','in_progress'],true))return false;
  if($status!==''&&$status!=='pending'&&$r['status']!==$status)return false;
  $date=substr($r['occurredAt'],0,10);if(($from!==''&&$date<$from)||($to!==''&&$date>$to))return false;
  if($q!==''){$texts=[$r['title'],$r['description'],$r['initialAction'],$r['location'],$r['people'],$r['author']];foreach($r['comments']??[] as $comment)$texts[]=$comment['text'];if(stripos(implode(' ',$texts),$q)===false)return false;}
  return true;
 }));
 usort($list,fn($a,$b)=>strcmp($b['occurredAt'],$a['occurredAt'])?:strcmp($b['createdAt'],$a['createdAt'])?:strcmp($b['id'],$a['id']));$offset=max(0,(int)($_GET['offset']??0));$page=array_slice($list,$offset,30);
 echo json_encode(['ok'=>true,'items'=>array_map(fn($r)=>irProjection($r,$actor),$page),'total'=>count($list),'unread'=>$unread,'counts'=>$counts,'nextOffset'=>$offset+count($page),'hasMore'=>$offset+count($page)<count($list)],JSON_UNESCAPED_UNICODE);exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('Method not allowed',405);
$in=json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);
$action=$in['action']??'';$id=(string)($in['id']??'');$now=date('c');
if($action==='read'){
 if(!isset($reports[$id])||!irVisible($reports[$id],$actor))staffFail('閲覧できる報告がありません。',404);
 if(!hash_equals(irVersion($reports[$id]),(string)($in['version']??'')))staffFail('報告が更新されています。開き直してください。',409);
 $data['reads'][$id][$actor['id']]=irVersion($reports[$id]);if(!safeJsonWriteAtomic($file,$data))staffFail('既読を記録できませんでした。',500);
 echo json_encode(['ok'=>true]);exit;
}
if($action==='tuition'){
 $name=irText($in,'student',300,true);$dir=__DIR__.'/data';$students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$directory=readJsonStrict($dir.'/directory_state.json');
 if(!in_array($name,array_column($students,'生徒名'),true)||!empty($directory['hiddenStudents'][$name]))staffFail('参加中の生徒を選択してください。',400);
 $in=array_replace($in,['title'=>$name.'さんの月謝を預かりました','category'=>'tuition','occurredAt'=>date('Y-m-d\TH:i'),'location'=>'','people'=>$name,'description'=>$name.'さんの月謝を預かりました。管理者の確認をお願いします。','initialAction'=>'','priority'=>'normal','status'=>'open','visibility'=>'private']);$action='create';
}
if($action==='create'){
 $token=irToken($in);$fields=irFields($in);$requestHash=irVersion($fields);
 foreach($reports as $r)if(($r['requestId']??'')===$token&&($r['authorId']??'')===$actor['id']){if(($r['requestHash']??'')!==$requestHash)staffFail('前の送信は保存済みです。入力を残しています。一覧で保存済みの報告を確認してください。',409);echo json_encode(['ok'=>true,'report'=>irProjection($r,$actor,true),'duplicate'=>true],JSON_UNESCAPED_UNICODE);exit;}
 $id=bin2hex(random_bytes(12));$r=$fields+['id'=>$id,'authorId'=>$actor['id'],'author'=>$actor['name'],'createdAt'=>$now,'updatedAt'=>$now,'updatedBy'=>$actor['name'],'requestId'=>$token,'requestHash'=>$requestHash,'comments'=>[],
  'history'=>[['kind'=>'created','at'=>$now,'by'=>$actor['name'],'byId'=>$actor['id']]]];
}else{
 if(!isset($reports[$id])||!irVisible($reports[$id],$actor))staffFail('報告が見つからないか、閲覧できません。',404);
 $r=$reports[$id];
 if($action==='comment'){
  $token=irToken($in);$text=irText($in,'text',18000,true);$requestHash=hash('sha256',$text);foreach($r['comments']??[] as $comment)if(($comment['requestId']??'')===$token&&($comment['authorId']??'')===$actor['id']){if(($comment['requestHash']??'')!==$requestHash)staffFail('前の追記は保存済みです。再読み込みして確認してください。入力内容は残しています。',409);echo json_encode(['ok'=>true,'report'=>irProjection($r,$actor,true),'duplicate'=>true],JSON_UNESCAPED_UNICODE);exit;}
  $r['comments'][]=['id'=>bin2hex(random_bytes(12)),'text'=>$text,'authorId'=>$actor['id'],'author'=>$actor['name'],'createdAt'=>$now,'requestId'=>$token,'requestHash'=>$requestHash];
 }elseif($action==='visibility'){
  if($actor['role']!=='admin')staffFail('表示の変更は管理者のみ可能です。',403);
  if(!is_bool($in['hidden']??null))staffFail('表示状態を確認してください。',400);
  if(!hash_equals(irVersion($r),(string)($in['version']??'')))staffFail('報告が更新されています。再読み込みしてください。',409);
  $r['history'][]=['kind'=>'visibility','at'=>$now,'by'=>$actor['name'],'byId'=>$actor['id'],'changes'=>['hidden'=>['before'=>!empty($r['hidden']),'after'=>$in['hidden']]]];$r['hidden']=$in['hidden'];
 }elseif($action==='update'||$action==='status'){
  if(($r['category']??'')==='tuition'&&$actor['role']!=='admin')staffFail('月謝の預かり報告の確認・変更は管理者が行います。',403);
  if($action==='update'&&!irEditable($r,$actor))staffFail('報告本文の編集は報告者と管理者が行えます。',403);
  if(!hash_equals(irVersion($r),(string)($in['version']??'')))staffFail('ほかの先生が更新しました。再読み込みして確認してください。',409);
  $fields=$action==='update'?irFields($in):['status'=>irChoice($in,'status',['open','in_progress','resolved','information'])];
  $changes=[];foreach($fields as $field=>$value)if(($r[$field]??'')!==$value){$changes[$field]=['before'=>$r[$field]??'','after'=>$value];$r[$field]=$value;}
  if(!$changes){echo json_encode(['ok'=>true,'report'=>irProjection($r,$actor,true)],JSON_UNESCAPED_UNICODE);exit;}
  $r['history'][]=['kind'=>$action,'at'=>$now,'by'=>$actor['name'],'byId'=>$actor['id'],'changes'=>$changes];
 }else staffFail('不明な操作です',400);
 $r['updatedAt']=$now;$r['updatedBy']=$actor['name'];
}
$reports[$id]=$r;$data['reports']=$reports;
if(!safeJsonWriteAtomic($file,$data))staffFail('報告を保存できませんでした。入力内容を残しています。',500);
echo json_encode(['ok'=>true,'report'=>irProjection($r,$actor,true)],JSON_UNESCAPED_UNICODE);
