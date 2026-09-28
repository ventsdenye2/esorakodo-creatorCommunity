import Link from 'next/link';
import {Avatar} from '../../../src/components/ui/avatar';
import {notFound} from 'next/navigation';
import {SiteHeader} from '../../../src/components/layout/site-header';
import {SiteFooter} from '../../../src/components/layout/site-footer';
import {createClient} from '../../../src/lib/supabase/server';
import {isSupabaseConfigured} from '../../../src/lib/supabase/config';
import {creatorWorks} from '../../../src/features/creator/queries';
import '../../../src/features/creator/portal.css';
export const dynamic='force-dynamic';
export const metadata={title:'作者主页'};
export default async function CreatorPublicPage({params}:{params:Promise<{handle:string}>}){
 const {handle}=await params;if(!/^[a-z0-9_]{3,32}$/.test(handle)||!isSupabaseConfigured())notFound();
 const db=await createClient();const {data:profile}=await db.from('profiles').select('id,handle,display_name,bio,avatar_asset_id').eq('handle',handle).maybeSingle();if(!profile)notFound();
 const {works,failed}=await creatorWorks(profile.id);
 return <div><SiteHeader/><main id="main-content" className="portal-page"><header className="portal-heading"><span className="archive-label">CREATOR PROFILE</span><Avatar assetId={profile.avatar_asset_id} name={profile.display_name}/><h1>{profile.display_name}</h1><p>@{profile.handle}</p><p>{profile.bio||'作者暂未填写简介。'}</p></header><section><h2>已发布作品</h2>{failed&&<p role="alert">部分作品暂时无法加载。</p>}{!works.length?<p className="portal-empty">暂无公开作品。</p>:<ul className="portal-list">{works.map(work=><li key={`${work.kind}-${work.id}`}><Link href={work.href}>{work.title} ↗</Link><p>{work.kind} · {new Date(work.date).toLocaleDateString('zh-CN')}</p></li>)}</ul>}</section></main><SiteFooter/></div>;
}

