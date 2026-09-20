"""Public GET-only smoke checks. Response bodies/cookies are never logged."""
import hashlib
import json
import re
import urllib.error
import urllib.parse
import urllib.request
import uuid

BASE_URL = 'https://224236.com/2026summer/'
HTML_PAGES = {
    'staff_login.html': '先生のログイン',
    'teacher2026summer.html': '全体スケ2026',
    'student.html': '生徒個人2026',
    'lesson_records.html': 'カルテ',
    'daily_board.html': '今日の動き',
}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def http_get(path):
    url = BASE_URL + path + '?_deploy_check=' + uuid.uuid4().hex
    request = urllib.request.Request(url, headers={
        'Cache-Control': 'no-cache', 'User-Agent': 'Timetable-Deployment-Healthcheck'})
    try:
        response = urllib.request.build_opener(NoRedirect()).open(request, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read(8 * 1024 * 1024)
        return response.code, body, response.headers.get('Location', '')


def healthcheck(expected_files=None):
    expected_files = expected_files or {}
    results = []
    for path, title in HTML_PAGES.items():
        status, body, _ = http_get(path)
        text = body.decode('utf-8', errors='replace')
        match = re.search(r'<title>(.*?)</title>', text, re.I | re.S)
        ok = status == 200 and match is not None and title in match[1] and '</html>' in text.lower()
        if path in expected_files:
            ok = ok and hashlib.sha256(body).hexdigest() == expected_files[path]
        if not ok:
            raise RuntimeError('HTTP page check failed: ' + path + ' (' + str(status) + ')')
        results.append({'path': path, 'status': status, 'page_content': 'ok'})
    for path in ('staff-auth.js', 'timetable-app.js'):
        status, body, _ = http_get(path)
        ok = status == 200 and len(body) > 100
        if path in expected_files:
            ok = ok and hashlib.sha256(body).hexdigest() == expected_files[path]
        if not ok:
            raise RuntimeError('HTTP asset check failed: ' + path)
        results.append({'path': path, 'status': status, 'asset_content': 'ok'})
    # The expected healthy anonymous response is a login redirect, not payroll data.
    for path in ('payroll.php', 'schedule_generator.php'):
        status, _, location = http_get(path)
        dest = urllib.parse.urlparse(urllib.parse.urljoin(BASE_URL, location))
        if status not in (302, 303) or dest.netloc != '224236.com' or dest.path != '/2026summer/staff_login.html':
            raise RuntimeError('Authentication redirect check failed: ' + path)
        results.append({'path': path, 'status': status, 'authentication': 'protected'})
    status, body, _ = http_get('staff_auth_api.php')
    try:
        state = json.loads(body)
    except (ValueError, UnicodeError):
        raise RuntimeError('Authentication API did not return JSON') from None
    if (status != 200 or state.get('user') is not None or state.get('needsSetup') is not False
            or not isinstance(state.get('csrf'), str) or 'recordDisplay' in state):
        raise RuntimeError('Anonymous authentication API check failed')
    results.append({'path': 'staff_auth_api.php', 'status': status, 'json_and_existing_setup': 'ok'})
    status, body, _ = http_get('data/site_private_settings.php')
    if status != 200 or body != b'':
        raise RuntimeError('Private settings HTTP protection failed')
    results.append({'path': 'data/site_private_settings.php', 'status': status, 'body_bytes': 0})
    return results


if __name__ == '__main__':
    print(json.dumps(healthcheck(), ensure_ascii=False, indent=2))
