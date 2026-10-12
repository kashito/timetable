<?php
// Preserve JSON on runtime failures, including after a write. Never claim a
// failed response proves that the write was rolled back.
if (!defined('TIMETABLE_API_RESPONSE')) {
 define('TIMETABLE_API_RESPONSE', true);
 $GLOBALS['apiResponseReserve']=str_repeat(' ',65536);
 $apiResponseFailure=function($kind,$file='',$line=0) {
  $GLOBALS['apiResponseReserve']=null;
  $api=basename($_SERVER['SCRIPT_NAME']??'api');
  $ref=substr(hash('sha256',microtime(true).$api),0,12);
  error_log('Timetable API '.$ref.' '.$api.' '.$kind.' '.basename($file).':'.(int)$line);
  if(!headers_sent()){http_response_code(500);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');}
  return json_encode(['ok'=>false,'outcomeUnknown'=>($_SERVER['REQUEST_METHOD']??'GET')!=='GET','error'=>'サーバー応答を完了できませんでした。保存状況を確認してください。','reference'=>$ref]);
 };
 set_exception_handler(function($e)use($apiResponseFailure){if(ob_get_level())ob_clean();echo $apiResponseFailure(get_class($e),$e->getFile(),$e->getLine());});
 register_shutdown_function(function()use($apiResponseFailure){
  $fatal=error_get_last();
  if($fatal&&in_array($fatal['type'],[E_ERROR,E_PARSE,E_CORE_ERROR,E_COMPILE_ERROR],true)){
   $GLOBALS['apiResponseReserve']=null;
   $GLOBALS['apiResponseFatalHandled']=true;
   if(ob_get_level())ob_clean();
   echo $apiResponseFailure('fatal',$fatal['file'],$fatal['line']);
  }
 });
 ob_start(function($body)use($apiResponseFailure){
  $fatal=error_get_last();
  if(empty($GLOBALS['apiResponseFatalHandled'])&&$fatal&&in_array($fatal['type'],[E_ERROR,E_PARSE,E_CORE_ERROR,E_COMPILE_ERROR],true))return $apiResponseFailure('fatal',$fatal['file'],$fatal['line']);
  $trim=ltrim($body);
  if($trim===''||$trim[0]!=='{')return $apiResponseFailure('invalid-response');
  return $body;
 });
}
