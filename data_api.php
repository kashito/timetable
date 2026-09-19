<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_policy.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET') staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir = __DIR__ . '/data';
$file = $dir . '/schedule_data.json';
$addFile = $dir . '/added_lessons.json';
$editFile = $dir . '/edited_lessons.json';
$studentMasterFile = $dir . '/student_master.json';
if (!is_dir($dir)) @mkdir($dir, 0775, true);

function readJsonArray($file,$default=[]){
 return readJsonStrict($file,$default);
}
function excelDateText($v) {
    $s = trim((string)$v);
    return str_replace('-', '/', $s);
}
function sourceKeyForRow($row, $index) {
    return 'XLSX:' . implode('|', [
        $index,
        excelDateText($row['日付'] ?? ''),
        trim((string)($row['時間番号'] ?? '')),
        trim((string)($row['クラス'] ?? '')),
        trim((string)($row['担当講師'] ?? ''))
    ]);
}
function mergedSchedule($base, $adds, $edits) {
    $out = [];
    foreach ($base as $i => $row) {
        if (!is_array($row)) continue;
        $key = sourceKeyForRow($row, $i);
        $effective = isset($edits[$key]) && is_array($edits[$key]) ? $edits[$key] : $row;
        // 明示削除された授業は現在の時間割には返さない。
        if (!empty($effective['_deleted'])) continue;
        $effective['_sourceKey'] = $key;
        $out[] = $effective;
    }
    foreach ($adds as $row) {
        if (!is_array($row)) continue;
        $key = 'ADD:' . trim((string)($row['_追加ID'] ?? ''));
        $effective = ($key !== 'ADD:' && isset($edits[$key]) && is_array($edits[$key])) ? $edits[$key] : $row;
        if (!empty($effective['_deleted'])) continue;
        $effective['_sourceKey'] = $key;
        $out[] = $effective;
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($file)) {
        echo json_encode(['ok'=>true,'initialized'=>false,'schedule'=>[],'students'=>[]], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $data = readJsonArray($file, []);
    $base = isset($data['schedule']) && is_array($data['schedule']) ? $data['schedule'] : [];
    $students = isset($data['students']) && is_array($data['students']) ? $data['students'] : [];
    if (file_exists($studentMasterFile)) $students = readJsonArray($studentMasterFile, $students);
    $schedule = policyRows();
    echo json_encode([
        'ok'=>true,
        'initialized'=>true,
        'schedule'=>$schedule,
        'students'=>$students,
        'updatedAt'=>$data['updatedAt'] ?? null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Invalid JSON'], JSON_UNESCAPED_UNICODE);
    exit;
}

if(!isset($input['schedule'],$input['students']) || !is_array($input['schedule']) || !is_array($input['students']) || count($input['schedule'])===0){ staffFail('時間割・生徒一覧が必要です。空の時間割で全体を上書きできません。',400); }
foreach(lessonGroups() as $g)if(!empty($g['active']))staffFail('連結中の授業があります。全体の時間割を読み替える前に連結を解除してください。',409);
$locked=readJsonStrict($dir.'/lesson_fixed.json');
if(empty($input['overrideFixed']))foreach(policyRows() as $old){if(empty($locked[canonicalLessonKey(policyKey($old))]['fixed']))continue;$same=false;foreach($input['schedule'] as $new)if(!scheduleFieldsChanged($old,$new)){$same=true;break;}if(!$same)guardFixedLesson(policyKey($old),$input);}
$payload=['schedule'=>$input['schedule'],'students'=>$input['students'],'updatedAt'=>date('c')];
if(!safeJsonWriteAtomic($file,$payload) || !safeJsonWriteAtomic($studentMasterFile,$input['students'])) staffFail('保存に失敗しました',500);
echo json_encode(['ok'=>true,'updatedAt'=>$payload['updatedAt']],JSON_UNESCAPED_UNICODE);
