"use server";
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {createClient} from '../../lib/supabase/server';
export async function saveProfile(_: {error:string;message:string},form:FormData){
 const parsed=z.object({display_name:z.string().trim().min(1).max(60),bio:z.string().trim().max(1000),avatar_asset_id:z.uuid().nullable()}).safeParse({display_name:form.get('display_name'),bio:form.get('bio'),avatar_asset_id:form.get('avatar_asset_id')||null});
 if(!parsed.success)return {error:'请填写1至60字的显示名称，简介最多1000字。',message:''};
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return {error:'请先登录后保存。',message:''};
 const {error}=await db.from('profiles').update(parsed.data).eq('id',user.id);if(error)return {error:'保存失败，请稍后重试。',message:''};
 revalidatePath('/creator','layout');return {error:'',message:'个人资料已保存。'};
}
