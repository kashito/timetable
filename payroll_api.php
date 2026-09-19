<?php
require_once __DIR__.'/staff_security.php';
staffRequire(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/data_safety.php';

$dir = __DIR__ . '/data';
$file = $dir . '/payroll_rates.json';
if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'dataフォルダを作成できません'], JSON_UNESCAPED_UNICODE);
  exit;
}
function readRates($file) {
  if (!is_file($file)) return [];
  $j = json_decode(@file_get_contents($file) ?: '[]', true);
  return is_array($j) ? $j : [];
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  echo json_encode(['ok'=>true,'rates'=>readRates($file)], JSON_UNESCAPED_UNICODE);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Method not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in) || !isset($in['rates']) || !is_array($in['rates'])) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'ratesが不正です'], JSON_UNESCAPED_UNICODE);
  exit;
}
$clean=[];
foreach ($in['rates'] as $r) {
  if (!is_array($r)) continue;
  $teacher=trim((string)($r['teacher']??''));
  $class=trim((string)($r['class']??''));
  $category=trim((string)($r['category']??''));
  $amount=(int)($r['amount']??0);
  if ($teacher==='' || $amount<0) continue;
  if (!in_array($category, ['', '演習','小学生','中学生','高校生','その他'], true)) $category='その他';
  $clean[]=['teacher'=>$teacher,'class'=>$class,'category'=>$category,'amount'=>$amount];
}
if (!safeJsonWriteAtomic($file, $clean)) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'給与単価を保存できません'], JSON_UNESCAPED_UNICODE);
  exit;
}
echo json_encode(['ok'=>true,'rates'=>$clean,'updatedAt'=>date('c')], JSON_UNESCAPED_UNICODE);
?>
