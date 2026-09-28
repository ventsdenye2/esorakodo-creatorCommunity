import {createClient} from '../../lib/supabase/server';
export type CreatorWork={id:string;title:string;status:string;kind:string;href:string;editHref:string;date:string};
export async function creatorWorks(creatorId:string,own=false):Promise<{works:CreatorWork[];failed:boolean}>{
 const db=await createClient();
 let forum=db.from('forum_topics').select('id,title,status,updated_at').eq('creator_id',creatorId).order('updated_at',{ascending:false}).limit(50);
 let press=db.from('articles').select('id,title,status,updated_at').eq('creator_id',creatorId).order('updated_at',{ascending:false}).limit(50);
 let events=db.from('events').select('id,title,status,updated_at').eq('creator_id',creatorId).order('updated_at',{ascending:false}).limit(50);
 let supplements=db.from('event_supplements').select('id,title,status,event_id,updated_at').eq('creator_id',creatorId).order('updated_at',{ascending:false}).limit(50);
 if(!own){forum=forum.eq('status','published');press=press.eq('status','published');events=events.eq('status','published');supplements=supplements.eq('status','published');}
 const results=await Promise.all([forum,press,events,supplements]);
 const parentIds=[...new Set((results[3].data??[]).map(row=>row.event_id))];
 const parents=parentIds.length?await db.from('events').select('id').in('id',parentIds).eq('status','published'):{data:[],error:null};
 const publicParents=new Set((parents.data??[]).map(parent=>parent.id));
 const works:CreatorWork[]=[
 ...(results[0].data??[]).map(r=>({...r,kind:'校园论坛',href:`/forum/${r.id}`,editHref:`/create/forum/${r.id}`,date:r.updated_at})),
 ...(results[1].data??[]).map(r=>({...r,kind:'校刊·部刊',href:`/press/${r.id}`,editHref:`/create/article/${r.id}`,date:r.updated_at})),
 ...(results[2].data??[]).map(r=>({...r,kind:'校史事件',href:`/events/${r.id}`,editHref:`/create/event/${r.id}`,date:r.updated_at})),
 ...(results[3].data??[]).filter(r=>own||publicParents.has(r.event_id)).map(r=>({...r,status:publicParents.has(r.event_id)?r.status:'hidden',kind:'事件补充',href:`/events/${r.event_id}/supplements/${r.id}`,editHref:`/create/event/supplement/${r.id}`,date:r.updated_at})),
 ];
 return {works:works.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)),failed:results.some(r=>r.error)||Boolean(parents.error)};
}
export async function creatorBookmarks(creatorId:string){
 const db=await createClient();
 const {data:rows,error}=await db.from('work_bookmarks').select('*').eq('creator_id',creatorId).order('created_at',{ascending:false}).limit(100);
 const items:{id:string;title:string;href:string}[]=[];
 if(error)return {items,failed:true};
 const ids=(key:'forum_topic_id'|'article_id'|'event_id'|'supplement_id')=>[...new Set((rows??[]).flatMap(row=>row[key]?[row[key]]:[]))];
 const [forum,articles,events,supplements]=await Promise.all([
  ids('forum_topic_id').length?db.from('forum_topics').select('id,title').in('id',ids('forum_topic_id')).eq('status','published'):{data:[],error:null},
  ids('article_id').length?db.from('articles').select('id,title').in('id',ids('article_id')).eq('status','published'):{data:[],error:null},
  ids('event_id').length?db.from('events').select('id,title').in('id',ids('event_id')).eq('status','published'):{data:[],error:null},
  ids('supplement_id').length?db.from('event_supplements').select('id,title,event_id').in('id',ids('supplement_id')).eq('status','published'):{data:[],error:null},
 ]);
 const parentIds=[...new Set((supplements.data??[]).map(row=>row.event_id))];
 const parents=parentIds.length?await db.from('events').select('id').in('id',parentIds).eq('status','published'):{data:[],error:null};
 const publicParents=new Set((parents.data??[]).map(parent=>parent.id));
 const forumMap=new Map((forum.data??[]).map(row=>[row.id,row]));
 const articleMap=new Map((articles.data??[]).map(row=>[row.id,row]));
 const eventMap=new Map((events.data??[]).map(row=>[row.id,row]));
 const supplementMap=new Map((supplements.data??[]).filter(row=>publicParents.has(row.event_id)).map(row=>[row.id,row]));
 for(const row of rows??[]){
  if(row.forum_topic_id){const work=forumMap.get(row.forum_topic_id);if(work)items.push({id:row.id,title:work.title,href:`/forum/${work.id}`});}
  else if(row.article_id){const work=articleMap.get(row.article_id);if(work)items.push({id:row.id,title:work.title,href:`/press/${work.id}`});}
  else if(row.event_id){const work=eventMap.get(row.event_id);if(work)items.push({id:row.id,title:work.title,href:`/events/${work.id}`});}
  else if(row.supplement_id){const work=supplementMap.get(row.supplement_id);if(work)items.push({id:row.id,title:work.title,href:`/events/${work.event_id}/supplements/${work.id}`});}
 }
 return {items,failed:[forum,articles,events,supplements,parents].some(result=>result.error)};
}
