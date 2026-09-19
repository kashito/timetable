<?php
require_once __DIR__.'/lesson_policy.php';
require_once __DIR__.'/lesson_links.php';
staffRequire(true);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$dir=__DIR__.'/data';
$base=readJsonStrict($dir.'/schedule_data.json');
$students=readJsonStrict($dir.'/student_master.json',$base['students']??[]);
$edits=readJsonStrict($dir.'/edited_lessons.json');$adds=readJsonStrict($dir.'/added_lessons.json');
$visibility=readJsonStrict($dir.'/lesson_visibility.json');$schedule=policyRows();
$classes=[];
foreach(array_merge($schedule,$students) as $r){$c=trim((string)($r['クラス']??''));if($c!=='')$classes[$c]=true;}
$version=hash('sha256',json_encode([$base,$students,$edits,$adds,$visibility],JSON_UNESCAPED_UNICODE));
if($_SERVER['REQUEST_METHOD']==='GET'){
 $list=[];foreach(array_keys($classes) as $c)$list[]=['name'=>$c,'lessons'=>count(array_filter($schedule,fn($r)=>($r['クラス']??'')===$c)),'hidden'=>in_array($c,$visibility['hidden']??[],true)];
 echo json_encode(['ok'=>true,'classes'=>$list,'version'=>$version],JSON_UNESCAPED_UNICODE);exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('Method not allowed',405);
$in=json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);
$old=trim((string)($in['sourceClass']??''));$new=trim((string)($in['name']??''));$action=$in['action']??'';
if(!in_array($action,['rename','clone','create'],true))staffFail('不明な操作です',400);
if($action!=='create'&&!isset($classes[$old]))staffFail('元のクラスが見つかりません。一覧を再読み込みしてください。',409);
if($new===''||strlen($new)>300||preg_match('/[|\x00-\x1f\x7f]/u',$new))staffFail('クラス名を入力してください。「|」や改行は使えません。',400);
if(isset($classes[$new]))staffFail('同じ名前のクラスがあります。別の名前にしてください。',409);
$nameDirectory=readJsonStrict($dir.'/directory_state.json');$nameAliases=$nameDirectory['classNameAliases']??[];
if(isset($nameAliases[$new])){
 $target=$new;$seen=[];while(isset($nameAliases[$target])&&!isset($seen[$target])){$seen[$target]=true;$target=$nameAliases[$target];}
 if($action!=='rename'||$target!==$old)staffFail('その名前は別のクラスの旧名として使われています。別の名前にしてください。',409);
}
if(!hash_equals($version,(string)($in['version']??'')))staffFail('編集している間にクラスや時間割が更新されました。一覧を再読み込みし、もう一度編集してください。',409);
$changes=[];
if($action==='clone'||$action==='create'){
 $names=$in['names']??null;$date=(string)($in['date']??'');
 if(!is_array($names)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||date('Y-m-d',strtotime($date))!==$date)staffFail('参加生徒と適用日を確認してください。',400);
 $clean=[];foreach($names as $n){if(!is_string($n)||trim($n)===''||strlen($n)>300)staffFail('生徒名を確認してください。',400);$clean[trim($n)]=true;}
 foreach(array_keys($clean) as $name){
  $priority='0';foreach($students as $r)if(($r['クラス']??'')===$old&&($r['生徒名']??'')===$name){$priority=$r['優先度']??'0';break;}
  $students[]=['生徒名'=>$name,'クラス'=>$new,'優先度'=>$priority,'在籍期間'=>[['from'=>$date,'until'=>'']]];
 }
 if(!$clean)$students[]=['生徒名'=>'','クラス'=>$new,'優先度'=>'0'];
}else{
 // A class rename changes labels for its existing lessons, including fixed ones.
 foreach($schedule as $r)if(($r['クラス']??'')===$old)guardFixedLesson(policyKey($r),$in);
 $aliases=readJsonStrict($dir.'/lesson_key_aliases.json');$moves=[];
 $moveKey=function($key)use($old,$new,&$moves){
  $key=canonicalLessonKey($key);$parts=explode('|',$key);
  if(count($parts)===6&&$parts[2]===$old){$parts[2]=$new;$moves[$key]=implode('|',$parts);}
 };
 foreach($schedule as $r)if(($r['クラス']??'')===$old)$moveKey(policyKey($r));
 // Keep source IDs stable; store renamed rows as edits, never reorder the source sheet.
 $rawRows=[];
 foreach($base['schedule']??[] as $i=>$r){$source='XLSX:'.implode('|',[$i,str_replace('-','/',$r['日付']??''),$r['時間番号']??'',$r['クラス']??'',$r['担当講師']??'']);$rawRows[$source]=$edits[$source]??$r;}
 foreach($adds as $r){$source='ADD:'.($r['_追加ID']??'');$rawRows[$source]=$edits[$source]??$r;}
 foreach($rawRows as $source=>$r)if(($r['クラス']??'')===$old){$moveKey(policyKey($r));$r['クラス']=$new;$r['_編集日時']=date('c');$edits[$source]=$r;}
 $maps=[];foreach(['lesson_records.json','class_state.json','room_overrides.json','lesson_fixed.json','schedule_overrides.json'] as $f){$maps[$f]=readJsonStrict($dir.'/'.$f);foreach(array_keys($maps[$f]) as $key)$moveKey((string)$key);}
 $attachments=readJsonStrict($dir.'/student_attachments.json');foreach($attachments as $f)$moveKey((string)($f['key']??''));
 foreach($aliases as $key=>$value)$moveKey((string)$key);
 $moves['__CLASS_MEMO__|'.$old]='__CLASS_MEMO__|'.$new;
 // Detect collisions before writing any file. Returning to a previous name is safe only for the same linked record.
 foreach($moves as $from=>$to){
  foreach($maps as $data)if(isset($data[$to])&&canonicalLessonKey($to)!==$from)staffFail('変更先の名前には別の授業記録があります。記録を保護するため変更を中止しました。',409);
  if(isset($aliases[$to])&&canonicalLessonKey($to)!==$from)staffFail('変更先の名前は別の授業の履歴で使われています。別の名前にしてください。',409);
 }
 foreach($maps as $f=>$data){$original=$data;
  foreach($moves as $from=>$to)if(isset($original[$from])){
   $data[$to]=$original[$from];if($f==='lesson_records.json'){$data[$to]['eventKey']=$to;$data[$to]['className']=$new;}
  }
  if($f==='lesson_records.json')foreach($data as &$entry)if(!empty($entry['groupId'])&&($entry['className']??'')===$old)$entry['className']=$new;unset($entry);
  if($data!==$original)$changes[$dir.'/'.$f]=$data;
 }
 foreach($attachments as &$f){$key=canonicalLessonKey((string)($f['key']??''));if(isset($moves[$key]))$f['key']=$moves[$key];}unset($f);
 if($attachments!==readJsonStrict($dir.'/student_attachments.json'))$changes[$dir.'/student_attachments.json']=$attachments;
 foreach($aliases as $key=>$value){$canonical=canonicalLessonKey((string)$key);if(isset($moves[$canonical]))$aliases[$key]=$moves[$canonical];}
 foreach($moves as $from=>$to){unset($aliases[$to]);$aliases[$from]=$to;}
 $changes[$dir.'/lesson_key_aliases.json']=$aliases;$changes[$dir.'/edited_lessons.json']=$edits;
 $memos=readJsonStrict($dir.'/class_memos.json');
 if(array_key_exists($old,$memos)){
  // A former name may still have a preserved memo copy from an earlier rename.
  if(array_key_exists($new,$memos)&&canonicalLessonKey('__CLASS_MEMO__|'.$new)!=='__CLASS_MEMO__|'.$old&&$memos[$new]!==$memos[$old])staffFail('変更先の名前には別の伝言があります。別の名前にしてください。',409);
  $memos[$new]=$memos[$old];$changes[$dir.'/class_memos.json']=$memos;
 }
 // Legacy short memo keys contain date, slot, class and teacher; IDs are unchanged.
 $memos=readJsonStrict($dir.'/memos.json');$originalMemos=$memos;
 foreach($originalMemos as $key=>$value){$parts=explode('|',(string)$key);if(count($parts)===4&&$parts[2]===$old){$parts[2]=$new;$to=implode('|',$parts);if(isset($memos[$to])&&$memos[$to]!==$value)staffFail('変更先に別のメモがあります。別の名前にしてください。',409);$memos[$to]=$value;}}
 if($memos!==$originalMemos)$changes[$dir.'/memos.json']=$memos;
 $lessonGroups=readJsonStrict($dir.'/lesson_groups.json');$originalGroups=$lessonGroups;foreach($lessonGroups as &$lg)foreach($lg['snapshot'] as &$gr)if(($gr['クラス']??'')===$old)$gr['クラス']=$new;unset($gr,$lg);if($lessonGroups!==$originalGroups)$changes[$dir.'/lesson_groups.json']=$lessonGroups;
 $directory=readJsonStrict($dir.'/directory_state.json');$classAliases=$directory['classNameAliases']??[];
 $resolveClass=function($c)use($classAliases){$seen=[];while(isset($classAliases[$c])&&!isset($seen[$c])){$seen[$c]=true;$c=$classAliases[$c];}return $c;};
 foreach($classAliases as $c=>$target)if($resolveClass($c)===$old)$classAliases[$c]=$new;
 unset($classAliases[$new]);$classAliases[$old]=$new;$directory['classNameAliases']=$classAliases;$changes[$dir.'/directory_state.json']=$directory;
 $requests=readJsonStrict($dir.'/staff_requests.json');$oldRequests=$requests;foreach($requests as &$r)if(($r['className']??'')===$old)$r['className']=$new;unset($r);if($requests!==$oldRequests)$changes[$dir.'/staff_requests.json']=$requests;
 $rates=readJsonStrict($dir.'/payroll_rates.json');$oldRates=$rates;foreach($rates as &$r)if(($r['class']??'')===$old)$r['class']=$new;unset($r);if($rates!==$oldRates)$changes[$dir.'/payroll_rates.json']=$rates;
 foreach($students as &$r)if(($r['クラス']??'')===$old)$r['クラス']=$new;unset($r);
 if(in_array($old,$visibility['hidden']??[],true)){$visibility['hidden']=array_values(array_unique(array_map(fn($c)=>$c===$old?$new:$c,$visibility['hidden'])));$visibility['updatedAt']=date('c');$changes[$dir.'/lesson_visibility.json']=$visibility;}
}
$changes[$dir.'/student_master.json']=$students;
if(is_file($dir.'/schedule_data.json')){$base['students']=$students;$base['updatedAt']=date('c');$changes[$dir.'/schedule_data.json']=$base;}
if(!safeDataTransaction($changes))staffFail('保存できませんでした。再読み込みして確認してください。',500);
echo json_encode(['ok'=>true,'name'=>$new],JSON_UNESCAPED_UNICODE);
