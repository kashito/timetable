"""Read-only other-period details and stable-source navigation; synthetic payroll."""
import shutil,urllib.request,urllib.error,urllib.parse
import test_payroll_adjustments as base
import test_lesson_creation as fixture

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):return None
class PayrollOtherLinksTests(base.PayrollAdjustmentsTests):
    def setUp(self):
        super().setUp()
        for name in ['payroll.php','admin_page_guard.php']:shutil.copyfile(fixture.ROOT/name,self.root/name)
        extras=[]
        for slot in [0,1]:
            row=fixture.row(slot);row.update(日付='2026-10-12',クラス='個別指導',担当講師=self.a,_追加ID='other-link'+str(slot+1),_sourceKey='ADD:other-link'+str(slot+1));extras.append(row)
        self.rows+=extras;self.write('added_lessons.json',self.rows);groups=self.read('lesson_groups.json');self.gid='e'*24;groups[self.gid]=dict(id=self.gid,key='GROUP:'+self.gid,sources=[r['_sourceKey'] for r in extras],snapshot=extras,active=True,mealBreak=False);self.write('lesson_groups.json',groups)
    def raw(self,path,client=None):
        client=client or self.admin;jar=next(h.cookiejar for h in client.handlers if isinstance(h,urllib.request.HTTPCookieProcessor));opener=urllib.request.build_opener(NoRedirect(),urllib.request.HTTPCookieProcessor(jar))
        try:r=opener.open(self.url+'/'+path,timeout=8)
        except urllib.error.HTTPError as e:r=e
        with r:return r.status,r.headers,r.read().decode('utf-8')
    def test_other_details_links_are_exact_and_do_not_change_payroll(self):
        initial=self.model();small=self.group(initial,'小学生',1000);code,saved=self.save(initial,{small['id']:0});self.assertEqual(code,200,saved);before=self.snapshot()
        model=self.model();items=model['otherLessons'];self.assertEqual(len(items),3);self.assertEqual(sum(g['plannedCount'] for g in model['groups'] if g['category']=='その他'),len(items));self.assertEqual(model['plannedPay'],11100);self.assertEqual(model['finalPay'],9100)
        self.assertEqual(items[0]['date'],'2026-10-10');self.assertEqual(items[0]['className'],'相談');self.assertEqual(items[0]['start'],'18:30');self.assertEqual(items[0]['slot'],'⑦')
        for item in items:
            code,headers,body=self.raw(item['url']);self.assertEqual(code,303,body);target=urllib.parse.urlparse(headers['Location']);query=urllib.parse.parse_qs(target.query);self.assertEqual(target.path,'schedule_generator.php');self.assertEqual(query['openSource'],[item['sourceKey']]);self.assertEqual(query['linkedDate'],[item['date']])
        self.assertEqual(before,self.snapshot())
    def test_deleted_source_never_redirects_to_same_key_replacement_and_auth_is_kept(self):
        item=self.model()['otherLessons'][0];old=next(r for r in self.rows if r['_sourceKey']==item['sourceKey']);replacement=dict(old,_追加ID='replacement',_sourceKey='ADD:replacement');old['_deleted']=True;self.write('added_lessons.json',self.rows+[replacement]);before=self.snapshot()
        code,headers,body=self.raw(item['url']);self.assertEqual(code,404);self.assertNotIn('Location',headers);self.assertIn('別のコマへは移動していません',body)
        self.assertEqual(len([r for r in self.model()['otherLessons'] if r['className']=='相談']),1);code,headers,body=self.raw('payroll.php?lessonSource='+urllib.parse.quote('ADD:replacement'));self.assertEqual(code,303);self.assertIn('replacement',headers['Location'])
        code,headers,body=self.raw(item['url'],self.client());self.assertEqual(code,303);self.assertTrue(headers['Location'].startswith('staff_login.html?'));nextpage=urllib.parse.parse_qs(urllib.parse.urlparse(headers['Location']).query)['next'][0];self.assertEqual(nextpage,'payroll.html?lessonSource='+urllib.parse.quote(item['sourceKey'],safe=''))
        self.assertEqual(self.raw(item['url'],self.teacher)[0],403);self.assertEqual(before,self.snapshot())

for name in vars(base.PayrollAdjustmentsTests):
    if name.startswith('test_'):setattr(PayrollOtherLinksTests,name,None)
