import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import test from 'node:test';
registerHooks({resolve(specifier,context,next){
 if(specifier.endsWith('/lib/supabase/server'))return {url:'data:text/javascript,export const createClient=async()=>globalThis.speakerDb',shortCircuit:true};
 if(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')){const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(url))return {url:url.href,shortCircuit:true};}
 return next(specifier,context);
},load(url,context,next){if(url.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true};return next(url,context);}});
const { prepareFloors, serializeFloors, insertFloor, removeFloor, defaultSpeakerName }=await import('../src/features/forum/draft-model.ts');
const { saveDraftSpeaker }=await import('../src/features/forum/speaker-actions.ts');
const owner='00000000-0000-4000-8000-000000000001',guest='00000000-0000-4000-8000-000000000002',topic='00000000-0000-4000-8000-000000000003';
const input=(account,body,reply=null)=>({forum_account_id:account,body,reply_to_floor_no:reply,in_world_time:'',like_count:4,question_count:2});
const initial=()=>prepareFloors([input(owner,'首帖'),input(guest,'独立发言'),input(owner,'回复第二楼',2)]);
test('inserting above a referenced floor preserves identity of quote after renumbering',()=>{
 const before=initial(),newFloor={...before[0],id:'inserted',body:'插入的发言',replyToId:null};
 const next=insertFloor(before,newFloor,before[1].id),serialized=serializeFloors(next);
 assert.deepEqual(serialized.map(f=>f.body),['首帖','插入的发言','独立发言','回复第二楼']);
 assert.equal(serialized[3].reply_to_floor_no,3);assert.equal(before.length,3);assert.equal(next[0],before[0]);
});
test('reply appends at end and carries one direct target',()=>{
 const floors=initial(),reply={...floors[0],id:'reply',replyToId:floors[2].id};
 const next=insertFloor(floors,reply);assert.equal(next.at(-1).id,'reply');assert.equal(serializeFloors(next).at(-1).reply_to_floor_no,3);
});
test('first floor cannot be deleted or displaced by insertion, including unknown insertion target',()=>{
 const floors=initial();assert.throws(()=>removeFloor(floors,floors[0].id),/首楼/);assert.throws(()=>insertFloor(floors,{...floors[1],id:'new'},floors[0].id),/首楼/);assert.throws(()=>insertFloor(floors,{...floors[1],id:'new'},'missing'),/首楼/);
});
test('deleting a target preserves its direct replies and all remaining counts',()=>{
 const floors=initial(),next=removeFloor(floors,floors[1].id);assert.equal(next[1].body,'回复第二楼');assert.equal(next[1].replyToId,null);assert.equal(next[1].like_count,4);assert.equal(floors[2].replyToId,floors[1].id);
});
test('100-floor cap applies to both appending and insertion',()=>{
 const floors=Array.from({length:100},(_,i)=>({...initial()[0],id:String(i)}));assert.throws(()=>insertFloor(floors,{...floors[0],id:'new'}),/100/);assert.throws(()=>insertFloor(floors,{...floors[0],id:'new'},'1'),/100/);
});
test('restored saved sequence round-trips account, time, count and target',()=>{const floors=initial();assert.deepEqual(serializeFloors(prepareFloors(serializeFloors(floors))),serializeFloors(floors));assert.equal(defaultSpeakerName(topic),defaultSpeakerName(topic));assert.ok(defaultSpeakerName(topic).length<=60);});
function database({user=owner,visible=true,fail=false}={}){
 const calls=[];const builder={select(value){calls.push(['select',value]);return this;},eq(key,value){calls.push(['eq',key,value]);return this;},insert(value){calls.push(['insert',value]);return this;},update(value){calls.push(['update',value]);return this;},async maybeSingle(){return {error:null,data:visible?{id:topic}:null};},async single(){return {error:fail?{message:'rejected'}:null,data:fail?null:{id:guest}};}};
 return {calls,rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:visible,error:null};},auth:{getUser:async()=>({data:{user:user?{id:user}:null}})},from(table){calls.push(['from',table]);return builder;}};
}
const speaker={topicId:topic,id:null,name:'晚自习的风',avatarId:null};
test('quick speaker requires valid inputs and authentication before any table access',async()=>{
 globalThis.speakerDb=database();assert.ok((await saveDraftSpeaker({...speaker,name:''})).error);assert.equal(globalThis.speakerDb.calls.length,0);
 globalThis.speakerDb=database({user:null});assert.ok((await saveDraftSpeaker(speaker)).error);assert.equal(globalThis.speakerDb.calls.length,0);
});
test('quick speaker rejects inaccessible topic before identity mutation',async()=>{
 globalThis.speakerDb=database({visible:false});assert.ok((await saveDraftSpeaker(speaker)).error);const calls=globalThis.speakerDb.calls;assert.ok(calls.some(c=>c[0]==='rpc'&&c[1]==='can_edit_forum'&&c[2].p_topic_id===topic));assert.ok(!calls.some(c=>c[0]==='insert'||c[0]==='update'));
});
test('new identity gets server-owned creator, unique valid handle and optional Student',async()=>{
 globalThis.speakerDb=database();assert.equal((await saveDraftSpeaker(speaker)).error,null);const value=globalThis.speakerDb.calls.find(c=>c[0]==='insert')[1];assert.equal(value.created_by,owner);assert.equal(value.student_id,null);assert.equal(value.avatar_asset_id,null);assert.match(value.handle,/^campus_[a-f0-9]{12}$/);assert.equal(value.display_name,speaker.name);
});
test('existing identity update is restricted by both identity ID and authenticated creator',async()=>{
 globalThis.speakerDb=database();await saveDraftSpeaker({...speaker,id:guest});const calls=globalThis.speakerDb.calls;const update=calls.findIndex(c=>c[0]==='update');assert.ok(update>0);assert.ok(calls.slice(update).some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]===guest));assert.ok(calls.slice(update).some(c=>c[0]==='eq'&&c[1]==='created_by'&&c[2]===owner));
});
test('identity write rejection is returned as a recoverable error',async()=>{globalThis.speakerDb=database({fail:true});const result=await saveDraftSpeaker(speaker);assert.ok(result.error);assert.equal(result.account,null);});
