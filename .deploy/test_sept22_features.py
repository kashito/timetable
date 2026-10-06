"""Regression checks for the 2026-09-22 schedule and display improvements."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class September22FeatureTests(unittest.TestCase):
    def text(self, name):
        return (ROOT / name).read_text(encoding="utf-8")

    def test_class_schedule_uses_numeric_date_and_slot_order(self):
        source = self.text("class-schedule.js")
        self.assertIn("function dateValue", source)
        self.assertIn("function slotValue", source)
        self.assertIn(".sort(compareSchedule)", source)
        self.assertNotIn("a['日付']+a['時間番号']", source)

    def test_private_schedule_setting_is_preserved_and_used(self):
        api = self.text("schedule_confirmed_api.php")
        client = self.text("schedule-confirmed.js")
        student = self.text("student.html")
        student_model = self.text("student-schedule-model.js")
        self.assertGreaterEqual(api.count("privateFrom"), 8)
        self.assertIn("setPrivateFrom", client)
        self.assertIn("生徒への非公開開始日", self.text("schedule_generator.php"))
        self.assertIn("生徒への非公開開始日", self.text("teacher2026summer.html"))
        self.assertIn("現在調整中", student_model)
        self.assertIn("LessonFixed?.isFixed", student)
        self.assertIn("const todayFinalizedAsOff", student)
        self.assertIn("visibleEvents.length === 0", student)
        self.assertIn("const confirmedDay", student)
        self.assertIn("r.date <= scheduleConfirmedDate", student)
        self.assertIn("date === today && japanNow.hour >= 6 && visibleEvents.length === 0", student)
        self.assertIn("eventCount:visibleEvents.length,privatePending,todayFinalizedAsOff,confirmedDay,schoolHoliday", student)
        self.assertNotIn("privatePending && date === today", student)
        self.assertIn("if(value.todayFinalizedAsOff)", student_model)
        self.assertIn("if(value.confirmedDay)", student_model)
        self.assertIn("if(value.schoolHoliday)", student_model)
        self.assertIn("if(value.privatePending&&count>0)", student_model)
        self.assertIn("function scheduleSixAmPublicationRefresh", student)
        self.assertIn("seconds * 1000 + 500", student)
        self.assertNotIn(".confirmed-date-bar{display:none", self.text("workspace-ui.css"))
        for page in ("schedule_generator.php", "teacher2026summer.html"):
            self.assertIn("workspace-ui.css?v=20260926-public-visibility", self.text(page))

    def test_countdown_supports_event_and_ten_readable_themes(self):
        api = self.text("calendar_events_api.php")
        editor = self.text("school-events.js")
        script = self.text("countdown.js")
        css = self.text("countdown.css")
        self.assertIn("'event'", api)
        self.assertIn("event:'カウントダウンイベント'", editor)
        self.assertIn("'event'", script)
        self.assertIn("'event'", self.text("calendar-view.js"))
        self.assertEqual(len(set(re.findall(r"\.countdown-theme-(\d+)\{", css))), 10)

    def test_both_daily_boards_show_seconds_clock(self):
        script = self.text("daily-board.js")
        self.assertIn('class="db-clock"', script)
        self.assertIn("setInterval(updateClock,1000)", script)
        self.assertIn("：", script)
        for page in ("daily_board.html", "room_board.html"):
            self.assertIn("20261006-pc-row-drag", self.text(page))

    def test_both_boards_share_advance_notice_and_time_pulse_rules(self):
        script = self.text("daily-board.js")
        api = self.text("daily_board_api.php")
        css = self.text("daily-board.css")
        for token in ("advanceNotice", "displayStartAt", "plannedAt-180000", "plannedAt+120000"):
            self.assertIn(token, script)
        self.assertIn("paintRows();", script)
        self.assertIn("公開前の予告と非表示の項目も", script)
        self.assertIn("db-edit-drag-handle", script)
        self.assertIn("選択した記事を今日へコピー", script)
        self.assertIn("data-copy-today", script)
        self.assertIn("rows:[...destination.rows,...copies]", script)
        self.assertIn("directRowDrag=boardId==='blue'&&monitor", script)
        self.assertIn("db-time-pulse", css)
        self.assertIn("dbReleased", api)
        self.assertIn("予告の表示開始日時を入力してください", api)

    def test_generator_header_has_requested_breathing_room(self):
        css = self.text("whole-time-header.css")
        self.assertIn("padding:10px 3px 12px", css)
        self.assertIn("margin-top:12px", css)

    def test_student_cards_remove_duplicate_class_tag_and_group_actions(self):
        student = self.text("student.html")
        self.assertIn('id="student-readability-v73"', student)
        self.assertIn('class="student-card-actions"', student)
        self.assertIn('<span>前回の授業から</span>', student)
        self.assertNotIn('tag tag-class', student)
        self.assertIn('@media(max-width:520px)', student)

    def test_availability_headers_show_ten_minute_early_arrival(self):
        script = self.text("availability.js")
        page = self.text("availability.html")
        self.assertIn("const arrivalTimes=['13:20','14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40']", script)
        self.assertIn('class="ng-slot-arrival"', script)
        self.assertIn('（${arrivalTimes[i]}入）', script)
        self.assertIn('${arrivalTimes[slots.indexOf(s)]}入', script)
        self.assertIn('.ng-slot-arrival{', page)
        self.assertIn('availability.js?v=20260924-arrival', page)

    def test_linked_lesson_autosaves_and_shows_last_saved_time(self):
        script = self.text("lesson-group.js")
        page = self.text("lesson_group.html")
        css = self.text("lesson-detail-layout.css")
        self.assertIn('setInterval(()=>{autoSave();renderNextLesson();},60000)', script)
        self.assertIn("message('自動保存中…')", script)
        self.assertIn("changeRevision===revision", script)
        self.assertIn("Object.hasOwn(current.attendance", script)
        self.assertIn("'groupSharedMemo'", script)
        self.assertIn('id="groupLastSaved"', page)
        self.assertIn('lesson-group.js?v=20261007-due-homework', page)
        self.assertIn('lesson-detail-layout.css?v=20260924-autosave', page)
        self.assertIn('.group-last-saved{', css)

    def test_student_message_is_shown_directly_below_lesson_date_and_time(self):
        generator_page = self.text("schedule_generator.php")
        generator_script = self.text("schedule-generator.js")
        timetable_page = self.text("teacher2026summer.html")
        timetable_script = self.text("timetable-app.js")
        group_page = self.text("lesson_group.html")
        group_script = self.text("lesson-group.js")
        preview_css = self.text("lesson-message-preview.css")

        self.assertLess(generator_page.index('id="fSlot"'), generator_page.index('id="generatorPublicMessagePreview"'))
        self.assertIn("publicPreview.hidden=!publicMessage", generator_script)
        self.assertIn("data-note=", timetable_script)
        self.assertIn("${esc(publicMessage)}", timetable_page)
        self.assertLess(group_page.index('id="groupFacts"'), group_page.index('id="groupPublicMessagePreview"'))
        self.assertIn("publicPreview.querySelector('span').textContent=publicMessage", group_script)
        self.assertIn('.lesson-public-message-preview[hidden]', preview_css)

    def test_whole_schedule_summarizes_each_class_student_message_below_time_header(self):
        app = self.text("timetable-app.js")
        page = self.text("teacher2026summer.html")
        css = self.text("whole-day-info.css")
        self.assertIn('data-public-message-date="${esc(d)}"', app)
        self.assertIn('function applyDayPublicMessageSummaries()', page)
        self.assertIn("item.append(name,document.createTextNode('：'+text))", page)
        self.assertIn('applyDayPublicMessageSummaries();', page)
        self.assertIn('.whole-day-public-messages[hidden]', css)
        self.assertIn('.teacher-day-info.whole-day-collapsed.has-public-messages', css)
        self.assertIn('async function copyPublicMessageToToday(cls,text,button)', page)
        self.assertIn("SharedClassState.save(key,{publicNote:text})", page)
        self.assertIn('window.WholeSchedule?.publicMessageKeys(today,cls)', page)
        self.assertIn('window.WholeSchedule={reload:()=>load(),publicMessageKeys}', app)
        self.assertIn("if(date<today)", page)
        self.assertIn('whole-day-public-message-copy', css)

    def test_previous_homework_has_immediate_checkboxes_and_carry_guidance(self):
        script = self.text("recording-tools.js")
        css = self.text("recording-tools.css")
        api = self.text("lesson_record_api.php")
        self.assertIn('data-homework-task', script)
        self.assertIn("action:'homework_check'", script)
        self.assertIn('未チェックは次回にも表示されます。変更はすぐ保存されます。', script)
        self.assertIn('.recording-homework-item', css)
        self.assertIn("$action==='homework_check'", api)


if __name__ == "__main__":
    unittest.main(verbosity=2)
