<?php
// Repeat a saved lesson (or its complete linked group) on selected dates.
// Validate the entire batch under the shared data lock before writing anything.
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!in_array($method,['GET','POST'],true))staffFail('Method not allowed',405);
$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);
if(!is_array($in)||!is_string($in['sourceKey']??null)||$in['sourceKey']==='')staffFail('元の授業を確認してください。',400);
$source=$in['sourceKey'];$dir=__DIR__.'/data';$added=readJsonStrict($dir.'/added_lessons.json');$dates=[];
if($method==='POST'){
 $dates=$in['dates']??null;$requestId=$in['requestId']??null;$version=$in['version']??null;
 if(!is_array($dates)||count($dates)<1||count($dates)>31||array_keys($dates)!==range(0,count($dates)-1)||!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId)||!is_string($version))staffFail('配置する日付を1～31日選んでください。',400);
 foreach($dates as $date)if(!is_string($date)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))staffFail('日付を確認してください。',400);
 if(count(array_unique($dates))!==count($dates))staffFail('同じ日付が複数選ばれています。',400);
 sort($dates);
 $hash=hash('sha256',json_encode([$actor['id'],$source,$version,$dates],JSON_UNESCAPED_UNICODE));
 $retry=array_values(array_filter($added,fn($r)=>($r['_連続配置要求ID']??'')===$requestId));
 if($retry){
  foreach($retry as $r)if(($r['_連続配置要求Hash']??'')!==$hash)staffFail('保存済みの操作です。画面を開き直してください。',409);
  if(count($retry)!==($retry[0]['_連続配置件数']??0))staffFail('保存済みの予定を一覧で確認してください。',409);
  echo json_encode(['ok'=>true,'count'=>count($retry),'dates'=>$dates,'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;
 }
}
$all=policyRows();$original=null;foreach($all as $r)if($r['_sourceKey']===$source)$original=$r;
if(!$original||!empty($original['日区分']))staffFail('元の授業が見つかりません。再読み込みしてください。',404);
$group=groupForSource($source);$members=$group?groupRows($group,$all):[$original];$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
usort($members,fn($a,$b)=>array_search($a['時間番号']??'',$slots,true)<=>array_search($b['時間番号']??'',$slots,true));
if($group&&(count($members)<2||count($members)!==count($group['sources'])))staffFail('連結した全コマを確認できません。再読み込みしてください。',409);
$states=readJsonStrict($dir.'/class_state.json');$templates=[];$previous=null;
foreach($members as $r){
 $index=array_search($r['時間番号']??'',$slots,true);
 if($index===false||!empty($r['日区分'])||!lgCompatible($original,$r)||($previous!==null&&$index!==$previous+1))staffFail('元の授業のコマ・連結を確認してください。',409);
 foreach(['開始','終了'] as $f)if(!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$r[$f]??''))staffFail('元の授業の開始・終了時刻を確認してください。',409);
 if($r['開始']>=$r['終了'])staffFail('元の授業の開始・終了時刻を確認してください。',409);
 $previous=$index;
 $template=array_intersect_key($r,array_flip(['日付','日区分','授業ID','クラス','種別','給与区分','担当講師','教室','時間番号','開始','終了','科目','備考','優先度']));
 $template['備考']=(string)($states[canonicalLessonKey(policyKey($r))]['publicNote']??$r['備考']??'');$templates[]=$template;
}
$current=hash('sha256',json_encode([$group,$members,$templates],JSON_UNESCAPED_UNICODE));$sourceDate=str_replace('/','-',$original['日付']);
if($method==='GET'){
 echo json_encode(['ok'=>true,'version'=>$current,'date'=>$sourceDate,'rows'=>$templates,'group'=>$group?groupSummary($group,$members):null,'maxDates'=>31],JSON_UNESCAPED_UNICODE);exit;
}
if(!hash_equals($current,$version))staffFail('元の授業が変更されました。画面を開き直してください。',409);
if(in_array($sourceDate,$dates,true))staffFail('元の授業と同じ日は選べません。',400);
$records=readJsonStrict($dir.'/lesson_records.json');$groups=lessonGroups();$occupied=[];
foreach($all as $r)if(empty($r['日区分']))$occupied[canonicalLessonKey(policyKey($r))]=true;
foreach(['lesson_records.json','class_state.json','lesson_fixed.json','lesson_key_aliases.json','room_overrides.json'] as $name)foreach(readJsonStrict($dir.'/'.$name) as $key=>$value){$occupied[$key]=true;$occupied[canonicalLessonKey($key)]=true;}
foreach(readJsonStrict($dir.'/student_attachments.json') as $f)if(!empty($f['key']))$occupied[canonicalLessonKey($f['key'])]=true;
$ng=readJsonStrict($dir.'/teacher_ng.json');$batches=[];$total=count($dates)*count($templates);
foreach($dates as $date){
 $batch=[];
 foreach($templates as $template){
  $r=array_replace($template,['日付'=>$date,'日区分'=>'','授業ID'=>'']);$key=policyKey($r);
  if(isset($occupied[$key])||canonicalLessonKey($key)!==$key)staffFail($date.' '.$r['時間番号'].'には同じ授業または保存済みの記録があります。どの日にも追加していません。日付の選択を見直してください。',409);
  $occupied[$key]=true;guardRoomSharing($r,'',$in);
  if(empty($in['overrideNg']))foreach($ng as $n)if(($n['teacher']??'')===($r['担当講師']??'')&&str_replace('/','-',$n['date']??'')===$date&&(!empty($n['allDay'])||in_array($r['時間番号'],$n['slots']??[],true)))policyConflict('ngConflict',$date.' '.$r['時間番号'].'は担当講師のNG登録があります。選んだ日付に配置しますか？');
  $r['_追加ID']='ADD-'.date('YmdHis').'-'.bin2hex(random_bytes(8));$r['_sourceKey']='ADD:'.$r['_追加ID'];$r['_追加日時']=date('c');
  $r['_連続配置要求ID']=$requestId;$r['_連続配置要求Hash']=$hash;$r['_連続配置件数']=$total;$batch[]=$r;
 }
 $batches[]=$batch;
}
$changes=[];
foreach($batches as $batch){
 if($group){[$newGroup,$record]=buildLessonGroup($batch,[],$actor,!empty($group['mealBreak']));$groups[$newGroup['id']]=$newGroup;$records[$newGroup['key']]=$record;}
 foreach($batch as $r){$added[]=$r;$states[policyKey($r)]=['publicNote'=>$r['備考'],'ready'=>false,'attendance'=>[],'updatedAt'=>date('c'),'updatedBy'=>$actor['name']];}
}
$changes[$dir.'/added_lessons.json']=$added;$changes[$dir.'/class_state.json']=$states;
if($group){$changes[$dir.'/lesson_groups.json']=$groups;$changes[$dir.'/lesson_records.json']=$records;}
if(!safeDataTransaction($changes))staffFail('保存できませんでした。入力内容を残して再度お試しください。',500);
echo json_encode(['ok'=>true,'count'=>$total,'dates'=>$dates,'replayed'=>false],JSON_UNESCAPED_UNICODE);
