<?php
// Shared lock protects the entire read/modify/write operation across APIs.
date_default_timezone_set('Asia/Tokyo');
function dataError($message) {
  http_response_code(500); header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok'=>false,'error'=>$message],JSON_UNESCAPED_UNICODE); exit;
}
function readJsonStrict($file,$default=[]) {
  if(!file_exists($file)) return $default;
  $raw=@file_get_contents($file);
  if($raw===false) dataError('既存データを読み込めないため中止しました：'.basename($file));
  if(substr($raw,0,14)==='<?php exit; ?>') $raw=substr($raw,14);
  $value=json_decode($raw,true);
  if(json_last_error()!==JSON_ERROR_NONE || !is_array($value)) dataError('既存JSONに問題があるため上書きを中止しました：'.basename($file));
  return $value;
}
function safeDataBackup($file) {
  if(!is_file($file)) return true;
  if(!is_readable($file)) return false;
  $dir=dirname($file).'/_backup';
  if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)) return false;
  $dest=$dir.'/'.basename($file).'.'.date('Ymd_His').'.'.bin2hex(random_bytes(6)).(substr($file,-4)==='.php'?'.bak.php':'.bak');
  if(!@copy($file,$dest)) return false;
  @chmod($dest,0664); return true; // Never delete old snapshots automatically.
}
function safeJsonWriteAtomic($file,$value) {
  $json=json_encode($value,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
  if($json===false) return false;
  if(is_file($file)) readJsonStrict($file);
  if(!safeDataBackup($file)) return false;
  if(substr($file,-4)==='.php') $json="<?php exit; ?>\n".$json;
  $tmp=$file.'.tmp.'.bin2hex(random_bytes(8));
  if(@file_put_contents($tmp,$json,LOCK_EX)!==strlen($json)){@unlink($tmp);return false;}
  if(!@rename($tmp,$file)){@unlink($tmp);return false;}
  @chmod($file,0664);return true;
}
function canonicalLessonKey($key) {
  $aliases=readJsonStrict(__DIR__.'/data/lesson_key_aliases.json');$seen=[];
  while(isset($aliases[$key]) && !isset($seen[$key])){$seen[$key]=true;$key=(string)$aliases[$key];}
  return $key;
}
function currentLessonEntries($entries) {
  $out=[];foreach($entries as $key=>$value) if(canonicalLessonKey((string)$key)===(string)$key) $out[$key]=$value;
  return $out;
}
if(!isset($GLOBALS['timetableDataLock'])) {
  $dir=__DIR__.'/data';
  if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)) dataError('dataフォルダを作成できません');
  $handle=@fopen($dir.'/.write.lock','c');
  if(!$handle || !flock($handle,($_SERVER['REQUEST_METHOD']??'GET')==='GET'?LOCK_SH:LOCK_EX)) dataError('データ保護のロックを取得できません');
  $GLOBALS['timetableDataLock']=$handle;
  register_shutdown_function(function()use($handle){flock($handle,LOCK_UN);fclose($handle);});
}
