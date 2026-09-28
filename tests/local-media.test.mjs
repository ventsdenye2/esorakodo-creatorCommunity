// Requires local Supabase and the official MinIO image. All credentials stay in
// memory; the app and object store bind only loopback, and fixtures are removed.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";
import { signUpload, verifyObject } from "../src/features/media/storage.ts";

const suffix = randomUUID().slice(0,8);
const container = `ktu-media-test-${suffix}`;
const endpoint = "http://127.0.0.1:19000";
const appUrl = "http://127.0.0.1:3005";
const image = "quay.io/minio/minio:RELEASE.2025-04-22T22-12-26Z";
const credentials = { accessKeyId:`test${suffix}`, secretAccessKey:randomUUID() };
const rawEnv = await readFile(new URL("../.env.local", import.meta.url),"utf8");
const env = Object.fromEntries(rawEnv.split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1).replace(/^"|"$/g,"")];}));
assert.equal(env.NEXT_PUBLIC_SUPABASE_URL,"http://127.0.0.1:54321","local database only");
const status = process.platform === "win32"
 ? execFileSync(process.env.ComSpec ?? "cmd.exe",["/d","/s","/c","npx --yes supabase status -o env"],{encoding:"utf8",stdio:["ignore","pipe","pipe"]})
 : execFileSync("npx",["--yes","supabase","status","-o","env"],{encoding:"utf8",stdio:["ignore","pipe","pipe"]});
const serviceKey = status.match(/^SERVICE_ROLE_KEY="([^"]+)"/m)?.[1];
assert.ok(serviceKey,"local service key available in memory");
const testEnv = {...env,R2_ENDPOINT:endpoint,R2_BUCKET:"ktu-media-test",R2_ACCESS_KEY_ID:credentials.accessKeyId,R2_SECRET_ACCESS_KEY:credentials.secretAccessKey,R2_FORCE_PATH_STYLE:"true",SUPABASE_SERVICE_ROLE_KEY:serviceKey};
Object.assign(process.env,testEnv);
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,serviceKey,{auth:{persistSession:false}});
const userIds=[];let server;let started=false;
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=","base64");
async function waitFor(url) {for(let i=0;i<90;i++){try{const r=await fetch(url);if(r.status<500)return;}catch{/* Service is still starting. */} await new Promise(resolve=>setTimeout(resolve,500));}throw new Error("Local test service did not start");}
async function post(path,cookie,body,origin=appUrl) {return fetch(`${appUrl}${path}`,{method:"POST",headers:{origin,"Content-Type":"application/json",...(cookie?{cookie}:{})},body:JSON.stringify(body)});}
async function viewer(id,cookie) {return fetch(`${appUrl}/api/media/${id}`,{headers:cookie?{cookie}:{},redirect:"manual"});}
try {
 execFileSync("docker",["run","--rm","-d","--name",container,"-p","127.0.0.1:19000:9000","--tmpfs","/data","-e",`MINIO_ROOT_USER=${credentials.accessKeyId}`,"-e",`MINIO_ROOT_PASSWORD=${credentials.secretAccessKey}`,image,"server","/data"],{stdio:["ignore","pipe","pipe"]});started=true;
 await waitFor(`${endpoint}/minio/health/live`);
 const s3=new S3Client({endpoint,region:"auto",forcePathStyle:true,credentials,requestChecksumCalculation:"WHEN_REQUIRED"});
 await s3.send(new CreateBucketCommand({Bucket:testEnv.R2_BUCKET}));
 // Exercise the deployment runtime; no shared .dev.vars or preview settings.
 server=spawn(process.execPath,["dist/standalone/server.js"],{cwd:new URL("..",import.meta.url),env:{...process.env,...testEnv,PORT:"3005",HOST:"127.0.0.1"},windowsHide:true,stdio:"ignore"});
 await waitFor(`${appUrl}/api/media/invalid`);
 const users=[];
 for(const n of [1,2]) {
  const email=`media-${suffix}-${n}@example.test`;const password=`KtU!${randomUUID()}`;
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{handle:`media_${suffix}_${n}`}});assert.ifError(error);userIds.push(data.user.id);
  const cookieJar=new Map();const auth=createServerClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...cookieJar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>cookieJar.set(name,value))}});
  assert.ifError((await auth.auth.signInWithPassword({email,password})).error);
  users.push({id:data.user.id,cookie:[...cookieJar].map(([k,v])=>`${k}=${v}`).join("; "),auth});
 }
 const request={filename:"campus.png",mimeType:"image/png",byteSize:png.length};
 assert.equal((await post("/api/media/upload",null,request)).status,401);
 assert.equal((await post("/api/media/upload",users[0].cookie,request,"https://unrelated.invalid")).status,403);
 assert.equal((await post("/api/media/complete",null,{id:randomUUID()})).status,401);
 assert.equal((await post("/api/media/complete",users[0].cookie,{id:randomUUID()},"https://unrelated.invalid")).status,403);
 const start=await post("/api/media/upload",users[0].cookie,request);assert.equal(start.status,200);const reservation=await start.json();
 const signed=new URL(reservation.uploadUrl);
 assert.match(signed.searchParams.get("X-Amz-SignedHeaders"),/if-none-match/);
 assert.match(signed.searchParams.get("X-Amz-SignedHeaders"),/content-type/);
 assert.equal(signed.searchParams.has("x-amz-checksum-crc32"),false);
 assert.equal((await viewer(reservation.id,users[0].cookie)).status,404,"pending unreadable");
 const wrongMime=await fetch(reservation.uploadUrl,{method:"PUT",headers:{...reservation.headers,"Content-Type":"image/jpeg"},body:png});assert.equal(wrongMime.status,403,"MIME header signed");
 const uploaded=await fetch(reservation.uploadUrl,{method:"PUT",headers:reservation.headers,body:png});assert.equal(uploaded.status,200);
 assert.equal((await fetch(reservation.uploadUrl,{method:"PUT",headers:reservation.headers,body:png})).status,412,"overwrite rejected");
 assert.equal((await post("/api/media/complete",users[1].cookie,{id:reservation.id})).status,404,"other creator cannot complete");
 assert.equal((await post("/api/media/complete",users[0].cookie,{id:reservation.id})).status,200);
 const ownerRead=await viewer(reservation.id,users[0].cookie);assert.equal(ownerRead.status,302);assert.match(ownerRead.headers.get("cache-control"),/no-store/);
 const objectRead=await fetch(ownerRead.headers.get("location"));assert.equal(objectRead.status,200);assert.deepEqual(Buffer.from(await objectRead.arrayBuffer()),png);
 assert.equal((await viewer(reservation.id)).status,404,"unattached asset private");
 assert.equal((await viewer(reservation.id,users[1].cookie)).status,404,"other creator cannot read private asset");
 // Public/hidden work behavior is covered by rolled-back pgTAP fixtures. This
 // integration test deliberately creates no published content on the campus.
 // Magic-byte and length failures are checked against actual object-store HEAD/GET.
 const badStart=await post("/api/media/upload",users[0].cookie,{...request,filename:"fake.png"});assert.equal(badStart.status,200);const bad=await badStart.json();
 assert.equal((await fetch(bad.uploadUrl,{method:"PUT",headers:bad.headers,body:Buffer.alloc(png.length,65)})).status,200);
 assert.equal((await post("/api/media/complete",users[0].cookie,{id:bad.id})).status,400,"fake PNG rejected");
 await assert.rejects(()=>verifyObject(`${users[0].id}/${reservation.id}`,"image/png",png.length+1),/MEDIA_MISMATCH/);
 // Empty checksum configuration and conditional write are also validated outside handlers.
 const direct=await signUpload("direct.png","image/png",png.length);
 assert.equal((await fetch(direct,{method:"PUT",headers:{"Content-Type":"image/png","If-None-Match":"*"},body:png})).status,200);
 await verifyObject("direct.png","image/png",png.length);
 console.log("PASS: local S3 presign/upload/overwrite/MIME/HEAD/magic and authenticated private media lifecycle; no works published.");
} finally {
 if(server)server.kill();
 for(const id of userIds){assert.ifError((await admin.from("media_assets").delete().eq("uploader_id",id)).error);assert.ifError((await admin.auth.admin.deleteUser(id)).error);}
 if(started)execFileSync("docker",["rm","-f",container],{stdio:["ignore","pipe","pipe"]});
}
