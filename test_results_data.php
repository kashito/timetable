<?php
require_once __DIR__.'/recording_context.php';
// Old empty scores remain ungraded; only explicitly unreported results notify students.
function trStatuses($r){$out=[];foreach($r['scores']??[] as $name=>$score)$out[$name]=$score!==null?'reported':($r['statuses'][$name]??'ungraded');return $out;}
function trPendingNames($r,$directory){if(!empty($r['archived']))return [];return array_keys(array_filter(trStatuses($r),fn($status,$name)=>$status==='unreported'&&empty($directory['hiddenStudents'][$name]),ARRAY_FILTER_USE_BOTH));}
function trReadData(){ $v=readJsonStrict(__DIR__.'/data/test_results.php',['schema'=>1,'items'=>[]]);if(($v['schema']??null)!==1||!is_array($v['items']??null))staffFail('テスト結果の保存形式を確認してください。',500);return $v; }
