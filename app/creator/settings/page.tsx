import {redirect} from 'next/navigation';
import {SiteHeader} from '../../../src/components/layout/site-header';
import {SiteFooter} from '../../../src/components/layout/site-footer';
import {createClient} from '../../../src/lib/supabase/server';
import {isSupabaseConfigured} from '../../../src/lib/supabase/config';
import {ProfileForm} from '../../../src/features/creator/profile-form';
import '../../../src/features/creator/portal.css';
export const dynamic='force-dynamic';export const metadata={title:'编辑个人资料'};
export default async function ProfileSettings(){
 if(!isSupabaseConfigured())redirect('/login');const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login');
 const {data:profile}=await db.from('profiles').select('display_name,bio,avatar_asset_id').eq('id',user.id).maybeSingle();
 return <div><SiteHeader/><main id="main-content" className="portal-page"><header className="portal-heading"><p className="archive-label">CREATOR PROFILE</p><h1>编辑个人资料</h1><p>这里的资料用于真实作者署名，与校园人物档案分开管理。</p></header><ProfileForm displayName={profile?.display_name??''} bio={profile?.bio??''} avatarId={profile?.avatar_asset_id}/></main><SiteFooter/></div>;
}

