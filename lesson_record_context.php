<?php
// Timings are read separately from record creation/edit dates. Linked lessons end at their last slot.
function recordLessonTimings($records){
 $rows=policyRows();$byKey=[];foreach($rows as $row)if(empty($row['日区分']))$byKey[canonicalLessonKey(policyKey($row))]=$row;
 $groups=lessonGroups();$out=[];$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];$ends=['14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40','22:30'];
 foreach($records as $key=>$record){
  $group=$groups[$record['groupId']??'']??null;$valid=true;
  if($group){$members=!empty($group['active'])?groupRows($group,$rows):($group['snapshot']??[]);if(count($members)!==count($group['sources']??[]))$valid=false;}
  else $members=isset($byKey[$key])?[$byKey[$key]]:[['日付'=>$record['date']??'','時間番号'=>$record['slot']??'','終了'=>$record['end']??'']];
  $date=str_replace('/','-',trim((string)($members[0]['日付']??$record['date']??'')));$last=null;
  foreach($members as $row){
   $rd=str_replace('/','-',trim((string)($row['日付']??'')));$end=trim((string)($row['終了']??''));
   if($end===''){foreach($slots as $i=>$slot)if(strpos((string)($row['時間番号']??''),$slot)!==false)$end=$ends[$i];}
   $dt=DateTimeImmutable::createFromFormat('!Y-m-d H:i',$rd.' '.$end,new DateTimeZone('Asia/Tokyo'));
   if(!$dt||$dt->format('Y-m-d H:i')!==$rd.' '.$end){$valid=false;continue;}
   if(!$last||$dt>$last)$last=$dt;
  }
  $out[$key]=['date'=>$date,'endAt'=>$valid&&$last?$last->format('c'):null];
 }
 return $out;
}
// Read-only attendance summary for the authenticated record list.
function recordAttendanceContext($records){
 $dir=__DIR__.'/data';$states=readJsonStrict($dir.'/class_state.json');
 $students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);
 $directory=readJsonStrict($dir.'/directory_state.json');$aliases=$directory['classNameAliases']??[];
 $className=function($name)use($aliases){$seen=[];while(isset($aliases[$name])&&!isset($seen[$name])){$seen[$name]=true;$name=$aliases[$name];}return $name;};
 $within=function($periods,$date){foreach($periods as $p)if((empty($p['from'])||$p['from']<=$date)&&(empty($p['until'])||$date<$p['until']))return true;return false;};
 $byClass=[];foreach($students as $student)if(!empty($student['生徒名']))$byClass[$className($student['クラス']??'')][]=$student;
 $rows=policyRows();$byKey=[];foreach($rows as $row)if(empty($row['日区分']))$byKey[canonicalLessonKey(policyKey($row))]=$row;
 $groups=lessonGroups();$out=[];
 foreach($records as $key=>$record){
  $group=$groups[$record['groupId']??'']??null;
  $members=$group?(!empty($group['active'])?groupRows($group,$rows):($group['snapshot']??[])):[$byKey[$key]??['日付'=>$record['date']??'','時間番号'=>$record['slot']??'','クラス'=>$record['className']??'','担当講師'=>$record['teacher']??'']];
  $items=[];
  foreach($members as $row){
   $memberKey=$group?canonicalLessonKey(policyKey($row)):$key;$state=$states[$memberKey]??[];
   $date=str_replace('/','-',$row['日付']??'');$class=$className($row['クラス']??'');$roster=[];$autoExempt=[];
   foreach($byClass[$class]??[] as $student){
    $name=$student['生徒名'];if(!$within($student['在籍期間']??[['from'=>'','until'=>'']],$date))continue;
    if(!empty($directory['hiddenStudents'][$name]))continue;
    $roster[$name]=true;if($within($student['免除期間']??[],$date))$autoExempt[$name]=true;
   }
   // Actual saved attendance survives later roster edits or student hiding.
   foreach($state['attendance']??[] as $name=>$status)if($status!==''&&$status!=='---')$roster[$name]=true;
   $statuses=['出席'=>[],'欠席'=>[],'遅刻'=>[],'早退'=>[],'免除'=>[],'その他'=>[],'不明'=>[],'未定'=>[]];$missing=[];
   foreach(array_keys($roster) as $name){
    $status=$state['attendance'][$name]??'';
    if($status===''||$status==='---')$status=($state['exemptionOverrides'][$name]??isset($autoExempt[$name]))?'免除':'';
    if(isset($statuses[$status]))$statuses[$status][]=$name;else $missing[]=$name;
   }
   foreach($statuses as &$names)sort($names,SORT_STRING);unset($names);sort($missing,SORT_STRING);
   $items[]=['eventKey'=>$memberKey,'date'=>$date,'slot'=>$row['時間番号']??'','teacher'=>$row['担当講師']??'',
    'groupId'=>!empty($group['active'])?$group['id']:'','editable'=>isset($byKey[$memberKey]),'statuses'=>$statuses,'missing'=>$missing,'total'=>count($roster)];
  }
  $out[$key]=$items;
 }
 return $out;
}
