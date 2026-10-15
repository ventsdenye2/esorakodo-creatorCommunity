// Run against a disposable PostgreSQL cluster only; never accepts a remote DSN.
// Install embedded-postgres@17.10.0-beta.17 into ignored output/pg-check first.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import EmbeddedPostgres from '../output/pg-check/node_modules/embedded-postgres/dist/index.js';

const cluster = new EmbeddedPostgres({ databaseDir: path.resolve(`output/pg-check/data-${Date.now()}`), user: 'postgres', password: randomUUID(), port: 55449, persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'], postgresFlags: ['-h', '127.0.0.1'], onLog() {}, onError() {} });
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
  // Forum images: private drafts, ownership, transactional links and published access.
  await db.query('reset role');
  const image=randomUUID(),otherImage=randomUUID(),pendingImage=randomUUID();
  await db.query("insert into media_assets(id,uploader_id,object_key,filename,mime_type,byte_size,status) values($1,$2,$1::uuid::text,'a.png','image/png',10,'ready'),($3,$4,$3::uuid::text,'b.png','image/png',10,'ready'),($5,$2,$5::uuid::text,'pending.png','image/png',10,'pending')",[image,a,otherImage,b,pendingImage]);
  await db.query('set role authenticated');
  const imageInput=[{forum_account_id:account,body:'图片\n![现场](/api/media/'+image+')\n![另一张](/api/media/'+image+')'}];
  const saveImages=(messages)=>db.query("select save_forum_draft($1,(select version from forum_topics where id=$1),'图片主题','campus',$2::jsonb,'{}','[]',false)",[topic,JSON.stringify(messages)]);
  await saveImages(imageInput);
  check((await db.query('select * from forum_message_media')).rows.length===1,'duplicate image lines create one relational link');
  await db.query('set role anon');
  check((await db.query('select * from media_assets where id=$1',[image])).rows.length===0,'draft forum image not visible anonymously');
  check((await db.query('select * from forum_message_media')).rows.length===0,'draft media links not visible anonymously');
  await db.query('set role authenticated');
  for(const invalidBody of ['![外部](https://example.com/a.png)','![本地](./a.png)','![别人的](/api/media/'+otherImage+')','![未完成](/api/media/'+pendingImage+')']) {
    await assert.rejects(saveImages([{forum_account_id:account,body:invalidBody}]),/FORUM_IMAGE_INVALID/);
    check((await db.query('select * from forum_message_media')).rows.length===1,'invalid image rolls back entire floor replacement');
  }
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
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]); await save([{...input[0],body:input[0].body+'\n![现场](/api/media/'+image+')'},...input.slice(1)],true);
  await assert.rejects(save(input),/FORUM_TOPIC_NOT_DRAFT/); check(true,'published counts frozen');
  await db.query('set role anon');
  rows=(await db.query('select * from forum_messages where topic_id=$1 order by floor_no',[topic])).rows;
  check(rows[0].like_count===42,'anonymous reader sees published authored counts');
  check((await db.query('select * from media_assets where id=$1',[image])).rows.length===1,'published forum grants anonymous ready image read');
  await db.query('reset role');
  await db.query("update forum_topics set status='hidden' where id=$1",[topic]);
  await db.query('set role anon');
  check((await db.query('select * from media_assets where id=$1',[image])).rows.length===0,'hidden forum revokes anonymous image access');
  await db.query('reset role'); await db.query("update forum_topics set status='published' where id=$1",[topic]); await db.query('set role anon');
  await assert.rejects(db.query('update forum_messages set like_count=0 where topic_id=$1',[topic])); check(true,'reader cannot vote by mutating authored counts');
  await assert.rejects(db.query("select create_wiki_entity_with_body('college','denied','Denied')")); check(true,'anonymous Markdown creation denied');
  await db.query('set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  const markdown='## 校园记录\n\n**重点**与*补充*\n\n1. 先借书\n2. 再登记\n\n| 日期 | 事件 |\n| --- | --- |\n| 周一 | 开馆 |';
  for(const type of ['student','college','place','article']) {
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
  // Official authority, idempotence, identity preservation and transactional failure.
  await db.query('reset role');
  const baseline = [{ official_id:'canon-test',entity_type:'article',slug:'canon-test',source_hash:'a'.repeat(64),name:'官网词条',summary:'官网摘要',body:'## 官网正文' }];
  const reconcile = entries => db.query('select reconcile_official_wiki($1::jsonb) as result',[JSON.stringify(entries)]);
  check((await reconcile(baseline)).rows[0].result.changed===1,'official first import creates knowledge record');
  const canon=(await db.query("select * from wiki_articles where slug='canon-test'")).rows[0];
  await db.query('set role authenticated');
  await db.query("select apply_wiki_revision('article',$1,1,'{\"body\":\"校园站补充\"}','补充')",[canon.id]);
  await assert.rejects(reconcile(baseline),/permission denied/);check(true,'creator cannot impersonate official sync');
  await assert.rejects(db.query("update wiki_articles set body='绕过历史' where id=$1",[canon.id]),/permission denied/);check(true,'knowledge writes cannot bypass revisions');
  await assert.rejects(db.query("update wiki_official_sources set source_hash=$1",['b'.repeat(64)]),/permission denied/);check(true,'creator cannot change authority metadata');
  await db.query('reset role');
  check((await reconcile(baseline)).rows[0].result.unchanged===1,'repeat baseline sync is idempotent');
  check((await db.query('select body,version from wiki_articles where id=$1',[canon.id])).rows[0].body==='校园站补充','repeat baseline sync preserves community contribution');
  const changed=[{...baseline[0],source_hash:'b'.repeat(64),body:'官网新修订'}];
  await reconcile(changed);
  const authoritative=(await db.query('select * from wiki_articles where id=$1',[canon.id])).rows[0];
  check(authoritative.body==='官网新修订'&&Number(authoritative.version)===3,'official changed content wins and appends revision');
  check((await db.query("select snapshot->>'body' as body from wiki_revisions where entity_id=$1 order by created_at,id",[canon.id])).rows.some(r=>r.body==='校园站补充'),'overridden community revision remains recoverable');
  await db.query('set role anon');
  check((await db.query('select * from wiki_articles where id=$1',[canon.id])).rows.length===1,'knowledge articles publicly readable');
  await assert.rejects(db.query("select create_wiki_entity_with_body('article','anon-test','Denied')"),/permission denied/);check(true,'anonymous knowledge creation denied');
  await assert.rejects(reconcile(changed),/permission denied/);check(true,'anonymous official sync denied');
  await db.query('reset role');
  const existing=(await db.query("select create_wiki_entity_with_body('college','canon-college','校园学院',null,null,null,'原始资料') as doc")).rows[0].doc;
  await reconcile([{...baseline[0],official_id:'canon-college',entity_type:'college',slug:'canon-college',name:'官网学院',body:'官网学院正文'}]);
  check((await db.query('select name from colleges where id=$1',[existing.id])).rows[0].name==='官网学院','first overlap favors official while preserving existing UUID');
  check((await db.query('select count(*)::int n from wiki_revisions where entity_id=$1',[existing.id])).rows[0].n===2,'first overlap preserves old revision');
  await assert.rejects(reconcile([{...changed[0],source_hash:'c'.repeat(64),body:'不可部分提交'}, {...baseline[0],official_id:'invalid-test',slug:'invalid-test',entity_type:'unsupported'}]),/OFFICIAL_ENTRY_INVALID/);
  check((await db.query('select body from wiki_articles where id=$1',[canon.id])).rows[0].body==='官网新修订','invalid batch atomically rolls back earlier changes');
  await assert.rejects(reconcile([{...changed[0],slug:'rebind-test'}]),/OFFICIAL_IDENTITY_CHANGED/);check(true,'official identity cannot silently rebind');
  await assert.rejects(reconcile([baseline[0],baseline[0]]),/OFFICIAL_ID_DUPLICATED/);check(true,'duplicate official IDs rejected');
  // Reconcile the actual full official manifest in this disposable database.
  const {prepareEntries}=await import('../scripts/prepare-official-wiki.mjs');
  const manifestPath=process.env.OFFICIAL_WIKI_MANIFEST ?? '../../kongtian-university/wiki-canon.json';
  if(fs.existsSync(manifestPath)) {
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    const allOfficial=prepareEntries(manifest);
    check(allOfficial.length===manifest.entries.length,'all official entries convert without unsupported HTML');
    check((await reconcile(allOfficial)).rows[0].result.changed===allOfficial.length,'all official entries import through revision-producing transactions');
    check((await reconcile(allOfficial)).rows[0].result.unchanged===allOfficial.length,'full import repeated without duplicate entities or revisions');
  } else console.log('SKIP optional cross-repository manifest acceptance: set OFFICIAL_WIKI_MANIFEST to run it');

  const legacy=(await db.query("select create_wiki_entity('college','qa-legacy','旧档案') as doc")).rows[0].doc;
  const old=(await db.query('select id from wiki_revisions where entity_id=$1',[legacy.id])).rows[0];
  await db.query('reset role'); await db.query("update wiki_revisions set snapshot=snapshot-'body' where id=$1",[old.id]);
  await db.query('set role authenticated');
  await db.query("select apply_wiki_revision('college',$1,1,'{\"body\":\"新版正文\"}','添加正文')",[legacy.id]);
  const restored=(await db.query("select rollback_wiki_revision($1,2,'恢复旧快照') as doc",[old.id])).rows[0].doc;
  check(restored.body===''&&restored.version===3,'pre-migration snapshot without body restores safely');
  await assert.rejects(db.query("update colleges set body='bypass' where id=$1",[legacy.id])); check(true,'Markdown cannot bypass revision RPC');

  await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  const content=JSON.stringify({schema_version:1,blocks:[{type:'paragraph',text:'隔离数据库验收正文'}]});
  const article=(await db.query("select save_article(null,null,'验收文章','摘要',$1::jsonb,array['校园生活'],false) as id",[content])).rows[0].id;
  check((await db.query('select status from articles where id=$1',[article])).rows[0].status==='draft','article draft save persists');
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");check((await db.query('select id from articles where id=$1',[article])).rows.length===0,'anonymous readers cannot see article draft');
  await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
  await assert.rejects(db.query("select save_article($1,1,'盗改','',$2::jsonb,'{}',false)",[article,content]),/FORBIDDEN/);check(true,'other creator cannot edit article');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  await assert.rejects(db.query("select save_article($1,99,'过期','',$2::jsonb,'{}',false)",[article,content]),/VERSION_CONFLICT/);check(true,'article optimistic lock rejects stale edits');
  await db.query("select save_article($1,1,'验收文章','摘要',$2::jsonb,array['校园生活'],true)",[article,content]);
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");check((await db.query('select status from articles where id=$1',[article])).rows[0].status==='published','published article visible anonymously');
  await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  await assert.rejects(db.query("select save_event(null,null,'无节点','概述','秋季','','','[]',true)") ,/INVALID_NODES/);check(true,'event publication rejects missing timeline');
  const timelineId=randomUUID(),timeline=JSON.stringify([{id:timelineId,label:'第一日',title:'开始',description:'经过'}]);
  const event=(await db.query("select save_event(null,null,'验收事件','概述','秋季','背景','影响',$1::jsonb,true) as id",[timeline])).rows[0].id;
  check((await db.query('select status from events where id=$1',[event])).rows[0].status==='published','event publication saves stable timeline');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
  const supplement=(await db.query("select save_event_supplement(null,null,$1,$2,'补充视角','perspective',$3::jsonb,true) as id",[event,timelineId,content])).rows[0].id;
  check((await db.query('select creator_id from event_supplements where id=$1',[supplement])).rows[0].creator_id===b,'event supplement preserves independent authorship');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  await assert.rejects(db.query("select save_event($1,1,'验收事件','概述','秋季','','','[]',false)",[event]),/NODE|NODES/);check(true,'timeline node referenced by supplement cannot be removed');
  check(Number((await db.query('select version from events where id=$1',[event])).rows[0].version)===1,'failed timeline update rolls back version');
  await db.query("select interact_work('article',$1,'like')",[article]);check((await db.query('select id from work_likes where article_id=$1',[article])).rows.length===1,'work like toggle adds one record');
  await db.query("select interact_work('article',$1,'like')",[article]);check((await db.query('select id from work_likes where article_id=$1',[article])).rows.length===0,'work like toggle removes record');
  await db.query("select interact_work('article',$1,'bookmark')",[article]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);check((await db.query('select id from work_bookmarks where article_id=$1',[article])).rows.length===0,'another creator cannot read private bookmark');
  await db.query("select interact_work('article',$1,'comment','测试作品讨论')",[article]);
  const comment=(await db.query('select id from work_comments where article_id=$1',[article])).rows[0].id;
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  await assert.rejects(db.query('select remove_work_comment($1)',[comment]),/FORBIDDEN/);check(true,'creator cannot remove another creator comment');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);await db.query('select remove_work_comment($1)',[comment]);
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");check((await db.query('select id from work_comments where id=$1',[comment])).rows.length===0,'removed comment is no longer publicly readable');
  await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
  const report=(await db.query("select report_work('event',$1,'隔离数据库举报理由') as id",[event])).rows[0].id;
  await assert.rejects(db.query("select moderate_report($1,'hide','普通用户不得处置')",[report]),/FORBIDDEN/);check(true,'ordinary creator cannot moderate');
  await db.query('reset role');await db.query('insert into moderators(creator_id) values($1)',[a]);
  await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  await db.query("select moderate_report($1,'hide','隔离验收隐藏理由')",[report]);
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");check((await db.query('select id from events where id=$1',[event])).rows.length===0,'moderation hides event from public readers');
  check((await db.query('select id from event_supplements where id=$1',[supplement])).rows.length===0,'hidden event also hides published supplements');
  await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);await db.query("select moderate_report($1,'restore','隔离验收恢复理由')",[report]);
  check((await db.query('select id from moderation_actions where report_id=$1',[report])).rows.length===2,'hide and restore both retain audit evidence');
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");check((await db.query('select id from events where id=$1',[event])).rows.length===1,'moderation restores public event');
  await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);

  const whitespace=['','   ','\t\r\n', '\u00a0', '\u3000', '\ufeff', '\u000b'];
  for(const type of ['paragraph','heading','quote']) for(const text of whitespace) {
    const blank=JSON.stringify({schema_version:1,blocks:[{type,text}]});
    await assert.rejects(db.query("select save_article(null,null,'不得发布空白','',$1::jsonb,'{}',true)",[blank]),/CONTENT_INVALID_BODY/);
    await assert.rejects(db.query("select save_event_supplement(null,null,$1,null,'不得发布空白','detail',$2::jsonb,true)",[event,blank]),/CONTENT_INVALID_BODY/);
    check(true,`article and supplement reject ${type} whitespace ${JSON.stringify(text)}`);
  }
  const blank=JSON.stringify({schema_version:1,blocks:[{type:'paragraph',text:'   '}]});
  await db.query("select save_article(null,null,'空白草稿允许暂存','',$1::jsonb,'{}',false)",[blank]);check(true,'blank drafts remain saveable');
  const v=JSON.stringify({schema_version:1,blocks:[{type:'paragraph',text:'v'}]});
  await db.query("select save_article(null,null,'有效正文','',$1::jsonb,'{}',true)",[v]);check(true,'letter v is meaningful, never mistaken for vertical-tab escape');
  await db.query("select save_article(null,null,'纯图片文章','',$1::jsonb,'{}',true)",[JSON.stringify({schema_version:1,blocks:[{type:'image',asset_id:image,alt:''}]})]);check(true,'valid image-only publication remains allowed');
  const before=(await db.query('select body,version from articles where id=$1',[article])).rows[0];
  await assert.rejects(db.query("select save_article($1,$2,'不得清空已发布','',$3::jsonb,'{}',false)",[article,before.version,blank]),/CONTENT_INVALID_BODY/);
  check(JSON.stringify((await db.query('select body,version from articles where id=$1',[article])).rows[0])===JSON.stringify(before),'failed published update rolls back body and version');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
  await assert.rejects(db.query("select save_event_supplement($1,1,$2,$3,'不得清空','perspective',$4::jsonb,false)",[supplement,event,timelineId,blank]),/CONTENT_INVALID_BODY/);check(true,'published supplement cannot be emptied using save intent');
  await db.query('reset role');
  await db.query("delete from work_comments where article_id=$1",[article]);
  const ids=Array.from({length:111},()=>randomUUID());
  for(const [i,id] of ids.entries())await db.query("insert into work_comments(id,creator_id,article_id,body,created_at) values($1,$2,$3,$4,'2026-10-13T00:00:00Z')",[id,a,article,'分页'+i]);
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");
  const collected=[];let cursor;
  do{
    const result=cursor?await db.query('select id,created_at from work_comments where article_id=$1 and (created_at,id)<($2,$3) order by created_at desc,id desc limit 50',[article,cursor.created_at,cursor.id]):await db.query('select id,created_at from work_comments where article_id=$1 order by created_at desc,id desc limit 50',[article]);
    collected.push(...result.rows.map(item=>item.id));cursor=result.rows.length===50?result.rows.at(-1):null;
  }while(cursor);
  check(collected.length===111&&new Set(collected).size===111,'stable cursor pages expose all 111 same-timestamp comments exactly once');
  await db.query('reset role');await db.query("insert into work_comments(creator_id,article_id,body,created_at) values($1,$2,'最新评论','2026-10-14T00:00:00Z')",[a,article]);
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");
  check((await db.query('select body from work_comments where article_id=$1 order by created_at desc,id desc limit 50',[article])).rows[0].body==='最新评论','new comment appears in initial newest page after more than 50 comments');
  await db.query('reset role');await db.query("update articles set status='hidden' where id=$1",[article]);
  await db.query("set role anon;select set_config('request.jwt.claim.sub','',false)");
  check((await db.query('select id from work_comments where article_id=$1',[article])).rows.length===0,'pagination never exposes hidden work comments through RLS');

  console.log(`Database acceptance complete: ${passed} checks passed.`);
} finally { if(db) await db.end(); await cluster.stop(); }
