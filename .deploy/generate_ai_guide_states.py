"""Generate student/guardian display rules in ai-guide.json from production UI code."""
import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "ai-guide.json"
CENTRAL_GUIDE = ROOT / "ai" / "guides" / "timetable" / "ai-guide.json"
GENERATOR = ".deploy/generate_ai_guide_states.py"


def source_ref(path, needle):
    text = (ROOT / path).read_text(encoding="utf-8")
    for number, line in enumerate(text.splitlines(), 1):
        if needle in line:
            return {"file": path, "line": number, "code": line.strip()}
    raise RuntimeError(f"Display-rule source not found: {path}: {needle}")


def generated_content():
    refs = {
        "hide": source_ref("student.html", "const hideTentative = !StaffAuth.user && schedulePrivateFrom;"),
        "filter": source_ref("student.html", "resolvedStudentNormal.filter(r => r.date < schedulePrivateFrom"),
        "pending": source_ref("student.html", "const privatePending = !!(hideTentative && date >= schedulePrivateFrom);"),
        "today_off": source_ref("student.html", "const todayFinalizedAsOff = !!(privatePending && date === today"),
        "six_refresh": source_ref("student.html", "function scheduleSixAmPublicationRefresh(clock)"),
        "banner": source_ref("student.html", "const dayState=StudentScheduleModel.dayState({"),
        "empty": source_ref("student.html", "if (selectedStudent && studentEvents.length === 0)"),
        "empty_label": source_ref("student.html", "const emptyDayLabel=SchoolHolidays.emptyDayLabel(date);"),
        "special": source_ref("student.html", "const overviewSpecial=special?displayDayType(specialDayLabel(special)):'';"),
        "label": source_ref("school-holidays.js", "return days>=0&&days<=14?'現在調整中':'未定';"),
        "off": source_ref("school-holidays.js", "if(isHoliday(d)||d<today)return 'OFF';"),
        "setting": source_ref("student.html", "schedulePrivateFrom=publicSettings?.ok?String(publicSettings.privateFrom||''):'';"),
        "fixed": source_ref("lesson-fixed.js", "const isFixed=key=>!!lessons[key]?.fixed;"),
        "overview": source_ref("student.html", "<div class=\"day-overview\">"),
        "gaps": source_ref("student-schedule-model.js", "function gaps(events)"),
        "day_state": source_ref("student-schedule-model.js", "function dayState(input)"),
        "homework": source_ref("student-schedule-model.js", "function homework(text,limit=88)"),
        "materials": source_ref("student.html", "class=\"student-materials-view\""),
        "other": source_ref("student.html", "<details class=\"student-other-info\">"),
        "themes": source_ref("student-display-settings.js", "const themes=["),
        "theme_storage": source_ref("student-display-settings.js", "const STORAGE='student-schedule-theme-v1';"),
    }
    digest = hashlib.sha256("\n".join(ref["code"] for ref in refs.values()).encode()).hexdigest()
    rules = [
        {
            "id": "student-currently-adjusting-private-window",
            "audience": ["student", "guardian"],
            "page": "生徒予定表",
            "status": "production",
            "message": "現在調整中",
            "message_variants": [
                {
                    "text": "現在調整中（確定した授業のみ表示しています）",
                    "condition": "その日について、公開対象として残った確定授業が1件以上ある（studentEvents.length > 0）"
                },
                {
                    "text": "現在調整中",
                    "condition": "公開対象として残った確定授業が0件で、対象日が今日の午前6時以降ではない"
                },
                {
                    "text": "OFF",
                    "condition": "対象日が日本時間の今日、午前6時以降、かつ公開対象として残った確定授業が0件"
                }
            ],
            "all_conditions": [
                "講師セッションがない（!StaffAuth.user）。生徒・保護者の通常閲覧が該当する",
                "schedule_confirmed_api.php が返す privateFrom（生徒への非公開開始日）が空でない",
                "表示対象日 date が privateFrom 以降（date >= schedulePrivateFrom）"
            ],
            "behavior": [
                "privateFrom より前の授業は確定・未確定に関係なく表示対象になる",
                "privateFrom 以降は未確定授業を除外する",
                "privateFrom 以降でも lesson_fixed_api の fixed が真の授業だけは表示する",
                "日本時間の当日午前6時以降に確定授業が0件なら「現在調整中」ではなく「OFF」を表示する",
                "午前6時前から画面を開いていても、6時に表示を再計算する",
                "privateFrom の設定取得に失敗した場合は空文字になり、この非公開処理とバナーは作動しない"
            ],
            "exact_predicates": {
                "feature_enabled": refs["hide"]["code"],
                "lesson_visibility": refs["filter"]["code"],
                "banner_visibility": refs["pending"]["code"],
                "today_off": refs["today_off"]["code"],
                "fixed_definition": refs["fixed"]["code"]
            },
            "source": [refs[k] for k in ("setting", "hide", "filter", "pending", "today_off", "six_refresh", "banner", "fixed")],
            "generated_by": GENERATOR
        },
        {
            "id": "student-currently-adjusting-empty-day",
            "audience": ["student", "guardian"],
            "page": "生徒予定表",
            "status": "production",
            "message": "現在調整中",
            "all_conditions": [
                "日本時間の今日を0日目として、表示対象日が0日後から14日後まで（両端を含む）",
                "その日が休講日として登録されていない",
                "通常の予定なし表示では、選択中の生徒にその日の表示対象授業が0件",
                "通常の予定なし表示では、特別日データがなく、非公開開始日バナーの対象でもない"
            ],
            "alternate_trigger": "特別日の表示名が OFF の場合も通常は emptyDayLabel を通る。ただし、生徒への非公開開始日以降で、当日午前6時以降かつ確定授業0件なら「OFF」を維持する",
            "priority_and_other_results": [
                "休講日登録済み、または今日より前の日付は OFF",
                "今日から15日後以降は 未定",
                "非公開開始日バナー対象でも、当日午前6時以降かつ確定授業0件なら OFF が優先される"
            ],
            "exact_predicates": {
                "off": refs["off"]["code"],
                "date_window": refs["label"]["code"],
                "empty_day_guard": refs["empty"]["code"],
                "today_off_label": refs["empty_label"]["code"],
                "special_off_conversion": refs["special"]["code"]
            },
            "source": [refs[k] for k in ("today_off", "empty", "empty_label", "special", "off", "label")],
            "generated_by": GENERATOR
        },
        {
            "id": "student-schedule-priority-layout",
            "audience": ["student", "guardian"],
            "page": "生徒予定表",
            "status": "production",
            "message": "日ごとの状態・来室時刻・終了時刻を先に表示",
            "behavior": [
                "日付直下に授業あり・OFF・現在調整中などの状態、最初の授業開始時刻、最後の授業終了時刻を表示する",
                "一部だけ確定している日は「授業あり・現在調整中（確定した授業のみ表示）」と表示し、全予定が確定したように見せない",
                "授業区間を統合してから空き時間を計算し、重複授業や連結授業の途中を空き時間にしない",
                "宿題は常時表示し、空欄は「宿題の記録はまだありません」、長文は「続きを読む」で全文を表示する",
                "資料を見る・資料を送るを各授業に表示し、資料0件と取得失敗を別の状態として案内する",
                "前回授業からの経過と開始までのカウントダウンは「その他の情報」に折りたたむ",
                "表示設定では20色から端末ごとのテーマを選択でき、標準へ戻せる。警告・欠席・未確定の意味色はテーマと分離する"
            ],
            "source": [refs[k] for k in ("overview", "day_state", "gaps", "homework", "materials", "other", "themes", "theme_storage")],
            "generated_by": GENERATOR
        }
    ]
    faq = {
        "id": "student-currently-adjusting-exact-condition",
        "question": "生徒・保護者画面で「現在調整中」と表示される正確な条件は？",
        "answer": "2系統あります。①講師未ログインかつ生徒への非公開開始日が設定され、対象日が開始日以降なら表示します。この期間は未確定授業を隠し、個別に確定された授業だけを表示します。確定授業がその日に1件以上あれば「（確定した授業のみ表示しています）」が付きます。ただし、日本時間の当日午前6時以降に確定授業が0件なら「OFF」と表示します。②予定なし日の補助表示では、休講日でなく、日本時間の今日から14日後までなら表示します。過去日・休講日は「OFF」、15日後以降は「未定」です。",
        "related_display_rule_ids": [rule["id"] for rule in rules],
        "status": "production",
        "generated_by": GENERATOR
    }
    operation = {
        "id": "student-schedule-display-settings",
        "question": "生徒予定表の色テーマを変更するには？",
        "answer": "生徒予定表の上部にある「表示設定」を開き、色見本と色名から選びます。選択はその端末のブラウザーに保存され、先生やほかの利用者の画面には影響しません。",
        "steps": [
            "生徒予定表を開く",
            "上部の「表示設定」を押す",
            "20色から好みの色を選ぶ",
            "元へ戻す場合は「標準に戻す」を押す"
        ],
        "page": "生徒予定表",
        "url": "https://224236.com/2026summer/student.html",
        "roles": ["student", "guardian"],
        "buttons": ["表示設定", "標準に戻す"],
        "status": "production",
        "keywords": ["テーマ", "色", "表示設定", "20色", "標準に戻す"],
        "generated_by": GENERATOR
    }
    recent = {
        "date": "2026-09-27",
        "feature": "生徒・保護者向け予定確認画面",
        "change": "日ごとの状態・来室/終了時刻・空き時間を要約し、宿題・資料操作を優先表示。20色の端末別テーマを追加",
        "generated_by": GENERATOR
    }
    return rules, faq, operation, recent, digest


def expected_guide(path):
    guide = json.loads(path.read_text(encoding="utf-8"))
    rules, faq, operation, recent, digest = generated_content()
    guide["display_rules"] = rules
    guide["faq"] = [item for item in guide.get("faq", []) if item.get("generated_by") != GENERATOR]
    guide["faq"].append(faq)
    guide["operations"] = [item for item in guide.get("operations", []) if item.get("generated_by") != GENERATOR]
    guide["operations"].append(operation)
    guide["recent_changes"] = [item for item in guide.get("recent_changes", []) if item.get("generated_by") != GENERATOR]
    guide["recent_changes"].insert(0, recent)
    guide["generated_sections"] = {
        "display_rules": {
            "generator": GENERATOR,
            "source_digest_sha256": digest,
            "sources": ["student.html", "school-holidays.js", "lesson-fixed.js", "student-schedule-model.js", "student-display-settings.js"]
        }
    }
    return guide


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="update ai-guide.json")
    args = parser.parse_args()
    stale = []
    for path in (GUIDE, CENTRAL_GUIDE):
        rendered = json.dumps(expected_guide(path), ensure_ascii=False, indent=2) + "\n"
        if args.write:
            path.write_text(rendered, encoding="utf-8")
            print(f"Updated {path.relative_to(ROOT)} display rules from production UI code")
        elif path.read_text(encoding="utf-8") != rendered:
            stale.append(path.relative_to(ROOT).as_posix())
    if stale:
        raise SystemExit(
            "Generated display rules are stale in " + ", ".join(stale)
            + "; run: python .deploy/generate_ai_guide_states.py --write"
        )
    if not args.write:
        print("Generated timetable display rules are current")


if __name__ == "__main__":
    main()
