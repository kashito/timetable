<?php
require_once __DIR__.'/lesson_groups.php';require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))staffFail('操作を確認してください。',405);
$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in)||!is_string($in['id']??null))staffFail('連結した授業を選び直してください。',400);
$dir=__DIR__.'/data';$groups=lessonGroups();$g=$groups[$in['id']]??null;if(!$g||empty($g['active']))staffFail('連結が変更・解除されました。再読み込みしてください。',409);
$all=policyRows();$members=groupRows($g,$all);if(count($members)<2||count($members)!==count($g['sources']))staffFail('連結したコマが変更されました。再読み込みしてください。',409);
$records=readJsonStrict($dir.'/lesson_records.json');$candidates=[];
foreach($all as $r)if(empty($r['日区分'])&&lgCompatible($members[0],$r)&&!groupForSource($r['_sourceKey']))$candidates[]=['row'=>$r,'record'=>$records[canonicalLessonKey(policyKey($r))]??[]];
$version=hash('sha256',json_encode([$g,$members,$candidates,$records[$g['key']]??[]],JSON_UNESCAPED_UNICODE));
if($method==='GET'){echo json_encode(['ok'=>true,'group'=>groupSummary($g,$members),'members'=>$members,'candidates'=>$candidates,'version'=>$version],JSON_UNESCAPED_UNICODE);exit;}
$sources=$in['sources']??null;$requestId=$in['requestId']??'';
if(!is_array($sources)||count($sources)<1||count($sources)>9||array_keys($sources)!==range(0,count($sources)-1)||count(array_unique($sources))!==count($sources)||!is_string($in['version']??null)||!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId))staffFail('追加するコマを選んでください。',400);
foreach($sources as $s)if(!is_string($s))staffFail('追加するコマを確認してください。',400);
$hash=hash('sha256',json_encode([$actor['id'],$g['id'],$in['version'],$sources],JSON_UNESCAPED_UNICODE));
if(($g['lastExtend']['requestId']??'')===$requestId){if(!hash_equals($g['lastExtend']['hash'],$hash))staffFail('保存済みの操作です。再読み込みしてください。',409);echo json_encode(['ok'=>true,'group'=>groupSummary($g,$members),'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;}
if(!hash_equals($version,$in['version']))staffFail('授業またはカルテが更新されました。開き直して確認してください。',409);
$extra=[];foreach($sources as $source){$found=null;foreach($candidates as $c)if($c['row']['_sourceKey']===$source)$found=$c['row'];if(!$found)staffFail('追加するコマが変更・連結されました。開き直してください。',409);$extra[]=$found;}
$rows=array_merge($members,$extra);$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];usort($rows,fn($a,$b)=>array_search($a['時間番号'],$slots,true)<=>array_search($b['時間番号'],$slots,true));$prev=null;$keys=[];
foreach($rows as $r){$i=array_search($r['時間番号'],$slots,true);if($i===false||($prev!==null&&$i!==$prev+1))staffFail('間が空かないように、前後の連続したコマを選んでください。',400);$prev=$i;$keys[]=canonicalLessonKey(policyKey($r));}
if(count(array_unique($keys))!==count($keys))staffFail('同じコマが含まれています。追加するコマを確認してください。',409);
$record=$records[$g['key']]??[];
foreach($extra as $r){$old=$records[canonicalLessonKey(policyKey($r))]??[];foreach(['memo','homework'] as $field)if(trim((string)($old[$field]??''))!=='')$record[$field]=rtrim((string)($record[$field]??'')).(trim((string)($record[$field]??''))!==''?"\n\n":'').'【追加 '.$r['時間番号'].'】' . "\n".$old[$field];}
$g['extendHistory'][]=['at'=>date('c'),'by'=>$actor['name'],'sources'=>$sources];$g['sources']=array_column($rows,'_sourceKey');$g['snapshot']=$rows;$g['lastExtend']=['requestId'=>$requestId,'hash'=>$hash];
$record['slot']=implode('',array_column($rows,'時間番号'));$record['updatedAt']=date('c');$record['updatedBy']=$actor['name'];$records[$g['key']]=$record;$groups[$g['id']]=$g;
if(!safeDataTransaction([$dir.'/lesson_groups.json'=>$groups,$dir.'/lesson_records.json'=>$records]))staffFail('追加の連結を保存できませんでした。',500);
echo json_encode(['ok'=>true,'group'=>groupSummary($g,$rows)],JSON_UNESCAPED_UNICODE);
