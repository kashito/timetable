<?php
// Create every period and its shared record together, or create none.
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST')staffFail('Method not allowed',405);
$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in))staffFail('入力形式が不正です。',400);
$count=$in['count']??null;$meal=$in['mealBreak']??false;$requestId=$in['requestId']??null;
if(!is_int($count)||$count<2||$count>11||!is_bool($meal)||!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId)||!is_array($in['row']??null))staffFail('追加するコマ数・食事休憩を確認してください。',400);
$row=[];
foreach(['日付','時間番号','クラス','担当講師','種別','科目','教室','給与区分','開始','終了','備考'] as $field){
 $value=$in['row'][$field]??'';
 if(!is_string($value)||strlen($value)>($field==='備考'?12000:300))staffFail('入力内容を確認してください。',400);
 $row[$field]=$field==='備考'?$value:trim($value);
}
$row['日付']=str_replace('/','-',$row['日付']);$date=$row['日付'];
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))||$row['クラス']===''||$row['種別']==='')staffFail('日付・クラス・種別を確認してください。',400);
$slots=['①'=>['13:30','14:10'],'②'=>['14:20','15:00'],'③'=>['15:10','15:50'],'④'=>['16:00','16:40'],'⑤'=>['16:50','17:30'],'⑥'=>['17:40','18:20'],'⑦'=>['18:30','19:10'],'⑧'=>['19:20','20:00'],'⑨'=>['20:10','20:50'],'⑩'=>['21:00','21:40'],'⑪'=>['21:50','22:30']];
$index=array_search($row['時間番号'],array_keys($slots),true);
if($index===false||$index+$count>count($slots))staffFail('同じ日の⑪までの連続したコマを選んでください。',400);
$hash=hash('sha256',json_encode([$actor['id'],$row,$count,$meal],JSON_UNESCAPED_UNICODE));
$dir=__DIR__.'/data';$added=readJsonStrict($dir.'/added_lessons.json');$groups=lessonGroups();
$retry=array_values(array_filter($added,fn($r)=>($r['_連結追加要求ID']??'')===$requestId));
if($retry){
 foreach($retry as $r)if(($r['_連結追加要求Hash']??'')!==$hash)staffFail('保存済みの操作です。画面を開き直してください。',409);
 $g=$groups[$retry[0]['_連結追加ID']??'']??null;
 if(count($retry)!==$count||!$g)staffFail('保存済みの授業を一覧で確認してください。',409);
 echo json_encode(['ok'=>true,'rows'=>$retry,'group'=>groupSummary($g),'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;
}
$all=policyRows();$records=readJsonStrict($dir.'/lesson_records.json');$states=readJsonStrict($dir.'/class_state.json');
$fixed=readJsonStrict($dir.'/lesson_fixed.json');$rooms=readJsonStrict($dir.'/room_overrides.json');$files=readJsonStrict($dir.'/student_attachments.json');$ng=readJsonStrict($dir.'/teacher_ng.json');
$occupied=[];foreach($all as $r)if(empty($r['日区分']))$occupied[canonicalLessonKey(policyKey($r))]=true;
foreach($files as $f)if(!empty($f['key']))$occupied[canonicalLessonKey($f['key'])]=true;
$rows=[];$previousEnd=null;
foreach(array_slice(array_keys($slots),$index,$count) as $i=>$slot){
 $r=$row;$r['時間番号']=$slot;$r['開始']=$i===0?$row['開始']:$slots[$slot][0];$r['終了']=$i===$count-1?$row['終了']:$slots[$slot][1];
 foreach(['開始','終了'] as $field)if(!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$r[$field]))staffFail('開始・終了時刻を確認してください。',400);
 if($r['開始']>=$r['終了']||($previousEnd!==null&&$previousEnd>$r['開始']))staffFail('授業時間が重ならないように開始・終了を確認してください。',400);
 $previousEnd=$r['終了'];$key=policyKey($r);
 if(canonicalLessonKey($key)!==$key||isset($occupied[$key])||isset($records[$key])||isset($states[$key])||isset($fixed[$key])||isset($rooms[$key]))staffFail($slot.'に同じ授業または以前の記録があります。新しい授業は追加していません。配置済みのコマを連結するか、連結詳細から延長してください。',409);
 guardRoomSharing($r,'',$in);
 if(empty($in['overrideNg']))foreach($ng as $n)if(($n['teacher']??'')===$r['担当講師']&&str_replace('/','-',$n['date']??'')===$date&&(!empty($n['allDay'])||in_array($slot,$n['slots']??[],true)))policyConflict('ngConflict',$r['担当講師'].'先生は '.$date.' '.$slot.' がNG登録されています。選んだ全コマを追加して連結しますか？');
 $r['_追加ID']='ADD-'.date('YmdHis').'-'.bin2hex(random_bytes(8));$r['_追加日時']=date('c');$r['_sourceKey']='ADD:'.$r['_追加ID'];
 $r['_連結追加要求ID']=$requestId;$r['_連結追加要求Hash']=$hash;$rows[]=$r;
}
[$group,$record]=buildLessonGroup($rows,$records,$actor,$meal);
foreach($rows as &$r){$r['_連結追加ID']=$group['id'];$added[]=$r;$states[policyKey($r)]=['publicNote'=>$r['備考'],'ready'=>false,'attendance'=>[],'updatedAt'=>date('c'),'updatedBy'=>$actor['name']];}unset($r);
$group['snapshot']=$rows;$groups[$group['id']]=$group;$records[$group['key']]=$record;
if(!safeDataTransaction([$dir.'/added_lessons.json'=>$added,$dir.'/class_state.json'=>$states,$dir.'/lesson_groups.json'=>$groups,$dir.'/lesson_records.json'=>$records]))staffFail('連結した授業を保存できませんでした。入力内容を残して再度お試しください。',500);
echo json_encode(['ok'=>true,'rows'=>$rows,'group'=>groupSummary($group,$rows)],JSON_UNESCAPED_UNICODE);
