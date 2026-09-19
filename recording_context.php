<?php
require_once __DIR__.'/lesson_groups.php';
function recordingTbdGuard($value,$before){if(trim((string)$value)==='未定'&&trim((string)$before)!=='未定'&&(staffCurrent()['role']??'')!=='admin')staffFail('未定としての記録は管理者のみ行えます。',403);}
function recordingContext($inputKey){
 $key=canonicalLessonKey($inputKey);$all=policyRows();$group=null;$rows=[];
 foreach(lessonGroups() as $g)if(!empty($g['active'])){foreach(groupRows($g,$all) as $r)if($g['key']===$key||canonicalLessonKey(policyKey($r))===$key){$group=$g;$rows=groupRows($g,$all);$key=$g['key'];break 2;}}
 if(!$group)foreach($all as $r)if(canonicalLessonKey(policyKey($r))===$key){$rows=[$r];break;}
 if(!$rows)staffFail('授業が見つかりません。時間割から開き直してください。',404);
 $first=$rows[0];$date=str_replace('/','-',$first['日付']);$class=$first['クラス'];$dir=__DIR__.'/data';$students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$directory=readJsonStrict($dir.'/directory_state.json');$names=[];
 foreach($students as $s){$name=$s['生徒名']??'';if(!$name||($s['クラス']??'')!==$class||!empty($directory['hiddenStudents'][$name]))continue;$active=!isset($s['在籍期間']);foreach($s['在籍期間']??[] as $p)if((empty($p['from'])||$p['from']<=$date)&&(empty($p['until'])||$date<$p['until']))$active=true;if($active)$names[$name]=true;}
 return ['key'=>$key,'date'=>$date,'className'=>$class,'teacher'=>$first['担当講師']??'','slots'=>implode('',array_column($rows,'時間番号')),'groupId'=>$group['id']??'','sources'=>array_column($rows,'_sourceKey'),'students'=>array_keys($names)];
}
function recordingPreviousHomework($key){
 $context=recordingContext($key);$rows=array_values(array_filter(policyRows(),fn($r)=>($r['クラス']??'')===$context['className']&&str_replace('/','-',$r['日付'])<$context['date']));
 $dates=array_map(fn($r)=>str_replace('/','-',$r['日付']),$rows);rsort($dates);$date=$dates[0]??'';$homework=[];$end='';$records=groupRecordList(currentLessonEntries(readJsonStrict(__DIR__.'/data/lesson_records.json')),true);
 foreach($rows as $r)if(str_replace('/','-',$r['日付'])===$date){$time=trim((string)($r['終了']??''));if(preg_match('/^(\d{1,2}):(\d{2})$/D',$time,$m)&&((int)$m[1])<24&&((int)$m[2])<60){$time=sprintf('%02d:%02d',(int)$m[1],(int)$m[2]);if($time>$end)$end=$time;}$text=trim((string)($records[canonicalLessonKey(policyKey($r))]['homework']??''));if($text!=='')$homework[$text]=true;}
 return ['date'=>$date,'endTime'=>$end,'endedAt'=>$date!==''&&$end!==''?$date.'T'.$end.':00+09:00':null,'serverNow'=>date('c'),'homework'=>implode("\n",array_keys($homework)),'dueDate'=>$context['date']];
}
