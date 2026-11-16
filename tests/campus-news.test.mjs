import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

async function load(rows, failures=[]) {
 const client={from(table){let filters=[],orders=[],limit=Infinity;return {select(){return this},eq(key,value){filters.push([key,value]);return this},order(key,{ascending}){orders.push([key,ascending]);return this},limit(value){limit=value;return this},then(resolve){if(failures.includes(table))return Promise.resolve({data:null,error:new Error('unavailable')}).then(resolve);let result=[...(rows[table]??[])].filter(row=>filters.every(([key,value])=>key.split('.').reduce((v,k)=>v?.[k],row)===value));result.sort((a,b)=>{for(const [key,asc] of orders){const diff=String(a[key]).localeCompare(String(b[key]));if(diff)return asc?diff:-diff;}return 0});return Promise.resolve({data:result.slice(0,limit),error:null}).then(resolve);}}}};
 const source=(await readFile(new URL('../src/components/home/campus-view-data.ts',import.meta.url),'utf8')).split('\n').filter(line=>!line.startsWith('import ')).join('\n');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace('export const getCampusCards','const getCampusCards').replace(/export {};?/g,'');
 return new Function('cache','isSupabaseConfigured','createClient','boardLabel',compiled+';return getCampusCards;')(fn=>fn,()=>true,async()=>client,()=> '校园日常')();
}
const row=(id,date,extra={})=>({id,title:id,name:id,slug:id,summary:'内容',board:'campus',status:'published',created_at:'2020-01-01',published_at:'2020-01-01',updated_at:date,...extra});
test('old edited works outrank new creations across all seven sources',async()=>{
 const tables=['forum_topics','articles','events','event_supplements','students','colleges','places'];const rows=Object.fromEntries(tables.map((t,i)=>[t,[row(t,'2026-11-'+String(10+i),{event_id:'event',events:{status:'published'}})]]));
 rows.forum_topics.push(row('edited-old','2026-11-20'));rows.students.push(row('new-person','2026-11-19',{created_at:'2026-11-19'}));
 const r=await load(rows);assert.equal(r.records.length,9);assert.equal(r.cards.length,6);assert.deepEqual(r.cards.slice(0,2).map(c=>c.id),['edited-old','new-person']);assert.equal(r.cards[0].date,'2026-11-20');assert.equal(new Set(r.records.map(c=>c.kind)).size,7);
});
test('filter before source limit, stable ties, and no draft/hidden parent leaks',async()=>{
 const old=Array.from({length:8},(_,i)=>row('old-'+i,'2026-10-01'));const rows={forum_topics:[...old,row('edited','2026-11-20'),row('draft','2026-12-01',{status:'draft'}),row('hidden','2026-12-02',{status:'hidden'})],event_supplements:[row('hidden-parent','2026-12-03',{events:{status:'hidden'}})],students:[row('z-tie','2026-11-20'),row('a-tie','2026-11-20')]};const r=await load(rows);assert.deepEqual(r.cards.slice(0,3).map(c=>c.id),['z-tie','edited','a-tie']);assert.ok(!r.records.some(c=>['draft','hidden','hidden-parent'].includes(c.id)));assert.equal(r.records.filter(c=>c.kind==='校园论坛').length,6);
});
test('partial source failure preserves other recent updates',async()=>{const r=await load({students:[row('person','2026-11-20')]},['events']);assert.equal(r.failed,true);assert.equal(r.cards[0].href,'/wiki/student/person');});
