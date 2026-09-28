import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const envText=await readFile(new URL('../.env.local',import.meta.url),'utf8');
const localEnv=Object.fromEntries(envText.split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),line.slice(at+1)];}));
const url=localEnv.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(url,'http://127.0.0.1:54321','session test only runs against local Supabase');
const site=process.env.KTU_TEST_SITE_URL??'http://127.0.0.1:3001';
assert.ok(['127.0.0.1','localhost'].includes(new URL(site).hostname),'local app only');
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY,'local service key required');
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const client=createClient(url,localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const suffix=randomUUID().replaceAll('-','').slice(0,10);const email=`session-${suffix}@example.test`;const password=`KtU!${randomUUID()}x`;let userId;
try{
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{handle:`session_${suffix}`,display_name:'Session QA'}});assert.ifError(created.error);userId=created.data.user.id;
 const signed=await client.auth.signInWithPassword({email,password});assert.ifError(signed.error);assert.ok(signed.data.session);
 const expired={...signed.data.session,expires_at:Math.floor(Date.now()/1000)-60};
 const value='base64-'+Buffer.from(JSON.stringify(expired)).toString('base64url');
 const key=`sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
 const response=await fetch(new URL('/creator',site),{headers:{Cookie:`${key}=${value}`},redirect:'manual'});
 assert.equal(response.status,200,'stale metadata should refresh rather than log out');
 const html=await response.text();assert.match(html,/Session QA/);
 assert.ok(response.headers.getSetCookie().some(cookie=>cookie.startsWith(key)), 'refreshed session must be persisted in response cookies');
 assert.match(response.headers.get('cache-control')??'',/private/);
 const anonymous=await fetch(new URL('/creator',site),{redirect:'manual'});assert.ok([303,307].includes(anonymous.status));assert.match(anonymous.headers.get('location')??'',/\/login/);
 console.log('Local SSR session refresh, cookie persistence, private caching and anonymous redirect: passed.');
}finally{if(userId){const removed=await admin.auth.admin.deleteUser(userId);assert.ifError(removed.error);}}
