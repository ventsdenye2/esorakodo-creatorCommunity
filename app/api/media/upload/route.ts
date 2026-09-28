import { z } from "zod";
import { createClient } from "../../../../src/lib/supabase/server";
import { mediaConfigured, signUpload } from "../../../../src/features/media/storage";
import { sameOrigin } from "../../../../src/features/media/server";
const input = z.object({ filename:z.string().trim().min(1).max(180), mimeType:z.enum(["image/jpeg","image/png","image/webp"]), byteSize:z.number().int().min(1).max(10485760) });
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"请求来源无效。"},{status:403});
  if (!mediaConfigured()) return Response.json({error:"图片上传暂未开放，请先保存文字内容。"},{status:503});
  const parsed = input.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return Response.json({error:"请选择不超过10MB的JPEG、PNG或WebP图片。"},{status:400});
  const db = await createClient();
  const {data:{user}} = await db.auth.getUser();
  if (!user) return Response.json({error:"请先登录。"},{status:401});
  const {data:id,error} = await db.rpc("reserve_media",{p_filename:parsed.data.filename,p_mime_type:parsed.data.mimeType,p_byte_size:parsed.data.byteSize});
  if (error || !id) return Response.json({error:"无法申请上传，请检查今日上传数量或稍后再试。"},{status:400});
  const {data:asset} = await db.from("media_assets").select("object_key").eq("id",id).single();
  if (!asset) return Response.json({error:"无法读取上传记录。"},{status:500});
  try {
    return Response.json({id,uploadUrl:await signUpload(asset.object_key,parsed.data.mimeType,parsed.data.byteSize),headers:{"Content-Type":parsed.data.mimeType,"If-None-Match":"*"}},{headers:{"Cache-Control":"no-store"}});
  } catch {return Response.json({error:"图片服务暂时不可用，请稍后重试。"},{status:503});}
}
