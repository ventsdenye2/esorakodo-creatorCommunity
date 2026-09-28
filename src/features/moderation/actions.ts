"use server";
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {createClient} from '../../lib/supabase/server';
export async function moderate(_: {error:string;message:string},form:FormData){
 const parsed=z.object({id:z.uuid(),action:z.enum(['hide','restore','dismiss']),reason:z.string().trim().min(5).max(1000)}).safeParse({id:form.get('id'),action:form.get('action'),reason:form.get('reason')});
 if(!parsed.success)return {error:'请选择处置方式并填写5至1000字的说明。',message:''};
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return {error:'请先登录。',message:''};
 const {data:allowed,error:permissionError}=await db.rpc('is_moderator');
 if(permissionError)return {error:'管理权限核验失败，请稍后重试。',message:''};
 if(!allowed)return {error:'你没有管理权限。',message:''};
 const {error}=await db.rpc('moderate_report',{p_report_id:parsed.data.id,p_action:parsed.data.action,p_reason:parsed.data.reason});
 if(error)return {error:'处理未完成，内容状态可能已变更。请刷新并重试。',message:''};
 revalidatePath('/','layout');revalidatePath(`/moderation/${parsed.data.id}`);return {error:'',message:'处理已完成并记录审计。'};
}
