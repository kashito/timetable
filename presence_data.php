<?php
require_once __DIR__.'/student_contacts.php';
function prHash($v){return hash('sha256',json_encode($v,JSON_UNESCAPED_UNICODE));}
function prNumber($v){$s=trim(strtr((string)$v,array_combine(preg_split('//u','０１２３４５６７８９',-1,PREG_SPLIT_NO_EMPTY),str_split('0123456789'))));return preg_match('/^[0-9]{1,5}$/D',$s)?str_pad($s,5,'0',STR_PAD_LEFT):'';}
function prName($v){return preg_replace('/[\s\x{3000}]+/u','',(string)$v);}
function prLegacyWal($file,$version){
 // Before SQLite 3.22, WAL readers need a writable connection, even for SELECT.
 if(version_compare($version,'3.22.0','>='))return false;
 $header=@file_get_contents($file,false,null,0,20);
 return is_string($header)&&strlen($header)===20&&substr($header,0,16)==="SQLite format 3\0"&&(ord($header[18])===2||ord($header[19])===2);
}
function prReadSource($file,$date,$compat,$version){
 // Fixed queries only. No CREATE, schema changes, source config/db(), or journal-mode changes.
 // A legacy WAL connection permits SQLite's own WAL coordination, not application writes.
 $db=null;$stage='open';$transaction=false;
 try{
  $db=new SQLite3($file,$compat?SQLITE3_OPEN_READWRITE:SQLITE3_OPEN_READONLY);$db->enableExceptions(true);$db->busyTimeout(1500);
  $stage='guard';$db->exec('PRAGMA query_only = ON');
  // PHP 8 adds an additional guard. Older PHP uses the same fixed SELECT-only path.
  if(method_exists($db,'setAuthorizer'))$db->setAuthorizer(function($action){return in_array($action,[SQLite3::SELECT,SQLite3::READ,SQLite3::FUNCTION,SQLite3::TRANSACTION],true)?SQLite3::OK:SQLite3::DENY;});
  $db->exec('BEGIN');$transaction=true;
  $stage='students';$q=$db->query('SELECT id,student_no,name,status FROM students ORDER BY id');$catalog=[];while($r=$q->fetchArray(SQLITE3_ASSOC)){$r['id']=(int)$r['id'];$catalog[$r['id']]=$r;}$q->finalize();
  // Derived table works on older SQLite that does not support WITH/CTE.
  $stage='latest';$q=$db->query('SELECT l.student_id,l.action,l.acted_at,l.id FROM attendance_logs l JOIN (SELECT student_id,MAX(acted_at) AS latest_at FROM attendance_logs GROUP BY student_id) t ON l.student_id=t.student_id AND l.acted_at=t.latest_at ORDER BY l.id DESC');$latest=[];
  while($r=$q->fetchArray(SQLITE3_ASSOC))if(!isset($latest[$r['student_id']]))$latest[$r['student_id']]=$r;
  $q->finalize();$stage='events';$stmt=$db->prepare('SELECT student_id,action,acted_at FROM attendance_logs WHERE acted_at>=:start AND acted_at<:end ORDER BY acted_at,id');$stmt->bindValue(':start',$date.' 00:00:00',SQLITE3_TEXT);$stmt->bindValue(':end',date('Y-m-d',strtotime($date.' +1 day')).' 00:00:00',SQLITE3_TEXT);$q=$stmt->execute();$events=[];
  while($r=$q->fetchArray(SQLITE3_ASSOC))$events[$r['student_id']][]=['status'=>$r['action'],'at'=>$r['acted_at']];
  $q->finalize();$stmt->close();$stage='finish';$db->exec('COMMIT');$transaction=false;$db->close();return [$catalog,$latest,$events];
 }catch(Throwable $e){
  $code=$db?($db->lastErrorCode()&255):14;
  if($db){try{if($transaction)$db->exec('ROLLBACK');$db->close();}catch(Throwable $ignored){}}
  $tag='ENTRY_READ';$help='再読み込みしてください。繰り返す場合は、この確認コードを管理者に伝えてください。';
  if(in_array($code,[5,6],true)){$tag='ENTRY_BUSY';$help='玄関アプリが処理中です。少し待って再読み込みしてください。';}
  elseif(in_array($code,[8,14],true)){$tag='ENTRY_OPEN';$help='稼働中のSQLiteと付随ファイル・保存フォルダのアクセス権限を確認してください。';}
  elseif(in_array($code,[11,26],true)){$tag='ENTRY_FORMAT';$help='玄関アプリ側で生徒一覧を開けるか確認してください。データベースの上書きはしないでください。';}
  elseif($code===1&&in_array($stage,['students','latest','events'],true)){$tag='ENTRY_SCHEMA';$help='玄関アプリのデータ形式を確認する必要があります。この確認コードを管理者に伝えてください。';}
  error_log('[presence] '.$tag.' stage='.$stage.' sqlite='.$version.' code='.$code.' connection='.($compat?'legacy-wal':'read-only').' '.get_class($e).': '.$e->getMessage());
  throw new RuntimeException('入退室データを読み取れませんでした。'.$help.'（確認コード：'.$tag.'/'.$stage.'/'.$code.'、SQLite '.$version.'）');
 }
}
function prSource($date){
 // Never load the entrance app's config/session or its write-capable db() helper.
 $file=dirname(__DIR__).'/attendance/data/attendance.sqlite';
 if(!class_exists('SQLite3'))throw new RuntimeException('サーバーのPHPでSQLite3を有効にしてください。（確認コード：ENTRY_EXTENSION）');
 if(!is_file($file)||!is_readable($file))throw new RuntimeException('attendance/data/attendance.sqlite を読み込めません。同じサーバーの設置場所・読み取り権限を確認してください。（確認コード：ENTRY_FILE）');
 $v=SQLite3::version();$version=$v['versionString'];return prReadSource($file,$date,prLegacyWal($file,$version),$version);
}
function prContext(){
 $dir=__DIR__.'/data';$base=readJsonStrict($dir.'/schedule_data.json');$master=readJsonStrict($dir.'/student_master.json',$base['students']??[]);$profiles=readJsonStrict($dir.'/student_profiles.php');$names=[];
 foreach($master as $m)if(!empty($m['生徒名']))$names[$m['生徒名']]=prNumber($profiles[$m['生徒名']]['registrationNumber']??'');
 $links=readJsonStrict($dir.'/presence_links.php',['schema'=>1,'links'=>[]]);if(($links['schema']??null)!==1||!is_array($links['links']??null))dataError('入退室の対応表を確認してください。上書きを停止しました。');
 return ['names'=>$names,'master'=>$master,'directory'=>readJsonStrict($dir.'/directory_state.json'),'states'=>readJsonStrict($dir.'/class_state.json'),'links'=>$links];
}
function prMappings($ctx,$catalog){
 $out=[];$numberCounts=array_count_values(array_filter(array_values($ctx['names'])));$owners=[];
 foreach($ctx['names'] as $name=>$number){
  $saved=$ctx['links']['links'][$name]??null;$has=array_key_exists($name,$ctx['links']['links']);$id=null;$reason='未連携';$mode='auto';$suggestion=null;
  $sameName=array_values(array_filter($catalog,fn($r)=>prName($r['name'])===prName($name)));if(count($sameName)===1)$suggestion=$sameName[0]['id'];
  if($has){$mode=$saved===null?'none':'manual';if($saved===null)$reason='連携しない設定';else{$target=$catalog[$saved['externalId']??0]??null;if($target&&$target['student_no']===($saved['number']??'')&&$target['name']===($saved['name']??'')){$id=$target['id'];$reason='管理者が確認済み';}else $reason='入退室側の生徒情報が変わりました。再確認が必要です';}}
  elseif($number!==''){$matches=array_values(array_filter($catalog,fn($r)=>prNumber($r['student_no'])===$number));if(count($matches)===1&&($numberCounts[$number]??0)===1&&prName($matches[0]['name'])===prName($name)){$id=$matches[0]['id'];$reason='塾籍番号・氏名が一致';}else $reason='塾籍番号・氏名の対応を確認してください';}
  $out[$name]=['externalId'=>$id,'reason'=>$reason,'mode'=>$mode,'suggestion'=>$suggestion,'selected'=>$has?($saved===null?'none':(string)($saved['externalId']??'')):'auto'];if($id!==null)$owners[$id][]=$name;
 }
 foreach($owners as $names)if(count($names)>1)foreach($names as $name){$out[$name]['externalId']=null;$out[$name]['reason']='同じ入退室生徒への対応が重複しています。管理者の確認が必要です';$out[$name]['conflict']=true;}
 return $out;
}
function prMappingVersion($ctx,$catalog){$identities=[];foreach($catalog as $id=>$r)$identities[$id]=[$r['student_no'],$r['name']];return prHash([$ctx['names'],$ctx['links'],$identities]);}
function prRegistrationNumbers($ctx=null){
 // Project only confirmed mappings; never expose the entrance roster, status, or credentials publicly.
 if($ctx===null)$ctx=prContext();
 try{[$catalog]=prSource(date('Y-m-d'));}catch(RuntimeException $e){return ['numbers'=>[],'status'=>'unavailable'];}
 $numbers=[];$counts=[];foreach($catalog as $r){$n=prNumber($r['student_no']);if($n!=='')$counts[$n]=($counts[$n]??0)+1;}
 foreach(prMappings($ctx,$catalog) as $name=>$mapping){$id=$mapping['externalId'];if($id===null)continue;$n=prNumber($catalog[$id]['student_no']);if($n!==''&&$counts[$n]===1)$numbers[$name]=$n;}
 return ['numbers'=>$numbers,'status'=>'available'];
}
function prStatus($map,$catalog,$latest,$events,$date){
 $id=$map['externalId'];$out=['status'=>'UNKNOWN','at'=>null,'stale'=>false,'reason'=>$map['reason'],'events'=>[]];if($id===null)return $out;
 $out['events']=$events[$id]??[];$r=$catalog[$id];$log=$latest[$id]??null;
 if(!$log){$out['reason']='入退室の記録がありません';return $out;}
 $stamp=DateTimeImmutable::createFromFormat('!Y-m-d H:i:s',$log['acted_at']);
 if(!$stamp||$stamp->format('Y-m-d H:i:s')!==$log['acted_at']||$stamp->getTimestamp()>time()+60||!in_array($log['action'],['IN','TEMP_OUT','OUT'],true)||$r['status']!==$log['action']){$out['reason']='現在の状態と入退室記録の確認が必要です';return $out;}
 $out['status']=$log['action'];$out['at']=$stamp->format('c');$out['stale']=$stamp->format('Y-m-d')<date('Y-m-d');$out['reason']=$out['stale']?'前日以前の記録・現在の居場所は要確認':'';return $out;
}
function prEligible($name,$rows,$ctx,$date){
 $dir=$ctx['directory'];$own=array_values(array_filter($ctx['master'],fn($m)=>($m['生徒名']??'')===$name));$eligible=[];$priority=[];
 foreach($own as $m)$priority[scClass($m['クラス']??'',$dir)]=(float)($m['優先度']??0);
 foreach($rows as $r){$cls=scClass($r['クラス']??'',$dir);if(!empty($r['日区分'])||str_replace('/','-',$r['日付']??'')!==$date||!empty($dir['hiddenClasses'][$cls]))continue;$members=array_filter($own,fn($m)=>scClass($m['クラス']??'',$dir)===$cls&&scWithin($m['在籍期間']??[['from'=>'','until'=>'']],$date));if(!$members)continue;
  $state=$ctx['states'][canonicalLessonKey(policyKey($r))]??[];$att=$state['attendance'][$name]??'';$exempt=false;
  if($att!==''&&$att!=='---')$exempt=$att==='免除';elseif(isset($state['exemptionOverrides'][$name]))$exempt=(bool)$state['exemptionOverrides'][$name];else foreach($members as $m)if(scWithin($m['免除期間']??[],$date))$exempt=true;
  if(!$exempt)$eligible[]=$r;
 }
 $out=[];foreach($eligible as $r){$suppressed=false;foreach($eligible as $other)if(($priority[scClass($other['クラス'],$dir)]??0)>($priority[scClass($r['クラス'],$dir)]??0)&&prMinutes($r)<prMinutes($other,true)&&prMinutes($other)<prMinutes($r,true)){$suppressed=true;break;}if(!$suppressed)$out[]=$r;}return $out;
}
function prMinutes($r,$end=false){$time=$r[$end?'終了':'開始']??'';if(preg_match('/^(\d{1,2}):(\d{2})$/D',$time,$m))return (int)$m[1]*60+(int)$m[2];$i=array_search($r['時間番号']??'',['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'],true);return 810+($i===false?0:$i)*50+($end?40:0);}
function prLessons($name,$rows,$ctx,$sourceGroups){$out=[];foreach($rows as $r){$key=canonicalLessonKey(policyKey($r));$g=$sourceGroups[$r['_sourceKey']]??null;$id=$g?$g['key']:$key;$item=scSummary($r);if(!isset($out[$id]))$out[$id]=['className'=>$item['className'],'slots'=>'','room'=>$r['教室']??'','attendance'=>[],'url'=>$g?'lesson_group.html?v=20260916-r53&id='.rawurlencode($g['id']).'&attendance=1':'teacher2026summer_vertical.html?'.http_build_query(['teacher'=>$item['teacher'],'openKey'=>$key,'date'=>$item['date'],'attendance'=>1])];$out[$id]['slots'].=$item['slot'];$out[$id]['attendance'][]=$item['slot'].'：'.($ctx['states'][$key]['attendance'][$name]??'未記録');}return array_values($out);}
