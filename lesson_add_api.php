<?php
require_once __DIR__.'/api_response.php';
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_policy.php';
$saveActor=staffRequire(($_SERVER['REQUEST_METHOD']??'GET')!=='GET');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir=__DIR__.'/data';
$addFile=$dir.'/added_lessons.json';
$editFile=$dir.'/edited_lessons.json';
$ngFile=$dir.'/teacher_ng.json';

require_once __DIR__.'/teacher_shift.php';

if(!is_dir($dir)){
  if(!@mkdir($dir,0777,true) && !is_dir($dir)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE);
    exit;
  }
}

function readJson($file,$default){
 return readJsonStrict($file,$default);
}

function normalizeDateKey($v){
  $s=str_replace('/','-',trim((string)$v));
  if(preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})/',$s,$m)) return sprintf('%04d-%02d-%02d',(int)$m[1],(int)$m[2],(int)$m[3]);
  return $s;
}
function occurrenceKeyForRow($row){
  $subjects=preg_split('/[,、，]/u',(string)($row['科目']??''));
  $subjects=array_values(array_filter(array_map('trim',$subjects),function($v){return $v!=='';}));
  return implode('|',[normalizeDateKey($row['日付']??''),trim((string)($row['時間番号']??'')),trim((string)($row['クラス']??'')),trim((string)($row['担当講師']??'')),trim((string)($row['種別']??'')),implode('+',$subjects)]);
}
function syncNoteToState($dir,$row){
  $eventKey=occurrenceKeyForRow($row);
  if($eventKey==='|||||') return false;
  $file=$dir.'/class_state.json';
  $state=readJsonStrict($file);
  if(!is_array($state)) $state=[];
  $cur=(isset($state[$eventKey])&&is_array($state[$eventKey]))?$state[$eventKey]:[];
  $cur['publicNote']=(string)($row['備考']??'');
  $cur['updatedAt']=date('c');
  $state[$eventKey]=$cur;
  $tmp=$file.'.tmp';
  $json=json_encode($state,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
  return safeJsonWriteAtomic($file,$state);
}

function writeJson($file,$data){
 return safeJsonWriteAtomic($file,$data);
}

function saveRequestKey($id,$actor){
 if(!is_string($id)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$id))staffFail('保存操作の識別子が不正です',400);
 return hash('sha256',$actor['id']."\0".$id);
}
function saveIntent($row){$fields=['日付','クラス','種別','給与区分','担当講師','教室','時間番号','開始','終了','科目','備考'];$v=[];foreach($fields as $f)$v[$f]=(string)($row[$f]??'');return hash('sha256',json_encode($v,JSON_UNESCAPED_UNICODE));}
if($_SERVER['REQUEST_METHOD']==='GET'){
 if(isset($_GET['requestId'])||isset($_GET['sourceKey'])){
  require_once __DIR__.'/lesson_links.php';$found=null;$source=(string)($_GET['sourceKey']??'');
  if(isset($_GET['requestId'])){$receipt=saveRequestKey($_GET['requestId'],$saveActor);foreach(readJson($addFile,[]) as $r)if(($r['_saveRequest']??'')===$receipt){$source='ADD:'.$r['_追加ID'];break;}}
  if($source!=='')$found=lessonBySource($source);
  $state=$found?readJsonStrict($dir.'/class_state.json'):[];
  echo json_encode(['ok'=>true,'row'=>$found,'sourceKey'=>$source,'noteSynced'=>$found&&(($state[occurrenceKeyForRow($found)]['publicNote']??null)===(string)($found['備考']??''))],JSON_UNESCAPED_UNICODE);exit;
 }

  echo json_encode([
    'ok'=>true,
    'rows'=>readJson($addFile,[]),
    'edits'=>readJson($editFile,[])
  ],JSON_UNESCAPED_UNICODE);
  exit;
}

if($_SERVER['REQUEST_METHOD']!=='POST'){
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE);
  exit;
}

$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'JSON形式が不正です'],JSON_UNESCAPED_UNICODE);
  exit;
}

$action=(string)($in['action']??'add');
$row=is_array($in['row']??null)?$in['row']:[];

if($action==='delete'){
  $sourceKey=trim((string)($in['sourceKey']??''));
  if($sourceKey===''){
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'削除対象キーがありません'],JSON_UNESCAPED_UNICODE);
    exit;
  }

  require_once __DIR__.'/lesson_links.php';
  $original=lessonBySource($sourceKey);guardGroupedSource($sourceKey);if($original)guardFixedLesson(policyKey($original),$in);
  $edits=readJson($editFile,[]);
  $edits[$sourceKey]=['_deleted'=>true,'_削除日時'=>date('c')];
  if(!writeJson($editFile,$edits)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'授業を削除できません'],JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok'=>true,'sourceKey'=>$sourceKey],JSON_UNESCAPED_UNICODE);
  exit;
}

foreach(['日付','クラス','種別','時間番号'] as $required){
  if(trim((string)($row[$required]??''))===''){
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>$required.'が未入力です'],JSON_UNESCAPED_UNICODE);
    exit;
  }
}

$sourceKey=trim((string)($in['sourceKey']??''));
$receipt=null;
if($action==='add'&&isset($in['requestId'])){
 $receipt=saveRequestKey($in['requestId'],$saveActor);
 foreach(readJson($addFile,[]) as $prior)if(($prior['_saveRequest']??'')===$receipt){
  if(($prior['_saveIntent']??'')!==saveIntent($row))staffFail('同じ保存操作の内容が変わっています。保存状況を確認してください。',409);
  require_once __DIR__.'/lesson_links.php';$saved=lessonBySource('ADD:'.$prior['_追加ID']);
  if(!$saved||saveIntent($saved)!==saveIntent($row))staffFail('追加済みの授業が変更・削除されています。時間割で確認してください。',409);
  if(!syncNoteToState($dir,$saved))staffFail('授業は保存済みですが、連絡の同期に失敗しました。',500);
  echo json_encode(['ok'=>true,'row'=>$saved,'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;
 }
}
if($action==='update'){
 require_once __DIR__.'/lesson_links.php';$original=lessonBySource($sourceKey);
 if(isset($in['sourceVersion'])){$snapshot=$original;if($snapshot)$snapshot['_sourceKey']=$sourceKey;if(!$snapshot||!is_string($in['sourceVersion'])||!hash_equals(hash('sha256',json_encode($snapshot,JSON_UNESCAPED_UNICODE)),$in['sourceVersion']))staffFail('元の授業が変更されました。再読み込みして確認してください。',409);}
 if($original&&scheduleFieldsChanged($original,$row)){guardGroupedSource($sourceKey);guardFixedLesson(policyKey($original),$in);guardRoomSharing($row,$sourceKey,$in);}
}elseif($action==='add')guardRoomSharing($row,'',$in);
$overrideNg=!empty($in['overrideNg']);
if(!$overrideNg && ($conflict=teacherNgConflict($ngFile,$row))){
  http_response_code(409);
  $teacher=trim((string)($row['担当講師']??''));
  $date=normalizeNgDate($row['日付']??'');
  $slot=trim((string)($row['時間番号']??''));
  $note=trim((string)($conflict['note']??''));
  $msg='⚠ '.$teacher.'先生は '.$date.' '.$slot.' がNG登録されています。';
  if($note!=='') $msg.='（'.$note.'）';
  echo json_encode(['ok'=>false,'ngConflict'=>true,'error'=>$msg,'conflict'=>$conflict],JSON_UNESCAPED_UNICODE);
  exit;
}

if($action==='add'){
  $rows=readJson($addFile,[]);
  $row['_追加ID']='ADD-'.date('YmdHis').'-'.bin2hex(random_bytes(3));
  $row['_追加日時']=date('c');
  if($receipt!==null){$row['_saveRequest']=$receipt;$row['_saveIntent']=saveIntent($row);}
  $rows[]=$row;

  if(!writeJson($addFile,$rows)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'追加授業を保存できません'],JSON_UNESCAPED_UNICODE);
    exit;
  }

  if(!syncNoteToState($dir,$row)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'scheduleSaved'=>true,'row'=>$row,'error'=>'授業は保存されましたが、メッセージ同期に失敗しました'],JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok'=>true,'row'=>$row],JSON_UNESCAPED_UNICODE);
  exit;
}

if($action==='update'){
  $sourceKey=trim((string)($in['sourceKey']??''));
  if($sourceKey===''){
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'編集対象キーがありません'],JSON_UNESCAPED_UNICODE);
    exit;
  }

  require_once __DIR__.'/lesson_links.php';
  $oldRow=lessonBySource($sourceKey);
  if(!$oldRow) staffFail('授業が見つかりません。再読み込みしてください。',404);
  $edits=readJson($editFile,[]);
  $row['_sourceKey']=$sourceKey;
  $row['_編集日時']=date('c');
  $edits[$sourceKey]=$row;

  if(!saveLessonMove($oldRow,$row,$edits,$in)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'授業編集を保存できません'],JSON_UNESCAPED_UNICODE);
    exit;
  }

  if(!syncNoteToState($dir,$row)){
    http_response_code(500);
    echo json_encode(['ok'=>false,'scheduleSaved'=>true,'row'=>$row,'error'=>'授業は保存されましたが、メッセージ同期に失敗しました'],JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok'=>true,'row'=>$row,'sourceKey'=>$sourceKey],JSON_UNESCAPED_UNICODE);
  exit;
}

http_response_code(400);
echo json_encode(['ok'=>false,'error'=>'不明な操作です'],JSON_UNESCAPED_UNICODE);
?>