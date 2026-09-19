<?php
declare(strict_types=1);
if(!defined('HISTORY_MEMBER_API_V58')){http_response_code(404);exit;}
function hm58_fail(string $message,int $status=400): void {http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>false,'error'=>$message],JSON_UNESCAPED_UNICODE);exit;}
function hm58_dir(string $suffix=''): string {
 $dir=__DIR__.'/data/members-v58'.($suffix!==''?'/'.$suffix:'');
 if(!is_dir($dir)&&!@mkdir($dir,0750,true)&&!is_dir($dir))hm58_fail('ユーザー情報を保存できません。api/data の書き込み権限を確認してください。',503);
 return $dir;
}
function hm58_read(string $path): ?array {
 if(!is_file($path))return null;$bytes=file_get_contents($path);$prefix="<?php http_response_code(404); exit; ?>\n";
 if($bytes===false||substr($bytes,0,strlen($prefix))!==$prefix)hm58_fail('保存情報を読み込めません。',503);
 $r=json_decode(substr($bytes,strlen($prefix)),true);if(!is_array($r))hm58_fail('保存情報を読み込めません。',503);return $r;
}
function hm58_write(string $path,array $data): void {
 $tmp=dirname($path).'/pending-'.bin2hex(random_bytes(10)).'.php';
 if(file_put_contents($tmp,"<?php http_response_code(404); exit; ?>\n".json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))===false||!rename($tmp,$path)){@unlink($tmp);hm58_fail('ユーザー情報を保存できません。',503);}@chmod($path,0640);
}
function hm58_lock(string $path){$f=@fopen($path,'c+');if(!$f||!flock($f,LOCK_EX))hm58_fail('保存が混み合っています。もう一度お試しください。',503);return $f;}
function hm58_unlock($lock): void {flock($lock,LOCK_UN);fclose($lock);}
function hm58_cookie_path(): string {return rtrim(str_replace('\\','/',dirname(dirname($_SERVER['SCRIPT_NAME']??'/api/members.php'))),'/').'/';}
function hm58_cookie_name(string $kind): string {return 'history_member_'.$kind.'_'.substr(hash('sha256',hm58_cookie_path()),0,10);}
function hm58_set_cookie(string $kind,string $value,int $expires=0): void {setcookie(hm58_cookie_name($kind),$value,['expires'=>$expires,'path'=>hm58_cookie_path(),'secure'=>true,'httponly'=>true,'samesite'=>'Lax']);}
function hm58_csrf(): string {$token=$_COOKIE[hm58_cookie_name('csrf')]??'';if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token)){$token=bin2hex(random_bytes(32));hm58_set_cookie('csrf',$token);}return $token;}
function hm58_check_post(): void {
 if(($_SERVER['REQUEST_METHOD']??'')!=='POST')hm58_fail('POSTが必要です。',405);
 $origin=$_SERVER['HTTP_ORIGIN']??'';if($origin!==''&&strtolower(rtrim($origin,'/'))!=='https://'.strtolower($_SERVER['HTTP_HOST']??''))hm58_fail('送信元を確認してください。',403);
 if(($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site')hm58_fail('送信元を確認してください。',403);
 $cookie=$_COOKIE[hm58_cookie_name('csrf')]??'';$header=$_SERVER['HTTP_X_MEMBER_CSRF']??'';
 if(!is_string($cookie)||!preg_match('/^[a-f0-9]{64}$/D',$cookie)||!is_string($header)||!hash_equals($cookie,$header))hm58_fail('認証画面を開き直してください。',403);
}
function hm58_limit(string $scope,int $limit,int $seconds): void {
 $file=hm58_dir('limits').'/'.hash('sha256',$scope).'.php';$lock=hm58_lock($file.'.lock.php');$v=hm58_read($file)??['start'=>time(),'count'=>0];if(time()-$v['start']>=$seconds)$v=['start'=>time(),'count'=>0];
 if($v['count']>=$limit){hm58_unlock($lock);header('Retry-After: '.max(1,$seconds-(time()-$v['start'])));hm58_fail('試行回数が多いため、時間をおいてお試しください。',429);}$v['count']++;hm58_write($file,$v);hm58_unlock($lock);
}
function hm58_current(): ?array {
 $token=$_COOKIE[hm58_cookie_name('session')]??'';if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token))return null;
 $session=hm58_read(hm58_dir('sessions').'/'.hash('sha256',$token).'.php');if(!$session||($session['expires']??0)<=time()||!preg_match('/^m[a-f0-9]{32}$/D',$session['memberId']??''))return null;
 $member=hm58_read(hm58_dir('accounts').'/'.$session['memberId'].'.php');if(!$member||$member['authVersion']!==$session['authVersion'])return null;return $member;
}
function hm58_public(array $m): array {return ['id'=>$m['id'],'loginId'=>$m['loginId'],'displayName'=>$m['displayName'],'createdAt'=>$m['createdAt']];}
function hm58_login(array $m,bool $remember=false): void {$token=bin2hex(random_bytes(32));$expires=time()+($remember?2592000:43200);hm58_write(hm58_dir('sessions').'/'.hash('sha256',$token).'.php',['memberId'=>$m['id'],'authVersion'=>$m['authVersion'],'expires'=>$expires]);hm58_set_cookie('session',$token,$remember?$expires:0);}
function hm58_records_dir(string $id): string {if(!preg_match('/^m[a-f0-9]{32}$/D',$id))hm58_fail('ユーザー情報を確認してください。',401);return hm58_dir('records/'.$id);}
function hm58_records(array $m,array $query,?array $scope=null): array {
 $dir=hm58_records_dir($m['id']);$id=$query['id']??null;
 if($id!==null){if(!is_string($id)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$id))hm58_fail('記録IDを確認してください。');$row=hm58_read($dir.'/'.$id.'.php');if(!$row||($row['memberId']??null)!==$m['id']||($scope!==null&&!hg58_scope($row,$scope)))hm58_fail('記録が見つかりません。',404);return ['record'=>$row];}
 $since=$query['since']??'0';$until=$query['until']??(string)time();$cursor=$query['cursor']??'';
 if(!is_string($since)||!ctype_digit($since)||!is_string($until)||!ctype_digit($until)||!is_string($cursor)||($cursor!==''&&!preg_match('/^\d{10}:[a-zA-Z0-9-]{16,80}$/D',$cursor)))hm58_fail('記録の取得条件を確認してください。');
 $until=min(time(),(int)$until);$files=[];foreach(glob($dir.'/*.php')?:[] as $p){$base=basename($p,'.php');if(!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$base)||str_starts_with($base,'pending-'))continue;$mtime=(int)filemtime($p);if($mtime<(int)$since||$mtime>$until)continue;$key=sprintf('%010d',$mtime).':'.$base;if($cursor!==''&&strcmp($key,$cursor)<=0)continue;$files[$key]=$p;}ksort($files,SORT_STRING);
 $rows=[];$next=null;foreach(array_slice($files,0,100,true) as $k=>$p){$r=hm58_read($p);$next=$k;if(!$r||($r['memberId']??null)!==$m['id']||($scope!==null&&!hg58_scope($r,$scope)))continue;$r['hasHandwriting']=!empty($r['handwriting']['strokes']);$r['hasCardWork']=!empty($r['cardWork']);unset($r['handwriting'],$r['cardWork']);$rows[]=$r;$next=$k;}
 return ['records'=>$rows,'next'=>count($files)>100?$next:null,'until'=>$until];
}
