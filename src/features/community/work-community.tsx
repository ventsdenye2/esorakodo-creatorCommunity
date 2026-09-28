import Link from 'next/link';
import {createClient} from '../../lib/supabase/server';
import {isSupabaseConfigured} from '../../lib/supabase/config';
import {workColumns,type WorkKind} from './types';
import {WorkActions,CommentForm,RemoveComment} from './work-actions';
import './community.css';
export async function WorkCommunity({kind,id,creatorId}:{kind:WorkKind;id:string;creatorId:string}){
 if(!isSupabaseConfigured())return null;
 const db=await createClient();const {data:{user}}=await db.auth.getUser();const col=workColumns[kind];
 const [author,comments,likes,liked,bookmark]=await Promise.all([
  db.from('profiles').select('handle,display_name').eq('id',creatorId).maybeSingle(),
  db.from('work_comments').select('id,creator_id,body,created_at,profiles(handle,display_name)').eq(col,id).order('created_at').limit(50),
  db.from('work_likes').select('id',{count:'exact',head:true}).eq(col,id),
  user?db.from('work_likes').select('id').eq(col,id).eq('creator_id',user.id).maybeSingle():null,
  user?db.from('work_bookmarks').select('id').eq(col,id).eq('creator_id',user.id).maybeSingle():null,
 ]);
 const interactionFailed=Boolean(likes.error||liked?.error||bookmark?.error);
 return <section className="work-community" aria-label="作品署名与创作讨论"><header><span className="archive-label">CREATOR / AFTERWORD</span><h2>作品与创作讨论</h2><p>作者：{author.data?<Link href={`/creator/${author.data.handle}`}>{author.data.display_name}</Link>:'作者资料暂不可用'} · 作品讨论与正文分开呈现。</p></header>
 {interactionFailed?<p role="alert">点赞与收藏状态暂时无法加载，请刷新后再操作。</p>:user?<WorkActions kind={kind} id={id} liked={Boolean(liked?.data)} bookmarked={Boolean(bookmark?.data)} likes={likes.count??0}/>:<p><Link href="/login">登录</Link>后可以收藏、点赞、评论或举报。</p>}
 {comments.error?<p role="alert">评论暂时无法加载，请稍后刷新。</p>:<ol className="work-comments">{comments.data?.map(comment=><li key={comment.id}><div>{comment.profiles?<Link href={`/creator/${comment.profiles.handle}`}>{comment.profiles.display_name}</Link>:<span>作者资料暂不可用</span>}<time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString('zh-CN')}</time></div><p>{comment.body}</p>{user?.id===comment.creator_id&&<RemoveComment kind={kind} id={comment.id}/>}</li>)}</ol>}
 {!comments.data?.length&&!comments.error&&<p className="muted">还没有作品评论。</p>}{user&&<CommentForm kind={kind} id={id}/>}</section>;
}

