import{t as e}from"./server-fKm6mZa0.js";import{d as t}from"./schemas-Cbiq04Jo.js";import{a as n,i as r,n as i,t as a}from"./collaboration-server-BBpQTtFX.js";var o=`force-dynamic`;async function s(o,{params:s}){try{let{id:i}=await s;if(!t().safeParse(i).success)throw new a(`作品地址无效。`,400);let c=await e(),l=new URL(o.url).searchParams.get(`editing`)===`1`,u=l?await n(c,i):``;if(!l&&!(await c.from(`forum_topics`).select(`id`).eq(`id`,i).eq(`status`,`published`).maybeSingle()).data)throw new a(`作品当前不可见。`,404);let d,f=!1,p=Date.now(),m=new TextEncoder,h=new ReadableStream({start(e){let t=-1,n=0,a=()=>{if(!f){f=!0,clearTimeout(d),o.signal.removeEventListener(`abort`,a);try{e.close()}catch{}}};o.signal.addEventListener(`abort`,a,{once:!0});async function s(){if(!f)try{if(Date.now()-p>55e3){a();return}if(l){let o=await c.from(`forum_edit_documents`).select(`revision`).eq(`topic_id`,i).maybeSingle();if(o.error)throw Error(`connection`);if(!o.data){e.enqueue(m.encode(`event: revoked
data: {}

`)),a();return}(t!==o.data.revision||Date.now()-n>4e3)&&(e.enqueue(m.encode(`data: `+JSON.stringify(await r(c,i,u))+`

`)),t=o.data.revision,n=Date.now())}else{let n=await c.from(`forum_topics`).select(`version`).eq(`id`,i).eq(`status`,`published`).maybeSingle();if(n.error)throw Error(`connection`);if(!n.data){e.enqueue(m.encode(`event: unavailable
data: {}

`)),a();return}t!==n.data.version&&(t=n.data.version,e.enqueue(m.encode(`data: `+JSON.stringify({version:t})+`

`)))}f||(d=setTimeout(s,750))}catch{a()}}s()},cancel(){f=!0,clearTimeout(d)}});return new Response(h,{headers:{"Content-Type":`text/event-stream`,"Cache-Control":`private, no-cache, no-transform`,"X-Accel-Buffering":`no`}})}catch(e){return i(e)}}export{s as GET,o as dynamic};