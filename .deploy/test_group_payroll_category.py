"""Linked payroll categories against isolated synthetic lessons and payroll."""
import secrets, shutil, urllib.parse
import test_payroll_adjustments as base
import test_lesson_creation as fixture

class GroupPayrollCategoryTests(base.PayrollAdjustmentsTests):
    def setUp(self):
        super().setUp()
        for name in ['lesson_group_move_api.php','data_api.php']:
            shutil.copyfile(fixture.ROOT/name,self.root/name)
        self.gid='a'*24
        self.write('lesson_records.json',{'GROUP:'+self.gid:{'memo':'Synthetic notes','homework':'Synthetic homework','dueHomework':'Synthetic due homework','replies':[{'text':'Synthetic reply'}]}})
        self.write('class_state.json',{fixture.key(self.rows[0]):{'attendance':{'Synthetic student':'欠席'},'ready':True}})
        self.rows.append(dict(self.rows[0],日付='2026-11-02',_追加ID='same-name-elsewhere',_sourceKey='ADD:same-name-elsewhere'))
        self.write('added_lessons.json',self.rows)
    def plan(self):
        row=self.rows[0];payload=dict(sourceKey=row['_sourceKey'],date=row['日付'].replace('/','-'),slot=row['時間番号'],room=row['教室'],teacher=row['担当講師'])
        code,data=self.request('lesson_group_move_api.php?'+urllib.parse.urlencode(payload));self.assertEqual(code,200,data)
        return dict(payload,version=data['version'],requestId=secrets.token_hex(16))
    def effective(self):
        code,data=self.request('data_api.php');self.assertEqual(code,200,data)
        return {r['_sourceKey']:r for r in data['schedule']}
    def test_explicit_save_reload_scope_payroll_and_record_preservation(self):
        model=self.model();code,saved=self.save(model,{self.group(model,'中学生')['id']:3});self.assertEqual(code,200,saved)
        original=self.effective();before=self.snapshot();payload=dict(self.plan(),payrollCategory='中学生');code,data=self.post('lesson_group_move_api.php',payload);self.assertEqual(code,200,data)
        actual=self.effective()
        for source,row in original.items():
            expected=dict(row)
            if source in ['ADD:payroll-0','ADD:payroll-1']:expected['給与区分']='中学生'
            self.assertEqual(actual[source],expected)
        for name,digest in before.items():
            if name not in ['edited_lessons.json','lesson_groups.json']:self.assertEqual(self.snapshot()[name],digest,name)
        group=data['group'];self.assertTrue(group['active']);self.assertEqual(group['sources'],['ADD:payroll-0','ADD:payroll-1']);self.assertFalse(group['mealBreak'])
        after=self.snapshot();code,replay=self.post('lesson_group_move_api.php',payload);self.assertEqual(code,200,replay);self.assertTrue(replay['replayed']);self.assertEqual(after,self.snapshot())
        changed=self.model();self.assertEqual(changed['plannedPay'],model['plannedPay']);self.assertEqual(self.group(changed,'中学生',1000)['plannedCount'],2);self.assertEqual(self.group(changed,'中学生',2000)['finalCount'],3)
        self.assertEqual(self.post('lesson_group_move_api.php',dict(payload,payrollCategory='高校生'))[0],409);self.assertEqual(after,self.snapshot())
        code,data=self.post('lesson_group_move_api.php',dict(self.plan(),payrollCategory=''));self.assertEqual(code,200,data);self.assertEqual(self.effective()['ADD:payroll-0']['給与区分'],'')
    def test_category_only_keeps_legacy_empty_times_and_date_format(self):
        for row in self.rows[:2]:row.update(日付='2026/10/05',開始='',終了='')
        self.write('added_lessons.json',self.rows);original=self.effective();payload=self.plan();payload['date']='2026-10-05'
        code,data=self.post('lesson_group_move_api.php',dict(payload,payrollCategory='中学生'));self.assertEqual(code,200,data);actual=self.effective()
        for source in ['ADD:payroll-0','ADD:payroll-1']:self.assertEqual(actual[source],dict(original[source],給与区分='中学生'))
    def test_mixed_unchanged_save_and_explicit_selection(self):
        self.rows[0]['給与区分']='中学生';self.rows[1]['給与区分']='高校生';self.write('added_lessons.json',self.rows)
        payload=self.plan();before=self.snapshot();code,data=self.post('lesson_group_move_api.php',payload);self.assertEqual(code,200,data);self.assertTrue(data['unchanged']);self.assertEqual(before,self.snapshot())
        payload=dict(self.plan(),room='白');code,data=self.post('lesson_group_move_api.php',payload);self.assertEqual(code,200,data);actual=self.effective();self.assertEqual(actual['ADD:payroll-0']['給与区分'],'中学生');self.assertEqual(actual['ADD:payroll-1']['給与区分'],'高校生')
        # Fixture's original room is no longer current after the explicit room change.
        self.rows[0]['教室']='白';self.rows[1]['教室']='白'
        code,data=self.post('lesson_group_move_api.php',dict(self.plan(),payrollCategory='演習'));self.assertEqual(code,200,data);actual=self.effective();self.assertTrue(all(actual['ADD:payroll-'+str(i)]['給与区分']=='演習' for i in [0,1]))
    def test_validation_stale_version_permissions_and_fixed_protection(self):
        payload=self.plan();before=self.snapshot()
        for value in [None,0,[],{},'invalid',' 中学生 ']:
            self.assertEqual(self.post('lesson_group_move_api.php',dict(payload,payrollCategory=value))[0],400);self.assertEqual(before,self.snapshot())
        valid=dict(payload,payrollCategory='中学生');self.assertEqual(self.request('lesson_group_move_api.php',valid,self.client())[0],401);self.assertEqual(self.request('lesson_group_move_api.php',valid,self.teacher,self.teacher_csrf)[0],403);self.assertEqual(self.request('lesson_group_move_api.php',valid,self.admin)[0],403);self.assertEqual(before,self.snapshot())
        code,data=self.post('lesson_group_move_api.php',valid);self.assertEqual(code,200,data);after=self.snapshot();stale=dict(payload,payrollCategory='高校生',requestId=secrets.token_hex(16));self.assertEqual(self.post('lesson_group_move_api.php',stale)[0],409);self.assertEqual(after,self.snapshot())
        self.write('lesson_fixed.json',{fixture.key(self.rows[0]):{'fixed':True}});payload=dict(self.plan(),payrollCategory='高校生');before=self.snapshot();code,data=self.post('lesson_group_move_api.php',payload);self.assertEqual(code,409,data);self.assertTrue(data['fixedConflict']);self.assertEqual(before,self.snapshot());self.assertEqual(self.post('lesson_group_move_api.php',dict(payload,overrideFixed=True))[0],200)

for name in vars(base.PayrollAdjustmentsTests):
    if name.startswith('test_'):setattr(GroupPayrollCategoryTests,name,None)
