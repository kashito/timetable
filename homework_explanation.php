<?php
require_once __DIR__.'/homework_completion.php';
function homeworkSharedSeriesId($row){if(isset($row['_homeworkSeries']))return $row['_homeworkSeries'];$id=groupSeriesId($row);return strpos($id,'ID:')===0?$id.'|CLASS:'.trim((string)($row['クラス']??'')):$id;}
function homeworkSharedRows(){
 $rows=policyRows();$series=[];foreach(lessonGroups() as $g)if(!empty($g['active'])){$members=groupRows($g,$rows);if(!$members)continue;$sid=homeworkSharedSeriesId($members[0]);foreach($g['sources'] as $source)$series[$source]=$sid;}foreach($rows as &$row)if(isset($series[$row['_sourceKey']]))$row['_homeworkSeries']=$series[$row['_sourceKey']];unset($row);return $rows;
}
// A separate store: personal submissions and old browser completion are never
// promoted to a teacher's shared explanation status.
function homeworkExplanationStates(){return readJsonStrict(__DIR__.'/data/homework_explanation_checks.php');}
function homeworkExplanationState($ids,$states=null){
 $states=$states??homeworkExplanationStates();$entries=[];$checked=false;
 foreach(array_unique($ids) as $id){$entry=$states[$id]??null;$entries[$id]=$entry;if($entry&&($entry['scope']??'')==='explanation'&&!empty($entry['checked']))$checked=true;}
 return ['checked'=>$checked,'revision'=>hash('sha256',json_encode($entries,JSON_UNESCAPED_UNICODE)),'completionScope'=>'explanation'];
}
function homeworkRecordOwner($key,$record,$rows=null){
 $target=canonicalLessonKey($key);$group=strpos($key,'GROUP:')===0?(lessonGroups()[substr($key,6)]??null):null;foreach($rows??policyRows() as $r)if(canonicalLessonKey(policyKey($r))===$target||($group&&in_array($r['_sourceKey'],$group['sources']??[],true)))return $r;
 return ['日付'=>$record['date']??'','クラス'=>$record['className']??'','担当講師'=>$record['teacher']??'','種別'=>'授業','科目'=>$record['subject']??''];
}
function homeworkRecordRefs($record,$owner){
 $result=[];$sid=homeworkSharedSeriesId($owner);$date=recordingDate($owner['日付']??'');$scope=(string)($record['eventKey']??logicalRecordKey(policyKey($owner)));
 foreach(['next'=>'homework','due'=>'dueHomework'] as $kind=>$field){
  $known=[];foreach($record['homeworkTaskRefs'][$kind]??[] as $ref)if(is_array($ref)&&isset($ref['id'],$ref['text']))$known[$ref['text']]=$ref;
  foreach(isset($record['homeworkTaskRefs'][$kind])?[]:($record['sourceRecords']??[]) as $source)foreach($source['homeworkTaskRefs'][$kind]??[] as $ref)if(is_array($ref)&&isset($ref['id'],$ref['text'])){$text=$ref['text'];if(!isset($known[$text]))$known[$text]=$ref;else $known[$text]['aliases']=array_values(array_unique(array_merge($known[$text]['aliases']??[],[$ref['id']],$ref['aliases']??[])));}
  $result[$kind]=[];foreach(array_unique(recordingHomeworkLines($record[$field]??'')) as $text)$result[$kind][]=$known[$text]??['id'=>homeworkCanonicalId($sid.'|TASK:'.$scope,$date,$kind,$text),'text'=>$text];
 }return $result;
}
function homeworkDecorateRecord($key,$record,$rows=null){if(!$record)return $record;$record['homeworkTaskRefs']=homeworkRecordRefs($record,homeworkRecordOwner($key,$record,$rows));return $record;}
function homeworkApplyRefs($key,$record,$existing,$provided=null,$owner=null){
 $owner=$owner??homeworkRecordOwner($key,$record);$old=homeworkRecordRefs($existing,$owner);$result=[];$used=[];
 foreach(homeworkHistoricalRecords(readJsonStrict(__DIR__.'/data/lesson_records.json')) as $other)foreach($other['homeworkTaskRefs']??[] as $refs)foreach($refs as $ref)if(is_array($ref)&&isset($ref['id']))$used[$ref['id']]=true;
 foreach(array_keys(homeworkExplanationStates()) as $id)$used[$id]=true;
 if($provided!==null&&!is_array($provided))staffFail('宿題の項目を読み込み直してください',400);
 foreach(['next'=>'homework','due'=>'dueHomework'] as $kind=>$field){
  $texts=array_values(array_unique(recordingHomeworkLines($record[$field]??'')));$known=array_column($old[$kind],null,'id');$byText=array_column($old[$kind],null,'text');$refs=[];
  if(is_array($provided)&&array_key_exists($kind,$provided)){
   if(!is_array($provided[$kind])||count($provided[$kind])!==count($texts))staffFail('宿題の本文と項目が一致しません。入力を控えて読み込み直してください',409);
   foreach($provided[$kind] as $i=>$ref){$id=$ref['id']??null;if(!is_array($ref)||!is_string($id)||!preg_match('/^(hwc_[a-f0-9]{24}|hwx_[a-f0-9]{32})$/D',$id)||($ref['text']??null)!==$texts[$i]||isset($refs[$id]))staffFail('宿題の項目を確認してください',400);
    if(!isset($known[$id])&&(strpos($id,'hwx_')!==0||isset($used[$id])))staffFail('別の宿題の識別子は使用できません。最新の項目を確認してください',409);
    $refs[$id]=array_replace($known[$id]??[],['id'=>$id,'text'=>$texts[$i]]);
   }
  }else foreach($texts as $text){$ref=$byText[$text]??['id'=>'hwx_'.bin2hex(random_bytes(16)),'text'=>$text];$refs[$ref['id']]=$ref;}
  $result[$kind]=array_values($refs);
 }unset($record['_homeworkRefSeedRevision']);$record['homeworkTaskRefs']=$result;return $record;
}
function homeworkSharedAssignments(){
 $rows=homeworkSharedRows();$raw=currentLessonEntries(readJsonStrict(__DIR__.'/data/lesson_records.json'));$records=groupRecordList($raw);foreach(lessonGroups() as $g)if(!empty($g['active'])&&isset($records[$g['key']]))foreach(groupRows($g,$rows) as $member)$records[canonicalLessonKey(policyKey($member))]=$records[$g['key']];$days=[];$items=[];
 foreach($rows as $r)if(empty($r['日区分']))$days[homeworkSharedSeriesId($r)][recordingDate($r['日付'])][]=$r;
 foreach($days as $sid=>$dates){ksort($dates);$keys=array_keys($dates);foreach($dates as $date=>$members){
  usort($members,fn($a,$b)=>strcmp(groupRowTime($a,'開始'),groupRowTime($b,'開始')));$index=array_search($date,$keys,true);$next=$keys[$index+1]??'';$nextRows=$next!==''?$dates[$next]:[];usort($nextRows,fn($a,$b)=>strcmp(groupRowTime($a,'開始'),groupRowTime($b,'開始')));
  foreach($members as $r){$key=canonicalLessonKey(policyKey($r));$record=$records[$key]??[];$refs=homeworkRecordRefs($record,$r);
   foreach(['next','due'] as $kind)foreach($refs[$kind] as $ref){$canonical=$ref['id'];$targets=$kind==='due'?$members:$nextRows;$dueDate=$kind==='due'?$date:$next;
    if(!isset($items[$canonical]))$items[$canonical]=['id'=>$ref['id'],'canonicalId'=>$canonical,'text'=>$ref['text'],'seriesId'=>$sid,'className'=>$r['クラス'],'assignedDate'=>$date,'kind'=>$kind,'dueAt'=>$dueDate!==''?$dueDate.'T'.groupRowTime($targets[0],'開始').':00+09:00':null,'targetKeys'=>array_map('policyKey',$targets),'sourceKeys'=>[],'aliases'=>[]];
    $items[$canonical]['aliases']=array_merge($items[$canonical]['aliases'],[$ref['id']],$ref['aliases']??[]);$items[$canonical]['sourceKeys'][]=policyKey($r);
   }
  }
 }}
 foreach($items as $canonical=>$due)if($due['kind']==='due'){$matching=[];foreach($items as $nextKey=>$next)if($next['kind']==='next'&&$next['seriesId']===$due['seriesId']&&$next['text']===$due['text']&&substr($next['dueAt']??'',0,10)===$due['assignedDate']&&array_intersect($next['targetKeys'],$due['targetKeys']))$matching[]=$nextKey;if(count($matching)===1){$nextKey=$matching[0];$items[$nextKey]['aliases']=array_merge($items[$nextKey]['aliases'],$due['aliases']);$items[$nextKey]['sourceKeys']=array_values(array_unique(array_merge($items[$nextKey]['sourceKeys'],$due['sourceKeys'])));unset($items[$canonical]);}}
 $states=homeworkExplanationStates();foreach($items as &$item){$item['aliases']=array_values(array_unique($item['aliases']));$item+=homeworkExplanationState($item['aliases'],$states);}unset($item);return array_values($items);
}
function homeworkSharedCatalog($student){
 $dir=__DIR__.'/data';$master=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$directory=readJsonStrict($dir.'/directory_state.json');$known=false;foreach($master as $r)if(($r['生徒名']??'')===$student&&empty($directory['hiddenStudents'][$student]))$known=true;if(!$known)staffFail('生徒が見つかりません',404);
 $eligible=homeworkEligibleRows($student,homeworkSharedRows(),$master,$directory,readJsonStrict($dir.'/class_state.json'));$keys=array_fill_keys(array_map('policyKey',$eligible),true);$dates=[];foreach($eligible as $r)$dates[homeworkSharedSeriesId($r)][recordingDate($r['日付'])][]=$r;foreach($dates as &$days)ksort($days);unset($days);$result=[];
 foreach(homeworkSharedAssignments() as $item){$sources=array_values(array_filter($eligible,fn($r)=>in_array(policyKey($r),$item['sourceKeys'],true)));if(!$sources)continue;usort($sources,fn($a,$b)=>strcmp(groupRowTime($a,'開始'),groupRowTime($b,'開始')));$date=$item['assignedDate'];
  if($item['kind']==='next'){if(strtotime($date.'T'.groupRowTime($sources[0],'開始').':00+09:00')>time())continue;$next='';foreach(array_keys($dates[$item['seriesId']]??[]) as $candidate)if($candidate>$date){$next=$candidate;break;}$targets=$next!==''?$dates[$item['seriesId']][$next]:[];$dueDate=$next;}
  else{$targets=$sources;$dueDate=$date;}
  usort($targets,fn($a,$b)=>strcmp(groupRowTime($a,'開始'),groupRowTime($b,'開始')));$item['targetKeys']=array_map('policyKey',$targets);$item['dueAt']=$dueDate!==''?$dueDate.'T'.groupRowTime($targets[0],'開始').':00+09:00':null;unset($item['sourceKeys'],$item['aliases'],$item['seriesId']);$result[$item['id']]=$item;
 }return array_values($result);
}
function recordingSharedHomework($key){
 $context=recordingContext($key);$series=homeworkSharedSeriesId(homeworkRecordOwner($context['key'],[],homeworkSharedRows()));$items=[];$date='';$end='';
 foreach(homeworkSharedAssignments() as $item){if($item['seriesId']!==$series||$item['assignedDate']>$context['date']||($item['kind']==='next'&&$item['assignedDate']===$context['date']))continue;$items[]=$item;if($item['assignedDate']>$date)$date=$item['assignedDate'];}
 foreach(policyRows() as $r)if(homeworkSharedSeriesId($r)===$series&&recordingDate($r['日付'])===$date&&groupRowTime($r,'終了')>$end)$end=groupRowTime($r,'終了');
 return ['student'=>'','students'=>[],'completionScope'=>'explanation','date'=>$date,'endTime'=>$end,'endedAt'=>$date!==''&&$end!==''?$date.'T'.$end.':00+09:00':null,'serverNow'=>date('c'),'items'=>$items,'homework'=>implode("\n",array_column(array_filter($items,fn($i)=>!$i['checked']),'text')),'dueDate'=>$context['date']];
}
