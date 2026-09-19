<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$method=$_SERVER['REQUEST_METHOD'];
if(!in_array($method,['GET','POST'],true))staffFail('操作を確認してください。',405);
$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);
if(!is_array($in)||!is_string($in['id']??null))staffFail('連結した授業を選び直してください。',400);
$dir=__DIR__.'/data';$groups=lessonGroups();$g=$groups[$in['id']]??null;
if(!$g||empty($g['active']))staffFail('連結が変更・解除されました。再読み込みしてください。',409);
$requestId=$in['requestId']??'';
if($method==='POST'){
 if(!is_string($in['version']??null)||!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId))staffFail('延長する操作をやり直してください。',400);
 if(array_key_exists('mealBreak',$in)&&!is_bool($in['mealBreak']))staffFail('食事休憩の「あり・なし」を選んでください。',400);
 $mealBreak=array_key_exists('mealBreak',$in)?$in['mealBreak']:!empty($g['mealBreak']);
 $hashParts=[$actor['id'],$g['id'],$in['version']];
 // Keep legacy requests valid, and distinguish different meal-break choices on retry.
 if(array_key_exists('mealBreak',$in))$hashParts[]=$mealBreak;
 $requestHash=hash('sha256',json_encode($hashParts,JSON_UNESCAPED_UNICODE));
 // A retry must succeed even when the saved extension reached the final slot.
 if(($g['lastLengthen']['requestId']??'')===$requestId){
  if(!hash_equals($g['lastLengthen']['hash'],$requestHash))staffFail('保存済みの操作です。画面を開き直してください。',409);
  echo json_encode(['ok'=>true,'group'=>groupSummary($g),'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;
 }
}
$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
$starts=['13:30','14:20','15:10','16:00','16:50','17:40','18:30','19:20','20:10','21:00','21:50'];
$ends=['14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40','22:30'];
$all=policyRows();$members=groupRows($g,$all);
if(count($members)<2||count($members)!==count($g['sources']))staffFail('連結したコマが変更されました。再読み込みしてください。',409);
usort($members,fn($a,$b)=>array_search($a['時間番号'],$slots,true)<=>array_search($b['時間番号'],$slots,true));
$previous=null;$memberKeys=[];
foreach($members as $r){
 $i=array_search($r['時間番号']??'',$slots,true);
 if($i===false||!empty($r['日区分'])||!lgCompatible($members[0],$r)||($previous!==null&&$i!==$previous+1))staffFail('連結した授業の内容が変わりました。元の予定を確認してください。',409);
 $previous=$i;$memberKeys[]=canonicalLessonKey(policyKey($r));
}
if(count(array_unique($memberKeys))!==count($memberKeys))staffFail('連結したコマの対応を確認できません。元の予定を確認してください。',409);
$records=readJsonStrict($dir.'/lesson_records.json');
if(!isset($records[$g['key']])||!is_array($records[$g['key']]))staffFail('共通カルテを確認できないため延長を中止しました。',409);
$next=$previous+1;
if($next>=count($slots))staffFail('⑪がその日の最後のコマです。翌日へまたがる延長はできません。',$method==='POST'?409:400);
$last=$members[count($members)-1];$date=str_replace('/','-',$last['日付']??'');
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))staffFail('授業の日付を確認してください。',409);
$new=[];foreach(['クラス','担当講師','種別','科目','教室','給与区分'] as $field)if(isset($last[$field]))$new[$field]=$last[$field];
$new=array_replace($new,['日付'=>$date,'時間番号'=>$slots[$next],'開始'=>$starts[$next],'終了'=>$ends[$next]]);
$newKey=policyKey($new);$canonical=canonicalLessonKey($newKey);
$state=readJsonStrict($dir.'/class_state.json');$fixed=readJsonStrict($dir.'/lesson_fixed.json');
$rooms=readJsonStrict($dir.'/room_overrides.json');$files=readJsonStrict($dir.'/student_attachments.json');
$matches=array_values(array_filter($all,fn($r)=>empty($r['日区分'])&&policyKey($r)===$newKey));
if(count($matches)>1)staffFail('次の'.$slots[$next].'に同じ授業が複数あります。どのコマを使うか確認できないため、延長していません。',409);
$existing=count($matches)===1;$mode=$existing?'join':'create';
if($existing){
 $new=$matches[0];
 if(!lgCompatible($last,$new))staffFail('次の'.$slots[$next].'に同じ授業がありますが、教室などの設定が異なります。次のコマの設定を確認してください。',409);
 if(groupForSource($new['_sourceKey']))staffFail('次の'.$slots[$next].'は別の連結授業に含まれています。連結の範囲を確認してください。',409);
 if(in_array($canonical,$memberKeys,true))staffFail('次のコマの記録が現在の連結授業と重なっています。記録を保護するため延長していません。',409);
 foreach($all as $other)if(empty($other['日区分'])&&$other['_sourceKey']!==$new['_sourceKey']&&canonicalLessonKey(policyKey($other))===$canonical)staffFail('次のコマの記録が別の授業と重なっています。記録を保護するため延長していません。',409);
 $newKey=$canonical;
}else{
 foreach($all as $r)if(empty($r['日区分'])&&canonicalLessonKey(policyKey($r))===$canonical)staffFail('次のコマに別の授業の履歴があります。記録を保護するため延長していません。',409);
 if($canonical!==$newKey)staffFail('次のコマに以前の授業の履歴があります。記録を保護するため延長していません。',409);
 foreach([$records,$state,$fixed,$rooms] as $map)if(isset($map[$newKey]))staffFail('次のコマに保存済みの記録があります。記録を保護するため延長していません。',409);
 foreach($files as $f)if(canonicalLessonKey($f['key']??'')===$newKey)staffFail('次のコマに保存済みの資料があります。延長していません。',409);
 $new['備考']=(string)($state[$memberKeys[count($memberKeys)-1]]['publicNote']??$last['備考']??'');
}
$validTime=fn($s)=>is_string($s)&&preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$s);
$lastEnd=trim((string)($last['終了']??''));
if(!$validTime($new['開始']??null)||!$validTime($new['終了']??null)||$new['開始']>=$new['終了'])staffFail('次のコマの開始・終了時刻を確認してください。',409);
if($lastEnd!==''&&(!$validTime($lastEnd)||$lastEnd>$new['開始']))staffFail('現在の終了時刻が次のコマに重なっています。最後のコマの時刻を確認してください。',409);
// Bind the preview to both the action and the exact existing period/records.
// A period created or edited by another administrator must not be silently adopted.
$target=$existing?[$newKey,$records[$newKey]??[],$state[$newKey]??[],$fixed[$newKey]??[]]:null;
$version=hash('sha256',json_encode([$g,$members,$records[$g['key']],$mode,$new,$target],JSON_UNESCAPED_UNICODE));
if($method==='POST'&&!hash_equals($version,$in['version']))staffFail('授業またはカルテが更新されました。開き直して確認してください。',409);
if($method==='GET'){
 echo json_encode(['ok'=>true,'version'=>$version,'mode'=>$mode,'group'=>groupSummary($g,$members),'row'=>$new,'slots'=>implode('',array_column($members,'時間番号')).$new['時間番号']],JSON_UNESCAPED_UNICODE);exit;
}
$fixedKeys=$existing?array_merge($memberKeys,[$newKey]):$memberKeys;
if(empty($in['overrideFixed']))foreach($fixedKeys as $key)if(!empty($fixed[$key]['fixed']))policyConflict('fixedConflict','確定済みのコマがあります。'.($existing?'配置済みの'.$new['時間番号'].'を連結に加えて延長しますか？ 確定状態は引き継ぎます。':'後ろに'.$new['時間番号'].'を1コマ増やしますか？ 追加するコマは未確定になります。'));
guardRoomSharing($new,$existing?$new['_sourceKey']:'',$in);
if(empty($in['overrideNg']))foreach(readJsonStrict($dir.'/teacher_ng.json') as $ng)if(($ng['teacher']??'')===($new['担当講師']??'')&&str_replace('/','-',$ng['date']??'')===$date&&(!empty($ng['allDay'])||in_array($new['時間番号'],$ng['slots']??[],true)))policyConflict('ngConflict',($new['担当講師']??'').'先生は '.$date.' '.$new['時間番号'].' がNG登録されています。それでも1コマ延長しますか？');
$changes=[];
if($existing){
 foreach(['memo','homework'] as $field){$text=(string)($records[$newKey][$field]??'');if(trim($text)!=='')$records[$g['key']][$field]=rtrim((string)($records[$g['key']][$field]??'')).(trim((string)($records[$g['key']][$field]??''))!==''?"\n\n":'').'【追加 '.$new['時間番号'].'】'."\n".$text;}
}else{
 $added=readJsonStrict($dir.'/added_lessons.json');
 $new['_追加ID']='ADD-'.date('YmdHis').'-'.bin2hex(random_bytes(8));$new['_追加日時']=date('c');$added[]=$new;
 $new['_sourceKey']='ADD:'.$new['_追加ID'];
 // Only a newly created period starts with blank attendance and preparation.
 $state[$newKey]=['ready'=>false,'attendance'=>[],'publicNote'=>$new['備考'],'updatedAt'=>date('c')];
 $changes[$dir.'/added_lessons.json']=$added;$changes[$dir.'/class_state.json']=$state;
}
$members[]=$new;
$g['sources']=array_column($members,'_sourceKey');$g['snapshot']=$members;
$g['extendHistory'][]=['at'=>date('c'),'by'=>$actor['name'],'sources'=>[$new['_sourceKey']],'mode'=>$existing?'lengthen-existing':'lengthen','mealBreakBefore'=>!empty($g['mealBreak']),'mealBreakAfter'=>$mealBreak];
$g['mealBreak']=$mealBreak;
$g['lastLengthen']=['requestId'=>$requestId,'hash'=>$requestHash];$groups[$g['id']]=$g;
$records[$g['key']]['slot']=implode('',array_column($members,'時間番号'));
$records[$g['key']]['updatedAt']=date('c');$records[$g['key']]['updatedBy']=$actor['name'];
$changes[$dir.'/lesson_groups.json']=$groups;$changes[$dir.'/lesson_records.json']=$records;
if(!safeDataTransaction($changes))staffFail('延長を保存できませんでした。もう一度お試しください。',500);
echo json_encode(['ok'=>true,'group'=>groupSummary($g,$members)],JSON_UNESCAPED_UNICODE);
