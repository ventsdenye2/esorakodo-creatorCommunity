import {createClient} from '../../lib/supabase/server';
import type {WikiEntityType} from '../wiki/types';
export async function relatedRecords(type:WikiEntityType|'event',id:string){
 const db=await createClient();const column=`${type}_id` as const;
 const [articles,supplements,events,forum]=await Promise.all([
  db.from('article_entity_links').select('article_id').eq(column,id).limit(60),
  db.from('supplement_entity_links').select('supplement_id').eq(column,id).limit(60),
  db.from('event_entity_links').select('event_id').eq(type==='event'?'related_event_id':column,id).limit(60),
  db.from('forum_topic_entity_links').select('topic_id').eq(column,id).limit(60),
 ]);
 const results=await Promise.all([
  articles.data?.length?db.from('articles').select('id,title,published_at').in('id',articles.data.map(r=>r.article_id)).eq('status','published').order('published_at',{ascending:false}):null,
  supplements.data?.length?db.from('event_supplements').select('id,event_id,title,published_at,events!inner(status)').in('id',supplements.data.map(r=>r.supplement_id)).eq('status','published').eq('events.status','published').order('published_at',{ascending:false}):null,
  events.data?.length?db.from('events').select('id,title,published_at').in('id',events.data.map(r=>r.event_id)).eq('status','published').order('published_at',{ascending:false}):null,
  forum.data?.length?db.from('forum_topics').select('id,title,published_at').in('id',forum.data.map(r=>r.topic_id)).eq('status','published').order('published_at',{ascending:false}):null,
 ]);
 return {failed:Boolean(articles.error||supplements.error||events.error||forum.error||results.some(r=>r?.error)),items:[
 ...(results[0]?.data??[]).map(r=>({id:r.id,title:r.title,kind:'校刊·部刊',href:`/press/${r.id}`,date:r.published_at})),
 ...(results[1]?.data??[]).map(r=>({id:r.id,title:r.title,kind:'事件补充',href:`/events/${r.event_id}/supplements/${r.id}`,date:r.published_at})),
 ...(results[2]?.data??[]).map(r=>({id:r.id,title:r.title,kind:'校史事件',href:`/events/${r.id}`,date:r.published_at})),
 ...(results[3]?.data??[]).map(r=>({id:r.id,title:r.title,kind:'校园论坛',href:`/forum/${r.id}`,date:r.published_at})),
 ].sort((a,b)=>(b.date??'').localeCompare(a.date??''))};
}
