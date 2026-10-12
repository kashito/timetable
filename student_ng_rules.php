<?php
require_once __DIR__.'/lesson_groups.php';require_once __DIR__.'/lesson_roster.php';
function studentNgTime($value){
 if(!is_string($value)||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/D',$value))return null;
 $date=DateTimeImmutable::createFromFormat('!Y-m-d\TH:i',$value,new DateTimeZone('Asia/Tokyo'));
 return $date&&$date->format('Y-m-d\TH:i')===$value?$date->getTimestamp():null;
}
function studentNgData(){
 $data=readJsonStrict(__DIR__.'/data/student_ng.php',['schema'=>1,'entries'=>[]]);
 if(($data['schema']??null)!==1||!is_array($data['entries']??null))dataError('生徒NGの形式を確認してください。上書きせず停止しました。');
 foreach($data['entries'] as $id=>$entry)if(!is_array($entry)||($entry['id']??'')!==$id||!preg_match('/^[a-f0-9]{24}$/D',(string)$id)||!is_string($entry['student']??null)||trim($entry['student'])===''||studentNgTime($entry['fromAt']??null)===null||studentNgTime($entry['untilAt']??null)===null||studentNgTime($entry['fromAt'])>=studentNgTime($entry['untilAt']))dataError('生徒NGの日時を確認してください。上書きせず停止しました。');
 return $data;
}
function studentNgSnapshot($changes=[]){
 $dir=__DIR__.'/data';$out=[];foreach(['schedule_data.json','added_lessons.json','edited_lessons.json','student_master.json','directory_state.json','class_state.json','lesson_groups.json','lesson_key_aliases.json','room_overrides.json'] as $name){$file=$dir.'/'.$name;$out[$name]=array_key_exists($file,$changes)?$changes[$file]:readJsonStrict($file);}
 if(!array_key_exists($dir.'/student_master.json',$changes)&&!is_file($dir.'/student_master.json'))$out['student_master.json']=$out['schedule_data.json']['students']??[];
 return $out;
}
function studentNgResolve($key,$aliases){$seen=[];while(isset($aliases[$key])&&!isset($seen[$key])){$seen[$key]=true;$key=(string)$aliases[$key];}return $key;}
function studentNgRows($snapshot){
 $edits=$snapshot['edited_lessons.json'];$out=[];
 foreach($snapshot['schedule_data.json']['schedule']??[] as $i=>$base){$source='XLSX:'.implode('|',[$i,str_replace('-','/',$base['日付']??''),$base['時間番号']??'',$base['クラス']??'',$base['担当講師']??'']);$row=$edits[$source]??$base;if(empty($row['_deleted'])){$row['_sourceKey']=$source;$out[$source]=$row;}}
 foreach($snapshot['added_lessons.json'] as $base){$source='ADD:'.($base['_追加ID']??'');$row=$edits[$source]??$base;if(empty($row['_deleted'])){$row['_sourceKey']=$source;$out[$source]=$row;}}
 foreach($out as &$row){$key=studentNgResolve(policyKey($row),$snapshot['lesson_key_aliases.json']);if(isset($snapshot['room_overrides.json'][$key]['room']))$row['教室']=$snapshot['room_overrides.json'][$key]['room'];}unset($row);return $out;
}
function studentNgPrepareSnapshot($snapshot,$rows,$ngNames){
 $snapshot['_ngNames']=$ngNames;$snapshot['_ngMasterClasses']=[];$snapshot['_ngGroupInvites']=[];
 foreach($snapshot['student_master.json'] as $student){if(!isset($ngNames[$student['生徒名']??'']))continue;$class=studentNgResolve((string)($student['クラス']??''),$snapshot['directory_state.json']['classNameAliases']??[]);$student['クラス']=$class;$snapshot['_ngMasterClasses'][$class][]=$student;}
 foreach($snapshot['lesson_groups.json'] as $group)if(!empty($group['active'])){$invited=[];foreach($group['sources']??[] as $source)if(isset($rows[$source])){$key=studentNgResolve(policyKey($rows[$source]),$snapshot['lesson_key_aliases.json']);$invited=array_merge($invited,lessonInvitedStudents($snapshot['class_state.json'][$key]??[]));}foreach($group['sources']??[] as $source)$snapshot['_ngGroupInvites'][$source]=array_values(array_unique($invited));}
 return $snapshot;
}
function studentNgRoster($row,$snapshot,$rows){
 $date=str_replace('/','-',$row['日付']??'');$directory=$snapshot['directory_state.json'];$class=studentNgResolve((string)($row['クラス']??''),$directory['classNameAliases']??[]);$master=isset($snapshot['_ngMasterClasses'])?($snapshot['_ngMasterClasses'][$class]??[]):$snapshot['student_master.json'];foreach($master as &$student)$student['クラス']=studentNgResolve((string)($student['クラス']??''),$directory['classNameAliases']??[]);unset($student);
 $key=studentNgResolve(policyKey($row),$snapshot['lesson_key_aliases.json']);$state=$snapshot['class_state.json'][$key]??[];$invited=lessonInvitedStudents($state);
 if(isset($snapshot['_ngGroupInvites']))$invited=array_merge($invited,$snapshot['_ngGroupInvites'][$row['_sourceKey']]??[]);else foreach($snapshot['lesson_groups.json'] as $group)if(!empty($group['active'])&&in_array($row['_sourceKey'],$group['sources']??[],true))foreach($group['sources'] as $source)if(isset($rows[$source])){$memberKey=studentNgResolve(policyKey($rows[$source]),$snapshot['lesson_key_aliases.json']);$invited=array_merge($invited,lessonInvitedStudents($snapshot['class_state.json'][$memberKey]??[]));}
 $state['invitedStudents']=array_values(array_unique($invited));$names=lessonRosterNames($master,$directory,$class,$date,$state);if(isset($snapshot['_ngNames']))$names=array_values(array_filter($names,fn($name)=>isset($snapshot['_ngNames'][$name])));$out=[];
 foreach($names as $name){$attendance=$state['attendance'][$name]??'';if($attendance==='免除'||($attendance===''||$attendance==='---')&&($state['exemptionOverrides'][$name]??false))continue;
  $own=array_values(array_filter($master,fn($student)=>($student['生徒名']??'')===$name&&($student['クラス']??'')===$class&&lessonStudentActive($student,$date)));$exempt=false;if($attendance===''||$attendance==='---')foreach($own as $student)foreach($student['免除期間']??[] as $period)if((empty($period['from'])||$period['from']<=$date)&&(empty($period['until'])||$date<$period['until']))$exempt=true;
  if(!$exempt||($state['exemptionOverrides'][$name]??null)===false)$out[]=$name;
 }sort($out,SORT_NATURAL);return $out;
}
function studentNgLessonTime($row,$field){
 $value=groupRowTime($row,$field);$raw=$row[$field]??'';
 if(is_numeric($value)&&((is_int($raw)||is_float($raw))||(float)$value>=0&&(float)$value<2)){$fraction=fmod((float)$value,1);if($fraction<0)$fraction+=1;$minutes=(int)round($fraction*1440)%1440;return sprintf('%02d:%02d',intdiv($minutes,60),$minutes%60);}
 if(preg_match('/^(\d{1,2}):(\d{2})/',$value,$match))return sprintf('%02d:%02d',(int)$match[1],(int)$match[2]);return $value;
}
function studentNgInterval($row){
 $date=str_replace('/','-',$row['日付']??'');$from=studentNgTime($date.'T'.studentNgLessonTime($row,'開始'));$until=studentNgTime($date.'T'.studentNgLessonTime($row,'終了'));
 if($from===null||$until===null)return null;if($until<$from)$until+=86400;return $until>$from?[$from,$until]:null;
}
function studentNgGuardChanges($changes){
 $input=json_decode($_POST['payload']??file_get_contents('php://input'),true);$override=!empty($input['overrideStudentNg'])||($_POST['overrideStudentNg']??'')==='1';
 $ng=studentNgData()['entries'];if(!$ng)return;$before=studentNgSnapshot();$after=studentNgSnapshot($changes);$oldRows=studentNgRows($before);$rows=studentNgRows($after);$conflicts=[];$ngNames=[];$bounds=[];foreach($ng as $entry){$ngNames[$entry['student']]=true;$bounds[]=array_replace($entry,['_from'=>studentNgTime($entry['fromAt']),'_until'=>studentNgTime($entry['untilAt'])]);}$before=studentNgPrepareSnapshot($before,$oldRows,$ngNames);$after=studentNgPrepareSnapshot($after,$rows,$ngNames);$low=min(array_column($bounds,'_from'));$high=max(array_column($bounds,'_until'));
 foreach($rows as $source=>$row){if(!empty($row['日区分']))continue;$interval=studentNgInterval($row);if(!$interval||$interval[1]<=$low||$interval[0]>=$high)continue;$relevant=array_values(array_filter($bounds,fn($entry)=>$interval[0]<$entry['_until']&&$entry['_from']<$interval[1]));if(!$relevant)continue;$names=studentNgRoster($row,$after,$rows);$old=$oldRows[$source]??null;$oldNames=$old?studentNgRoster($old,$before,$oldRows):[];
  if($old&&!scheduleFieldsChanged($old,$row))$names=array_values(array_diff($names,$oldNames));if(!$names)continue;
  foreach($relevant as $entry)if(in_array($entry['student'],$names,true)){$label=str_replace('/','-',$row['日付']).' '.$row['時間番号'].' '.($row['クラス']??'').'：'.$entry['student'].'（NG '.str_replace('T',' ',$entry['fromAt']).'～'.str_replace('T',' ',$entry['untilAt']).'）';$conflicts[$label]=true;}
 }
 if($conflicts){$lines=array_keys($conflicts);sort($lines);$revision=hash('sha256',json_encode($lines,JSON_UNESCAPED_UNICODE));if($override&&hash_equals($revision,(string)($input['studentNgRevision']??$_POST['studentNgRevision']??'')))return;$message="生徒NGと授業の時間帯が重なります。\n".implode("\n",array_slice($lines,0,20));if(count($lines)>20)$message.="\nほか".(count($lines)-20).'件';http_response_code(409);header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>false,'studentNgConflict'=>true,'studentNgRevision'=>$revision,'error'=>$message."\nこのまま保存・配置しますか？"],JSON_UNESCAPED_UNICODE);exit;}
}
