<?php
require_once __DIR__.'/lesson_groups.php';
function scText($in,$key,$max,$required=false){$s=$in[$key]??'';if(!is_string($s)||strlen($s)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$s)||($required&&trim($s)===''))staffFail('入力内容と文字数を確認してください。',400);return trim($s);}
function scVersion($value){return hash('sha256',json_encode($value,JSON_UNESCAPED_UNICODE));}
function scItemVersion($item){unset($item['reads']);return scVersion($item);}
function scData(){return readJsonStrict(__DIR__.'/data/student_contacts.php');}
function scOwner(){
 $token=$_COOKIE['timetable_contact_device']??'';
 if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token)){$token=bin2hex(random_bytes(32));setcookie('timetable_contact_device',$token,['expires'=>time()+31536000,'path'=>rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'])),'/').'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);}
 // The cookie identifies the submitting browser, never an authenticated student.
 return hash('sha256',$token);
}
function scWithin($periods,$date){foreach($periods as $p)if((empty($p['from'])||$p['from']<=$date)&&(empty($p['until'])||$date<$p['until']))return true;return false;}
function scClass($name,$directory){$seen=[];while(isset($directory['classNameAliases'][$name])&&!isset($seen[$name])){$seen[$name]=true;$name=$directory['classNameAliases'][$name];}return $name;}
function scSummary($r){return ['key'=>canonicalLessonKey(policyKey($r)),'sourceKey'=>$r['_sourceKey'],'date'=>str_replace('/','-',$r['日付']??''),'slot'=>$r['時間番号']??'','className'=>$r['クラス']??'','teacher'=>$r['担当講師']??'','start'=>$r['開始']??'','end'=>$r['終了']??''];}
function scKeys($v,$filterOnly=false){if(!is_array($v)||count($v)<1||count($v)>11||array_keys($v)!==range(0,count($v)-1))staffFail('対象の授業を選んでください。',400);foreach($v as $s)if(!is_string($s)||strlen($s)>2000||$s==='')staffFail('対象の授業を選び直してください。',400);if(!$filterOnly&&count(array_unique($v))!==count($v))staffFail('同じ授業を複数回選択しています。対象コマを選び直してください。',400);return $filterOnly?array_values(array_unique($v)):$v;}
function scContext($student,$keys){
 $keys=scKeys($keys);$all=policyRows();$dir=__DIR__.'/data';$directory=readJsonStrict($dir.'/directory_state.json');$base=readJsonStrict($dir.'/schedule_data.json');$master=readJsonStrict($dir.'/student_master.json',$base['students']??[]);$own=array_values(array_filter($master,fn($r)=>($r['生徒名']??'')===$student));
 if(!$own)staffFail('生徒名を選び直してください。',400);
 $states=readJsonStrict($dir.'/class_state.json');$eligible=[];$priorities=[];
 foreach($own as $m)$priorities[scClass($m['クラス']??'',$directory)]=(float)($m['優先度']??0);
 foreach($all as $r){
  $date=str_replace('/','-',$r['日付']??'');$class=scClass($r['クラス']??'',$directory);
  if(!empty($r['日区分'])||$date<date('Y-m-d')||$class===''||(!empty($directory['hiddenStudents'][$student])&&$date>=($directory['hiddenStudentFrom'][$student]??date('Y-m-d'))))continue;
  $members=array_values(array_filter($own,fn($m)=>scClass($m['クラス']??'',$directory)===$class&&scWithin($m['在籍期間']??[['from'=>'','until'=>'']],$date)));if(!$members)continue;
  $key=canonicalLessonKey(policyKey($r));$state=$states[$key]??[];$att=$state['attendance'][$student]??'';
  if($att!==''&&$att!=='---')$exempt=$att==='免除';elseif(isset($state['exemptionOverrides'][$student]))$exempt=(bool)$state['exemptionOverrides'][$student];else{$exempt=false;foreach($own as $m)if(scClass($m['クラス']??'',$directory)===$class&&scWithin($m['免除期間']??[],$date))$exempt=true;}
  if(!$exempt)$eligible[]=$r;
 }
 $visible=[];foreach($eligible as $r){$priority=$priorities[scClass($r['クラス'],$directory)]??0;$suppressed=false;foreach($eligible as $other)if(str_replace('/','-',$r['日付'])===str_replace('/','-',$other['日付'])&&($r['開始']??'')<($other['終了']??'')&&($other['開始']??'')<($r['終了']??'')&&($priorities[scClass($other['クラス'],$directory)]??0)>$priority){$suppressed=true;break;}if(!$suppressed)$visible[canonicalLessonKey(policyKey($r))]=$r;}
 $target=[];foreach($keys as $key){$canonical=canonicalLessonKey($key);if(!isset($visible[$canonical]))staffFail('参加予定が変わったか、連絡できる授業ではありません。予定表を再読み込みしてください。',409);$target[]=$visible[$canonical];}
 usort($target,fn($a,$b)=>strcmp($a['開始']??'',$b['開始']??''));$first=$target[0];$g=groupForSource($first['_sourceKey']);
 foreach($target as $r)if(str_replace('/','-',$r['日付'])!==str_replace('/','-',$first['日付'])||$r['クラス']!==$first['クラス']||(count($target)>1&&(!$g||!in_array($r['_sourceKey'],$g['sources'],true))))staffFail('同じ連結授業のコマを選んでください。',400);
 return ['student'=>$student,'lessons'=>array_map('scSummary',$target),'version'=>scVersion([$target,$own,$g?[$g['id'],$g['sources']]:null])];
}
function scCurrentRows(){static $rows=null;if($rows===null){$rows=[];foreach(policyRows() as $r)$rows[$r['_sourceKey']]=$r;}return $rows;}
function scCanRead($item,$actor){if($actor['role']==='admin')return true;$rows=scCurrentRows();foreach($item['lessons'] as $r)if($r['teacher']===$actor['name']||($rows[$r['sourceKey']]['担当講師']??'')===$actor['name'])return true;return false;}
function scPlan($in){
 $kind=scText($in,'kind',20);if(!in_array($kind,['','classroom','skip','other'],true))staffFail('授業内容への取り組み方を選んでください。',400);$date=scText($in,'date',10);$time=scText($in,'time',5);$text=scText($in,'text',3000);
 if($kind==='classroom'&&(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))))staffFail('教室で取り組む日を指定してください。',400);
 if($kind==='classroom'&&$time!==''&&!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$time))staffFail('教室で取り組む時刻を確認してください。',400);
 if($kind==='other'&&$text==='')staffFail('その他の内容を記入してください。',400);
 return ['kind'=>$kind,'date'=>$kind==='classroom'?$date:'','time'=>$kind==='classroom'?$time:'','text'=>$kind==='other'?$text:''];
}
function scAttendanceContext($item){if(!isset($GLOBALS['scAttendanceStates']))$GLOBALS['scAttendanceStates']=readJsonStrict(__DIR__.'/data/class_state.json');$all=$GLOBALS['scAttendanceStates'];$rows=scCurrentRows();$out=[];foreach($item['lessons'] as $r){$current=$rows[$r['sourceKey']]??null;if(!$current)continue;$key=canonicalLessonKey(policyKey($current));$out[$key]=['student'=>$item['student'],'value'=>$all[$key]['attendance'][$item['student']]??'---','row'=>scSummary($current),'exemption'=>$all[$key]['exemptionOverrides'][$item['student']]??null];}return $out;}
function scPublic($item,$staff=false){
 $out=array_intersect_key($item,array_flip(['id','student','lessons','kind','arrival','reason','createdAt','cancelledAt','plan','planUpdatedAt','confirmations','revision']));$out['version']=scItemVersion($item);
 $out['confirmed']=!empty($item['confirmations'])&&count($item['confirmations'])===count($item['lessons']);
 $out['attendance']=scAttendanceContext($item);$out['attendanceVersion']=scVersion($out['attendance']);
 if(!$staff){unset($out['attendanceVersion']);foreach($out['attendance'] as $key=>&$r){if(!isset($item['confirmations'][$key])){unset($out['attendance'][$key]);continue;}unset($r['exemption']);$r['value']=$item['confirmations'][$key]['value'];}unset($r);foreach($out['confirmations'] as &$r)unset($r['actorId']);unset($r);}
 else $out['read']=($item['reads'][staffCurrent()['id']]??0)===$item['revision'];
 if($staff){$out['links']=[];$rows=scCurrentRows();foreach($item['lessons'] as $r){$current=$rows[$r['sourceKey']]??null;if(!$current)continue;$g=groupForSource($r['sourceKey']);$url=$g?'lesson_group.html?v=20260916-r53&id='.rawurlencode($g['id']).'&attendance=1':'teacher2026summer_vertical.html?'.http_build_query(['teacher'=>$current['担当講師']??'','openKey'=>canonicalLessonKey(policyKey($current)),'date'=>str_replace('/','-',$current['日付']??''),'attendance'=>'1']);$out['links'][$url]=['url'=>$url,'label'=>$g?'連結授業の出欠を開く':($current['時間番号']??'').'の出欠を開く'];}$out['links']=array_values($out['links']);}
 return $out;
}
