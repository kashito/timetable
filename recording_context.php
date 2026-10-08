<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_roster.php';
function recordingTbdGuard($value,$before){if(trim((string)$value)==='未定'&&trim((string)$before)!=='未定'&&(staffCurrent()['role']??'')!=='admin')staffFail('未定としての記録は管理者のみ行えます。',403);}
function recordingDate($value){$value=str_replace('/','-',trim((string)$value));$stamp=strtotime($value);return $stamp===false?'':date('Y-m-d',$stamp);}
function recordingContext($inputKey){
 $key=canonicalLessonKey($inputKey);$all=policyRows();$group=null;$rows=[];
 foreach(lessonGroups() as $g)if(!empty($g['active'])){foreach(groupRows($g,$all) as $r)if($g['key']===$key||canonicalLessonKey(policyKey($r))===$key){$group=$g;$rows=groupRows($g,$all);$key=$g['key'];break 2;}}
 if(!$group)foreach($all as $r)if(canonicalLessonKey(policyKey($r))===$key){$rows=[$r];break;}
 if(!$rows)staffFail('授業が見つかりません。時間割から開き直してください。',404);
 $first=$rows[0];$date=recordingDate($first['日付']);$class=$first['クラス'];$dir=__DIR__.'/data';$students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$directory=readJsonStrict($dir.'/directory_state.json');$states=readJsonStrict($dir.'/class_state.json');$names=array_fill_keys(lessonRosterNames($students,$directory,$class,$date,[]),true);
 foreach($rows as $row)foreach(lessonInvitedStudents($states[canonicalLessonKey(policyKey($row))]??[]) as $name)if(empty($directory['hiddenStudents'][$name]))$names[$name]=true;$roster=array_keys($names);sort($roster,SORT_NATURAL);
 return ['key'=>$key,'date'=>$date,'className'=>$class,'teacher'=>$first['担当講師']??'','slots'=>implode('',array_column($rows,'時間番号')),'groupId'=>$group['id']??'','sources'=>array_column($rows,'_sourceKey'),'students'=>$roster,'seriesId'=>groupSeriesId($first)];
}
function recordingHomeworkLines($text){
 $lines=preg_split('/\R/u',trim((string)$text));$out=[];foreach($lines as $line){$line=trim($line);if($line!==''&&$line!=='宿題なし'&&$line!=='未定')$out[]=$line;}return $out;
}
// Direct assignments remain on their target lesson, separate from homework for the next lesson.
function recordingNormalizeHomework($text){if(!is_string($text)||strlen($text)>120000)staffFail('宿題の内容を確認してください',400);return implode("\n",array_unique(recordingHomeworkLines($text)));}
function recordingHomeworkTaskId($eventKey,$index,$text){return 'hw_'.substr(hash('sha256',$eventKey."\0".$index."\0".$text),0,24);}
function recordingPreviousHomework($key,$storedRecords=null,$student=''){
 $context=recordingContext($key);require_once __DIR__.'/homework_completion.php';if($student===''&&count($context['students'])===1)$student=$context['students'][0];if($student!==''&&!in_array($student,$context['students'],true))staffFail('この授業の生徒を選んでください',400);$raw=currentLessonEntries($storedRecords??readJsonStrict(__DIR__.'/data/lesson_records.json'));$records=groupRecordList($raw,true);$rows=[];$date='';$end='';
 foreach(policyRows() as $r){$rowDate=recordingDate($r['日付']??'');if($rowDate===''||groupSeriesId($r)!==$context['seriesId']||$rowDate>=$context['date'])continue;$rows[]=$r;if($rowDate>$date){$date=$rowDate;$end='';}if($rowDate===$date){$time=groupRowTime($r,'終了');if(preg_match('/^(\d{1,2}):(\d{2})$/D',$time,$m)&&((int)$m[1])<24&&((int)$m[2])<60){$time=sprintf('%02d:%02d',(int)$m[1],(int)$m[2]);if($time>$end)$end=$time;}}}
 usort($rows,fn($a,$b)=>strcmp(recordingDate($a['日付']).' '.groupRowTime($a,'開始'),recordingDate($b['日付']).' '.groupRowTime($b,'開始')));
 // A linked lesson exposes the same common homework through each member period. Treat
 // identical text assigned on the same day as one logical task, while retaining every
 // former task id so checks saved before this de-duplication continue to work.
 $tasks=[];$latestTaskDate='';foreach($rows as $r){$record=$records[canonicalLessonKey(policyKey($r))]??[];$source=(string)($record['eventKey']??canonicalLessonKey(policyKey($r)));$assignedDate=recordingDate($r['日付']);foreach(recordingHomeworkLines($record['homework']??'') as $i=>$text){$id=recordingHomeworkTaskId($source,$i,$text);$logical=hash('sha256',$assignedDate."\0".$text);if(!isset($tasks[$logical]))$tasks[$logical]=['id'=>$id,'text'=>$text,'assignedDate'=>$assignedDate,'aliases'=>[]];if(!in_array($id,$tasks[$logical]['aliases'],true))$tasks[$logical]['aliases'][]=$id;if($assignedDate>$latestTaskDate)$latestTaskDate=$assignedDate;}}
 $ordered=array_values($raw);usort($ordered,fn($a,$b)=>strcmp((string)($a['date']??'').(string)($a['updatedAt']??''),(string)($b['date']??'').(string)($b['updatedAt']??'')));$checks=[];
 foreach($ordered as $record){if(recordingDate($record['date']??'')>$context['date'])continue;foreach(($record['homeworkChecks']??[]) as $id=>$entry)$checks[$id]=is_array($entry)?!empty($entry['checked']):(bool)$entry;}
 $current=$raw[$context['key']]['homeworkChecks']??[];$items=[];foreach($tasks as $task){$id=$task['id'];$aliases=$task['aliases'];$hasCurrent=false;$hasSaved=false;foreach($aliases as $alias){if(array_key_exists($alias,$current))$hasCurrent=true;if(array_key_exists($alias,$checks))$hasSaved=true;}
  // Once the consolidated id is saved it is authoritative, including an explicit
  // uncheck. Before that, accept a checked state stored under any former member id.
  if(array_key_exists($id,$current))$checked=is_array($current[$id])?!empty($current[$id]['checked']):(bool)$current[$id];else{$checked=false;$sourceChecks=$hasCurrent?$current:$checks;foreach($aliases as $alias)if(array_key_exists($alias,$sourceChecks)){ $value=$sourceChecks[$alias];if(is_array($value)?!empty($value['checked']):(bool)$value){$checked=true;break;} }}
  $canonical=homeworkCanonicalId($context['seriesId'],$task['assignedDate'],'next',$task['text']);$sourceRows=array_values(array_filter($rows,fn($row)=>recordingDate($row['日付'])===$task['assignedDate']));$legacy=homeworkLegacyChecked(homeworkSourceAliases($sourceRows,$raw,$task['text']),$raw);$personal=$student!==''?(homeworkStudentStates()[$student][$canonical]??null):null;if($student!=='')$checked=homeworkState($student,$canonical,$legacy)['checked'];
  $visible=$student!==''?($hasCurrent||$task['assignedDate']===$latestTaskDate||!$checked||$personal!==null):($hasCurrent||$task['assignedDate']===$latestTaskDate||($hasSaved&&!$checked));if($visible&&($student!==''||!$checked||$hasCurrent)){unset($task['aliases']);$task['checked']=$checked;$items[]=$task;}}
 require_once __DIR__.'/homework_completion.php';if($student===''&&count($context['students'])===1)$student=$context['students'][0];if($student!==''&&!in_array($student,$context['students'],true))staffFail('この授業の生徒を選んでください',400);
 $eligible=$student!==''?array_column(homeworkCatalog($student),null,'id'):null;
 foreach($items as &$item){$item['canonicalId']=homeworkCanonicalId($context['seriesId'],$item['assignedDate'],'next',$item['text']);if($student!=='')$item=array_replace($item,homeworkState($student,$item['canonicalId'],$item['checked']));}unset($item);
 if($eligible!==null)$items=array_values(array_filter($items,fn($item)=>isset($eligible[$item['canonicalId']])));
 return ['student'=>$student,'students'=>$context['students'],'date'=>$date,'endTime'=>$end,'endedAt'=>$date!==''&&$end!==''?$date.'T'.$end.':00+09:00':null,'serverNow'=>date('c'),'homework'=>implode("\n",array_column($items,'text')),'items'=>$items,'dueDate'=>$context['date']];
}
