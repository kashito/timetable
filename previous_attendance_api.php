<?php
require_once __DIR__.'/lesson_groups.php';
$actor=staffRequire();header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');
if($_SERVER['REQUEST_METHOD']!=='GET')staffFail('Method not allowed',405);
$rows=policyRows();$target=null;$exclude=[];$key=canonicalLessonKey((string)($_GET['key']??''));
$groupId=(string)($_GET['groupId']??'');
function paMinutes($r){$start=(string)($r['開始']??'');if(preg_match('/^(\d{1,2}):(\d{2})$/',$start,$m)&&$m[1]<24&&$m[2]<60)return (int)$m[1]*60+(int)$m[2];$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];$i=array_search($r['時間番号']??'',$slots,true);return $i===false?null:810+$i*50;}
if($groupId!==''){
 $g=lessonGroups()[$groupId]??null;if(!$g||empty($g['active']))staffFail('連結中の授業を開き直してください。',404);
 $members=groupRows($g,$rows);usort($members,fn($a,$b)=>(paMinutes($a)??9999)<=>(paMinutes($b)??9999));$target=$members[0]??null;$exclude=$g['sources'];
}else{
 foreach($rows as $row)if(canonicalLessonKey(policyKey($row))===$key){$target=$row;$exclude[]=$row['_sourceKey'];break;}
 if(!$target&&$actor['role']==='admin'&&isset($_GET['className'],$_GET['date'],$_GET['slot']))$target=['クラス'=>(string)$_GET['className'],'日付'=>(string)$_GET['date'],'時間番号'=>(string)$_GET['slot'],'開始'=>(string)($_GET['start']??'')];
}
if(!$target||!empty($target['日区分']))staffFail('授業を開き直してください。',404);
$date=str_replace('/','-',$target['日付']??'');$start=paMinutes($target);$directory=readJsonStrict(__DIR__.'/data/directory_state.json');
$className=function($s)use($directory){$seen=[];while(isset($directory['classNameAliases'][$s])&&!isset($seen[$s])){$seen[$s]=true;$s=$directory['classNameAliases'][$s];}return $s;};$class=$className($target['クラス']??'');
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||$start===null||$class==='')staffFail('日付・クラス・開始時間を確認してください。',400);
$candidates=[];foreach($rows as $r){$time=paMinutes($r);if(empty($r['日区分'])&&!in_array($r['_sourceKey'],$exclude,true)&&str_replace('/','-',$r['日付']??'')===$date&&$className($r['クラス']??'')===$class&&$time!==null&&$time<$start)$candidates[]=$r;}
usort($candidates,fn($a,$b)=>paMinutes($b)<=>paMinutes($a));
if(!$candidates){echo json_encode(['ok'=>true,'found'=>false,'message'=>'同じ日・同じクラスの前の授業がありません。出欠は変更していません。'],JSON_UNESCAPED_UNICODE);exit;}
if(count($candidates)>1&&paMinutes($candidates[0])===paMinutes($candidates[1]))staffFail('同じ開始時間の前の授業が複数あります。出欠を確認して個別に入力してください。',409);
$prev=$candidates[0];$prevKey=canonicalLessonKey(policyKey($prev));$state=readJsonStrict(__DIR__.'/data/class_state.json')[$prevKey]??[];$attendance=[];
foreach($state['attendance']??[] as $name=>$v)if(in_array($v,['出席','欠席','遅刻','早退','免除','その他','不明','未定'],true)&&($v!=='未定'||$actor['role']==='admin'))$attendance[$name]=$v;
echo json_encode(['ok'=>true,'found'=>true,'source'=>['key'=>$prevKey,'date'=>$date,'slot'=>$prev['時間番号']??'','start'=>$prev['開始']??'','className'=>$class,'teacher'=>$prev['担当講師']??''],'attendance'=>(object)$attendance],JSON_UNESCAPED_UNICODE);
