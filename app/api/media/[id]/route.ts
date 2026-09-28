import { z } from "zod";
import { createClient } from "../../../../src/lib/supabase/server";
import { isSupabaseConfigured } from "../../../../src/lib/supabase/config";
import { mediaConfigured, signRead } from "../../../../src/features/media/storage";
export async function GET(_request: Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!z.uuid().safeParse(id).success || !isSupabaseConfigured() || !mediaConfigured())return new Response(null,{status:404});
  const db=await createClient();
  const {data:asset}=await db.from("media_assets").select("object_key,status").eq("id",id).maybeSingle();
  if(!asset || asset.status!=='ready')return new Response(null,{status:404});
  try {return new Response(null,{status:302,headers:{Location:await signRead(asset.object_key),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
  catch{return new Response(null,{status:503});}
}
