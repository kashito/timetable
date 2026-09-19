<?php
require_once __DIR__.'/staff_security.php';
staffSession(); if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') staffCsrf();
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
require_once __DIR__ . '/data_safety.php';

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$uploadDir = $dataDir . DIRECTORY_SEPARATOR . 'student_uploads';
$metaFile = $dataDir . DIRECTORY_SEPARATOR . 'student_attachments.json';
if (!is_dir($dataDir)) @mkdir($dataDir, 0775, true);
if (!is_dir($uploadDir)) @mkdir($uploadDir, 0775, true);

function sa_read($file){
  if(!is_file($file)) return [];
  $v=readJsonStrict($file);
  return is_array($v)?$v:[];
}
function sa_out($v,$code=200){
  http_response_code($code); header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($v, JSON_UNESCAPED_UNICODE); exit;
}
function sa_clean_name($name){
  $name=preg_replace('/[\x00-\x1F\x7F]/u','',basename((string)$name));
  $name=preg_replace('~[\\/<>:"|?*]+~u','_',$name);
  return trim($name) ?: 'file';
}
function sa_can_delete($row){return !!staffCurrent()||(!empty($row['owner'])&&hash_equals($row['owner'],hash('sha256',$_SESSION['uploadOwner']??'')));}
function sa_public($row){
  return ['canDelete'=>sa_can_delete($row),'id'=>$row['id'],'key'=>$row['key'],'name'=>$row['name'],'stored'=>$row['stored']??'','size'=>$row['size']??0,'mime'=>$row['mime']??'application/octet-stream','uploadedAt'=>$row['uploadedAt']??'','sender'=>$row['sender']??'teacher','senderName'=>$row['senderName']??''];
}

$method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
$action=$_GET['action'] ?? ($_POST['action'] ?? 'list');
$rows=sa_read($metaFile);

if($method==='GET' && $action==='download'){
  $id=trim((string)($_GET['id']??''));
  foreach($rows as $row){
    if(($row['id']??'')!==$id) continue;
    $path=$uploadDir.DIRECTORY_SEPARATOR.($row['stored']??'');
    if(!is_file($path)){ http_response_code(404); exit('file not found'); }
    $name=sa_clean_name($row['name']??'download');
    $mime=(string)($row['mime']??'application/octet-stream');
    $ext=pathinfo($name,PATHINFO_EXTENSION);
    $ascii='download'.($ext?'.'.preg_replace('/[^A-Za-z0-9]+/','',$ext):'');
    while (ob_get_level() > 0) { @ob_end_clean(); }
    header('Content-Type: '.$mime);
    header('Content-Length: '.filesize($path));
    // Both filename= and filename*= are required for reliable names on iOS/Android/older browsers.
    header('Content-Disposition: attachment; filename="'.$ascii.'"; filename*=UTF-8\'\''.rawurlencode($name));
    header('Content-Transfer-Encoding: binary');
    header('X-Content-Type-Options: nosniff');
    header('Pragma: public');
    header('Expires: 0');
    $fp=@fopen($path,'rb'); if(!$fp){http_response_code(404);exit('file not found');} fpassthru($fp); fclose($fp); exit;
  }
  http_response_code(404); exit('file not found');
}

if($method==='GET' && $action==='all'){
  $map=[];
  foreach($rows as $row){ $k=(string)($row['key']??''); if($k!=='') $map[$k][]=sa_public($row); }
  sa_out(['ok'=>true,'attachments'=>$map]);
}

if($method==='GET'){
  $key=canonicalLessonKey(trim((string)($_GET['key']??'')));
  if($key==='') sa_out(['ok'=>false,'error'=>'key is required'],400);
  $items=[]; foreach($rows as $row) if(($row['key']??'')===$key) $items[]=sa_public($row);
  sa_out(['ok'=>true,'attachments'=>$items]);
}

if($method==='POST' && $action==='upload'){
  $key=canonicalLessonKey(trim((string)($_POST['key']??'')));
  if($key==='') sa_out(['ok'=>false,'error'=>'授業キーがありません'],400);
  if(!isset($_FILES['file'])) sa_out(['ok'=>false,'error'=>'ファイルを選択してください'],400);
  $f=$_FILES['file'];
  if(($f['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK) sa_out(['ok'=>false,'error'=>'アップロードに失敗しました'],400);
  $size=(int)($f['size']??0);
  if($size<=0 || $size>20*1024*1024) sa_out(['ok'=>false,'error'=>'ファイルは20MB以下にしてください'],400);
  $name=sa_clean_name($f['name']??'file');
  $ext=strtolower(pathinfo($name,PATHINFO_EXTENSION));
  $blocked=['php','phtml','phar','cgi','pl','py','sh','htaccess','htm','html','js','svg'];
  if(in_array($ext,$blocked,true)) sa_out(['ok'=>false,'error'=>'この種類のファイルはアップロードできません'],400);
  $mime='application/octet-stream';
  if(function_exists('finfo_open')){ $fi=finfo_open(FILEINFO_MIME_TYPE); if($fi){$m=finfo_file($fi,$f['tmp_name']); if($m)$mime=$m; if(PHP_VERSION_ID<80500)finfo_close($fi);} }
  if($ext===''){
    $mimeExt=['image/jpeg'=>'jpg','image/png'=>'png','image/gif'=>'gif','image/webp'=>'webp','application/pdf'=>'pdf'];
    if(isset($mimeExt[$mime])){ $ext=$mimeExt[$mime]; $name.='.'.$ext; }
  }
  $id=date('YmdHis').'_'.bin2hex(random_bytes(8));
  $stored=$id.($ext?'.'.$ext:'');
  $dest=$uploadDir.DIRECTORY_SEPARATOR.$stored;
  if(!move_uploaded_file($f['tmp_name'],$dest)) sa_out(['ok'=>false,'error'=>'ファイルを保存できませんでした'],500);
  @chmod($dest,0664);
  $active=staffCurrent();$sender=$active?'teacher':'student';
  $senderName=trim(preg_replace('/[\x00-\x1F\x7F]/u','',(string)($_POST['senderName']??'')));
  if($active)$senderName=$active['name'];
  if(strlen($senderName)>240) $senderName=substr($senderName,0,240);
  $row=['owner'=>hash('sha256',$_SESSION['uploadOwner']),'id'=>$id,'key'=>$key,'name'=>$name,'stored'=>$stored,'size'=>$size,'mime'=>$mime,'uploadedAt'=>date(DATE_ATOM),'sender'=>$sender,'senderName'=>$senderName];
  $rows[]=$row;
  if(!safeJsonWriteAtomic($metaFile,$rows)){ @unlink($dest); sa_out(['ok'=>false,'error'=>'添付情報を保存できませんでした'],500); }
  sa_out(['ok'=>true,'attachment'=>sa_public($row)]);
}

if($method==='POST' && $action==='delete'){
  $raw=json_decode(file_get_contents('php://input')?:'{}',true); if(!is_array($raw))$raw=[];
  $id=trim((string)($raw['id']??'')); $key=trim((string)($raw['key']??''));
  $next=[];$found=null;
  foreach($rows as $row){ if((($row['id']??'')===$id) && ($key===''||($row['key']??'')===$key)){$found=$row;continue;} $next[]=$row; }
  if(!$found) sa_out(['ok'=>false,'error'=>'添付ファイルが見つかりません'],404);
  if(!sa_can_delete($found))staffFail('この端末から送信した資料だけ削除できます。過去の資料は先生に依頼してください。');
  if(!safeJsonWriteAtomic($metaFile,$next)) sa_out(['ok'=>false,'error'=>'削除情報を保存できませんでした'],500);
  $path=$uploadDir.DIRECTORY_SEPARATOR.($found['stored']??''); if(is_file($path)){ $trash=$dataDir.DIRECTORY_SEPARATOR.'_backup'.DIRECTORY_SEPARATOR.'student_uploads'; if(!is_dir($trash)) @mkdir($trash,0775,true); @rename($path,$trash.DIRECTORY_SEPARATOR.date('Ymd_His').'_'.basename($path)); }
  sa_out(['ok'=>true]);
}
sa_out(['ok'=>false,'error'=>'method not allowed'],405);
