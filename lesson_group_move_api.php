<?php
require_once __DIR__.'/lesson_groups.php';require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))staffFail('操作を確認してください。',405);
$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式を確認してください。',400);
$source=$in['sourceKey']??'';$date=$in['date']??'';$slot=$in['slot']??'';$room=$in['room']??'';
if(!is_string($source)||!is_string($date)||!is_string($slot)||!is_string($room)||strlen($room)>300||preg_match('/[\x00-\x1f\x7f]/u',$room))staffFail('移動先を確認してください。',400);
if($room==='__OTHER__')$room='';
$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];$starts=['13:30','14:20','15:10','16:00','16:50','17:40','18:30','19:20','20:10','21:00','21:50'];$ends=['14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40','22:30'];
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))||!in_array($slot,$slots,true))staffFail('移動先の日付・コマを確認してください。',400);
$dir=__DIR__.'/data';$groups=lessonGroups();$g=groupForSource($source);if(!$g)staffFail('連結が変更・解除されました。再読み込みしてください。',409);
$requestId=$in['requestId']??'';$requestHash=hash('sha256',json_encode([$actor['id'],$source,$date,$slot,$room,$in['version']??''],JSON_UNESCAPED_UNICODE));
if($method==='POST'){
 if(!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId))staffFail('移動操作をやり直してください。',400);
 if(($g['lastMove']['requestId']??'')===$requestId){if(!hash_equals($g['lastMove']['hash'],$requestHash))staffFail('保存済みの操作です。再読み込みしてください。',409);echo json_encode(['ok'=>true,'group'=>groupSummary($g),'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;}
}
$all=policyRows();$members=groupRows($g,$all);$anchor=null;$keys=[];
foreach($members as $r){if($r['_sourceKey']===$source)$anchor=$r;$keys[]=canonicalLessonKey(policyKey($r));}
if(!$anchor||count($members)<2||count($members)!==count($g['sources'])||count(array_unique($keys))!==count($keys))staffFail('連結したコマの対応を確認できません。管理者が元の予定を確認してください。',409);
$fromIndex=array_search($anchor['時間番号'],$slots,true);if($fromIndex===false)staffFail('移動元の時間番号を確認してください。',409);$delta=array_search($slot,$slots,true)-$fromIndex;
$minute=function($v){if(!preg_match('/^(\d{2}):(\d{2})$/D',$v,$m)||(int)$m[1]>23||(int)$m[2]>59)staffFail('授業の開始・終了時刻を確認してください。',409);return (int)$m[1]*60+(int)$m[2];};
$moved=[];$nextKeys=[];foreach($members as $r){
 $i=array_search($r['時間番号'],$slots,true);if($i===false||!empty($r['日区分'])||!lgCompatible($members[0],$r))staffFail('連結した授業の内容が変わりました。再読み込みしてください。',409);
 $next=$i+$delta;if($next<0||$next>=count($slots))staffFail('連結した全コマが収まる時間を選んでください。①～⑪の範囲外には移動できません。',400);
 $offset=$minute($starts[$next])-$minute($starts[$i]);$start=$minute(trim($r['開始']??'')?:$starts[$i])+$offset;$end=$minute(trim($r['終了']??'')?:$ends[$i])+$offset;
 if($start<0||$end>=1440||$end<=$start)staffFail('移動後の授業時刻が同じ日に収まりません。',400);
 $r=array_replace($r,['日付'=>$date,'時間番号'=>$slots[$next],'教室'=>$room,'開始'=>sprintf('%02d:%02d',intdiv($start,60),$start%60),'終了'=>sprintf('%02d:%02d',intdiv($end,60),$end%60)]);
 $moved[]=$r;$nextKeys[]=policyKey($r);
}
$version=hash('sha256',json_encode([$g,$members],JSON_UNESCAPED_UNICODE));
if($method==='GET'){echo json_encode(['ok'=>true,'version'=>$version,'group'=>groupSummary($g,$members),'rows'=>$moved],JSON_UNESCAPED_UNICODE);exit;}
if(!is_string($in['version']??null)||!hash_equals($version,$in['version']))staffFail('連結した予定が変更されました。画面を開き直して確認してください。',409);
$names=['lesson_records.json','class_state.json','room_overrides.json','lesson_fixed.json'];$maps=[];foreach($names as $n)$maps[$n]=readJsonStrict($dir.'/'.$n);
$aliases=readJsonStrict($dir.'/lesson_key_aliases.json');$files=readJsonStrict($dir.'/student_attachments.json');$resolve=function($key)use($aliases){$seen=[];while(isset($aliases[$key])&&!isset($seen[$key])){$seen[$key]=true;$key=$aliases[$key];}return $key;};
$mapping=array_combine($keys,$nextKeys);$ownSources=array_flip($g['sources']);$foreign=array_filter($all,fn($r)=>!isset($ownSources[$r['_sourceKey']])&&empty($r['日区分']));
foreach($moved as $i=>$r){$next=$nextKeys[$i];$returning=isset($mapping[$resolve($next)]);
 foreach($foreign as $other)if(policyKey($other)===$next||canonicalLessonKey(policyKey($other))===$resolve($next))staffFail('移動先に同じ授業があります。既存の授業を確認してください。移動は行っていません。',409);
 if(!$returning){foreach($maps as $map)if(isset($map[$next])||isset($map[$resolve($next)]))staffFail('移動先に保存済みの記録があります。記録を保護するため移動していません。',409);foreach($files as $f)if($resolve($f['key']??'')===$resolve($next))staffFail('移動先に保存済みの資料があります。移動していません。',409);if(isset($aliases[$next]))staffFail('移動先に別の授業の履歴があります。移動していません。',409);}
}
if(empty($in['overrideFixed']))foreach($keys as $key)if(!empty($maps['lesson_fixed.json'][$key]['fixed']))policyConflict('fixedConflict','連結した授業に「確定」済みのコマがあります。全'.count($members).'コマを連結したまま移動しますか？');
if($room!==''&&$room!=='PC'&&empty($in['overrideRoom']))foreach($moved as $r)foreach($foreign as $other)if(str_replace('/','-',$other['日付']??'')===$date&&($other['教室']??'')===$room&&(($other['時間番号']??'')===$r['時間番号']||(($other['開始']??'')<$r['終了']&&($other['終了']??'')>$r['開始'])))policyConflict('roomConflict',$date.' '.$room.'教室に別の授業があります。同じ教室で指導する予定として、連結全体を移動しますか？');
if(empty($in['overrideNg']))foreach(readJsonStrict($dir.'/teacher_ng.json') as $ng)foreach($moved as $r)if(($ng['teacher']??'')===$r['担当講師']&&str_replace('/','-',$ng['date']??'')===$date&&(!empty($ng['allDay'])||in_array($r['時間番号'],$ng['slots']??[],true)))policyConflict('ngConflict',$r['担当講師'].'先生は '.$date.' '.$r['時間番号'].' がNG登録されています。連結全体を移動しますか？');
$changes=[];$edits=readJsonStrict($dir.'/edited_lessons.json');foreach($moved as $r)$edits[$r['_sourceKey']]=$r;$changes[$dir.'/edited_lessons.json']=$edits;
// Build all destinations from the original maps before replacing any overlapping member key.
foreach($maps as $name=>$before){$after=$before;foreach($keys as $key)unset($after[$key]);foreach($members as $i=>$old){$key=$keys[$i];$next=$nextKeys[$i];if(!isset($before[$key]))continue;$value=$before[$key];$r=$moved[$i];if($name==='room_overrides.json')$value['room']=$room;if($name==='lesson_records.json')$value=array_replace($value,['eventKey'=>$next,'date'=>$date,'slot'=>$r['時間番号'],'className'=>$r['クラス'],'teacher'=>$r['担当講師'],'room'=>$room]);$after[$next]=$value;}$changes[$dir.'/'.$name]=$after;}
$common=$changes[$dir.'/lesson_records.json'][$g['key']]??null;if($common)$changes[$dir.'/lesson_records.json'][$g['key']]=array_replace($common,['date'=>$date,'slot'=>implode('',array_column($moved,'時間番号')),'room'=>$room]);
foreach($files as &$f){$old=$resolve($f['key']??'');if(isset($mapping[$old]))$f['key']=$mapping[$old];}unset($f);$changes[$dir.'/student_attachments.json']=$files;
foreach($aliases as $a=>$v){$old=$resolve($a);if(isset($mapping[$old]))$aliases[$a]=$mapping[$old];}foreach($mapping as $old=>$next)if($old!==$next)$aliases[$old]=$next;foreach($nextKeys as $next)unset($aliases[$next]);$changes[$dir.'/lesson_key_aliases.json']=$aliases;
$g['moveHistory'][]=['at'=>date('c'),'by'=>$actor['name'],'from'=>$members,'to'=>$moved];$g['lastMove']=['requestId'=>$requestId,'hash'=>$requestHash];$groups[$g['id']]=$g;$changes[$dir.'/lesson_groups.json']=$groups;
if(!safeDataTransaction($changes))staffFail('連結した授業を保存できませんでした。移動前の記録を保護して停止しました。',500);
echo json_encode(['ok'=>true,'group'=>groupSummary($g,$moved)],JSON_UNESCAPED_UNICODE);
