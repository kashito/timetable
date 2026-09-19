<?php
require_once __DIR__.'/staff_security.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');staffSession();
function authOut($v){echo json_encode(array_merge(['ok'=>true],$v),JSON_UNESCAPED_UNICODE);exit;}
function passwordValid($s){return strlen($s)>=12 && strlen($s)<=72;}
$accounts=staffAccounts();
if(($_SERVER['REQUEST_METHOD']??'GET')==='GET'){
  $u=staffCurrent();$v=['user'=>$u,'csrf'=>$_SESSION['csrf'],'needsSetup'=>count($accounts)===0];
  if($u&&empty($u['mustChange']))$v['recordDisplay']=['teacherToneRules'=>staffSiteSettings()['teacherToneRules']];
  if($u&&$u['role']==='admin'&&($_GET['action']??'')==='accounts')$v['accounts']=array_values(array_map(function($a){return array_intersect_key($a,array_flip(['id','name','role','active','mustChange']));},$accounts));
  authOut($v);
}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')staffFail('Method not allowed',405);
staffCsrf();$in=json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);
$action=(string)($in['action']??'');
if($action==='login'||$action==='setup'){
  $local=in_array($_SERVER['SERVER_NAME']??'',['localhost','127.0.0.1','::1'],true);
  if(!$local&&(empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off'))staffFail('HTTPSのアドレスでログインしてください。',400);
  $rateFile=__DIR__.'/data/staff_login_attempts.php';$attempts=readJsonStrict($rateFile);$now=time();
  $ip=hash('sha256',(string)($_SERVER['REMOTE_ADDR']??''));
  $bucket=array_values(array_filter($attempts[$ip]??[],function($t)use($now){return $t>$now-900;}));
  if(count($bucket)>=15)staffFail('試行回数が多いため、15分待って再試行してください。',429);
  $id=trim((string)($in['id']??''));$pass=(string)($in['password']??'');$valid=false;
  if($action==='setup'){
    if(count($accounts)!==0)staffFail('初期設定は完了しています。',409);
    $hash=require __DIR__.'/staff_setup_key.php';
    $valid=hash_equals($hash,hash('sha256',(string)($in['setupKey']??'')))&&preg_match('/^[a-zA-Z0-9_.-]{3,40}$/',$id)&&passwordValid($pass);
    if($valid){
      $accounts[$id]=['id'=>$id,'name'=>staffSiteSettings(true)['initialAdminName'],'role'=>'admin','active'=>true,'version'=>1,'mustChange'=>false,'passwordHash'=>password_hash($pass,PASSWORD_DEFAULT)];
      if(!safeJsonWriteAtomic(__DIR__.'/data/staff_accounts.php',$accounts))staffFail('アカウントを保存できません',500);
    }
  }else{
    $u=$accounts[$id]??[];
    $valid=!empty($u['active'])&&password_verify($pass,$u['passwordHash']??'');
  }
  if(!$valid){$bucket[]=$now;$attempts[$ip]=$bucket;if(!safeJsonWriteAtomic($rateFile,$attempts))staffFail('ログイン保護情報を保存できません',500);staffFail('ID・パスワード・初期設定キーを確認してください。パスワードは12文字以上です。',401);}
  session_regenerate_id(true);$_SESSION['staffId']=$id;$_SESSION['staffVersion']=$accounts[$id]['version'];$_SESSION['loginAt']=$now;$_SESSION['csrf']=bin2hex(random_bytes(32));
  authOut(['user'=>staffCurrent(),'csrf'=>$_SESSION['csrf']]);
}
if($action==='logout'){$_SESSION=[];session_regenerate_id(true);authOut([]);}
$user=staffRequire();
if($action==='password'){
  $old=(string)($in['oldPassword']??'');$pass=(string)($in['password']??'');
  if(!password_verify($old,$accounts[$user['id']]['passwordHash'])||!passwordValid($pass))staffFail('現在のパスワードと新しい12～72バイトのパスワードを確認してください。',400);
  $a=&$accounts[$user['id']];$a['passwordHash']=password_hash($pass,PASSWORD_DEFAULT);$a['mustChange']=false;$a['version']++;
  if(!safeJsonWriteAtomic(__DIR__.'/data/staff_accounts.php',$accounts))staffFail('保存できません',500);
  $_SESSION['staffVersion']=$a['version'];session_regenerate_id(true);authOut(['user'=>staffCurrent()]);
}
staffRequire(true);
if($action==='demo_account'){
 $id='preview_'.bin2hex(random_bytes(4));$pass=bin2hex(random_bytes(12));
 $a=['id'=>$id,'name'=>'確認用講師（'.substr($id,-8).'）','role'=>'teacher','active'=>true,'version'=>1,'mustChange'=>false,'passwordHash'=>password_hash($pass,PASSWORD_DEFAULT),'createdBy'=>$user['id'],'createdAt'=>date('c')];
 $accounts[$id]=$a;if(!safeJsonWriteAtomic(__DIR__.'/data/staff_accounts.php',$accounts))staffFail('アカウントを保存できません。',500);
 authOut(['account'=>['id'=>$id,'name'=>$a['name'],'password'=>$pass]]);
}
$id=trim((string)($in['id']??''));
if(!preg_match('/^[a-zA-Z0-9_.-]{3,40}$/',$id))staffFail('IDは英数字・_・.・-の3～40文字で入力してください。',400);
if($action==='account'){
  $name=trim((string)($in['name']??''));$role=($in['role']??'teacher')==='admin'?'admin':'teacher';$pass=(string)($in['password']??'');
  if($name===''||(empty($accounts[$id])&&!passwordValid($pass))||($pass!==''&&!passwordValid($pass)))staffFail('先生名と12文字以上の仮パスワードを確認してください。',400);
  foreach($accounts as $otherId=>$a)if($otherId!==$id&&$a['name']===$name)staffFail('同じ先生名が登録済みです。',409);
  $a=$accounts[$id]??['id'=>$id,'version'=>0];$a['name']=$name;$a['role']=$role;$a['active']=!array_key_exists('active',$in)||!empty($in['active']);$a['version']++;
  if($id===$user['id']&&(!$a['active']||$role!=='admin'||$name!==$user['name']))staffFail('自分の管理者権限・名前・有効状態は変更できません。',400);
  if($pass!==''){$a['passwordHash']=password_hash($pass,PASSWORD_DEFAULT);$a['mustChange']=$id!==$user['id'];}
  $accounts[$id]=$a;
  if(!safeJsonWriteAtomic(__DIR__.'/data/staff_accounts.php',$accounts))staffFail('保存できません',500);
  if($id===$user['id'])$_SESSION['staffVersion']=$a['version'];authOut([]);
}
staffFail('不明な操作です',400);
