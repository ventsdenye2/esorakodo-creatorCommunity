import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicConfig, isSupabaseConfigured } from './src/lib/supabase/config';

// Refresh cookies at the request boundary; Server Components cannot reliably
// persist refreshed sessions. Actual authorization remains in RLS and actions.
export async function middleware(request: NextRequest) {
  let response=NextResponse.next({request});
  if(!isSupabaseConfigured() || !request.cookies.getAll().some(cookie=>cookie.name.startsWith('sb-')))return response;
  const {url,anonKey}=getSupabasePublicConfig();
  const supabase=createServerClient(url,anonKey,{cookies:{
    getAll(){return request.cookies.getAll();},
    setAll(cookies){
      cookies.forEach(({name,value})=>request.cookies.set(name,value));
      response=NextResponse.next({request});
      cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    },
  }});
  try {await supabase.auth.getUser();} catch { /* Page/actions still validate identity; do not trust a stale token. */ }
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|images/|favicon.ico|icon.png).*)']};
