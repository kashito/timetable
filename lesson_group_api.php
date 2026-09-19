<?php
require_once __DIR__.'/lesson_groups.php';require_once __DIR__.'/lesson_links.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$dir=__DIR__.'/data';$groups=lessonGroups();$allRows=policyRows();
$method=$_SERVER['REQUEST_METHOD'];$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);$action=$in['action']??'index';
if($method==='GET'&&$action==='index'){$out=[];foreach($groups as $g)if(!empty($g['active']))$out[]=groupSummary($g,groupRows($g,$allRows));echo json_encode(['ok'=>true,'groups'=>$out],JSON_UNESCAPED_UNICODE);exit;}
$actor=staffRequire($method!=='GET'&&$action!=='save');
$records=readJsonStrict($dir.'/lesson_records.json');$states=readJsonStrict($dir.'/class_state.json');
function lgVersion($g,$rows,$record,$states){$memberStates=[];foreach($rows as $r){$k=canonicalLessonKey(policyKey($r));$memberStates[$k]=$states[$k]??[];}$dir=__DIR__.'/data';$students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$class=$rows[0]['クラス']??'';$roster=array_values(array_filter($students,fn($r)=>($r['クラス']??'')===$class));$directory=readJsonStrict($dir.'/directory_state.json');return hash('sha256',json_encode([$g,$rows,$record,$memberStates,$roster,$directory['hiddenStudents']??[],$directory['hiddenStudentFrom']??[]],JSON_UNESCAPED_UNICODE));}
if($method==='GET'&&$action==='candidates'){
 staffRequire(true);$source=(string)($in['sourceKey']??'');$current=null;foreach($allRows as $r)if($r['_sourceKey']===$source)$current=$r;if(!$current)staffFail('授業が見つかりません',404);
 $out=[];foreach($allRows as $r)if(empty($r['日区分'])&&lgCompatible($current,$r)&&!groupForSource($r['_sourceKey']))$out[]=['row'=>$r,'record'=>$records[canonicalLessonKey(policyKey($r))]??[]];
 echo json_encode(['ok'=>true,'candidates'=>$out,'version'=>hash('sha256',json_encode([$out,$groups],JSON_UNESCAPED_UNICODE))],JSON_UNESCAPED_UNICODE);exit;
}
if($method==='POST'&&$action==='create'){
 $mealBreak=$in['mealBreak']??false;if(!is_bool($mealBreak))staffFail('食事休憩の有無を選んでください',400);
 $sources=$in['sources']??[];if(!is_array($sources)||count($sources)<2||count($sources)>11||count(array_unique($sources))!==count($sources))staffFail('連続する2コマ以上を選んでください',400);
 $rows=[];foreach($sources as $s){if(groupForSource($s))staffFail('選んだコマはすでに連結されています。開き直してください。',409);$found=null;foreach($allRows as $r)if($r['_sourceKey']===$s)$found=$r;if(!$found)staffFail('授業が変更されました。開き直してください。',409);$rows[]=$found;}
 $slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];usort($rows,fn($a,$b)=>array_search($a['時間番号'],$slots,true)<=>array_search($b['時間番号'],$slots,true));
 $prev=null;foreach($rows as $r){$i=array_search($r['時間番号']??'',$slots,true);if($i===false||!empty($r['日区分'])||!lgCompatible($rows[0],$r)||($prev!==null&&$i!==$prev+1))staffFail('同じ日・クラス・講師・教室・授業内容の、連続するコマを選んでください',400);$prev=$i;}
 $candidates=[];foreach($allRows as $r)if(empty($r['日区分'])&&lgCompatible($rows[0],$r)&&!groupForSource($r['_sourceKey']))$candidates[]=['row'=>$r,'record'=>$records[canonicalLessonKey(policyKey($r))]??[]];
 if(!hash_equals(hash('sha256',json_encode([$candidates,$groups],JSON_UNESCAPED_UNICODE)),(string)($in['version']??'')))staffFail('授業またはカルテが更新されました。開き直して確認してください。',409);
 [$g,$record]=buildLessonGroup($rows,$records,$actor,$mealBreak);$id=$g['id'];$records[$g['key']]=$record;$groups[$id]=$g;
 if(!safeDataTransaction([$dir.'/lesson_groups.json'=>$groups,$dir.'/lesson_records.json'=>$records]))staffFail('連結を保存できません',500);echo json_encode(['ok'=>true,'group'=>groupSummary($g,$rows)],JSON_UNESCAPED_UNICODE);exit;
}
$id=(string)($in['id']??'');$g=$groups[$id]??null;if(!$g)staffFail('連結した授業が見つかりません',404);$rows=groupRows($g,$allRows);if(empty($g['active']))$rows=$g['snapshot']??$rows;
if(!empty($g['active'])&&count($rows)!==count($g['sources']))staffFail('連結中の授業が変更されています。管理者に確認してください。',409);
$key=$g['key'];$record=$records[$key]??[];$version=lgVersion($g,$rows,$record,$states);
if($method==='GET'&&$action==='detail'){
 $students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$names=[];$date=str_replace('/','-',$rows[0]['日付']??'');$class=$rows[0]['クラス']??'';$directory=readJsonStrict($dir.'/directory_state.json');
 foreach($students as $r){if(($r['クラス']??'')!==$class||empty($r['生徒名']))continue;$name=$r['生徒名'];if(!empty($directory['hiddenStudents'][$name]))continue;$active=!isset($r['在籍期間']);foreach($r['在籍期間']??[] as $p)if((empty($p['from'])||$p['from']<=$date)&&(empty($p['until'])||$date<$p['until']))$active=true;if($active)$names[$name]=true;}
 $members=[];foreach($rows as $r){$k=canonicalLessonKey(policyKey($r));$members[]=['row'=>$r,'key'=>$k,'state'=>$states[$k]??[],'record'=>$records[$k]??[]];}
 echo json_encode(['ok'=>true,'group'=>groupSummary($g,$rows),'record'=>$record,'members'=>$members,'students'=>array_keys($names),'version'=>$version],JSON_UNESCAPED_UNICODE);exit;
}
if($method!=='POST')staffFail('Method not allowed',405);
if(empty($g['active']))staffFail('連結は解除済みです。履歴として表示しています。',409);
if(!hash_equals($version,(string)($in['version']??'')))staffFail('連結した授業・カルテ・出席が更新されました。再読み込みして確認してください。',409);
if($action==='delete'){foreach($rows as $r)guardFixedLesson(policyKey($r),$in);$edits=readJsonStrict($dir.'/edited_lessons.json');foreach($rows as $r)$edits[$r['_sourceKey']]=['_deleted'=>true,'_削除日時'=>date('c'),'_変更者'=>$actor['name']];$groups[$id]['active']=false;$groups[$id]['snapshot']=$rows;$groups[$id]['deletedAt']=date('c');$groups[$id]['deletedBy']=$actor['name'];if(!safeDataTransaction([$dir.'/edited_lessons.json'=>$edits,$dir.'/lesson_groups.json'=>$groups]))staffFail('削除を保存できません。',500);echo json_encode(['ok'=>true]);exit;}
if($action==='unlink'){$groups[$id]['active']=false;$groups[$id]['snapshot']=$rows;$groups[$id]['unlinkedAt']=date('c');$groups[$id]['unlinkedBy']=$actor['name'];if(!safeJsonWriteAtomic($dir.'/lesson_groups.json',$groups))staffFail('解除できません',500);echo json_encode(['ok'=>true],JSON_UNESCAPED_UNICODE);exit;}
if($action!=='save')staffFail('不明な操作です',400);
$memo=(string)($in['memo']??'');$homework=(string)($in['homework']??'');if(strlen($memo)>120000||strlen($homework)>120000)staffFail('本文が長すぎます',400);
require_once __DIR__.'/recording_context.php';foreach(['memo','homework'] as $field)recordingTbdGuard($in[$field]??'',$record[$field]??'');foreach($in['attendance']??[] as $name=>$value)foreach($rows as $r)recordingTbdGuard($value,$states[canonicalLessonKey(policyKey($r))]['attendance'][$name]??'');
$hasNote=array_key_exists('publicNote',$in);$edits=null;
if($hasNote){
 if(!is_string($in['publicNote'])||strlen($in['publicNote'])>12000)staffFail('生徒へのメッセージは4000文字程度までで入力してください。',400);
 $edits=readJsonStrict($dir.'/edited_lessons.json');
 foreach($rows as $r){$source=$r['_sourceKey'];$copy=$r;unset($copy['_sourceKey']);$copy['備考']=$in['publicNote'];$copy['_編集日時']=date('c');$edits[$source]=$copy;}
}
if(trim($memo)!==''||empty($record['memo']))$record['memo']=$memo;$record['homework']=$homework;$record['updatedAt']=date('c');$record['updatedBy']=$actor['name'];$records[$key]=$record;
$attendance=$in['attendance']??[];if(!is_array($attendance))staffFail('出席の形式が不正です',400);foreach($attendance as $name=>$value)if(!in_array($value,['---','出席','遅刻','欠席','早退','免除','その他','不明','未定'],true))staffFail('出席を確認してください',400);
foreach($rows as $r){$k=canonicalLessonKey(policyKey($r));$state=$states[$k]??[];foreach($attendance as $name=>$value){if($value==='---')unset($state['attendance'][$name]);else $state['attendance'][$name]=$value;if(isset($state['exemptionOverrides'][$name])){$state['exemptionOverrides'][$name]=$value==='免除';unset($state['exemptionUndo'][$name]);}}
 if($hasNote)$state['publicNote']=$in['publicNote'];
 if($attendance)$state['attendanceTouched']=true;if(array_key_exists('ready',$in))$state['ready']=(bool)$in['ready'];if($hasNote||$attendance||array_key_exists('ready',$in)){$state['updatedAt']=date('c');$state['updatedBy']=$actor['name'];$states[$k]=$state;}
}
$writes=[$dir.'/lesson_records.json'=>$records,$dir.'/class_state.json'=>$states];if($hasNote)$writes[$dir.'/edited_lessons.json']=$edits;
if(!safeDataTransaction($writes))staffFail('保存できません',500);echo json_encode(['ok'=>true],JSON_UNESCAPED_UNICODE);
