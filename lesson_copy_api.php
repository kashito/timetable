<?php
require_once __DIR__.'/lesson_groups.php';require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$dir=__DIR__.'/data';$method=$_SERVER['REQUEST_METHOD'];$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);
$source=$in['sourceKey']??null;if(!is_string($source)||$source==='')staffFail('元の授業がありません',400);
$slots=['①'=>['13:30','14:10'],'②'=>['14:20','15:00'],'③'=>['15:10','15:50'],'④'=>['16:00','16:40'],'⑤'=>['16:50','17:30'],'⑥'=>['17:40','18:20'],'⑦'=>['18:30','19:10'],'⑧'=>['19:20','20:00'],'⑨'=>['20:10','20:50'],'⑩'=>['21:00','21:40'],'⑪'=>['21:50','22:30']];
$original=lessonBySource($source);if($original)$original['_sourceKey']=$source;
$version=$original?hash('sha256',json_encode($original,JSON_UNESCAPED_UNICODE)):'';
if($method==='GET'){
 if(!$original||!empty($original['日区分']))staffFail('授業が見つかりません',404);
 echo json_encode(['ok'=>true,'row'=>$original,'version'=>$version,'slots'=>$slots,'group'=>groupForSource($source)?groupSummary(groupForSource($source)):null],JSON_UNESCAPED_UNICODE);exit;
}
if($method!=='POST')staffFail('Method not allowed',405);
$requestId=$in['requestId']??null;$targets=$in['targets']??null;$link=$in['link']??null;$mealBreak=$in['mealBreak']??false;if(!is_bool($mealBreak)||($mealBreak&&$link!==true))staffFail('食事休憩は連結する場合に選択してください',400);
if(!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId)||!is_bool($link)||!is_array($targets)||count($targets)<1||count($targets)>10||array_keys($targets)!==range(0,count($targets)-1)||!is_string($in['version']??null))staffFail('複製先・連結の設定を確認してください',400);
$hashInput=[$actor['id'],$source,$in['version'],$targets,$link];if($mealBreak)$hashInput[]=true;$hash=hash('sha256',json_encode($hashInput,JSON_UNESCAPED_UNICODE));$added=readJsonStrict($dir.'/added_lessons.json');$retry=array_values(array_filter($added,fn($r)=>($r['_複製要求ID']??'')===$requestId));
if($retry){foreach($retry as $r)if(($r['_複製要求Hash']??'')!==$hash)staffFail('この複製操作は保存済みです。画面を開き直してください。',409);if(count($retry)!==count($targets))staffFail('複製済みの授業を再読み込みして確認してください。',409);$groups=lessonGroups();$gid=$retry[0]['_複製連結ID']??'';echo json_encode(['ok'=>true,'rows'=>$retry,'group'=>isset($groups[$gid])?groupSummary($groups[$gid]):null,'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;}
if(!$original||!hash_equals($version,$in['version']))staffFail('元の授業が変更されました。画面を開き直して確認してください。',409);
if(!empty($original['日区分'])||!isset($slots[$original['時間番号']??'']))staffFail('授業のコマを確認してください',400);
if($link)guardGroupedSource($source);
$all=policyRows();$occupied=[];foreach($all as $r)$occupied[canonicalLessonKey(policyKey($r))]=true;
foreach(readJsonStrict($dir.'/student_attachments.json') as $file)if(!empty($file['key']))$occupied[canonicalLessonKey($file['key'])]=true;
$records=readJsonStrict($dir.'/lesson_records.json');$states=readJsonStrict($dir.'/class_state.json');$fixed=readJsonStrict($dir.'/lesson_fixed.json');$aliases=readJsonStrict($dir.'/lesson_key_aliases.json');$rooms=readJsonStrict($dir.'/room_overrides.json');
$ng=readJsonStrict($dir.'/teacher_ng.json');$copies=[];$seen=[];
foreach($targets as $target){
 if(!is_array($target)||!is_string($target['date']??null)||!is_string($target['slot']??null)||!is_string($target['room']??null))staffFail('複製先を確認してください',400);
 $date=$target['date'];$slot=$target['slot'];$room=$target['room'];if($room==='__OTHER__')$room='';
 if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))||!isset($slots[$slot])||strlen($room)>300||preg_match('/[\x00-\x1f\x7f]/u',$room))staffFail('日付・時間・教室を確認してください',400);
 $row=array_intersect_key($original,array_flip(['日付','日区分','授業ID','クラス','種別','給与区分','担当講師','教室','時間番号','開始','終了','科目','備考','優先度']));
 $row=array_merge($row,['日付'=>$date,'日区分'=>'','授業ID'=>'','時間番号'=>$slot,'教室'=>$room,'開始'=>$slots[$slot][0],'終了'=>$slots[$slot][1]]);
 $key=policyKey($row);if(isset($seen[$key])||isset($occupied[canonicalLessonKey($key)])||isset($records[$key])||isset($states[$key])||isset($fixed[$key])||isset($aliases[$key])||isset($rooms[$key]))staffFail($date.' '.$slot.'には同じ授業または保存済みの記録があります。複製は行っていません。',409);$seen[$key]=true;
 guardRoomSharing($row,'',$in);
 if(empty($in['overrideNg']))foreach($ng as $n)if(($n['teacher']??'')===($row['担当講師']??'')&&str_replace('/','-',$n['date']??'')===$date&&(!empty($n['allDay'])||in_array($slot,$n['slots']??[],true)))policyConflict('ngConflict',$row['担当講師'].'先生は '.$date.' '.$slot.' がNG登録されています。選んだコマを複製しますか？');
 $row['_追加ID']='ADD-'.date('YmdHis').'-'.bin2hex(random_bytes(6));$row['_追加日時']=date('c');$row['_複製要求ID']=$requestId;$row['_複製要求Hash']=$hash;$row['_sourceKey']='ADD:'.$row['_追加ID'];$copies[]=$row;
}
$changes=[];$group=null;
if($link){
 $groupRows=array_merge([$original],$copies);$keys=array_keys($slots);usort($groupRows,fn($a,$b)=>array_search($a['時間番号'],$keys,true)<=>array_search($b['時間番号'],$keys,true));$prev=null;
 foreach($groupRows as $r){$i=array_search($r['時間番号'],$keys,true);if(!lgCompatible($original,$r)||($prev!==null&&$i!==$prev+1))staffFail('連結する場合は、同じ日の次のコマを続けて選んでください。',400);$prev=$i;}
 [$group,$record]=buildLessonGroup($groupRows,$records,$actor,$mealBreak);$groups=lessonGroups();$groups[$group['id']]=$group;$records[$group['key']]=$record;
 foreach($copies as &$row)$row['_複製連結ID']=$group['id'];unset($row);
 $changes[$dir.'/lesson_groups.json']=$groups;$changes[$dir.'/lesson_records.json']=$records;
}
foreach($copies as $row){$added[]=$row;$states[policyKey($row)]=['publicNote'=>(string)($row['備考']??''),'updatedAt'=>date('c'),'updatedBy'=>$actor['name']];}
$changes[$dir.'/added_lessons.json']=$added;$changes[$dir.'/class_state.json']=$states;
if(!safeDataTransaction($changes))staffFail('複製を保存できません。入力内容を残しています。',500);
echo json_encode(['ok'=>true,'rows'=>$copies,'group'=>$group?groupSummary($group,$groupRows):null],JSON_UNESCAPED_UNICODE);
