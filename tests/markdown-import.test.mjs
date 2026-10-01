import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) {const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(url))return {url:url.href,shortCircuit:true};}return next(specifier,context);},load(url,context,next){if(url.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true};return next(url,context);}});
const {parseForum,parseArticle,parseEvent,MAX_IMPORT_BYTES}=await import('../src/features/import/parse.ts');
const text=kind=>readFileSync(new URL(`../public/guide/templates/${kind}.md`,import.meta.url),'utf8').replaceAll('\r\n','\n');
const forum=text('forum'),article=text('article'),event=text('event');
let checks=0;const ok=(run)=>{run();checks++};
ok(()=>assert.equal(parseForum(forum).floors[1].reply_to_floor_no,1));
ok(()=>assert.equal(parseForum('\uFEFF'+forum.replaceAll('\n','\r\n')).identities.length,2));
ok(()=>assert.equal(parseArticle(article).body.blocks[2].type,'quote'));
ok(()=>assert.equal(parseEvent(event).nodes.length,2));
for(const invalid of [forum.replace('回复: 1','回复: 2'),forum.replace('楼层 2','楼层 3'),forum.replace('赞同: 12','赞同: -1'),forum.replace('昵称: 夜读者','昵称: '+ '名'.repeat(61)),forum.replace('tags:','typo:'),forum.replace('board: campus','board: nowhere'),forum.replace('title: 图书馆闭馆后的灯','title: a\ntitle: b'),forum.replace('回复: 0','回复: 1'),forum.replace('## 楼层 1','未归属文字\n## 楼层 1'),forum.replace('library_helper','night_reader'), 'a'.repeat(MAX_IMPORT_BYTES+1)])ok(()=>assert.throws(()=>parseForum(invalid)));
for(const invalid of [article+'\n\n| a | b |',article+'\n\n**粗体**',article.replace('校园生活','不支持标签'),article.replace('summary: 一次图书馆志愿活动的记录。','summary: '+'字'.repeat(501)),article.replace('## 夜里的书架','## 标题\n没有空行')])ok(()=>assert.throws(()=>parseArticle(invalid)));
for(const invalid of [event.replace('2026-09-20','2026-02-30'),event.replace('ends_on: 2026-09-21','ends_on: 2026-09-19'),event.replace('时间节点 2','时间节点 3'),event.replace('## 后续影响','## 事件背景'),event.replace('starts_on: 2026-09-20','starts_on:')])ok(()=>assert.throws(()=>parseEvent(invalid)));
ok(()=>assert.equal(parseEvent(event.slice(0,event.indexOf('### 时间节点'))).nodes.length,0));
console.log(`PASS ${checks} Markdown import parser checks`);

