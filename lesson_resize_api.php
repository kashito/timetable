<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_links.php';

$actor=staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('操作を確認してください。',405);
$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in))staffFail('入力形式を確認してください。',400);

$source=$in['sourceKey']??'';$edge=$in['edge']??'';$target=$in['time']??'';
if(!is_string($source)||$source===''||!in_array($edge,['start','end'],true)||!is_string($target))staffFail('変更する授業と時刻を確認してください。',400);
$toMinutes=function($value){
 if(!is_string($value)||!preg_match('/^(\d{2}):(\d{2})$/D',$value,$m)||(int)$m[1]>23||(int)$m[2]>59)staffFail('時刻を確認してください。',400);
 return (int)$m[1]*60+(int)$m[2];
};
$format=function($minutes){return sprintf('%02d:%02d',intdiv($minutes,60),$minutes%60);};
$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
$starts=['13:30','14:20','15:10','16:00','16:50','17:40','18:30','19:20','20:10','21:00','21:50'];
$ends=['14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40','22:30'];
$targetMinutes=$toMinutes($target);
if($targetMinutes%5!==0)staffFail('時刻は5分単位で変更してください。',400);

$all=policyRows();$by=[];foreach($all as $row)$by[$row['_sourceKey']]=$row;
if(!isset($by[$source]))staffFail('授業が変更または削除されました。再読み込みしてください。',409);
$group=groupForSource($source);$members=$group?groupRows($group,$all):[$by[$source]];
usort($members,function($a,$b)use($slots){return array_search($a['時間番号']??'',$slots,true)<=>array_search($b['時間番号']??'',$slots,true);});
if(!$members||($group&&count($members)!==count($group['sources']??[])))staffFail('連結した授業の内容が変わりました。再読み込みしてください。',409);
$first=$members[0];$last=$members[count($members)-1];
$currentStart=trim((string)($first['開始']??''));$currentEnd=trim((string)($last['終了']??''));
$expectedStart=$in['expectedStart']??'';$expectedEnd=$in['expectedEnd']??'';
if(!is_string($expectedStart)||!is_string($expectedEnd))staffFail('変更前の時刻を確認できません。再読み込みしてください。',400);
$currentTarget=$edge==='start'?$currentStart:$currentEnd;
$expectedOther=$edge==='start'?$expectedEnd:$expectedStart;
$currentOther=$edge==='start'?$currentEnd:$currentStart;
if($currentTarget===$target&&$expectedOther===$currentOther){echo json_encode(['ok'=>true,'start'=>$currentStart,'end'=>$currentEnd,'grouped'=>(bool)$group,'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;}
if($expectedStart!==$currentStart||$expectedEnd!==$currentEnd)staffFail('授業時刻が別の画面で変更されました。再読み込みしてください。',409);

$boundaryIndex=$edge==='start'?0:count($members)-1;$boundary=$members[$boundaryIndex];
$slotIndex=array_search($boundary['時間番号']??'',$slots,true);
if($slotIndex===false)staffFail('授業の時間番号を確認できません。',409);
$boundaryStart=$toMinutes(trim((string)($boundary['開始']??''))?:$starts[$slotIndex]);
$boundaryEnd=$toMinutes(trim((string)($boundary['終了']??''))?:$ends[$slotIndex]);
$dayStart=$toMinutes($starts[0]);$dayEnd=$toMinutes($ends[count($ends)-1]);
if($edge==='start'&&($targetMinutes<$dayStart||$targetMinutes>$boundaryEnd-5))staffFail($starts[0].'〜'.$format($boundaryEnd-5).' の範囲で開始時刻を変更してください。',400);
if($edge==='end'&&($targetMinutes<$boundaryStart+5||$targetMinutes>$dayEnd))staffFail($format($boundaryStart+5).'〜'.$ends[count($ends)-1].' の範囲で終了時刻を変更してください。',400);

$dir=__DIR__.'/data';$fixed=readJsonStrict($dir.'/lesson_fixed.json');
if(empty($in['overrideFixed']))foreach($members as $row){$key=canonicalLessonKey(policyKey($row));if(!empty($fixed[$key]['fixed']))policyConflict('fixedConflict',($group?'連結した授業':'この授業').'は「確定」済みです。それでも時刻を変更しますか？');}

$updated=$boundary;$updated[$edge==='start'?'開始':'終了']=$format($targetMinutes);$updated['_sourceKey']=$boundary['_sourceKey'];
$isExtension=$edge==='start'?$targetMinutes<$boundaryStart:$targetMinutes>$boundaryEnd;
if($isExtension)guardRoomSharing($updated,$boundary['_sourceKey'],$in);
$members[$boundaryIndex]=$updated;

$edits=readJsonStrict($dir.'/edited_lessons.json');$saved=$updated;$saved['_編集日時']=date('c');$edits[$boundary['_sourceKey']]=$saved;
$changes=[$dir.'/edited_lessons.json'=>$edits];
if($group){
 $groups=lessonGroups();$group['snapshot']=$members;
 $group['resizeHistory'][]=['at'=>date('c'),'by'=>$actor['name'],'edge'=>$edge,'from'=>$currentTarget,'to'=>$target,'source'=>$boundary['_sourceKey']];
 $groups[$group['id']]=$group;$changes[$dir.'/lesson_groups.json']=$groups;
}
if(!safeDataTransaction($changes))staffFail('授業時刻を保存できませんでした。変更前の状態を保護して停止しました。',500);
echo json_encode(['ok'=>true,'start'=>$edge==='start'?$target:$currentStart,'end'=>$edge==='end'?$target:$currentEnd,'grouped'=>(bool)$group,'group'=>$group?groupSummary($group,$members):null],JSON_UNESCAPED_UNICODE);
