"""Real isolated PHP: selected dates, legacy notices, namespace/data protection and JST."""
import hashlib,json,secrets,shutil,subprocess,unittest
import test_lesson_creation as fixture

class BoardDateTests(unittest.TestCase):
    setUpClass=classmethod(fixture.LessonCreationTests.setUpClass.__func__)
    tearDownClass=classmethod(fixture.LessonCreationTests.tearDownClass.__func__)
    write=classmethod(fixture.LessonCreationTests.write.__func__)
    client=classmethod(fixture.LessonCreationTests.client.__func__)
    request=classmethod(fixture.LessonCreationTests.request.__func__)
    login=classmethod(fixture.LessonCreationTests.login.__func__)
    snapshot=fixture.LessonCreationTests.snapshot
    tearDown=fixture.LessonCreationTests.tearDown
    def setUp(self):
        fixture.LessonCreationTests.setUp(self);shutil.copyfile(fixture.ROOT/'daily_board_api.php',self.root/'daily_board_api.php')
        for name in ['blue_board.php','daily_board.php']:self.write(name,{'schema':1,'days':{}})
        self.write('board_guides.php',{'schema':1,'days':{'blue:2026-10-08':{'slides':[{'id':'image_original','image':'fixture-image.jpg'}]}}})
    def read(self,name):
        text=(self.root/'data'/name).read_text(encoding='utf8');return json.loads(text[14:] if text.startswith('<?php exit; ?>') else text)
    def board(self,date='2026-10-08',board='blue'):
        code,j=self.request('daily_board_api.php?date='+date+'&board='+board);self.assertEqual(code,200,j);return j['board']
    def save(self,date,rows,board='blue',client=None,csrf=None):
        return self.request('daily_board_api.php',dict(date=date,board=board,rows=rows,version=self.board(date,board)['version'],requestId=secrets.token_hex(16)),client,csrf or self.csrf)
    def row(self,date='2026-10-09',**extra):
        return dict(id='row_'+secrets.token_hex(8),kind='note',visible=True,advanceNotice=True,displayStartAt=date+'T16:30',time='',target='',place='',instruction='検証用の連絡',**extra)
    def test_past_future_month_year_dates_roundtrip_both_boards(self):
        for board in ['all','blue']:
            for date in ['2026-10-07','2026-10-09','2026-11-01','2027-01-01']:
                row=self.row(date);code,j=self.save(date,[row],board);self.assertEqual(code,200,j);self.assertEqual(self.board(date,board)['rows'][0]['instruction'],row['instruction']);self.assertEqual(self.board(date,board)['rows'][0]['displayStartAt'],date+'T16:30')
            self.assertEqual(len(self.read('daily_board.php' if board=='all' else 'blue_board.php')['days']),4)
    def test_new_cross_day_forecast_rejected_without_any_writes(self):
        before=self.snapshot();code,j=self.save('2026-10-08',[self.row()]);self.assertEqual(code,400,j);self.assertIn('対象日',j['error']);self.assertEqual(before,self.snapshot())
    def test_legacy_cross_day_preserved_hidden_order_and_unknown_image_metadata(self):
        old=self.row();old['imageRef']='existing-image';other=self.row('2026-10-08');self.write('blue_board.php',{'schema':1,'days':{'2026-10-08':{'rows':[old,other]},'2026-10-07':{'rows':[self.row('2026-10-07')]},'2026-10-10':{'rows':[self.row('2026-10-10')]}}});original=self.read('blue_board.php');protected=self.snapshot()
        changed={**old,'visible':False,'highlight':True,'animation':'scroll'};changed.pop('imageRef');code,j=self.save('2026-10-08',[other,changed]);self.assertEqual(code,200,j);data=self.read('blue_board.php');self.assertEqual(data['days']['2026-10-07'],original['days']['2026-10-07']);self.assertEqual(data['days']['2026-10-10'],original['days']['2026-10-10']);self.assertEqual(data['days']['2026-10-08']['rows'][1]['imageRef'],'existing-image');self.assertEqual(data['days']['2026-10-08']['rows'][1]['displayStartAt'],old['displayStartAt']);self.assertFalse(data['days']['2026-10-08']['rows'][1]['visible'])
        after=self.snapshot();self.assertEqual({k:v for k,v in protected.items()if k!='blue_board.php'},{k:v for k,v in after.items()if k!='blue_board.php'})
    def test_legacy_wrong_date_content_change_is_rejected(self):
        old=self.row();self.write('blue_board.php',{'schema':1,'days':{'2026-10-08':{'rows':[old]}}});before=self.snapshot();code,j=self.save('2026-10-08',[{**old,'instruction':'変更した連絡'}]);self.assertEqual(code,400,j);self.assertEqual(before,self.snapshot())
    def test_future_save_does_not_move_or_overwrite_source_day_or_other_board(self):
        old=self.row();self.write('blue_board.php',{'schema':1,'days':{'2026-10-08':{'rows':[old]}}});source=self.read('blue_board.php')['days']['2026-10-08'];other=self.snapshot()['daily_board.php'];code,j=self.save('2026-10-09',[self.row()]);self.assertEqual(code,200,j);self.assertEqual(self.read('blue_board.php')['days']['2026-10-08'],source);self.assertEqual(self.snapshot()['daily_board.php'],other)
    def test_existing_guards_require_admin_and_csrf(self):
        payload=dict(date='2026-10-09',board='blue',rows=[self.row()],version=self.board('2026-10-09')['version'],requestId=secrets.token_hex(16));before=self.snapshot();self.assertEqual(self.request('daily_board_api.php',payload,self.teacher,self.teacher_csrf)[0],403);self.assertEqual(self.request('daily_board_api.php',payload,self.client())[0],401);self.assertEqual(self.request('daily_board_api.php',payload,self.admin)[0],403);self.assertEqual(before,self.snapshot())
    def test_actual_php_release_predicate_at_jst_boundary_and_visibility(self):
        source=(fixture.ROOT/'daily_board_api.php').read_text(encoding='utf8');function=source[source.index('function dbReleased('):source.index('function dbLegacyScheduleUnchanged(')]
        php='<?php\n'+function+'''$row=['visible'=>true,'advanceNotice'=>true,'displayStartAt'=>'2026-10-09T16:30'];$out=[];foreach(['2026-10-09T07:29:59Z','2026-10-09T07:30:00Z']as$time){$date=new DateTime($time);$date->setTimezone(new DateTimeZone('Asia/Tokyo'));$out[]=dbReleased($row,$date->format('Y-m-d\\TH:i'));}$row['visible']=false;$out[]=dbReleased($row,'2026-10-09T16:31');echo json_encode($out);'''
        output=subprocess.check_output([fixture.PHP],input=php.encode());self.assertEqual(json.loads(output),[False,True,False])

if __name__=='__main__':unittest.main()
