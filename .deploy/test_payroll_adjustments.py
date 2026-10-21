"""Synthetic payroll count adjustments; never production rates, lessons or payments."""
import json,shutil,urllib.parse
import test_lesson_creation as fixture

class PayrollAdjustmentsTests(fixture.LessonCreationTests):
    php_options=['-d','disable_functions=str_starts_with']
    def setUp(self):
        super().setUp()
        for name in ['api_response.php','payroll_adjustments.php','payroll_adjustments_api.php','payroll_api.php']:
            shutil.copyfile(fixture.ROOT/name,self.root/name)
        self.a='Synthetic teacher A';self.b='Synthetic teacher B';self.rows=[]
        values=[('2026-10-05',0,'小5','授業'),('2026-10-05',1,'小5','授業'),('2026-10-06',2,'小6','授業'),('2026-10-07',3,'中1','授業'),('2026-10-08',4,'高1','授業'),('2026-10-09',5,'演習','演習'),('2026-10-10',6,'相談','授業')]
        for i,(date,slot,cls,kind) in enumerate(values):
            r=fixture.row(slot);r.update(日付=date,クラス=cls,担当講師=self.a,種別=kind,_追加ID='payroll-'+str(i),_sourceKey='ADD:payroll-'+str(i));self.rows.append(r)
        b=dict(self.rows[0],担当講師=self.b,_追加ID='payroll-b',_sourceKey='ADD:payroll-b');nov=dict(self.rows[0],日付='2026-11-01',_追加ID='payroll-nov',_sourceKey='ADD:payroll-nov');off=dict(self.rows[0],日付='2026-10-11',日区分='休み',_追加ID='payroll-off',_sourceKey='ADD:payroll-off')
        self.rows+=[b,nov,off];self.write('added_lessons.json',self.rows);gid='a'*24;self.write('lesson_groups.json',{gid:dict(id=gid,key='GROUP:'+gid,sources=[r['_sourceKey'] for r in self.rows[:2]],snapshot=self.rows[:2],active=True,mealBreak=False)})
        self.rates=[dict(teacher=self.a,**{'class':cls},category=cat,amount=amount) for cls,cat,amount in [('小5','',1000),('小6','',1500),('','中学生',2000),('','高校生',3000),('','演習',500),('','',700)]]+[dict(teacher=self.b,**{'class':'小5'},category='',amount=900)]
        self.write('payroll_rates.json',self.rates);(self.root/'data/payroll_adjustments.php').unlink(missing_ok=True)
    def model(self,teacher=None,month='10',client=None):
        code,j=self.request('payroll_adjustments_api.php?'+urllib.parse.urlencode(dict(teacher=teacher or self.a,**{'from':'2026-'+month+'-01','to':'2026-'+month+'-30'})),client=client);self.assertEqual(code,200,j);return j
    def save(self,model,overrides=None,action='save',**extra):
        return self.post('payroll_adjustments_api.php',dict(**model['scope'],action=action,overrides=overrides or {},expectedRevision=model['revision'],basisRevision=model['basisRevision'],**extra))
    def group(self,model,cat,rate=None):return next(g for g in model['groups'] if g['category']==cat and (rate is None or g['rate']==rate))
    def test_count_zero_save_reload_period_teacher_reset_and_source_preservation(self):
        before=self.snapshot();model=self.model();self.assertEqual(model['plannedCount'],7);self.assertEqual(model['plannedPay'],9700);self.assertEqual(model['finalPay'],9700)
        small=self.group(model,'小学生',1000);middle=self.group(model,'中学生');code,j=self.save(model,{small['id']:0,middle['id']:3});self.assertEqual(code,200,j);self.assertEqual(j['plannedPay'],9700);self.assertEqual(j['finalPay'],11700);self.assertEqual(self.group(j,'小学生',1000)['finalCount'],0)
        reloaded=self.model();self.assertEqual(reloaded['finalPay'],11700);self.assertEqual(self.model(month='11')['finalPay'],1000);b=self.model(self.b);self.assertEqual(b['finalPay'],900);self.assertFalse(b['overrides'])
        code,b=self.save(b,{self.group(b,'小学生')['id']:0});self.assertEqual(code,200,b)
        self.assertEqual(self.save(reloaded,action='reset')[0],200);self.assertEqual(self.model()['finalPay'],9700);self.assertEqual(self.model(self.b)['finalPay'],0)
        for name,value in before.items():self.assertEqual(self.snapshot()[name],value,name)
        self.assertTrue((self.root/'data/payroll_adjustments.php').read_text(encoding='utf-8').startswith('<?php exit; ?>'))
    def test_validation_concurrent_save_and_changed_rate_basis(self):
        model=self.model();g=self.group(model,'小学生',1000)
        for value in [-1,1.5,'2',True]:
            before=self.snapshot();code,j=self.save(model,{g['id']:value});self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())
        before=self.snapshot();self.assertEqual(self.save(model,{'unknown':1})[0],400);self.assertEqual(before,self.snapshot())
        code,saved=self.save(model,{g['id']:1});self.assertEqual(code,200,saved);before=self.snapshot();self.assertEqual(self.save(model,{g['id']:0})[0],409);self.assertEqual(before,self.snapshot())
        self.rates[0]['amount']=1100;self.write('payroll_rates.json',self.rates);new=self.model();self.assertEqual(self.group(new,'小学生',1100)['finalCount'],1);self.assertEqual(new['finalPay'],8800)
        before=self.snapshot();self.assertEqual(self.save(saved,{g['id']:2})[0],409);self.assertEqual(before,self.snapshot())
    def test_legacy_date_rate_regroup_and_large_total_are_not_silently_applied(self):
        self.rows[0]['日付']='2026/10/5';self.rows[1]['日付']='2026-10-5';self.write('added_lessons.json',self.rows);model=self.model();self.assertEqual(model['plannedPay'],9700)
        code,saved=self.save(model,{self.group(model,'小学生',1000)['id']:0});self.assertEqual(code,200,saved)
        self.rates[1]['amount']=1000;self.write('payroll_rates.json',self.rates);changed=self.model();self.assertEqual(changed['unmatchedCount'],1);self.assertIsNone(changed['finalPay']);self.assertEqual(changed['unmatched'][0]['finalCount'],0)
        before=self.snapshot();self.assertEqual(self.save(changed)[0],409);self.assertEqual(before,self.snapshot());code,reset=self.save(changed,action='reset');self.assertEqual(code,200,reset);self.assertEqual(reset['finalPay'],9200)
        before=self.snapshot();self.assertEqual(self.save(reset,{self.group(reset,'小学生',1000)['id']:9007199254740})[0],400);self.assertEqual(before,self.snapshot())
    def test_existing_rate_precedence_missing_rate_reference_and_admin_only(self):
        self.write('payroll_rates.json',[dict(teacher=self.a,**{'class':'小5'},category='高校生',amount=999)]+self.rates);self.assertEqual(self.model()['plannedPay'],9700)
        settings=dict(schema=1,initialAdminName='Synthetic admin',payrollExcludedNames=[self.a],teacherToneRules=[]);self.write('site_private_settings.php',settings);self.assertTrue(self.model()['excludedFromTotal'])
        self.write('payroll_rates.json',[]);model=self.model();self.assertIsNone(model['plannedPay']);self.assertIsNone(model['finalPay']);g=self.group(model,'小学生');code,j=self.save(model,{g['id']:0});self.assertEqual(code,200,j);self.assertEqual(self.group(j,'小学生')['finalPay'],0);self.assertIsNone(j['finalPay'])
        q='payroll_adjustments_api.php?'+urllib.parse.urlencode(model['scope']);self.assertEqual(self.request(q,client=self.client())[0],401);self.assertEqual(self.request(q,client=self.teacher)[0],403)
        payload=dict(**j['scope'],overrides={},expectedRevision=j['revision'],basisRevision=j['basisRevision']);before=self.snapshot();self.assertEqual(self.request('payroll_adjustments_api.php',payload,self.admin)[0],403);self.assertEqual(self.request('payroll_adjustments_api.php',payload,self.teacher,self.teacher_csrf)[0],403);self.assertEqual(before,self.snapshot())

for name in vars(fixture.LessonCreationTests):
    if name.startswith('test_'):setattr(PayrollAdjustmentsTests,name,None)
