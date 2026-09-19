<?php
function snRespond($value,$flags=JSON_UNESCAPED_UNICODE){
 $json=json_encode($value,$flags);if($json===false)throw new RuntimeException('Shared-note response encoding failed');echo $json;
}
try {
require_once __DIR__.'/lesson_policy.php';$actor=staffRequire();header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');
$file=__DIR__.'/data/shared_notes.php';$data=readJsonStrict($file,['notes'=>[]]);if(!isset($data['notes'])||!is_array($data['notes']))dataError('先生共有メモの形式を確認してください。上書きせず停止しました。');
$directory=readJsonStrict(__DIR__.'/data/directory_state.json');
function snClass($s){global $directory;$seen=[];while(isset($directory['classNameAliases'][$s])&&!isset($seen[$s])){$seen[$s]=true;$s=$directory['classNameAliases'][$s];}return $s;}
function snVersion($r){unset($r['reads']);return hash('sha256',json_encode($r,JSON_UNESCAPED_UNICODE));}
function snText($in,$k,$max,$required=true){$s=$in[$k]??'';if(!is_string($s)||strlen($s)>$max||($required&&trim($s)===''))staffFail('入力内容・文字数を確認してください。',400);return trim($s);}
function snProjection($r){unset($r['requestId'],$r['requestHash']);$r['version']=snVersion($r);return snExtraProjection($r);}
require_once __DIR__.'/shared_notes_data.php';
if($_SERVER['REQUEST_METHOD']==='GET'&&isset($_GET['inbox'])){$items=snInbox();$unread=count(array_filter($items,fn($r)=>$r['unread']));$pending=count(array_filter($items,fn($r)=>$r['mine']&&$r['todo']&&empty($r['done'])));snRespond(['ok'=>true,'items'=>isset($_GET['countOnly'])?[]:$items,'unread'=>$unread,'pending'=>$pending,'staff'=>isset($_GET['countOnly'])?[]:snStaff()]);exit;}
if($_SERVER['REQUEST_METHOD']==='GET'&&isset($_GET['summary'])){$out=[];foreach($data['notes'] as $r){if(!empty($r['done']))continue;$cls=snClass($r['className']);$out[$cls]=($out[$cls]??0)+1;}snRespond(['ok'=>true,'counts'=>(object)$out],JSON_UNESCAPED_UNICODE);exit;}
$in=$_SERVER['REQUEST_METHOD']==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式を確認してください。',400);
$class=snClass(snText($in,'className',600));$exists=false;foreach(policyRows() as $r)if(snClass($r['クラス']??'')===$class){$exists=true;break;}
if(!$exists){$base=readJsonStrict(__DIR__.'/data/schedule_data.json');foreach(readJsonStrict(__DIR__.'/data/student_master.json',$base['students']??[]) as $r)if(snClass($r['クラス']??'')===$class){$exists=true;break;}}
if(!$exists)foreach($data['notes'] as $note)if(snClass($note['className'])===$class){$exists=true;break;}
if(!$exists)staffFail('クラスが見つかりません。詳細を開き直してください。',404);
// Older shared text is exposed as a virtual note; it is never overwritten or assigned a guessed author/time.
$legacy=[];$states=readJsonStrict(__DIR__.'/data/class_state.json');$memos=readJsonStrict(__DIR__.'/data/class_memos.json');
foreach($states as $key=>$st)if(strpos((string)$key,'__CLASS_MEMO__|')===0&&snClass(substr($key,15))===$class){$text=trim((string)($st['teacherMemo']??''));if($text!=='')$legacy[$text]=true;}
foreach($memos as $key=>$v)if(snClass((string)$key)===$class&&is_string($v)&&trim($v)!=='')$legacy[trim($v)]=true;
$virtual=[];foreach(array_keys($legacy) as $text){$text=(string)$text;$id='legacy_'.hash('sha256',$class.'|'.$text);$already=false;foreach($data['notes'] as $n)if(!empty($n['legacy'])&&snClass($n['className'])===$class&&$n['text']===$text){$already=true;break;}if(!$already)$virtual[$id]=['id'=>$id,'className'=>$class,'text'=>$text,'legacy'=>true,'author'=>null,'authorId'=>null,'createdAt'=>null,'done'=>false,'completionHistory'=>[]];}
function snList(){global $data,$virtual,$class;$out=[];foreach(array_merge($virtual,$data['notes']) as $r)if(snClass($r['className'])===$class)$out[]=snProjection($r);usort($out,fn($a,$b)=>(int)$a['done']<=>(int)$b['done']?:strcmp($b['createdAt']??'',$a['createdAt']??'')?:strcmp($b['id'],$a['id']));return $out;}
if($_SERVER['REQUEST_METHOD']==='GET'){snRespond(['ok'=>true,'className'=>$class,'notes'=>snList(),'staff'=>snStaff(),'classRecipients'=>snClassRecipients($class)],JSON_UNESCAPED_UNICODE);exit;}
if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('Method not allowed',405);
$action=snText($in,'action',20);$now=date('c');
if($action==='post'){
 $text=snText($in,'text',30000);$requestId=snText($in,'requestId',80);if(!preg_match('/^[a-zA-Z0-9_-]{16,80}$/',$requestId))staffFail('詳細を開き直してください。',400);$todo=$in['todo']??false;if(!is_bool($todo))staffFail('TODOの状態を確認してください。',400);$hash=hash('sha256',$class.'|'.$text.($todo?'|TODO|'.json_encode($in['assigneeIds']??null):''));
 foreach($data['notes'] as $n)if(($n['requestId']??'')===$requestId&&($n['authorId']??'')===$actor['id']){if(($n['requestHash']??'')!==$hash)staffFail('前の発言は保存済みです。一覧を確認してください。入力は残しています。',409);snRespond(['ok'=>true,'notes'=>snList(),'duplicate'=>true],JSON_UNESCAPED_UNICODE);exit;}
 $targets=$todo?snTargets($in,$class):snClassRecipients($class);$id=bin2hex(random_bytes(12));$data['notes'][$id]=['id'=>$id,'className'=>$class,'text'=>$text,'author'=>$actor['name'],'authorId'=>$actor['id'],'createdAt'=>$now,'done'=>false,'todo'=>$todo,'recipientIds'=>$targets,'recipientNames'=>snRecipientNames($targets),'reads'=>[$actor['id']=>$now],'completionHistory'=>[],'requestId'=>$requestId,'requestHash'=>$hash];
}elseif($action==='done'){
 $id=snText($in,'id',80);$r=$data['notes'][$id]??$virtual[$id]??null;if(!$r||snClass($r['className'])!==$class)staffFail('共有メモが見つかりません。',404);$done=$in['done']??null;if(!is_bool($done))staffFail('完了状態を確認してください。',400);
 if(!empty($r['todo'])&&!snExtraProjection($r)['canComplete'])staffFail('このTODOの担当者または管理者が完了を操作できます。');
 if($r['done']===$done){snRespond(['ok'=>true,'notes'=>snList()],JSON_UNESCAPED_UNICODE);exit;}
 if(!hash_equals(snProjection($r)['version'],snText($in,'version',64)))staffFail('完了状態が更新されました。再読み込みして確認してください。',409);
 $r['done']=$done;$r['completionHistory'][]=['done'=>$done,'at'=>$now,'by'=>$actor['name'],'byId'=>$actor['id']];$r['doneAt']=$done?$now:null;$r['doneBy']=$done?$actor['name']:null;$data['notes'][$id]=$r;unset($virtual[$id]);
}elseif($action==='read'||$action==='todo'){
 $id=snText($in,'id',80);$r=$data['notes'][$id]??$virtual[$id]??null;if(!$r||snClass($r['className'])!==$class)staffFail('共有メモが見つかりません。',404);
 if($action==='read'){if(!snMine($r))staffFail('自分宛てのメモを確認してください。');$r['reads'][$actor['id']]=$now;}
 else{if(!snCanManage($r))staffFail('投稿者または管理者がTODOを設定できます。');if(!empty($r['done']))staffFail('先に未完了・再表示に戻してください。',409);if(!hash_equals(snProjection($r)['version'],snText($in,'version',64)))staffFail('メモが更新されています。再読み込みしてください。',409);$todo=$in['todo']??null;if(!is_bool($todo))staffFail('TODOの状態を確認してください。',400);$targets=$todo?snTargets($in,$class):snClassRecipients($class);$r['todo']=$todo;$r['recipientIds']=$targets;$r['recipientNames']=snRecipientNames($targets);$r['reads']=[$actor['id']=>$now];$r['assignmentHistory'][]=['todo'=>$todo,'assigneeIds'=>$targets,'at'=>$now,'by'=>$actor['name'],'byId'=>$actor['id']];}
 $data['notes'][$id]=$r;unset($virtual[$id]);
}else staffFail('不明な操作です。',400);
if(!safeJsonWriteAtomic($file,$data))staffFail('共有メモを保存できませんでした。入力は残しています。',500);
snRespond(['ok'=>true,'notes'=>snList()],JSON_UNESCAPED_UNICODE);

}catch(Throwable $e){
 error_log('[shared_notes_api] '.get_class($e).' at '.basename($e->getFile()).':'.$e->getLine());
 http_response_code(500);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
 snRespond(['ok'=>false,'error'=>(($_SERVER['REQUEST_METHOD']??'GET')==='GET'?'共有メモを読み込めませんでした。':'共有メモの保存結果を確認できませんでした。').'入力を残して「共有メモを再読み込み」を押してください。繰り返す場合は管理者にお知らせください。（SN_SERVER）']);
}
