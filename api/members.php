<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
define('HISTORY_MEMBER_API_V58',true);
require_once __DIR__.'/member-store-v58.php';
function hm58_result(array $data): void {echo json_encode(['ok'=>true]+$data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
$action=$_GET['action']??'session';
if($action==='session'&&($_SERVER['REQUEST_METHOD']??'')==='GET'){$csrf=hm58_csrf();$m=hm58_current();hm58_result(['member'=>$m?hm58_public($m):null,'csrf'=>$csrf]);}
if($action==='records'&&($_SERVER['REQUEST_METHOD']??'')==='GET'){$m=hm58_current();if(!$m)hm58_fail('ログインしてください。',401);hm58_result(hm58_records($m,$_GET));}
hm58_check_post();
$raw=file_get_contents('php://input',false,null,0,16001);if($raw===false||strlen($raw)>16000)hm58_fail('送信内容が大きすぎます。',413);$body=json_decode($raw,true);if(!is_array($body))hm58_fail('送信内容を確認してください。');
if($action==='logout'){$token=$_COOKIE[hm58_cookie_name('session')]??'';if(is_string($token)&&preg_match('/^[a-f0-9]{64}$/D',$token))@unlink(hm58_dir('sessions').'/'.hash('sha256',$token).'.php');hm58_set_cookie('session','',time()-3600);hm58_result(['member'=>null]);}
if(!in_array($action,['register','login','recover','password'],true))hm58_fail('操作を確認してください。');
$ip=$_SERVER['REMOTE_ADDR']??'unknown';hm58_limit('ip:'.$ip,200,900);
$login=$body['loginId']??'';if(!is_string($login)||!preg_match('/^[a-zA-Z0-9_-]{4,32}$/D',$login))hm58_fail('ログインIDは半角英数字・ハイフン・アンダーバーの4〜32文字です。');$login=strtolower($login);
$password=$body['password']??'';if(!is_string($password)||strlen($password)<10||strlen($password)>72||preg_match('/[^\x20-\x7E]/',$password))hm58_fail('パスワードは半角の10〜72文字です。');
hm58_limit('login:'.$login,15,900);
$index=hm58_dir('logins').'/'.hash('sha256',$login).'.php';
if($action==='register'){
 hm58_limit('register:'.$ip,60,3600);$name=$body['displayName']??'';if(!is_string($name)||!preg_match('/^.{1,20}$/usD',$name)||preg_match('/[\p{C}]/u',$name)||trim($name)==='')hm58_fail('表示名は1〜20文字で入力してください。');
 $hash=password_hash($password,PASSWORD_DEFAULT,['cost'=>12]);$recovery=bin2hex(random_bytes(24));
 $lock=hm58_lock(hm58_dir().'/register.lock.php');if(is_file($index)){hm58_unlock($lock);hm58_fail('このログインIDは利用できません。別のIDを指定してください。',409);}
 $m=['id'=>'m'.bin2hex(random_bytes(16)),'loginId'=>$login,'displayName'=>trim($name),'passwordHash'=>$hash,'recoveryHash'=>hash('sha256',$recovery),'authVersion'=>1,'createdAt'=>gmdate('c')];hm58_write(hm58_dir('accounts').'/'.$m['id'].'.php',$m);hm58_write($index,['id'=>$m['id']]);hm58_unlock($lock);hm58_login($m,($body['remember']??false)===true);hm58_result(['member'=>hm58_public($m),'recoveryCode'=>$recovery]);
}
$ref=hm58_read($index);$m=$ref?hm58_read(hm58_dir('accounts').'/'.$ref['id'].'.php'):null;
if($action==='login'){
 $hash=$m['passwordHash']??'$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
 if(!password_verify($password,$hash)||!$m)hm58_fail('ログインIDまたはパスワードを確認してください。',401);
 hm58_login($m,($body['remember']??false)===true);hm58_result(['member'=>hm58_public($m)]);
}
if(!$m)hm58_fail('入力内容を確認してください。',401);
$lock=hm58_lock(hm58_dir('accounts').'/'.$m['id'].'.lock.php');$m=hm58_read(hm58_dir('accounts').'/'.$m['id'].'.php');
if($action==='recover'){$code=$body['recoveryCode']??'';if(!is_string($code)||!preg_match('/^[a-f0-9]{48}$/D',$code)||!hash_equals($m['recoveryHash'],hash('sha256',$code)))hm58_fail('入力内容を確認してください。',401);}
else{$current=hm58_current();$old=$body['currentPassword']??'';if(!$current||$current['id']!==$m['id']||!is_string($old)||!password_verify($old,$m['passwordHash']))hm58_fail('現在のパスワードを確認してください。',401);}
$recovery=bin2hex(random_bytes(24));$m['passwordHash']=password_hash($password,PASSWORD_DEFAULT,['cost'=>12]);$m['recoveryHash']=hash('sha256',$recovery);$m['authVersion']++;hm58_write(hm58_dir('accounts').'/'.$m['id'].'.php',$m);hm58_unlock($lock);hm58_login($m,($body['remember']??false)===true);hm58_result(['member'=>hm58_public($m),'recoveryCode'=>$recovery]);
