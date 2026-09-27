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
        "banner": source_ref("student.html", "student-schedule-adjusting\">現在調整中"),
        "empty": source_ref("student.html", "if (!special && !privatePending) html +="),
        "special": source_ref("student.html", "SchoolHolidays.emptyDayLabel(date):originalLabel"),
        "label": source_ref("school-holidays.js", "return days>=0&&days<=14?'現在調整中':'未定';"),
        "off": source_ref("school-holidays.js", "if(isHoliday(d)||d<today)return 'OFF';"),
        "setting": source_ref("student.html", "schedulePrivateFrom=publicSettings?.ok?String(publicSettings.privateFrom||''):'';"),
        "fixed": source_ref("lesson-fixed.js", "const isFixed=key=>!!lessons[key]?.fixed;"),
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
                    "condition": "その日について、公開対象として残った確定授業が0件"
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
                "privateFrom の設定取得に失敗した場合は空文字になり、この非公開処理とバナーは作動しない"
            ],
            "exact_predicates": {
                "feature_enabled": refs["hide"]["code"],
                "lesson_visibility": refs["filter"]["code"],
                "banner_visibility": refs["pending"]["code"],
                "fixed_definition": refs["fixed"]["code"]
            },
            "source": [refs[k] for k in ("setting", "hide", "filter", "pending", "banner", "fixed")],
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
            "alternate_trigger": "特別日の表示名が OFF の場合も emptyDayLabel を通るため、休講日登録がなく今日から14日後以内なら「現在調整中」に置換される",
            "priority_and_other_results": [
                "休講日登録済み、または今日より前の日付は OFF",
                "今日から15日後以降は 未定",
                "非公開開始日バナー対象なら、予定なしラベルよりバナーが優先される"
            ],
            "exact_predicates": {
                "off": refs["off"]["code"],
                "date_window": refs["label"]["code"],
                "empty_day_guard": refs["empty"]["code"],
                "special_off_conversion": refs["special"]["code"]
            },
            "source": [refs[k] for k in ("empty", "special", "off", "label")],
            "generated_by": GENERATOR
        }
    ]
    faq = {
        "id": "student-currently-adjusting-exact-condition",
        "question": "生徒・保護者画面で「現在調整中」と表示される正確な条件は？",
        "answer": "2系統あります。①講師未ログインかつ生徒への非公開開始日が設定され、対象日が開始日以降なら表示します。この期間は未確定授業を隠し、個別に確定された授業だけを表示します。確定授業がその日に1件以上あれば「（確定した授業のみ表示しています）」が付きます。②予定なし日の補助表示では、休講日でなく、日本時間の今日から14日後までなら表示します。過去日・休講日は「OFF」、15日後以降は「未定」です。",
        "related_display_rule_ids": [rule["id"] for rule in rules],
        "status": "production",
        "generated_by": GENERATOR
    }
    return rules, faq, digest


def expected_guide(path):
    guide = json.loads(path.read_text(encoding="utf-8"))
    rules, faq, digest = generated_content()
    guide["display_rules"] = rules
    guide["faq"] = [item for item in guide.get("faq", []) if item.get("generated_by") != GENERATOR]
    guide["faq"].append(faq)
    guide["generated_sections"] = {
        "display_rules": {
            "generator": GENERATOR,
            "source_digest_sha256": digest,
            "sources": ["student.html", "school-holidays.js", "lesson-fixed.js"]
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
