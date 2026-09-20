<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_policy.php';require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);header('Content-Type: application/json; charset=utf-8');
if(!in_array($_SERVER['REQUEST_METHOD'],['GET','POST'],true))staffFail('Method not allowed',405);
$in=$_SERVER['REQUEST_METHOD']==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);$from=$in['from']??'';$to=$in['to']??'';$mode=$in['mode']??'empty';
function copyDateValid($date){if(!is_string($date)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date))return false;[$y,$m,$d]=array_map('intval',explode('-',$date));return checkdate($m,$d,$y);}
if(!copyDateValid($from)||!copyDateValid($to)||$from===$to||!in_array($mode,['empty','append','replace'],true))staffFail('コピー元・コピー先・方式を確認してください',400);
$dir=__DIR__.'/data';$rows=policyRows();$source=[];$target=[];
foreach($rows as $r){$date=str_replace('/','-',$r['日付']??'');if($date===$from)$source[]=$r;if($date===$to)$target[]=$r;}
if(!$source)staffFail('コピー元の日に予定がありません',400);
$locks=readJsonStrict($dir.'/lesson_fixed.json');$groups=lessonGroups();$version=hash('sha256',json_encode([$source,$target,$locks,$groups,readJsonStrict($dir.'/teacher_ng.json')],JSON_UNESCAPED_UNICODE));
$protected=[];foreach($groups as $g){if(empty($g['active']))continue;$members=groupRows($g,$rows);if(array_filter($members,fn($r)=>!empty($locks[canonicalLessonKey(policyKey($r))]['fixed'])))foreach($g['sources'] as $s)$protected[$s]=true;}
$fixedPreserved=count(array_filter($target,function($r)use($locks,$protected){return !empty($locks[canonicalLessonKey(policyKey($r))]['fixed'])||!empty($protected[$r['_sourceKey']]);}));
if($_SERVER['REQUEST_METHOD']==='GET'){echo json_encode(['ok'=>true,'version'=>$version,'sourceCount'=>count($source),'targetCount'=>count($target),'fixedPreserved'=>$fixedPreserved]);exit;}
$requestId=$in['requestId']??'';if(!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId))staffFail('コピー画面を開き直してください。',400);
$receipts=readJsonStrict($dir.'/week_copy_receipts.json');$receiptKey=$actor['id'].'|'.$requestId;$hash=hash('sha256',json_encode([$from,$to,$mode,$in['version']??'']));
if(isset($receipts[$receiptKey])){if($receipts[$receiptKey]['hash']!==$hash)staffFail('コピー済みの操作です。画面を開き直してください。',409);echo json_encode($receipts[$receiptKey]['result']);exit;}
if(!is_string($in['version']??null)||!hash_equals($version,$in['version']))staffFail('比較中に予定が変更されました。コピー画面を開き直して確認してください。',409);
$remove=[];$retained=[];
foreach($target as $r){if($mode==='replace'&&empty($locks[canonicalLessonKey(policyKey($r))]['fixed'])&&empty($protected[$r['_sourceKey']]))$remove[]=$r;else $retained[]=$r;}
function copySignature($r){$v=[];foreach(['時間番号','教室','クラス','種別','給与区分','担当講師','開始','終了','科目','備考'] as $f)$v[]=trim((string)($r[$f]??''));return json_encode($v,JSON_UNESCAPED_UNICODE);}
$occupiedKeys=array_map('policyKey',$retained);$signatures=array_map('copySignature',$retained);$planned=[];$copiedSources=[];$skipped=0;$ngs=readJsonStrict($dir.'/teacher_ng.json');
foreach($source as $r){
 if(in_array(copySignature($r),$signatures,true)){$skipped++;continue;}
 $r['日付']=$to;if(in_array(policyKey($r),$occupiedKeys,true)){$skipped++;continue;}$room=$r['教室']??'';$clashes=[];
 foreach(array_merge($retained,$planned) as $other){if($room===''||$room==='PC'||($other['教室']??'')!==$room)continue;$overlap=($other['時間番号']??'')===($r['時間番号']??'');if(!empty($r['開始'])&&!empty($r['終了'])&&!empty($other['開始'])&&!empty($other['終了']))$overlap=$r['開始']<$other['終了']&&$other['開始']<$r['終了'];if($overlap)$clashes[]=$other['クラス']??'授業';}
 if($clashes&&$mode==='empty'){$skipped++;continue;}
 if($clashes&&empty($in['overrideRoom']))policyConflict('roomConflict',$room.'教室で「'.($r['クラス']??'').'」と「'.implode('・',$clashes).'」が同時になります。同時利用としてコピーしますか？');
 foreach($ngs as $ng)if(($ng['date']??'')===$to&&($ng['teacher']??'')===($r['担当講師']??'')&&(!empty($ng['allDay'])||in_array($r['時間番号']??'',$ng['slots']??[],true))&&empty($in['overrideNg']))policyConflict('ngConflict','コピー先には講師のNG時間が含まれます。それでもコピーしますか？');
 $originalSource=$r['_sourceKey'];unset($r['_sourceKey'],$r['_追加ID'],$r['_追加日時'],$r['_編集日時']);$r['_追加ID']='ADD-'.bin2hex(random_bytes(10));$r['_追加日時']=date('c');$copy=$r;$copy['_sourceKey']='ADD:'.$r['_追加ID'];$copiedSources[$originalSource]=$copy;$planned[]=$r;$occupiedKeys[]=policyKey($r);$signatures[]=copySignature($r);
}
$adds=readJsonStrict($dir.'/added_lessons.json');$edits=readJsonStrict($dir.'/edited_lessons.json');$state=readJsonStrict($dir.'/class_state.json');
foreach($groups as &$g){if(empty($g['active']))continue;$removedSources=array_column($remove,'_sourceKey');if(array_intersect($g['sources'],$removedSources)){if(count(array_intersect($g['sources'],$removedSources))!==count($g['sources']))staffFail('連結の一部を組み直せません。確定状態を確認してください。',409);$g['snapshot']=groupRows($g,$rows);$g['active']=false;$g['removedAt']=date('c');$g['removedBy']=$actor['name'];}}unset($g);
foreach($remove as $r)$edits[$r['_sourceKey']]=['_deleted'=>true,'_削除日時'=>date('c'),'_理由'=>'日付コピーで組み直し','_変更者'=>$actor['name']];
$maps=['class_state.json'=>$state,'lesson_records.json'=>readJsonStrict($dir.'/lesson_records.json'),'room_overrides.json'=>readJsonStrict($dir.'/room_overrides.json'),'lesson_fixed.json'=>$locks];
$aliases=readJsonStrict($dir.'/lesson_key_aliases.json');$oldAliases=$aliases;$resolve=function($key)use($oldAliases){$seen=[];while(isset($oldAliases[$key])&&!isset($seen[$key])){$seen[$key]=true;$key=$oldAliases[$key];}return $key;};
foreach($aliases as $k=>$v)$aliases[$k]=$resolve($k);
$archives=readJsonStrict($dir.'/lesson_move_archive.json');$archiveKeys=[];$files=readJsonStrict($dir.'/student_attachments.json');
foreach($planned as $r){$adds[]=$r;$key=policyKey($r);$saved=[];foreach($maps as $name=>$values)if(isset($values[$key]))$saved[$name]=$values[$key];$hasFiles=false;foreach($files as $f)if($resolve($f['key']??'')===$key)$hasFiles=true;
 if($saved||$hasFiles){$ak='ARCHIVE:'.bin2hex(random_bytes(12));$archives[$ak]=['fromKey'=>$key,'at'=>date('c'),'by'=>$actor['name'],'reason'=>'日付コピー・組み直し','records'=>$saved];
  if($resolve($key)===$key){$archiveKeys[$key]=$ak;foreach($saved as $name=>$v){if($name==='lesson_records.json'){$v['eventKey']=$ak;$v['archivedFrom']=$key;}$maps[$name][$ak]=$v;}}
 }
 foreach($maps as &$values)unset($values[$key]);unset($values);unset($aliases[$key]);$maps['class_state.json'][$key]=['publicNote'=>$r['備考']??''];
}
foreach($aliases as $k=>$v)if(isset($archiveKeys[$v]))$aliases[$k]=$archiveKeys[$v];
foreach($files as &$f){$k=$resolve($f['key']??'');$f['key']=$archiveKeys[$k]??$k;}unset($f);
$state=$maps['class_state.json'];$records=$maps['lesson_records.json'];$linked=0;
foreach(lessonGroups() as $g){if(empty($g['active'])||count(array_intersect($g['sources'],array_keys($copiedSources)))!==count($g['sources']))continue;$members=array_map(fn($source)=>$copiedSources[$source],$g['sources']);[$copyGroup,$record]=buildLessonGroup($members,[],$actor,!empty($g['mealBreak']));$groups[$copyGroup['id']]=$copyGroup;$records[$record['eventKey']]=$record;$linked++;}
$result=['ok'=>true,'copied'=>count($planned),'removed'=>count($remove),'skipped'=>$skipped,'linked'=>$linked,'fixedPreserved'=>$fixedPreserved];
$receipts[$receiptKey]=['hash'=>$hash,'result'=>$result,'at'=>date('c')];
if(!safeDataTransaction([$dir.'/added_lessons.json'=>$adds,$dir.'/edited_lessons.json'=>$edits,$dir.'/class_state.json'=>$state,$dir.'/lesson_groups.json'=>$groups,$dir.'/lesson_records.json'=>$records,$dir.'/week_copy_receipts.json'=>$receipts,$dir.'/lesson_key_aliases.json'=>$aliases,$dir.'/student_attachments.json'=>$files,$dir.'/lesson_move_archive.json'=>$archives,$dir.'/room_overrides.json'=>$maps['room_overrides.json'],$dir.'/lesson_fixed.json'=>$maps['lesson_fixed.json']]))staffFail('コピーを保存できません',500);
echo json_encode($result,JSON_UNESCAPED_UNICODE);
