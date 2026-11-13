import { registerHooks } from 'node:module';import { readFileSync,existsSync } from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';import test from 'node:test';import * as Y from 'yjs';
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.endsWith('.ts')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return {url:u.href,shortCircuit:true};}return n(s,c);},load(u,c,n){if(u.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(u),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true};return n(u,c);}});
const {seedForum,readForum,writeFloors,floorText,replaceText,publishableSnapshot}=await import('../src/features/forum/collaboration-document.ts');
const account='00000000-0000-4000-8000-000000000001';const floor=(id,body,replyToId=null)=>({id,body,forum_account_id:account,in_world_time:'',like_count:0,question_count:0,replyToId});
const seed=()=>seedForum({title:'今晚去观星',board:'campus',tags:'观星',links:[],floors:[floor('root','图书馆门口集合'),floor('second','带望远镜'),floor('third','收到','second')]});
function peers(){const base=seed(),a=new Y.Doc(),b=new Y.Doc();const state=Y.encodeStateAsUpdate(base);Y.applyUpdate(a,state);Y.applyUpdate(b,state);return {a,b};}
function merge(a,b){const av=Y.encodeStateAsUpdate(a),bv=Y.encodeStateAsUpdate(b);Y.applyUpdate(a,bv);Y.applyUpdate(b,av);assert.deepEqual(readForum(a),readForum(b));}
test('two simultaneous writers retain both same-floor text insertions',()=>{const {a,b}=peers();floorText(a,'root').insert(0,'A：');floorText(b,'root').insert(floorText(b,'root').length,'，B也到');merge(a,b);assert.equal(floorText(a,'root').toString(),'A：图书馆门口集合，B也到');});
test('same-position edits converge independently of delivery order and duplicate delivery',()=>{const {a,b}=peers();floorText(a,'second').insert(1,'甲');floorText(b,'second').insert(1,'乙');merge(a,b);const state=Y.encodeStateAsUpdate(a);Y.applyUpdate(a,state);assert.equal(floorText(a,'second').length,'带望远镜'.length+2);assert.match(floorText(a,'second').toString(),/甲/);assert.match(floorText(a,'second').toString(),/乙/);});
test('concurrent insertion and editing preserve stable quotes',()=>{const {a,b}=peers();const before=readForum(a).floors;writeFloors(a,[before[0],floor('inserted','天气晴朗'),...before.slice(1)]);floorText(b,'second').insert(0,'我会');merge(a,b);const snap=publishableSnapshot(readForum(a));assert.ok(snap.success);assert.equal(snap.data.messages[3].reply_to_floor_no,3);assert.equal(snap.data.messages[2].body,'我会带望远镜');});
test('deleting a concurrently edited message does not resurrect it or retarget replies',()=>{const {a,b}=peers();writeFloors(a,readForum(a).floors.filter(f=>f.id!=='second'));floorText(b,'second').insert(0,'新增');merge(a,b);const state=readForum(a);assert.equal(state.floors.length,2);assert.equal(state.floors[1].replyToId,null);});
test('first floor deletion is rejected',()=>{const doc=seed();writeFloors(doc,readForum(doc).floors.slice(1));assert.throws(()=>readForum(doc),/首楼/);});
test('partial text remains in shared state while public snapshot validation holds last valid content',()=>{const doc=seed();replaceText(floorText(doc,'root'),'');assert.equal(readForum(doc).floors[0].body,'');assert.equal(publishableSnapshot(readForum(doc)).success,false);replaceText(floorText(doc,'root'),'重新改写');assert.ok(publishableSnapshot(readForum(doc)).success);});
test('independent shared metadata changes do not overwrite text or other archive links',()=>{const {a,b}=peers();a.getMap('links').set('student:a',{entity_type:'student',entity_id:account});b.getMap('links').set('college:b',{entity_type:'college',entity_id:'00000000-0000-4000-8000-000000000002'});a.getText('title').insert(0,'【约伴】');b.getMap('meta').set('board','clubs');merge(a,b);assert.equal(readForum(a).links.length,2);assert.equal(readForum(a).board,'clubs');assert.match(readForum(a).title,/约伴/);});
test('emoji substitution never corrupts surrogate pairs across serialized updates',()=>{const doc=seed();replaceText(floorText(doc,'root'),'😀你好');replaceText(floorText(doc,'root'),'😁你好');const peer=new Y.Doc();Y.applyUpdate(peer,Y.encodeStateAsUpdate(doc));assert.equal(floorText(peer,'root').toString(),'😁你好');});

const {isForumDocumentComplete,acknowledgesForumUpdate}=await import('../src/features/forum/collaboration-sync.ts');
test('missing initialization is detected and full-state retry recovers all floors',()=>{
 const client=seed(), vector=Y.encodeStateVector(client);replaceText(client.getText('title'),'恢复测试');
 const floors=readForum(client).floors;for(let i=0;i<22;i++)floors.push(floor('extra-'+i,'第'+i+'条正文'));
 writeFloors(client,floors);const delta=Y.encodeStateAsUpdate(client,vector),server=new Y.Doc();Y.applyUpdate(server,delta);
 assert.equal(isForumDocumentComplete(server),false);
 const sent=Y.encodeStateAsUpdate(client);assert.equal(acknowledgesForumUpdate(Y.encodeStateAsUpdate(server),sent),false);
 Y.applyUpdate(server,sent);assert.equal(isForumDocumentComplete(server),true);assert.deepEqual(readForum(server),readForum(client));assert.equal(readForum(server).floors.length,25);
 assert.equal(acknowledgesForumUpdate(Y.encodeStateAsUpdate(server),sent),true);
});
test('stale success cannot acknowledge new text or deletions',()=>{
 const {a,b}=peers();floorText(a,'root').insert(0,'未确认内容');
 assert.equal(acknowledgesForumUpdate(Y.encodeStateAsUpdate(b),Y.encodeStateAsUpdate(a)),false);
 Y.applyUpdate(b,Y.encodeStateAsUpdate(a));assert.equal(acknowledgesForumUpdate(Y.encodeStateAsUpdate(b),Y.encodeStateAsUpdate(a)),true);
 floorText(a,'root').delete(0,2);assert.equal(acknowledgesForumUpdate(Y.encodeStateAsUpdate(b),Y.encodeStateAsUpdate(a)),false);
 Y.applyUpdate(b,Y.encodeStateAsUpdate(a));assert.equal(acknowledgesForumUpdate(Y.encodeStateAsUpdate(b),Y.encodeStateAsUpdate(a)),true);
});
test('full-state retries preserve concurrent server edits and stable replies',()=>{
 const {a,b}=peers();floorText(a,'second').insert(0,'甲');floorText(b,'root').insert(0,'乙');
 const sent=Y.encodeStateAsUpdate(a);Y.applyUpdate(b,sent);Y.applyUpdate(b,sent);
 assert.equal(acknowledgesForumUpdate(Y.encodeStateAsUpdate(b),sent),true);Y.applyUpdate(a,Y.encodeStateAsUpdate(b));
 assert.deepEqual(readForum(a),readForum(b));assert.equal(readForum(b).floors[2].replyToId,'second');assert.match(floorText(b,'root').toString(),/^乙/);
});
test('pending deletion dependencies are also incomplete',()=>{
 const client=seed(),vector=Y.encodeStateVector(client);floorText(client,'root').delete(0,2);
 const server=new Y.Doc();Y.applyUpdate(server,Y.encodeStateAsUpdate(client,vector));assert.equal(isForumDocumentComplete(server),false);
 Y.applyUpdate(server,Y.encodeStateAsUpdate(client));assert.equal(isForumDocumentComplete(server),true);
});
