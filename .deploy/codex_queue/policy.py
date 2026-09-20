"""Conservative phase-one policy. No model decision can override these limits."""
import hashlib
import re
from pathlib import PurePosixPath

class ReviewRequired(Exception):
    def __init__(self,message,level=3):
        super().__init__(message)
        self.level=level

def level_limit(value):
    if type(value) is not int or value not in (1, 2):
        raise ValueError('max_level は 1 または 2 を指定してください。')
    return value

def require_level(level, maximum):
    level_limit(maximum)
    if level > maximum:
        reason = 'LEVEL 1限定運用のため自動処理対象外' if maximum == 1 else 'LEVEL 3は自動改修対象外'
        raise ReviewRequired('要確認：'+reason+'（依頼全体：LEVEL '+str(level)+'）。候補は作成していません。', level=level)

PROTECTED = re.compile(r'(^|/)(data|uploads?|backups?|_backup|recovery[^/]*|vendor|\.git|\.github|\.deploy|\.codex|\.secrets|credentials|sessions|logs)(/|$)|(^|/)(staff[_-]|auth|security|login|payroll|backup|restore|data_safety|admin[_-]page|site_private|codex[_-]queue|codex[_-]memo|student[_-](manage|contact)|class[_-]members|presence|incident)', re.I)
SENSITIVE_REQUEST = re.compile(r'認証|ログイン|権限|給与|金額|月謝|個人情報|実データ|初期化|バックアップ|復元|秘密鍵|パスワード|SSH|Secrets|deploy|workflow|site_private_settings|data/|\b(?:DROP|TRUNCATE|ALTER\s+TABLE|DB\s*削除)\b', re.I)
DANGEROUS_CODE = re.compile(r'\b(?:DROP\s+TABLE|TRUNCATE|ALTER\s+TABLE|CREATE\s+TABLE|DELETE\s+FROM|password_hash|password_verify|staffRequire|staffCurrent|staffCsrf|staffSession|session_start|setcookie|chmod|unlink|rmdir|rename|file_put_contents|file_get_contents|fopen|fwrite|safeJsonWriteAtomic|readJsonStrict|eval|exec|system|passthru|shell_exec|popen|proc_open|curl_exec)\s*\(?|\.\./|(?:https?:)?//[^\s\"\'<>]+|\b(?:fetch|XMLHttpRequest|sendBeacon)\s*\(', re.I)
SECRET = re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,})|\b(?:password|secret|token|api[_-]?key)\s*[:=]\s*[\"\'][^\"\']{8,}[\"\']', re.I)

def safe_path(name):
    p = PurePosixPath(name)
    if not isinstance(name, str) or not name or p.is_absolute() or str(p) != name or any(s in ('', '.', '..') for s in name.split('/')) or any(c in name for c in '\\:\x00\r\n'):
        raise ReviewRequired('安全でないファイル名です。')
    if PROTECTED.search(name) or p.suffix.lower() not in ('.html', '.css', '.js', '.php'):
        raise ReviewRequired('保護対象または運用ファイルの変更です。LEVEL 3として停止します。')
    return p

def request_risk(snapshot):
    text = '\n'.join([snapshot.get('text', ''), *(u.get('text', '') for u in snapshot.get('updates', []))])
    return bool(SENSITIVE_REQUEST.search(text))

def digest_files(files):
    return {name: hashlib.sha256(body).hexdigest() for name, body in sorted(files.items())}

def html_cosmetic(old, new):
    # Exact markup and executable blocks must remain identical for LEVEL 1.
    if re.findall(r'<[^>]+>', old) != re.findall(r'<[^>]+>', new):
        return False
    for pattern in (r'<script\b[^>]*>[\s\S]*?</script>', r'<\?[\s\S]*?\?>'):
        if re.findall(pattern, old, re.I) != re.findall(pattern, new, re.I):
            return False
    return True

def apply_edits(original, edits, suggested_level, *, max_level=2):
    require_level(suggested_level, max_level)
    if suggested_level not in (1, 2):
        raise ReviewRequired('LEVEL 3は自動改修しません。')
    if not isinstance(edits, list) or not edits or len(edits) > 80:
        raise ReviewRequired('変更内容を特定できないか、変更が多すぎます。')
    # Inspect the entire batch before materializing a candidate. Never accept a
    # LEVEL 1 subset of an otherwise LEVEL 2 request.
    planned = {}
    changed = set()
    level = suggested_level
    total = 0
    for edit in edits:
        if not isinstance(edit, dict) or set(edit) != {'path', 'before', 'after'}:
            raise ReviewRequired('修正案の形式が正しくありません。')
        name, before, after = edit['path'], edit['before'], edit['after']
        safe_path(name)
        if not isinstance(before, str) or not isinstance(after, str) or not after or before == after:
            raise ReviewRequired('削除・空の変更は自動処理しません。')
        total += len(before.encode()) + len(after.encode())
        if total > 512000 or '\x00' in before + after:
            raise ReviewRequired('変更量または形式が想定外です。')
        if DANGEROUS_CODE.search(before + '\n' + after) or SECRET.search(after):
            raise ReviewRequired('認証・データ操作・外部通信・秘密情報に関わる変更のため、LEVEL 3として停止します。')
        try:
            old = planned.get(name, original.get(name, b'')).decode('utf-8')
        except UnicodeError:
            raise ReviewRequired('バイナリ・文字コードの変更は自動処理しません。') from None
        if name not in original and name not in planned:
            if before:
                raise ReviewRequired('新規ファイルの指定が一致しません。')
            new = after
            level = 2
        else:
            if not before or old.count(before) != 1:
                raise ReviewRequired('置換箇所を一意に特定できません。')
            new = old.replace(before, after, 1)
        if name.endswith(('.js', '.php')) or (name.endswith('.html') and not html_cosmetic(old, new)):
            level = 2
        if name.endswith('.css') and re.search(r'@import|url\s*\(|expression\s*\(', before + after, re.I):
            raise ReviewRequired('外部参照を伴うCSSは要確認です。')
        planned[name] = new.encode('utf-8')
        changed.add(name)
    if len(changed) >= 100 or len(changed) > 20:
        raise ReviewRequired('想定を超えるファイル数の変更です。')
    if len(changed) > 1:
        level = 2
    require_level(level, max_level)
    actual = {n for n in planned if planned[n] != original.get(n)}
    if actual != changed:
        raise ReviewRequired('変更が相殺されたか、差分が一致しません。')
    return dict(original, **planned), sorted(changed), level
