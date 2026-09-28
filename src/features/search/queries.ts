import {createClient} from '../../lib/supabase/server';
import {isSupabaseConfigured} from '../../lib/supabase/config';
export type SearchGroup={kind:string;label:string;items:{id:string;title:string;summary:string;href:string}[]};
export const searchKinds=[['student','人物'],['college','学院'],['place','地点'],['event','校史事件'],['article','校刊'],['supplement','事件补充'],['forum','论坛'],['account','论坛身份'],['creator','创作者'],['tag','话题标签']] as const;
export async function searchCampus(query:string,kind:string){
 if(!isSupabaseConfigured()||!query.trim())return {groups:[] as SearchGroup[],failed:false};
 const db=await createClient();const q=`%${query.trim().slice(0,80).replace(/[\\%_]/g,'\\$&')}%`;
 const jobs=searchKinds.filter(([key])=>!kind||kind===key).map(async([key,label]):Promise<SearchGroup>=>{
  if(key==='student'||key==='college'||key==='place'){
   const table={student:'students',college:'colleges',place:'places'} as const;
   const {data,error}=await db.from(table[key]).select('id,name,summary,slug').ilike('name',q).order('name').limit(12);if(error)throw error;
   return {kind:key,label,items:(data??[]).map(r=>({id:r.id,title:r.name,summary:r.summary??'',href:`/wiki/${key}/${r.slug}`}))};
  }
  if(key==='event'||key==='article'||key==='forum'){
   const table={event:'events',article:'articles',forum:'forum_topics'} as const;
   const {data,error}=await db.from(table[key]).select('id,title,published_at').eq('status','published').ilike('title',q).order('published_at',{ascending:false}).limit(12);if(error)throw error;
   return {kind:key,label,items:(data??[]).map(r=>({id:r.id,title:r.title,summary:r.published_at?new Date(r.published_at).toLocaleDateString('zh-CN'):'',href:`/${key==='event'?'events':key==='article'?'press':'forum'}/${r.id}`}))};
  }
  if(key==='supplement'){
   const {data,error}=await db.from('event_supplements').select('id,title,event_id,events!inner(status)').eq('status','published').eq('events.status','published').ilike('title',q).order('published_at',{ascending:false}).limit(12);if(error)throw error;
   return {kind:key,label,items:(data??[]).map(r=>({id:r.id,title:r.title,summary:'事件档案补充',href:`/events/${r.event_id}/supplements/${r.id}`}))};
  }
  if(key==='tag'){
   const {data,error}=await db.from('hashtags').select('id,name').ilike('name',q).order('name').limit(12);if(error)throw error;
   return {kind:key,label,items:(data??[]).map(r=>({id:r.id,title:`#${r.name}`,summary:'校园论坛话题',href:`/forum?tag=${encodeURIComponent(r.name)}`}))};
  }
  const table=key==='account'?'forum_accounts':'profiles';
  const results=await Promise.all([db.from(table).select('id,handle,display_name').ilike('display_name',q).order('handle').limit(12),db.from(table).select('id,handle,display_name').ilike('handle',q).order('handle').limit(12)]);
  if(results.some(r=>r.error))throw new Error('SEARCH_FAILED');
  const rows=[...new Map(results.flatMap(r=>r.data??[]).map(r=>[r.id,r])).values()].slice(0,12);
  return {kind:key,label,items:rows.map(r=>({id:r.id,title:r.display_name,summary:`@${r.handle}`,href:`/${key==='account'?'forum/accounts':'creator'}/${r.handle}`}))};
 });
 const results=await Promise.allSettled(jobs);return {groups:results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]),failed:results.some(r=>r.status==='rejected')};
}
