import {registerHooks} from 'node:module';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import path from 'node:path';import {randomUUID} from 'node:crypto';import {AsyncLocalStorage} from 'node:async_hooks';import ts from 'typescript';
import EmbeddedPostgres from '../../output/pg-check/node_modules/embedded-postgres/dist/index.js';
export const authContext=new AsyncLocalStorage();globalThis.forumTestContext=authContext;
registerHooks({resolve(s,c,n){if(s.endsWith('/lib/supabase/server'))return {url:'data:text/javascript,export const createClient=async()=>globalThis.forumTestContext.getStore()',shortCircuit:true};if(s.startsWith('.')&&c.parentURL?.endsWith('.ts')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return {url:u.href,shortCircuit:true};}return n(s,c);},load(u,c,n){if(u.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(u),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true};return n(u,c);}});
export async function createForumTestRuntime(port=55459){
 const cluster=new EmbeddedPostgres({databaseDir:path.resolve('output/pg-check/collaboration-'+Date.now()),user:'postgres',password:randomUUID(),port,persistent:true,initdbFlags:['--encoding=UTF8','--locale=C'],postgresFlags:['-h','127.0.0.1'],onLog(){},onError(){}});
 console.log('collaboration db: initializing');await cluster.initialise();await cluster.start();
 const admin=cluster.getPgClient('postgres','127.0.0.1');await admin.connect();
 try{
  await admin.query("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema extensions;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,extensions to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");
  for(const f of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await admin.query(readFileSync('supabase/migrations/'+f,'utf8'));
 }catch(error){console.error('migration failed',error.message);await admin.end();await cluster.stop();throw error;}
 const ids={owner:randomUUID(),editor:randomUUID(),other:randomUUID(),topic:randomUUID(),account:randomUUID(),editorAccount:randomUUID(),first:randomUUID()};
 for(const [kind,handle,name] of [['owner','author_01','晚自习观察员'],['editor','writer_02','带了望远镜'],['other','other_03','路过的同学']])await admin.query('insert into auth.users values($1,$2,$3)',[ids[kind],kind+'@example.test',JSON.stringify({handle,display_name:name})]);
 await admin.query("insert into forum_accounts(id,handle,display_name,created_by)values($1,'night_study','晚自习观察员',$2),($3,'telescope','带了望远镜',$4)",[ids.account,ids.owner,ids.editorAccount,ids.editor]);
 await admin.query("insert into forum_topics(id,creator_id,title,board)values($1,$2,'今晚有人一起去观星吗？','campus')",[ids.topic,ids.owner]);
 async function query(viewer,sql,args=[]){const client=cluster.getPgClient('postgres','127.0.0.1');await client.connect();try{await client.query('set role '+(viewer?'authenticated':'anon'));if(viewer)await client.query("select set_config('request.jwt.claim.sub',$1,false)",[viewer]);return await client.query(sql,args);}finally{await client.end();}}
 const identifier=s=>{if(!/^[a-z_][a-z0-9_]*$/i.test(s))throw Error('invalid SQL identifier');return '"'+s+'"';};
 function database(viewer){
  return {auth:{getUser:async()=>({data:{user:viewer?{id:viewer}:null}})},from(table){
   let fields='*',clauses=[],values=[],ordering='',lim='',mode='many',mutation=null;
   const op=(name,operator,value)=>{values.push(value);clauses.push(identifier(name)+operator+'$'+values.length);return builder;};
   const builder={insert(value){mutation={kind:'insert',value};return this;},update(value){mutation={kind:'update',value};return this;},select(f='*'){if(!/^[a-z_,*]+$/i.test(f))throw Error('fixture select unsupported: '+f);fields=f;return this;},eq(k,v){return op(k,'=',v);},gt(k,v){return op(k,'>',v);},in(k,v){op(k,'=any(',v);clauses[clauses.length-1]+=')';return this;},order(k,{ascending=true}={}){ordering=' order by '+identifier(k)+(ascending?' asc':' desc');return this;},limit(v){lim=' limit '+Number(v);return this;},maybeSingle(){mode='optional';return execute();},single(){mode='single';return execute();},then(a,b){return execute().then(a,b);}};
   async function execute(){
    try{
     let sql='select '+fields+' from public.'+identifier(table)+(clauses.length?' where '+clauses.join(' and '):'')+ordering+lim;
     if(mutation?.kind==='insert'){
      const rows=Array.isArray(mutation.value)?mutation.value:[mutation.value],keys=Object.keys(rows[0]);values=[];
      sql='insert into public.'+identifier(table)+'('+keys.map(identifier).join(',')+') values '+rows.map(row=>'('+keys.map(key=>{values.push(row[key]);return '$'+values.length;}).join(',')+')').join(',')+' returning '+fields;
     }
     if(mutation?.kind==='update'){
      const keys=Object.keys(mutation.value),offset=values.length;
      sql='update public.'+identifier(table)+' set '+keys.map((key,i)=>identifier(key)+'=$'+(offset+i+1)).join(',')+(clauses.length?' where '+clauses.join(' and '):'')+' returning '+fields;
      values.push(...Object.values(mutation.value));
     }
     const result=await query(viewer,sql,values);
     if(mode==='single'&&result.rows.length!==1)return {data:null,error:{message:'expected one row'}};
     return {data:mode==='many'?result.rows:result.rows[0]??null,error:null};
    }catch(error){return {data:null,error:{message:error.message,code:error.code}};}
   }
   return builder;
  },async rpc(name,args={}){
   const keys=Object.keys(args),parameters=keys.map((k,i)=>identifier(k)+' => $'+(i+1)).join(',');
   const values=Object.entries(args).map(([key,value])=>value!==null&&typeof value==='object'&&key!=='p_tags'?JSON.stringify(value):value);
   const set=name==='list_forum_edit_accounts';
   try{const result=await query(viewer,set?'select coalesce(jsonb_agg(r),\'[]\'::jsonb) result from public.'+identifier(name)+'('+parameters+') r':'select to_jsonb(public.'+identifier(name)+'('+parameters+')) result',values);return {data:result.rows[0]?.result,error:null};}
   catch(error){return {data:null,error:{message:error.message,code:error.code}};}
  }};
 }
 console.log('collaboration db: fixtures ready');
 return {cluster,admin,ids,database,query,async close(){await admin.end();await cluster.stop();}};
}
