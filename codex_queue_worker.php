<?php
// Worker transport is SSH + PHP CLI only. No HTTP credential or remote command API.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$_SERVER['REQUEST_METHOD']='POST';
require_once __DIR__.'/codex_queue_lib.php';
try{
 $raw=stream_get_contents(STDIN,1024*1024+1);if(strlen($raw)>1024*1024)cqFail('Request too large');
 $in=json_decode($raw,true);if(!is_array($in)||!is_string($in['action']??null))cqFail('Invalid request');
 $out=cqWorker($in['action'],$in);echo json_encode($out,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
}catch(Throwable $e){echo json_encode(['ok'=>false,'error'=>$e->getMessage(),'code'=>(int)$e->getCode()],JSON_UNESCAPED_UNICODE);exit(1);}
