import os
import json
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class LessonInvitationTests(unittest.TestCase):
    def text(self, name):
        return (ROOT / name).read_text(encoding="utf-8")

    def test_php_roster_helper_merges_invites_without_changing_membership(self):
        php = os.environ.get("TIMETABLE_TEST_PHP", "php")
        code = (
            "require 'lesson_roster.php';"
            "$s=[['生徒名'=>'通常','クラス'=>'A'],['生徒名'=>'追加','クラス'=>'B']];"
            "$d=['hiddenStudents'=>[]];"
            "echo json_encode(lessonRosterNames($s,$d,'A','2026-10-03',['invitedStudents'=>['追加','追加']]));"
        )
        result = subprocess.run([php, "-r", code], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), ["\u8ffd\u52a0", "\u901a\u5e38"])

    def test_save_and_public_read_include_invitation_field(self):
        self.assertIn("'invitedStudents'", self.text("state_api.php"))
        self.assertIn("'invitedStudents'", self.text("staff_security.php"))
        group = self.text("lesson_group_api.php")
        self.assertIn("lessonValidateInvitedStudents", group)
        self.assertIn("'availableStudents'=>lessonVisibleStudentNames", group)

    def test_all_lesson_details_offer_invitation_picker(self):
        for name in ("teacher2026summer.html", "teacher2026summer_vertical.html"):
            page = self.text(name)
            self.assertIn("LessonInvitations.markup", page)
            self.assertIn("invitedStudents:LessonInvitations.selected(modal)", page)
        self.assertIn('id="generatorInvitationPicker"', self.text("schedule_generator.php"))
        self.assertIn('id="groupInvitationPicker"', self.text("lesson_group.html"))

    def test_invite_reaches_student_schedule_and_attendance_contexts(self):
        student = self.text("student.html")
        self.assertIn("function isInvitedToLesson", student)
        self.assertIn("isInvitedToLesson(r)||!isExemptForSelectedStudent(r)", student)
        for name in ("recording_context.php", "lesson_record_context.php", "lesson_tasks_api.php", "student_contacts.php"):
            self.assertIn("lessonInvitedStudents", self.text(name), name)


if __name__ == "__main__":
    unittest.main()
