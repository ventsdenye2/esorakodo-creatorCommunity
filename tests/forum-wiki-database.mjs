// Run against a disposable PostgreSQL cluster only; never accepts a remote DSN.
// Install embedded-postgres@17.10.0-beta.17 into ignored output/pg-check first.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import EmbeddedPostgres from '../output/pg-check/node_modules/embedded-postgres/dist/index.js';

const cluster = new EmbeddedPostgres({ databaseDir: path.resolve(`output/pg-check/data-${Date.now()}`), user: 'postgres', password: randomUUID(), port: 55439, persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'], postgresFlags: ['-h', '127.0.0.1'], onLog() {}, onError() {} });
let db, passed = 0;
function check(value, message) { assert.ok(value, message); passed++; console.log(`PASS ${passed}: ${message}`); }
try {
  await cluster.initialise(); await cluster.start(); db = cluster.getPgClient(); await db.connect();
  // Only the Supabase auth boundary is reproduced. Domain SQL and RLS are unmodified.
  await db.query(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema extensions;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,extensions to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`);
  const files=fs.readdirSync('supabase/migrations').filter(p=>p.endsWith('.sql')).sort();
  for(const file of files) await db.query(fs.readFileSync(`supabase/migrations/${file}`,'utf8'));
  check(true, `all ${files.length} migrations apply to empty PostgreSQL 17`);
  const a=randomUUID(), b=randomUUID(), account=randomUUID(), topic=randomUUID();
  await db.query(`insert into auth.users values($1,'qa-a@example.test','{"handle":"qa_author"}'),($2,'qa-b@example.test','{"handle":"qa_other"}')`,[a,b]);
  await db.query(`insert into forum_accounts(id,handle,display_name,created_by) values($1,'qa_role','借书同学',$2);`,[account,a]);
  await db.query(`insert into forum_topics(id,creator_id,title,board) values($1,$2,'论坛测试','campus')`,[topic,a]);
  await db.query('set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  const independent=randomUUID();
  await db.query("insert into forum_accounts(id,handle,display_name,account_type,created_by) values($1,'qa_independent','独立学生身份','student',$2)",[independent,a]);
  check((await db.query('select student_id from forum_accounts where id=$1',[independent])).rows[0].student_id===null,'student forum identity can be created without a character archive');
  await db.query("insert into forum_accounts(handle,display_name,account_type,student_id,created_by) values('qa_import_a','导入甲','unknown',null,$1),('qa_import_b','导入乙','unknown',null,$1)",[a]);
  check((await db.query("select id from forum_accounts where created_by=$1 and handle like 'qa_import_%'",[a])).rows.length===2,'Markdown import can create a batch of independent owned identities');
  await assert.rejects(db.query("insert into forum_accounts(handle,display_name,account_type,created_by) values('qa_partial','不可残留','unknown',$1),('qa_role','冲突','unknown',$1)",[a]),/duplicate key/);
  check((await db.query("select id from forum_accounts where handle='qa_partial'")).rows.length===0,'conflicting handle rolls back entire import identity batch');
  await assert.rejects(db.query("insert into forum_accounts(handle,display_name,account_type,created_by) values('qa_forged','伪造归属','unknown',$1)",[b]),/row-level security/);
  check(true,'identity import cannot spoof another creator');
  const input=[{forum_account_id:account,body:'独立发言',like_count:42,question_count:3},{forum_account_id:account,body:'回复第一层',reply_to_floor_no:1,like_count:5,question_count:999999999},{forum_account_id:account,body:'兼容旧编辑器'}];
  const save=async(messages, publish=false, version)=>db.query(`select save_forum_draft($1,coalesce($2,(select version from forum_topics where id=$1)),'论坛测试','campus',$3::jsonb,'{}','[]', $4) as version`,[topic,version??null,JSON.stringify(messages),publish]);
  await save(input);
  let rows=(await db.query('select * from forum_messages where topic_id=$1 order by floor_no',[topic])).rows;
  check(rows[0].like_count===42&&rows[1].question_count===999999999&&rows[2].like_count===0,'authored counts persist, upper bound and legacy zero default');
  check(rows[1].reply_to_message_id===rows[0].id,'reply relation survives atomic save');
  const version=(await db.query('select version from forum_topics where id=$1',[topic])).rows[0].version;
  for(const bad of [-1,1.5,1000000000,null,'4']) {
    await assert.rejects(save([{...input[0],like_count:bad}]),/FORUM_MESSAGE_INVALID/); passed++;
  }
  check((await db.query('select version from forum_topics where id=$1',[topic])).rows[0].version===version,'invalid counts roll back version and existing floors');
  check((await db.query('select id from forum_messages where topic_id=$1 order by floor_no',[topic])).rows[0].id===rows[0].id,'failed replace preserves prior IDs and counts');
  await assert.rejects(save(input,false,1),/FORUM_VERSION_CONFLICT/); check(true,'stale forum save rejected');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
  check((await db.query('select * from forum_messages where topic_id=$1',[topic])).rows.length===0,'other author cannot read draft');
  await assert.rejects(save(input),/FORUM_TOPIC_NOT_OWNED/); check(true,'other author cannot change counts');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]); await save(input,true);
  await assert.rejects(save(input),/FORUM_TOPIC_NOT_DRAFT/); check(true,'published counts frozen');
  await db.query('set role anon');
  rows=(await db.query('select * from forum_messages where topic_id=$1 order by floor_no',[topic])).rows;
  check(rows[0].like_count===42,'anonymous reader sees published authored counts');
  await assert.rejects(db.query('update forum_messages set like_count=0 where topic_id=$1',[topic])); check(true,'reader cannot vote by mutating authored counts');
  await assert.rejects(db.query("select create_wiki_entity_with_body('college','denied','Denied')")); check(true,'anonymous Markdown creation denied');
  await db.query('set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  const markdown='## 校园记录\n\n**重点**与*补充*\n\n1. 先借书\n2. 再登记\n\n| 日期 | 事件 |\n| --- | --- |\n| 周一 | 开馆 |';
  for(const type of ['student','college','place']) {
    const entity=(await db.query('select create_wiki_entity_with_body($1,$2,$3,$4,null,null,$5) as doc',[type,`qa-${type}`,'档案测试','摘要',markdown])).rows[0].doc;
    check(entity.body===markdown&&entity.version===1,`${type} creates Markdown and first immutable snapshot`);
    const first=(await db.query('select * from wiki_revisions where entity_id=$1',[entity.id])).rows[0];
    const next=(await db.query("select apply_wiki_revision($1,$2,1,$3::jsonb,'补充一条') as doc",[type,entity.id,JSON.stringify({body:markdown+'\n\n新增内容'})])).rows[0].doc;
    check(next.version===2&&next.body.endsWith('新增内容'),`${type} records body edit`);
    await assert.rejects(db.query("select apply_wiki_revision($1,$2,1,'{\"body\":\"stale\"}','过期')",[type,entity.id]),/WIKI_VERSION_CONFLICT/); check(true,`${type} rejects stale version`);
    await assert.rejects(db.query("select apply_wiki_revision($1,$2,2,$3::jsonb,'过长')",[type,entity.id,JSON.stringify({body:'a'.repeat(50001)})])); check(true,`${type} rejects oversized Markdown`);
    const restored=(await db.query("select rollback_wiki_revision($1,2,'恢复旧版') as doc",[first.id])).rows[0].doc;
    check(restored.version===3&&restored.body===markdown,`${type} restore appends version and restores Markdown`);
    check((await db.query('select count(*)::int as n from wiki_revisions where entity_id=$1',[entity.id])).rows[0].n===3,`${type} failed writes leave no revisions and old history remains`);
  }
  const legacy=(await db.query("select create_wiki_entity('college','qa-legacy','旧档案') as doc")).rows[0].doc;
  const old=(await db.query('select id from wiki_revisions where entity_id=$1',[legacy.id])).rows[0];
  await db.query('reset role'); await db.query("update wiki_revisions set snapshot=snapshot-'body' where id=$1",[old.id]);
  await db.query('set role authenticated');
  await db.query("select apply_wiki_revision('college',$1,1,'{\"body\":\"新版正文\"}','添加正文')",[legacy.id]);
  const restored=(await db.query("select rollback_wiki_revision($1,2,'恢复旧快照') as doc",[old.id])).rows[0].doc;
  check(restored.body===''&&restored.version===3,'pre-migration snapshot without body restores safely');
  await assert.rejects(db.query("update colleges set body='bypass' where id=$1",[legacy.id])); check(true,'Markdown cannot bypass revision RPC');
  console.log(`Database acceptance complete: ${passed} checks passed.`);
} finally { if(db) await db.end(); await cluster.stop(); }
