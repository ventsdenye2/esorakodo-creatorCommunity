import "server-only";
import { AwsV4Signer } from "aws4fetch";

export function mediaConfigured() {
  return Boolean(process.env.R2_ENDPOINT && process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function objectUrl(key: string) {
  if (!mediaConfigured()) throw new Error("MEDIA_UNAVAILABLE");
  const url = new URL(process.env.R2_ENDPOINT!);
  const bucket = process.env.R2_BUCKET!;
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("MEDIA_CONFIGURATION");
  if (!key || key.split("/").some(part => !part || part === "." || part === "..")) throw new Error("MEDIA_OBJECT_KEY");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))) throw new Error("MEDIA_CONFIGURATION");
  const path = key.split("/").map(part => encodeURIComponent(part)).join("/");
  if (process.env.R2_FORCE_PATH_STYLE === "true") url.pathname = `/${bucket}/${path}`;
  else { url.hostname = `${bucket}.${url.hostname}`; url.pathname = `/${path}`; }
  return url;
}

// Web Crypto and fetch keep Node standalone and Worker builds on one SigV4 path.
async function presign(key: string, method: string, headers: Record<string, string> = {}, expires = 60, query: Record<string, string> = {}) {
  const url = objectUrl(key);
  url.searchParams.set("X-Amz-Expires", String(expires));
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
  const signed = await new AwsV4Signer({
    url: url.toString(), method, headers, service: "s3", region: "auto", signQuery: true,
    allHeaders: true,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  }).sign();
  return signed.url.toString();
}

export async function signUpload(key: string, mime: string, size: number) {
  return presign(key, "PUT", { "Content-Type": mime, "Content-Length": String(size), "If-None-Match": "*" }, 300);
}

export async function signRead(key: string) {
  return presign(key, "GET", {}, 60, { "response-content-disposition": "inline", "response-cache-control": "private, max-age=30" });
}

export async function verifyObject(key: string, mime: string, size: number) {
  const head = await fetch(await presign(key, "HEAD"), { method: "HEAD", redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!head.ok || Number(head.headers.get("Content-Length")) !== size || head.headers.get("Content-Type") !== mime) throw new Error("MEDIA_MISMATCH");
  const range = { Range: "bytes=0-15" };
  const object = await fetch(await presign(key, "GET", range), { headers: range, redirect: "error", signal: AbortSignal.timeout(15000) });
  if (object.status !== 206 || Number(object.headers.get("Content-Length")) > 16) {
    await object.body?.cancel();
    throw new Error("MEDIA_RANGE");
  }
  const bytes = new Uint8Array(await object.arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  const text = new TextDecoder("ascii");
  const valid = mime === "image/png" ? bytes.length >= 8 && png.every((value, index) => bytes[index] === value)
    : mime === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === "image/webp" && text.decode(bytes.subarray(0, 4)) === "RIFF" && text.decode(bytes.subarray(8, 12)) === "WEBP";
  if (!valid) throw new Error("MEDIA_SIGNATURE");
}
