<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
function hc61_respond(array $data,int $code=200): void {http_response_code($code);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
$method=$_SERVER['REQUEST_METHOD']??'';if(!in_array($method,['GET','POST'],true))hc61_respond(['ok'=>false,'error'=>'通信方法を確認してください。'],405);
$origin=$_SERVER['HTTP_ORIGIN']??'';if($origin!==''){$host=parse_url($origin,PHP_URL_HOST);$actual=preg_replace('/:\d+$/','',$_SERVER['HTTP_HOST']??'');if(!$host||strcasecmp($host,$actual)!==0)hc61_respond(['ok'=>false,'error'=>'送信元を確認してください。'],403);}
define('HISTORY_CARD_STATS_V61',true);require_once __DIR__.'/card-stats-store-v61.php';
try{
 if($method==='POST'){
  if((int)($_SERVER['CONTENT_LENGTH']??0)>5000)hc61_respond(['ok'=>false,'error'=>'送信内容が大きすぎます。'],413);
  $raw=file_get_contents('php://input',false,null,0,5001);if($raw===false||strlen($raw)>5000)hc61_respond(['ok'=>false,'error'=>'送信内容が大きすぎます。'],413);
  $r=json_decode($raw,true);if(!is_array($r)||!is_string($r['id']??null)||!preg_match('/^[A-Za-z0-9-]{16,80}$/D',$r['id']))hc61_respond(['ok'=>false,'error'=>'出題の識別情報を確認してください。'],400);
  if(isset($r['memberId'])){define('HISTORY_MEMBER_API_V58',true);require_once __DIR__.'/member-store-v58.php';hm58_check_post();$member=hm58_current();if(!$member||$member['id']!==$r['memberId'])hc61_respond(['ok'=>false,'error'=>'ユーザーを確認してください。'],401);$scope='member:'.$member['id'];}
  else{$key=$_SERVER['HTTP_X_LEARNING_KEY']??'';if(!is_string($key)||!preg_match('/^[a-f0-9]{64}$/D',$key))hc61_respond(['ok'=>false,'error'=>'出題の識別情報がありません。'],401);$scope='visitor:'.hash('sha256',$key);}
  $question=$r['questionId']??null;$fingerprint=$r['questionFingerprint']??null;
 }else{$question=$_GET['questionId']??null;$fingerprint=$_GET['questionFingerprint']??null;}
 if(!is_string($question)||!preg_match('/^[A-Za-z0-9-]{3,100}$/D',$question)||!is_string($fingerprint)||!preg_match('/^q53-[a-f0-9]{8}$/D',$fingerprint))hc61_respond(['ok'=>false,'error'=>'問題の識別情報を確認してください。'],400);
 if($method==='POST'){hc61_add(['answerMode'=>'cards','id'=>$r['id'],'questionId'=>$question,'questionFingerprint'=>$fingerprint],$scope,true);hc61_respond(['ok'=>true]);}
 $complete=hc61_backfill();hc61_respond(['ok'=>true,'complete'=>$complete,'stats'=>$complete?hc61_summary($question,$fingerprint):null]);
}catch(Throwable $e){hc61_respond(['ok'=>false,'error'=>'集計を取得できません。再接続してください。'],503);}
