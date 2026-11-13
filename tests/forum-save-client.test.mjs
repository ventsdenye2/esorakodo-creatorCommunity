import {registerHooks} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as Y from 'yjs';
registerHooks({resolve(s,c,n){if(s==='react'&&c.parentURL?.endsWith('use-forum-collaboration.ts'))return {url:'data:text/javascript,export const useState=v=>[typeof v==="function"?v():v,()=>{}];export const useRef=v=>({current:v});export const useEffect=f=>{globalThis.cleanupForumHook=f()}',shortCircuit:true};if(s.startsWith('.')&&c.parentURL?.endsWith('.ts')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return {url:u.href,shortCircuit:true};}return n(s,c);},load(u,c,n){if(u.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(u),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true};return n(u,c);}});
const {useForumCollaboration}=await import('../src/features/forum/use-forum-collaboration.ts');
const {seedForum,readForum,writeFloors}=await import('../src/features/forum/collaboration-document.ts');
test('actual save hook sends initialization and retains backup until durable acknowledgement',async()=>{
 const old={fetch:globalThis.fetch,document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,EventSource:globalThis.EventSource};
 const storage=new Map(),server=seedForum({title:'测试',board:'campus',tags:'',links:[],floors:[]});let accept=false,revision=1,posts=0;
 const envelope=()=>({document:{state:Buffer.from(Y.encodeStateAsUpdate(server)).toString('base64'),revision},viewerId:'creator',status:'draft',accounts:[],members:[],presence:[]});
 globalThis.document=new EventTarget();globalThis.window=new EventTarget();globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null,removeItem:k=>storage.delete(k)};globalThis.EventSource=class{addEventListener(){}close(){}};
 globalThis.fetch=async(url,options={})=>{const body=options.body?JSON.parse(options.body):null;if(body?.kind==='presence')return {ok:true};if(body?.kind==='update'){posts++;const submitted=new Y.Doc();Y.applyUpdate(submitted,Buffer.from(body.update,'base64'));assert.equal(submitted.store.pendingStructs,null);assert.equal(readForum(submitted).floors.length,25);submitted.destroy();if(accept){Y.applyUpdate(server,Buffer.from(body.update,'base64'));revision++;}}return {ok:true,json:async()=>envelope()};};
 try{
  const session=useForumCollaboration('topic');await new Promise(r=>setImmediate(r));
  writeFloors(session.doc,Array.from({length:25},(_,i)=>({id:'floor-'+i,body:'正文'+i,forum_account_id:'00000000-0000-4000-8000-000000000001',in_world_time:'',like_count:0,question_count:0,replyToId:null})));
  assert.equal(await session.flush(),false);assert.ok(storage.has('forum-edit:topic:creator'),'HTTP success with stale state must retain backup');
  accept=true;assert.equal(await session.flush(),true);assert.equal(storage.size,0);assert.equal(readForum(server).floors.length,25);
  assert.equal(await session.flush(),true);assert.equal(posts,3,'manual save without queued delta still sends complete state');
  const fetchBefore=globalThis.fetch;let release,hold=true,secondFinished=false;
  globalThis.fetch=async(...args)=>{if(args[1]?.body&&JSON.parse(args[1].body).kind==='update'&&hold){hold=false;await new Promise(resolve=>{release=resolve});}return fetchBefore(...args);};
  const firstSave=session.flush();const manualSave=session.flush().then(result=>{secondFinished=true;return result;});
  await new Promise(resolve=>setTimeout(resolve,10));assert.equal(secondFinished,false,'manual save waits for the active sync instead of reporting failure');
  release();assert.equal(await firstSave,true);assert.equal(await manualSave,true);
 }finally{globalThis.cleanupForumHook?.();Object.assign(globalThis,old);server.destroy();}
});
