"use server";
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {createClient} from '../../lib/supabase/server';
import {workKinds,type InteractionState} from './types';
const schema=z.object({kind:z.enum(workKinds),id:z.uuid(),action:z.enum(['like','bookmark','comment','report','remove']),body:z.string().max(2000)});
export async function interact(_:InteractionState,form:FormData):Promise<InteractionState>{
 const parsed=schema.safeParse({kind:form.get('kind'),id:form.get('id'),action:form.get('action'),body:form.get('body')??''});
 if(!parsed.success)return {error:'操作信息无效，请重新打开页面。',message:''};
 const {kind,id,action,body}=parsed.data;
 if(action==='report' && (body.trim().length<5||body.length>1000))return {error:'请填写5至1000字的举报原因。',message:''};
 if(action==='comment'&&!body.trim())return {error:'请先填写评论内容。',message:''};
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return {error:'请先登录后再操作。',message:''};
 const result=action==='report'?await db.rpc('report_work',{p_kind:kind,p_id:id,p_reason:body}):action==='remove'?await db.rpc('remove_work_comment',{p_id:id}):await db.rpc('interact_work',{p_kind:kind,p_id:id,p_action:action,p_body:body});
 if(result.error)return {error:result.error.message.includes('RATE_LIMIT')?'操作较频繁，请稍后再试。':'操作未完成，内容可能已不可用，请刷新后重试。',message:''};
 revalidatePath('/', 'layout');
 return {error:'',message:action==='report'?'举报已提交。':action==='comment'?'评论已发布。':action==='remove'?'评论已移除。':'已更新。'};
}
