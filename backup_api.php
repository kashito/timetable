<?php
require_once __DIR__.'/staff_security.php';
staffRequire(true);
header('Cache-Control: no-store');
$dataDir=__DIR__.'/data';
$backupDir=$dataDir.'/_system_backups';
if(!is_dir($dataDir) && !@mkdir($dataDir,0775,true) && !is_dir($dataDir)){ http_response_code(500); exit('data folder error'); }
if(!is_dir($backupDir) && !@mkdir($backupDir,0775,true) && !is_dir($backupDir)){ http_response_code(500); exit('backup folder error'); }
function safeName($s){ return preg_replace('/[^A-Za-z0-9_.-]/','',basename((string)$s)); }
function collectFiles($root){
  $out=[]; $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS));
  foreach($it as $f){
    if(!$f->isFile()) continue;
    $path=$f->getPathname(); $rel=str_replace('\\','/',substr($path,strlen($root)+1));
    if($rel==='.write.lock')continue;
    if(strpos($rel,'_system_backups/')===0 || strpos($rel,'_backup/')===0) continue;
    $out[]=[$path,$rel];
  }
  return $out;
}
$action=$_GET['action']??'';
if($action==='download'){
  $name=safeName($_GET['file']??''); $path=$backupDir.'/'.$name;
  if($name==='' || !is_file($path)){ http_response_code(404); exit('not found'); }
  header('Content-Type: application/zip'); header('Content-Length: '.filesize($path));
  header('Content-Disposition: attachment; filename="'.$name.'"');
  while(ob_get_level()) ob_end_clean(); readfile($path); exit;
}
header('Content-Type: application/json; charset=utf-8');
if($action==='list'){
  $items=[]; foreach(glob($backupDir.'/backup_*.zip')?:[] as $f){$items[]=['file'=>basename($f),'size'=>filesize($f),'time'=>date('c',filemtime($f))];}
  usort($items,function($a,$b){return strcmp($b['file'],$a['file']);});
  echo json_encode(['ok'=>true,'items'=>$items],JSON_UNESCAPED_UNICODE); exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST'){ http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE); exit; }
$stamp=date('Ymd_His').'_'.bin2hex(random_bytes(4));
$snapshotName='snapshot_'.$stamp; $snapshotDir=$backupDir.'/'.$snapshotName;
if(!@mkdir($snapshotDir,0775,true) && !is_dir($snapshotDir)){ echo json_encode(['ok'=>false,'error'=>'スナップショットフォルダを作成できません'],JSON_UNESCAPED_UNICODE); exit; }
foreach(collectFiles($dataDir) as [$src,$rel]){
  $dest=$snapshotDir.'/'.$rel; $dd=dirname($dest);
  if(!is_dir($dd)&&!@mkdir($dd,0775,true)&&!is_dir($dd))staffFail('バックアップ先を作成できません',500);
  if(!@copy($src,$dest)||filesize($src)!==filesize($dest))staffFail('バックアップ中にコピーできないファイルがありました。作成済み分を残して中止しました。',500);
  @chmod($dest,0664);
}
$name='backup_'.$stamp.'.zip'; $path=$backupDir.'/'.$name; $url='';
if(class_exists('ZipArchive')){
  $zip=new ZipArchive();
  if($zip->open($path,ZipArchive::CREATE|ZipArchive::EXCL)===true){
    foreach(collectFiles($snapshotDir) as [$src,$rel])if(!$zip->addFile($src,$rel))staffFail('ZIPにファイルを追加できません。スナップショットは残しています。',500);
    if(!$zip->close())staffFail('ZIPの保存に失敗しました。スナップショットは残しています。',500);
    @chmod($path,0664); $url='backup_api.php?action=download&file='.rawurlencode($name);
  }
}
echo json_encode(['ok'=>true,'file'=>$url?$name:$snapshotName,'url'=>$url,'snapshot'=>$snapshotName,'zipAvailable'=>$url!=='' ],JSON_UNESCAPED_UNICODE);
