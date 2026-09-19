<?php
require_once __DIR__.'/staff_security.php';

// Fallback download endpoint. Student UI normally links directly to the stored
// file, but this keeps old links working and preserves the file extension.
$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$metaFile = $dataDir . DIRECTORY_SEPARATOR . 'student_attachments.json';
$uploadDir = $dataDir . DIRECTORY_SEPARATOR . 'student_uploads';
$id = trim((string)($_GET['id'] ?? ''));
if ($id === '' || !is_file($metaFile)) { http_response_code(404); exit; }
$rows = json_decode((string)@file_get_contents($metaFile), true);
if (!is_array($rows)) { http_response_code(404); exit; }
$row = null;
foreach ($rows as $r) {
  if (is_array($r) && (string)($r['id'] ?? '') === $id) { $row = $r; break; }
}
if (!$row) { http_response_code(404); exit; }
$stored = basename((string)($row['stored'] ?? ''));
$path = $uploadDir . DIRECTORY_SEPARATOR . $stored;
if ($stored === '' || !is_file($path) || !is_readable($path)) { http_response_code(404); exit('file not found'); }

$name = basename((string)($row['name'] ?? 'download'));
$name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name);
$storedExt = strtolower((string)pathinfo($stored, PATHINFO_EXTENSION));
$nameExt = strtolower((string)pathinfo($name, PATHINFO_EXTENSION));
// Older metadata can contain a name without an extension. Recover it from the
// stored filename so Windows/iOS can identify the file type.
if ($nameExt === '' && $storedExt !== '') {
  $name = ($name !== '' ? $name : 'download') . '.' . $storedExt;
  $nameExt = $storedExt;
}
if ($name === '') $name = 'download' . ($storedExt !== '' ? '.'.$storedExt : '');
$ext = $nameExt !== '' ? preg_replace('/[^A-Za-z0-9]/', '', $nameExt) : '';
$ascii = 'download' . ($ext !== '' ? '.'.$ext : '');

$mime = (string)($row['mime'] ?? '');
if ($mime === '' || preg_match('/[\r\n]/', $mime)) {
  $mime = 'application/octet-stream';
  if (function_exists('finfo_open')) {
    $fi = finfo_open(FILEINFO_MIME_TYPE);
    if ($fi) { $m = finfo_file($fi, $path); if ($m) $mime = $m; if(PHP_VERSION_ID<80500)finfo_close($fi); }
  }
}
while (ob_get_level() > 0) { @ob_end_clean(); }
header('Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: public');
header('Expires: 0');
header('Content-Type: '.$mime);
header('Content-Length: '.(string)filesize($path));
header('Accept-Ranges: bytes');
header("Content-Disposition: attachment; filename=\"{$ascii}\"; filename*=UTF-8''".rawurlencode($name));
header('Content-Transfer-Encoding: binary');
header('X-Content-Type-Options: nosniff');
$fp = @fopen($path, 'rb');
if (!$fp) { http_response_code(404); exit; }
fpassthru($fp);
fclose($fp);
exit;
