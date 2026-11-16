import { z } from "zod";
import { createClient } from "../../../../src/lib/supabase/server";
import { isSupabaseConfigured } from "../../../../src/lib/supabase/config";
import { mediaConfigured, signRead } from "../../../../src/features/media/storage";
export async function GET(request: Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!z.uuid().safeParse(id).success || !isSupabaseConfigured() || !mediaConfigured())return new Response(null,{status:404});
  const db=await createClient();
  const {data:asset}=await db.from("media_assets").select("object_key,status,mime_type,byte_size").eq("id",id).maybeSingle();
  if(!asset || asset.status!=='ready')return new Response(null,{status:404});
  try {
    if (new URL(request.url).searchParams.get("export") === "1") {
      if (!['image/png','image/jpeg','image/webp'].includes(asset.mime_type) || asset.byte_size > 10485760) return new Response(null,{status:400});
      const object = await fetch(await signRead(asset.object_key), { redirect: "error", signal: AbortSignal.timeout(20000) });
      if (!object.ok || Number(object.headers.get("content-length")) > 10485760) { await object.body?.cancel(); return new Response(null,{status:503}); }
      return new Response(object.body, {headers:{'Content-Type':asset.mime_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
    }
    return new Response(null,{status:302,headers:{Location:await signRead(asset.object_key),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  catch{return new Response(null,{status:503});}
}
