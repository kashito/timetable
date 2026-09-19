<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/staff_security.php';
if(!(($_SERVER['REQUEST_METHOD']??'GET')==='GET' && ($_GET['action']??'')==='homework')) $actor=staffRequire();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/data_safety.php';
$dir=__DIR__.'/data';
$file=$dir.'/lesson_records.json';
if(!is_dir($dir) && !@mkdir($dir,0775,true) && !is_dir($dir)){
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE); exit;
}
if(!file_exists($file)){ @file_put_contents($file,'{}'); @chmod($file,0664); }
function readRecords($file){return readJsonStrict($file);}
function nowIso(){ return date('c'); }
function uid($prefix='r'){ try{return $prefix.bin2hex(random_bytes(6));}catch(Throwable $e){return $prefix.uniqid();} }
function cleanText($v){ return trim((string)$v); }

if($_SERVER['REQUEST_METHOD']==='GET'){
  if(($_GET['action']??'')==='previous_homework'){staffRequire();require_once __DIR__.'/recording_context.php';echo json_encode(['ok'=>true]+recordingPreviousHomework((string)($_GET['key']??'')),JSON_UNESCAPED_UNICODE);exit;}
  $all=currentLessonEntries(readRecords($file));
  if(($_GET['action']??'')==='homework'){$all=groupRecordList($all,true);foreach($all as $k=>$r){$all[$k]=['homework'=>(string)($r['homework']??'')];} echo json_encode(['ok'=>true,'records'=>$all],JSON_UNESCAPED_UNICODE);exit;}
  $key=canonicalLessonKey(trim((string)($_GET['key']??'')));if($key==='')$all=groupRecordList($all);
  if($key!==''){ echo json_encode(['ok'=>true,'record'=>$all[$key]??[]],JSON_UNESCAPED_UNICODE); }
  else { $response=['ok'=>true,'records'=>$all];if(!empty($_GET['includeAttendance'])){require_once __DIR__.'/lesson_record_context.php';$response['attendance']=recordAttendanceContext($all);}if(!empty($_GET['includeTiming'])){require_once __DIR__.'/lesson_record_context.php';$response['timings']=recordLessonTimings($all);}echo json_encode($response,JSON_UNESCAPED_UNICODE); }
  exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST'){ http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE); exit; }
$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'JSON形式が不正です'],JSON_UNESCAPED_UNICODE); exit; }
$key=canonicalLessonKey(trim((string)($in['eventKey']??'')));
if($key===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'eventKeyがありません'],JSON_UNESCAPED_UNICODE); exit; }
$groupRows=policyRows();foreach(lessonGroups() as $group)if(!empty($group['active']))foreach(groupRows($group,$groupRows) as $gr)if(canonicalLessonKey(policyKey($gr))===$key)staffFail('この授業は連結中です。連結詳細の共通カルテから入力してください。',409);
$all=readRecords($file);
$action=trim((string)($in['action']??'save'));
$existing=(isset($all[$key]) && is_array($all[$key]))?$all[$key]:[];
require_once __DIR__.'/recording_context.php';foreach(['memo','homework'] as $field)if(array_key_exists($field,$in))recordingTbdGuard($in[$field],$existing[$field]??'');

if($action==='reaction'){
 if(!$existing)staffFail('カルテが見つかりません',404);
 $emoji=(string)($in['emoji']??'');$expected=(string)($in['expected']??'');$allowed=['','👍','❤️','😊','🙏'];
 if(!in_array($emoji,$allowed,true)||!in_array($expected,$allowed,true))staffFail('リアクションを確認してください',400);
 $replyId=(string)($in['replyId']??'');$target=&$existing;
 if($replyId!==''){$found=false;foreach($existing['replies']??[] as $index=>$reply)if(($reply['id']??'')===$replyId){$target=&$existing['replies'][$index];$found=true;break;}if(!$found)staffFail('返信が見つかりません。再読み込みしてください。',404);}
 $reactions=$target['reactions']??[];$current=$reactions[$actor['id']]['emoji']??'';
 if($current!==$emoji){
  if($current!==$expected)staffFail('あなたのリアクションが更新されています。表示を確認してもう一度押してください。',409);
  if($emoji==='')unset($reactions[$actor['id']]);else $reactions[$actor['id']]=['emoji'=>$emoji,'name'=>$actor['name'],'at'=>nowIso()];
  $target['reactions']=$reactions;unset($target);$all[$key]=$existing;
  if(!safeJsonWriteAtomic($file,$all))staffFail('リアクションを保存できません',500);
 }
 echo json_encode(['ok'=>true,'record'=>$existing],JSON_UNESCAPED_UNICODE);exit;
}

if($action==='edit'){
  if(!$existing){ http_response_code(404); echo json_encode(['ok'=>false,'error'=>'編集するカルテがありません'],JSON_UNESCAPED_UNICODE); exit; }
  $memo=cleanText($in['memo']??'');
  if($memo===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'カルテ本文を空欄にはできません'],JSON_UNESCAPED_UNICODE); exit; }
  $existing['memo']=$memo; $existing['editedBy']=$actor['name'];
  // カルテ一覧から宿題も同時に編集できる。空欄は『宿題なし』として保存。
  if(array_key_exists('homework',$in)) $existing['homework']=(string)$in['homework'];
  $existing['updatedAt']=nowIso();
  $all[$key]=$existing;
  if(!safeJsonWriteAtomic($file,$all)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'カルテ編集の保存に失敗しました'],JSON_UNESCAPED_UNICODE); exit; }
  echo json_encode(['ok'=>true,'record'=>$existing],JSON_UNESCAPED_UNICODE); exit;
}

if($action==='reply'){
  if(!$existing){ http_response_code(404); echo json_encode(['ok'=>false,'error'=>'返信先カルテがありません'],JSON_UNESCAPED_UNICODE); exit; }
  $text=cleanText($in['text']??'');
  $author=$actor['name'];
  if($text==='' || $author===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'返信内容と名前を入力してください'],JSON_UNESCAPED_UNICODE); exit; }
  $replies=(isset($existing['replies']) && is_array($existing['replies']))?$existing['replies']:[];
  $replies[]=['id'=>uid('rp_'),'author'=>$author,'role'=>'teacher','text'=>$text,'createdAt'=>nowIso()];
  $existing['replies']=$replies;
  $existing['updatedAt']=nowIso();
  $all[$key]=$existing;
  if(!safeJsonWriteAtomic($file,$all)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'返信の保存に失敗しました'],JSON_UNESCAPED_UNICODE); exit; }
  echo json_encode(['ok'=>true,'record'=>$existing],JSON_UNESCAPED_UNICODE); exit;
}

if($action==='read'){
  if(!$existing){ http_response_code(404); echo json_encode(['ok'=>false,'error'=>'カルテがありません'],JSON_UNESCAPED_UNICODE); exit; }
  $teacher=$actor['name'];
  if($teacher===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'先生名を選択してください'],JSON_UNESCAPED_UNICODE); exit; }
  $reads=(isset($existing['reads']) && is_array($existing['reads']))?$existing['reads']:[];
  $reads[$teacher]=['at'=>nowIso()];
  $existing['reads']=$reads;
  $all[$key]=$existing;
  if(!safeJsonWriteAtomic($file,$all)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'既読スタンプの保存に失敗しました'],JSON_UNESCAPED_UNICODE); exit; }
  echo json_encode(['ok'=>true,'record'=>$existing],JSON_UNESCAPED_UNICODE); exit;
}

$memo=(string)($in['memo']??($existing['memo']??''));
$homeworkProvided=array_key_exists('homework',$in);
$homework=(string)($homeworkProvided?$in['homework']:($existing['homework']??''));
// 明示的に宿題欄が送られてきた場合は、空欄への変更も保存する。
// これにより「宿題だけ登録していた記録」の宿題も消去できる。
// 何も送られていない空データだけは、従来どおり既存カルテを保護する。
if(trim($memo)==='' && trim($homework)==='' && !$homeworkProvided){
  if($existing){ echo json_encode(['ok'=>true,'record'=>$existing,'protected'=>true],JSON_UNESCAPED_UNICODE); }
  else { echo json_encode(['ok'=>true,'record'=>[]],JSON_UNESCAPED_UNICODE); }
  exit;
}
$record=$existing; if(!$existing) $record['author']=$actor['name'];
$record['eventKey']=$key;
$record['date']=(string)($in['date']??($existing['date']??''));
$record['slot']=(string)($in['slot']??($existing['slot']??''));
$record['className']=(string)($in['className']??($existing['className']??''));
$record['teacher']=(string)($in['teacher']??($existing['teacher']??''));
$record['room']=(string)($in['room']??($existing['room']??''));
$record['subject']=(string)($in['subject']??($existing['subject']??''));
if(trim($memo)==='' && trim((string)($existing['memo']??''))!=='') $memo=$existing['memo'];
$record['memo']=$memo;
if(empty($record['author'])) $record['author']=$existing['teacher']??$actor['name'];
$record['editedBy']=$actor['name'];
$record['homework']=$homework;
if(empty($record['createdAt'])) $record['createdAt']=nowIso();
$record['updatedAt']=nowIso();
if(!isset($record['replies']) || !is_array($record['replies'])) $record['replies']=[];
if(!isset($record['reads']) || !is_array($record['reads'])) $record['reads']=[];
$all[$key]=$record;
if(!safeJsonWriteAtomic($file,$all)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'保存に失敗しました'],JSON_UNESCAPED_UNICODE); exit; }
echo json_encode(['ok'=>true,'record'=>$record],JSON_UNESCAPED_UNICODE);
