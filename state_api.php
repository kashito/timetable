<?php
require_once __DIR__.'/staff_security.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET' || isset($_GET['action'])) staffRequire();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir=__DIR__.'/data';
$stateFile=$dir.'/class_state.json';
$memoFile=$dir.'/class_memos.json';

if(!is_dir($dir) && !@mkdir($dir,0777,true) && !is_dir($dir)){
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'],JSON_UNESCAPED_UNICODE);
  exit;
}
foreach([$stateFile,$memoFile] as $f){
  if(!file_exists($f)){
    if(@file_put_contents($f,'{}')===false){
      http_response_code(500);
      echo json_encode(['ok'=>false,'error'=>basename($f).'を作成できません'],JSON_UNESCAPED_UNICODE);
      exit;
    }
    @chmod($f,0666);
  }
}

function readJson($file){
 return readJsonStrict($file);
}

function normalizeDateKey($v){
  $s=trim((string)$v);
  $s=str_replace('/','-',$s);
  if(preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})/',$s,$m)){
    return sprintf('%04d-%02d-%02d',(int)$m[1],(int)$m[2],(int)$m[3]);
  }
  return $s;
}
function occurrenceKeyForRow($row){
  $subjects=preg_split('/[,、，]/u',(string)($row['科目']??''));
  $subjects=array_values(array_filter(array_map('trim',$subjects),function($v){return $v!=='';}));
  return implode('|',[
    normalizeDateKey($row['日付']??''),
    trim((string)($row['時間番号']??'')),
    trim((string)($row['クラス']??'')),
    trim((string)($row['担当講師']??'')),
    trim((string)($row['種別']??'')),
    implode('+',$subjects)
  ]);
}
function excelSourceKey($row,$index){
  $date=str_replace('-','/',trim((string)($row['日付']??'')));
  return 'XLSX:'.implode('|',[
    $index,$date,trim((string)($row['時間番号']??'')),
    trim((string)($row['クラス']??'')),trim((string)($row['担当講師']??''))
  ]);
}
function syncPublicNoteToSchedule($dir,$eventKey,$note){
  $scheduleFile=$dir.'/schedule_data.json';
  $addFile=$dir.'/added_lessons.json';
  $editFile=$dir.'/edited_lessons.json';
  $base=[];
  if(file_exists($scheduleFile)){
    $data=json_decode(@file_get_contents($scheduleFile)?:'{}',true);
    if(is_array($data)&&isset($data['schedule'])&&is_array($data['schedule'])) $base=$data['schedule'];
  }
  $adds=file_exists($addFile)?json_decode(@file_get_contents($addFile)?:'[]',true):[];
  $edits=file_exists($editFile)?json_decode(@file_get_contents($editFile)?:'{}',true):[];
  if(!is_array($adds)) $adds=[]; if(!is_array($edits)) $edits=[];
  $found=false;
  foreach($base as $i=>$raw){
    if(!is_array($raw)) continue;
    $source=excelSourceKey($raw,$i);
    $row=(isset($edits[$source])&&is_array($edits[$source]))?array_merge($raw,$edits[$source]):$raw;
    if(!empty($row['_deleted'])) continue;
    if(occurrenceKeyForRow($row)===$eventKey){
      $row['備考']=$note; $row['_編集日時']=date('c'); $edits[$source]=$row; $found=true; break;
    }
  }
  if(!$found){
    foreach($adds as $raw){
      if(!is_array($raw)) continue;
      $source='ADD:'.trim((string)($raw['_追加ID']??''));
      $row=(isset($edits[$source])&&is_array($edits[$source]))?array_merge($raw,$edits[$source]):$raw;
      if(!empty($row['_deleted'])) continue;
      if(occurrenceKeyForRow($row)===$eventKey){
        $row['備考']=$note; $row['_編集日時']=date('c'); $edits[$source]=$row; $found=true; break;
      }
    }
  }
  if(!$found) return [false,'対応する授業が見つかりません'];
  $tmp=$editFile.'.tmp';
  $json=json_encode($edits,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
  if(!safeJsonWriteAtomic($editFile,$edits)) return [false,'時間割への同期保存に失敗しました'];
  return [true,''];
}

function updateJson($file,$callback){
 $data=$callback(readJsonStrict($file));
 $ok=safeJsonWriteAtomic($file,$data);
 return [$ok,$ok?'':'保存に失敗しました',$data];
}


function legacyClassMemos($stateFile){
  $state=readJson($stateFile);
  $out=[];
  foreach($state as $key=>$val){
    if(strpos((string)$key,'__CLASS_MEMO__|')!==0 || !is_array($val)) continue;
    $classKey=substr((string)$key,strlen('__CLASS_MEMO__|'));
    if($classKey==='') continue;
    $out[$classKey]=(string)($val['teacherMemo']??'');
  }
  return $out;
}

function mergedClassMemos($stateFile,$memoFile){
  $legacy=legacyClassMemos($stateFile);
  $modern=readJson($memoFile);
  $merged=$legacy;
  foreach($modern as $k=>$v){
    $text=(string)$v;
    // v40で空のclass_memos.jsonが新規作成された場合でも、旧伝言を隠さない。
    if($text!=='' || !array_key_exists((string)$k,$merged)) $merged[(string)$k]=$text;
  }
  return $merged;
}

$action=(string)($_GET['action']??'');

/* Class memo list GET (for schedule comment icons) */
if($_SERVER['REQUEST_METHOD']==='GET' && $action==='getAllClassMemos'){
  echo json_encode(['ok'=>true,'classMemos'=>mergedClassMemos($stateFile,$memoFile)],JSON_UNESCAPED_UNICODE);
  exit;
}

/* Completely independent class memo GET */
if($_SERVER['REQUEST_METHOD']==='GET' && $action==='getClassMemo'){
  $classKey=trim((string)($_GET['classKey']??''));
  if($classKey===''){
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'クラス名がありません'],JSON_UNESCAPED_UNICODE); exit;
  }
  $memos=mergedClassMemos($stateFile,$memoFile);
  echo json_encode(['ok'=>true,'classMemo'=>(string)($memos[$classKey]??'')],JSON_UNESCAPED_UNICODE);
  exit;
}

/* Existing per-slot GET */
if($_SERVER['REQUEST_METHOD']==='GET'){
  echo json_encode(['ok'=>true,'state'=>staffPublicState(currentLessonEntries(readJson($stateFile)))],JSON_UNESCAPED_UNICODE);
  exit;
}

if($_SERVER['REQUEST_METHOD']!=='POST'){
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Method not allowed'],JSON_UNESCAPED_UNICODE); exit;
}

$in=json_decode(file_get_contents('php://input'),true);
if(!is_array($in)){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'JSON形式が不正です'],JSON_UNESCAPED_UNICODE); exit;
}

/* Completely independent class memo SAVE */
if($action==='saveClassMemo'){
  $classKey=trim((string)($in['classKey']??''));
  if($classKey===''){
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'クラス名がありません'],JSON_UNESCAPED_UNICODE); exit;
  }
  $memo=(string)($in['teacherMemo']??'');
  list($ok,$err,$data)=updateJson($memoFile,function($memos) use($classKey,$memo){
    $memos[$classKey]=$memo;
    return $memos;
  });
  if(!$ok){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$err],JSON_UNESCAPED_UNICODE); exit;
  }
  // 旧方式（class_state.json の __CLASS_MEMO__|クラス名）にも同時保存。
  // コマ生成・講師ページ・全体スケジュールのどこから保存しても同じ伝言を共有する。
  $legacyKey='__CLASS_MEMO__|'.$classKey;
  list($ok2,$err2,$state2)=updateJson($stateFile,function($state) use($legacyKey,$memo){
    $cur=(isset($state[$legacyKey])&&is_array($state[$legacyKey]))?$state[$legacyKey]:[];
    $cur['teacherMemo']=$memo;
    $cur['updatedAt']=date('c'); $cur['updatedBy']=staffCurrent()['name'];
    $state[$legacyKey]=$cur;
    return $state;
  });
  if(!$ok2){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$err2],JSON_UNESCAPED_UNICODE); exit;
  }
  echo json_encode(['ok'=>true,'classMemo'=>$memo],JSON_UNESCAPED_UNICODE);
  exit;
}

/* Existing per-slot SAVE: ready/public note/attendance only */
$eventKey=canonicalLessonKey(trim((string)($in['eventKey']??'')));
if($eventKey===''){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'eventKeyがありません'],JSON_UNESCAPED_UNICODE); exit;
}
if(isset($in['attendance'])){if(!is_array($in['attendance']))staffFail('出欠を確認してください。',400);$previous=readJsonStrict($stateFile)[$eventKey]['attendance']??[];foreach($in['attendance'] as $name=>$value){$before=$previous[$name]??'';if(trim((string)$value)==='未定'&&trim((string)$before)!=='未定'&&(staffCurrent()['role']??'')!=='admin')staffFail('未定としての記録は管理者のみ行えます。',403);}}
if(array_key_exists('publicNote',$in)){
  list($syncOk,$syncErr)=syncPublicNoteToSchedule($dir,$eventKey,(string)$in['publicNote']);
  if(!$syncOk){
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$syncErr],JSON_UNESCAPED_UNICODE); exit;
  }
}
list($ok,$err,$state)=updateJson($stateFile,function($state) use($eventKey,$in){
  $cur=(isset($state[$eventKey])&&is_array($state[$eventKey]))?$state[$eventKey]:[];
  foreach(['publicNote','ready','attendance','attendanceTouched','teacherMemo'] as $field){
    if(array_key_exists($field,$in)){
      if($field==='attendance'&&is_array($in[$field])){
        $attendance=$in[$field];$directory=readJsonStrict(__DIR__.'/data/directory_state.json');$lessonDate=explode('|',$eventKey)[0];
        foreach($cur['attendance']??[] as $name=>$value){
          if(!array_key_exists($name,$attendance)&&!empty($directory['hiddenStudents'][$name]))$attendance[$name]=$value;
        }
        $previousAttendance=$cur['attendance']??[];
        foreach($attendance as $name=>$value)if(($previousAttendance[$name]??null)!==$value&&isset($cur['exemptionOverrides'][$name])){$cur['exemptionOverrides'][$name]=$value==='免除';unset($cur['exemptionUndo'][$name]);}
        foreach($previousAttendance as $name=>$value)if(!array_key_exists($name,$attendance)&&isset($cur['exemptionOverrides'][$name])){$cur['exemptionOverrides'][$name]=false;unset($cur['exemptionUndo'][$name]);}
        $cur[$field]=$attendance;
      }else $cur[$field]=$in[$field];
    }
  }
  $cur['updatedAt']=date('c'); $cur['updatedBy']=staffCurrent()['name'];
  $state[$eventKey]=$cur;
  return $state;
});
if(!$ok){
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>$err],JSON_UNESCAPED_UNICODE); exit;
}
echo json_encode(['ok'=>true,'state'=>$state[$eventKey]??[]],JSON_UNESCAPED_UNICODE);
?>