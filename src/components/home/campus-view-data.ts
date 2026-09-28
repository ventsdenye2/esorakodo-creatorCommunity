import { cache } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';
import {boardLabel} from '../../features/forum/schemas';
export type CampusCard={id:string;title:string;summary:string;kind:string;motif:string;href:string;date:string|null};
export const getCampusCards=cache(async():Promise<{cards:CampusCard[];records:CampusCard[];failed:boolean}>=>{
 if(!isSupabaseConfigured())return {cards:[],records:[],failed:false};
 try{
  const db=await createClient();
  const jobs=[
   db.from('forum_topics').select('id,title,board,published_at').eq('status','published').order('published_at',{ascending:false}).limit(6).then(({data,error})=>{if(error)throw error;return (data??[]).map((r):CampusCard=>({id:r.id,title:r.title,summary:`来自「${boardLabel(r.board)}」的校园讨论。`,kind:'校园论坛',motif:'对话',href:`/forum/${r.id}`,date:r.published_at}));}),
   db.from('articles').select('id,title,summary,published_at').eq('status','published').order('published_at',{ascending:false}).limit(6).then(({data,error})=>{if(error)throw error;return (data??[]).map((r):CampusCard=>({id:r.id,title:r.title,summary:r.summary,kind:'校刊·部刊',motif:'阅读',href:`/press/${r.id}`,date:r.published_at}));}),
   db.from('events').select('id,title,summary,published_at').eq('status','published').order('published_at',{ascending:false}).limit(6).then(({data,error})=>{if(error)throw error;return (data??[]).map((r):CampusCard=>({id:r.id,title:r.title,summary:r.summary,kind:'校史事件',motif:'校史',href:`/events/${r.id}`,date:r.published_at}));}),
   db.from('event_supplements').select('id,event_id,title,kind,published_at,events!inner(status)').eq('status','published').eq('events.status','published').order('published_at',{ascending:false}).limit(6).then(({data,error})=>{if(error)throw error;return (data??[]).map((r):CampusCard=>({id:r.id,title:r.title,summary:'来自事件档案的补充记录与不同视角。',kind:'事件补充',motif:'见闻',href:`/events/${r.event_id}/supplements/${r.id}`,date:r.published_at}));}),
   ...(['students','colleges','places'] as const).map((table,index)=>db.from(table).select('id,name,slug,summary,created_at').order('created_at',{ascending:false}).limit(6).then(({data,error})=>{if(error)throw error;return (data??[]).map((r):CampusCard=>({id:r.id,title:r.name,summary:r.summary||'了解空天大学的人物与校园。',kind:['人物档案','学院档案','地点档案'][index],motif:['人物','学院','地点'][index],href:`/wiki/${['student','college','place'][index]}/${r.slug}`,date:r.created_at}));})),
  ];
  const results=await Promise.allSettled(jobs);const records=results.flatMap(r=>r.status==='fulfilled'?r.value:[]).sort((a,b)=>Date.parse(b.date??'1970-01-01')-Date.parse(a.date??'1970-01-01'));
  return {cards:records.slice(0,6),records,failed:results.some(r=>r.status==='rejected')};
 }catch{return {cards:[],records:[],failed:true};}
});

