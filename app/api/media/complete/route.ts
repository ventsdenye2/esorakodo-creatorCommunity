import { z } from "zod";
import { createClient } from "../../../../src/lib/supabase/server";
import { mediaConfigured, verifyObject } from "../../../../src/features/media/storage";
import { sameOrigin, createMediaAdmin } from "../../../../src/features/media/server";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"请求来源无效。"},{status:403});
  if (!mediaConfigured()) return Response.json({error:"图片服务暂未开放。"},{status:503});
  const parsed=z.object({id:z.uuid()}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return Response.json({error:"图片编号无效。"},{status:400});
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user)return Response.json({error:"请先登录。"},{status:401});
  const {data:asset}=await db.from("media_assets").select("*").eq("id",parsed.data.id).eq("uploader_id",user.id).maybeSingle();
  if(!asset || asset.status==='hidden')return Response.json({error:"图片不存在或无权访问。"},{status:404});
  if(asset.status==='ready')return Response.json({id:asset.id,url:`/api/media/${asset.id}`});
  try {
    await verifyObject(asset.object_key,asset.mime_type,asset.byte_size);
    const admin=createMediaAdmin();const {data:completed,error}=await admin.from("media_assets").update({status:'ready'}).eq("id",asset.id).eq("status","pending").select("id").maybeSingle();
    if(error || !completed)throw error ?? new Error("MEDIA_STATE_CHANGED");
    return Response.json({id:asset.id,url:`/api/media/${asset.id}`});
  } catch {return Response.json({error:"图片校验未通过，请确认上传已完成，且文件格式和大小正确。"},{status:400});}
}
