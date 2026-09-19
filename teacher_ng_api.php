<?php
require_once __DIR__.'/staff_security.php';
$actor=staffRequire();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/data_safety.php';
$dir=__DIR__.'/data';
$file=$dir.'/teacher_ng.json';
if(!is_dir($dir) && !@mkdir($dir,0777,true) && !is_dir($dir)){
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE); exit;
}
function ngRead($file){return array_values(readJsonStrict($file));}
function ngVisible($list){global $actor;return $actor['role']==='admin'?array_values($list):array_values(array_filter($list,fn($e)=>($e['teacher']??'')===$actor['name']));}
function ngDate($v){ $s=str_replace('/','-',trim((string)$v)); if(preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})/',$s,$m)) return sprintf('%04d-%02d-%02d',(int)$m[1],(int)$m[2],(int)$m[3]); return ''; }
$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
if($_SERVER['REQUEST_METHOD']==='GET'){
  echo json_encode(['ok'=>true,'entries'=>ngVisible(ngRead($file))],JSON_UNESCAPED_UNICODE); exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST'){ http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE); exit; }
$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'JSON形式が不正です'],JSON_UNESCAPED_UNICODE); exit; }
if($actor['role']!=='admin'){
 if(isset($in['teacher']) && $in['teacher']!==$actor['name'])staffFail('自分の勤務予定だけ変更できます。');
 $in['teacher']=$actor['name'];
}
$action=(string)($in['action']??'save'); $list=ngRead($file); $beforeNg=$list;
function ngSave($file,$list){
 global $beforeNg,$actor;
 $changes=[$file=>$list];$requests=readJsonStrict(__DIR__.'/data/staff_requests.json');$today=date('Y-m-d');$limit=date('Y-m-d',strtotime('+7 days'));
 $dates=[];foreach(array_merge($beforeNg,$list)as $e)if(($e['date']??'')>=$today&&($e['date']??'')<=$limit)$dates[($e['teacher']??'').'|'.$e['date']]=[$e['teacher'],$e['date']];
 $notified=false;
 foreach($dates as [$teacher,$date]){
  $describe=function($items)use($teacher,$date){foreach($items as $e)if(($e['teacher']??'')===$teacher&&($e['date']??'')===$date)return (!empty($e['allDay'])?'終日NG':implode('・',$e['slots']??[]).' NG').' '.($e['note']??'');return '全コマOK';};
  $old=$describe($beforeNg);$new=$describe($list);
  if($old!==$new && $actor['role']!=='admin'){
   $id=bin2hex(random_bytes(12));$requests[$id]=['id'=>$id,'kind'=>'ng_change','targetRole'=>'admin','text'=>$teacher.'先生 / '.$date."\n変更前：".$old."\n変更後：".$new,'className'=>'','author'=>$actor['name'],'authorId'=>$actor['id'],'createdAt'=>date('c'),'done'=>false];$notified=true;
  }
 }
 if($notified)$changes[__DIR__.'/data/staff_requests.json']=$requests;
 require_once __DIR__.'/lesson_links.php';$GLOBALS['ngNotified']=$notified;return safeDataTransaction($changes);
}
if($action==='grid'){
 $teacher=trim((string)($in['teacher']??''));$days=$in['days']??null;
 if($teacher===''||!is_array($days)||count($days)<1||count($days)>366)staffFail('先生と表示期間を確認してください。',400);
 foreach($days as $d){
  $date=ngDate($d['date']??'');if($date==='')staffFail('日付が不正です',400);
  $selected=array_values(array_intersect($slots,is_array($d['slots']??null)?$d['slots']:[]));
  $list=array_values(array_filter($list,function($e)use($teacher,$date){return !(($e['teacher']??'')===$teacher&&($e['date']??'')===$date);}));
  if(count($selected))$list[]=['id'=>'NG-'.bin2hex(random_bytes(8)),'teacher'=>$teacher,'date'=>$date,'allDay'=>count($selected)===11,'slots'=>count($selected)===11?[]:$selected,'note'=>trim((string)($d['note']??'')),'updatedAt'=>date('c'),'updatedBy'=>$actor['name']];
 }
 if(!ngSave($file,$list))staffFail('保存に失敗しました',500);
 echo json_encode(['ok'=>true,'entries'=>ngVisible($list),'notified'=>$GLOBALS['ngNotified']??false],JSON_UNESCAPED_UNICODE);exit;
}



if($action==='batch_dates'){
  $teacher=trim((string)($in['teacher']??''));
  $datesRaw=is_array($in['dates']??null)?$in['dates']:[];
  $note=trim((string)($in['note']??''));
  $dates=[];
  foreach($datesRaw as $v){ $d=ngDate($v); if($d!=='') $dates[$d]=true; }
  $dates=array_keys($dates); sort($dates);
  if($teacher===''||!$dates){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'講師とNG日を選択してください'],JSON_UNESCAPED_UNICODE); exit; }
  if(count($dates)>366){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'一括登録は366日以内にしてください'],JSON_UNESCAPED_UNICODE); exit; }
  $count=0;
  foreach($dates as $date){
    $existing=null;
    foreach($list as $i=>$e){ if((string)($e['teacher']??'')===$teacher && ngDate($e['date']??'')===$date){ $existing=$i; break; } }
    $entry=['id'=>$existing!==null?(string)($list[$existing]['id']??'NG-'.bin2hex(random_bytes(5))):'NG-'.bin2hex(random_bytes(5)),'teacher'=>$teacher,'date'=>$date,'allDay'=>true,'slots'=>[],'note'=>$note,'updatedAt'=>date('c')];
    if($existing===null) $list[]=$entry; else $list[$existing]=$entry;
    $count++;
  }
  usort($list,function($a,$b){ $d=strcmp((string)($a['date']??''),(string)($b['date']??'')); return $d?:strcmp((string)($a['teacher']??''),(string)($b['teacher']??'')); });
  if(!ngSave($file,$list)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'NG設定を保存できません'],JSON_UNESCAPED_UNICODE); exit; }
  echo json_encode(['ok'=>true,'count'=>$count,'entries'=>ngVisible($list)],JSON_UNESCAPED_UNICODE); exit;
}

if($action==='batch_allday'){
  $teacher=trim((string)($in['teacher']??''));
  $start=ngDate($in['startDate']??'');
  $end=ngDate($in['endDate']??'');
  $note=trim((string)($in['note']??''));
  if($teacher===''||$start===''||$end===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'講師・開始日・終了日は必須です'],JSON_UNESCAPED_UNICODE); exit; }
  if($end<$start){ $tmp=$start; $start=$end; $end=$tmp; }
  try{ $d1=new DateTimeImmutable($start); $d2=new DateTimeImmutable($end); }catch(Exception $e){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'日付が不正です'],JSON_UNESCAPED_UNICODE); exit; }
  $days=(int)$d1->diff($d2)->format('%a')+1;
  if($days>366){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'一括登録は366日以内にしてください'],JSON_UNESCAPED_UNICODE); exit; }
  $count=0;
  for($d=$d1;$d<=$d2;$d=$d->modify('+1 day')){
    $date=$d->format('Y-m-d'); $existing=null;
    foreach($list as $i=>$e){ if((string)($e['teacher']??'')===$teacher && ngDate($e['date']??'')===$date){ $existing=$i; break; } }
    $entry=['id'=>$existing!==null?(string)($list[$existing]['id']??'NG-'.bin2hex(random_bytes(5))):'NG-'.bin2hex(random_bytes(5)),'teacher'=>$teacher,'date'=>$date,'allDay'=>true,'slots'=>[],'note'=>$note,'updatedAt'=>date('c')];
    if($existing===null) $list[]=$entry; else $list[$existing]=$entry;
    $count++;
  }
  usort($list,function($a,$b){ $d=strcmp((string)($a['date']??''),(string)($b['date']??'')); return $d?:strcmp((string)($a['teacher']??''),(string)($b['teacher']??'')); });
  if(!ngSave($file,$list)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'NG設定を保存できません'],JSON_UNESCAPED_UNICODE); exit; }
  echo json_encode(['ok'=>true,'count'=>$count,'entries'=>ngVisible($list)],JSON_UNESCAPED_UNICODE); exit;
}
if($action==='delete'){
  $id=trim((string)($in['id']??'')); if($actor['role']!=='admin'){foreach($list as $e)if(($e['id']??'')===$id&&($e['teacher']??'')!==$actor['name'])staffFail('自分のNGだけ削除できます。');} $list=array_values(array_filter($list,fn($e)=>(string)($e['id']??'')!==$id));
  if(!ngSave($file,$list)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'NG設定を保存できません'],JSON_UNESCAPED_UNICODE); exit; }
  echo json_encode(['ok'=>true,'entries'=>ngVisible($list)],JSON_UNESCAPED_UNICODE); exit;
}
$teacher=trim((string)($in['teacher']??'')); $date=ngDate($in['date']??''); $allDay=!empty($in['allDay']);
$selected=is_array($in['slots']??null)?array_values(array_intersect($slots,array_map('strval',$in['slots']))):[];
$note=trim((string)($in['note']??''));
if($teacher===''||$date===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'講師と日付は必須です'],JSON_UNESCAPED_UNICODE); exit; }
if(!$allDay && !$selected){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'終日NGまたはNGコマを選択してください'],JSON_UNESCAPED_UNICODE); exit; }
// same teacher/date is one record: overwrite so management stays simple
$existing=null; foreach($list as $i=>$e){ if((string)($e['teacher']??'')===$teacher && ngDate($e['date']??'')===$date){ $existing=$i; break; } }
$entry=['id'=>$existing!==null?(string)($list[$existing]['id']??'NG-'.bin2hex(random_bytes(5))):'NG-'.bin2hex(random_bytes(5)),'teacher'=>$teacher,'date'=>$date,'allDay'=>$allDay,'slots'=>$allDay?[]:$selected,'note'=>$note,'updatedAt'=>date('c')];
if($existing===null) $list[]=$entry; else $list[$existing]=$entry;
usort($list,function($a,$b){ $d=strcmp((string)($a['date']??''),(string)($b['date']??'')); return $d?:strcmp((string)($a['teacher']??''),(string)($b['teacher']??'')); });
if(!ngSave($file,$list)){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'NG設定を保存できません'],JSON_UNESCAPED_UNICODE); exit; }
echo json_encode(['ok'=>true,'entry'=>$entry,'entries'=>ngVisible($list)],JSON_UNESCAPED_UNICODE);
?>
