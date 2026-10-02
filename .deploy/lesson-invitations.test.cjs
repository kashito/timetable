const test=require('node:test');
const assert=require('node:assert/strict');
const invites=require('../lesson-invitations.js');

test('normalizes and deduplicates invited students',()=>{
 assert.deepEqual(invites.normalize([' 山田 ','','山田','阿部']),['阿部','山田']);
});

test('merges regular and extra invite roster once',()=>{
 assert.deepEqual(invites.merge(['山田','阿部'],['山田','井上']),['阿部','井上','山田']);
});

test('selector excludes regular members and preserves invited selection',()=>{
 const html=invites.markup(['山田','阿部','井上'],['山田'],['井上']);
 assert.doesNotMatch(html,/value="山田"/);
 assert.match(html,/value="井上" checked/);
 assert.match(html,/追加招集の生徒/);
});
