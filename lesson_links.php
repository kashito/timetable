<?php
require_once __DIR__.'/staff_security.php';
function lessonBySource($source){
  $dir=__DIR__.'/data';$row=null;
  if(strpos($source,'ADD:')===0){foreach(readJsonStrict($dir.'/added_lessons.json') as $r)if('ADD:'.($r['_追加ID']??'')===$source){$row=$r;break;}}
  elseif(preg_match('/^XLSX:(\d+)\|/',$source,$m)){$d=readJsonStrict($dir.'/schedule_data.json');$row=$d['schedule'][(int)$m[1]]??null;}
  $edits=readJsonStrict($dir.'/edited_lessons.json');if(isset($edits[$source]))$row=$edits[$source];
  if(is_array($row)&&empty($row['_deleted'])&&function_exists('policyKey')){$rooms=readJsonStrict($dir.'/room_overrides.json');$key=canonicalLessonKey(policyKey($row));if(isset($rooms[$key]['room']))$row['教室']=$rooms[$key]['room'];}
  return is_array($row)&&empty($row['_deleted'])?$row:null;
}
function safeDataTransaction($changes){
  $prepared=[];$original=[];
  $cleanup=function()use(&$prepared){foreach($prepared as $p)if(is_file($p))@unlink($p);};
  // Validate every original before creating any temporary files.
  foreach($changes as $file=>$value)if(is_file($file))readJsonStrict($file);
  foreach($changes as $file=>$value){
    if(is_file($file))readJsonStrict($file);
    $json=json_encode($value,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
    if($json===false||!safeDataBackup($file)){$cleanup();return false;}
    $original[$file]=is_file($file)?file_get_contents($file):null;
    if($original[$file]===false){$cleanup();return false;}
    $tmp=$file.'.tmp.'.bin2hex(random_bytes(8));
    if(@file_put_contents($tmp,$json,LOCK_EX)!==strlen($json)){foreach($prepared as $p)@unlink($p);@unlink($tmp);return false;}
    $prepared[$file]=$tmp;
  }
  $done=[];
  foreach($prepared as $file=>$tmp){
    if(!@rename($tmp,$file)){
      foreach($done as $prior){
        if($original[$prior]!==null){$restore=$prior.'.restore.'.bin2hex(random_bytes(8));if(@file_put_contents($restore,$original[$prior],LOCK_EX)!==false)@rename($restore,$prior);}
        else @unlink($prior); // Only files created by this failed transaction.
      }
      foreach($prepared as $p)if(is_file($p))@unlink($p);return false;
    }
    @chmod($file,0664);$done[]=$file;
  }
  return true;
}
function saveLessonMove($oldRow,$newRow,$edits,$input=[]){
  $dir=__DIR__.'/data';$old=canonicalLessonKey(occurrenceKeyForRow($oldRow));$next=occurrenceKeyForRow($newRow);
  $changes=[$dir.'/edited_lessons.json'=>$edits];
  if($old===$next){
   $rooms=readJsonStrict($dir.'/room_overrides.json');
   if(isset($rooms[$old])){$rooms[$old]['room']=$newRow['教室']??'';$changes[$dir.'/room_overrides.json']=$rooms;}
   return safeDataTransaction($changes);
  }
  $aliases=readJsonStrict($dir.'/lesson_key_aliases.json');
  $resolve=function($key)use($aliases){$seen=[];while(isset($aliases[$key])&&!isset($seen[$key])){$seen[$key]=true;$key=$aliases[$key];}return $key;};
  $returning=$resolve($next)===$old;
  foreach(policyRows() as $other)if(($other['_sourceKey']??'')!==($newRow['_sourceKey']??'')&&policyKey($other)===$next)staffFail('移動先に同じ日時・クラス・講師の授業があります。一覧の絞り込みを解除して確認してください。',409);
  $names=['lesson_records.json','class_state.json','room_overrides.json','lesson_fixed.json'];$archive=[];
  if(!$returning)foreach($names as $name){$values=readJsonStrict($dir.'/'.$name);if(isset($values[$next]))$archive[$name]=$values[$next];}
  $historical=$resolve($next)===$next;
  $files=readJsonStrict($dir.'/student_attachments.json');
  if(!$returning&&$historical){$attached=array_values(array_filter($files,function($f)use($resolve,$next){return $resolve($f['key']??'')===$next;}));if($attached)$archive['student_attachments.json']=$attached;}
  $record=$archive['lesson_records.json']??[];$state=$archive['class_state.json']??[];
  $meaningful=trim((string)($record['memo']??''))!==''||trim((string)($record['homework']??''))!==''||!empty($record['replies'])||!empty($state['attendance'])||trim((string)($state['publicNote']??''))!==''||!empty($archive['student_attachments.json']);
  if($archive&&$historical&&$meaningful&&empty($input['archiveDestination']))policyConflict('recordConflict','移動先の枠は空いていますが、以前のカルテ・出席・連絡が残っています。以前の記録を別に保管して、この授業を移動しますか？');
  $archiveKey='ARCHIVE:'.bin2hex(random_bytes(12));
  if($archive){$log=readJsonStrict($dir.'/lesson_move_archive.json');$log[$archiveKey]=['fromKey'=>$next,'at'=>date('c'),'by'=>staffCurrent()['name']??'','records'=>$archive];$changes[$dir.'/lesson_move_archive.json']=$log;}

  foreach(['lesson_records.json','class_state.json','room_overrides.json','lesson_fixed.json'] as $name){
    $file=$dir.'/'.$name;$data=readJsonStrict($file);
    if(isset($archive[$name])&&$historical){$data[$archiveKey]=$archive[$name];if($name==='lesson_records.json'){$data[$archiveKey]['eventKey']=$archiveKey;$data[$archiveKey]['archivedFrom']=$next;}}
    unset($data[$next]);
    if(isset($data[$old])){
      $data[$next]=$data[$old];
      if($name==='room_overrides.json')$data[$next]['room']=$newRow['教室']??'';
      if($name==='lesson_records.json'){
        $data[$next]['eventKey']=$next;$data[$next]['date']=normalizeDateKey($newRow['日付']??'');
        $data[$next]['slot']=$newRow['時間番号']??'';$data[$next]['className']=$newRow['クラス']??'';
        if(empty($data[$next]['author']))$data[$next]['author']=$data[$next]['teacher']??'';
        $data[$next]['teacher']=$newRow['担当講師']??'';$data[$next]['room']=$newRow['教室']??'';
      }
    }
    unset($data[$old]);$changes[$file]=$data;
  }
  $changed=false;
  foreach($files as &$f){$k=$resolve($f['key']??'');if($k===$old){$f['key']=$next;$changed=true;}elseif($k===$next&&$historical&&$archive){$f['key']=$archiveKey;$changed=true;}elseif($k!==($f['key']??'')){$f['key']=$k;$changed=true;}}unset($f);
  if($changed)$changes[$dir.'/student_attachments.json']=$files;
  foreach($aliases as $k=>$v){$resolved=$resolve($k);$aliases[$k]=$resolved===$old?$next:($historical&&$archive&&$resolved===$next?$archiveKey:$resolved);}
  unset($aliases[$next]);$aliases[$old]=$next;$changes[$dir.'/lesson_key_aliases.json']=$aliases;
  return safeDataTransaction($changes);
}
