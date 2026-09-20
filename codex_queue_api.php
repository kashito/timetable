<?php
require_once __DIR__.'/staff_security.php';
$actor=staffRequire(true);
header('Cache-Control: private, no-store');header('Vary: Cookie');header('X-Content-Type-Options: nosniff');header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/codex_queue_lib.php';
try{
 $method=$_SERVER['REQUEST_METHOD']??'GET';if(!in_array($method,['GET','POST'],true))cqFail('Method not allowed',405);
 $raw=$method==='POST'?file_get_contents('php://input'):'';if(strlen($raw)>32000)cqFail('入力が長すぎます。');
 $in=$method==='GET'?$_GET:json_decode($raw,true);if(!is_array($in))cqFail('JSON形式で送信してください。');
 $action=$in['action']??'list';if(!is_string($action)||($method==='GET'&&$action!=='list'))cqFail('操作を確認してください。',405);
 echo json_encode(cqAdmin($action,$in,$actor),JSON_UNESCAPED_UNICODE);
}catch(Throwable $e){$code=(int)$e->getCode();$code=in_array($code,[400,404,409,405],true)?$code:500;http_response_code($code);echo json_encode(['ok'=>false,'error'=>$code===500?'キューを処理できませんでした。既存データは保持しています。':$e->getMessage()],JSON_UNESCAPED_UNICODE);}
