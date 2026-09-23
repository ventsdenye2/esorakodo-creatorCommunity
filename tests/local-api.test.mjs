import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const localEnv = Object.fromEntries(
  envText.split(/\r?\n/).filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const url = localEnv.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.equal(url, "http://127.0.0.1:54321", "this test only targets the local API");
assert.ok(anonKey && serviceKey, "local anon and service role keys are required");

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const password = `KtU!${randomUUID()}a`;
const slug = `api-${suffix}`;
const users = [
  { email: `api-a-${suffix}@example.test`, handle: `api_a_${suffix}` },
  { email: `api-b-${suffix}@example.test`, handle: `api_b_${suffix}` },
];
const createdUserIds = [];
let studentId;

try {
  for (const entry of users) {
    entry.client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await entry.client.auth.signUp({
      email: entry.email,
      password,
      options: { data: { handle: entry.handle, display_name: entry.handle } },
    });
    assert.ifError(error);
    assert.ok(data.user?.id, "signup returned an Auth user");
    entry.id = data.user.id;
    createdUserIds.push(entry.id);

    if (!data.session) {
      const { error: confirmationError } = await admin.auth.admin.updateUserById(entry.id, {
        email_confirm: true,
      });
      assert.ifError(confirmationError);
    }
    const { error: loginError } = await entry.client.auth.signInWithPassword({
      email: entry.email,
      password,
    });
    assert.ifError(loginError);
  }

  const [author, contributor] = users;
  const { data: profile, error: profileError } = await author.client
    .from("profiles").select("handle").eq("id", author.id).single();
  assert.ifError(profileError);
  assert.equal(profile.handle, author.handle);

  const { data: otherUpdate, error: otherUpdateError } = await contributor.client
    .from("profiles").update({ bio: "unauthorized" }).eq("id", author.id).select("id");
  assert.ifError(otherUpdateError);
  assert.deepEqual(otherUpdate, [], "Creator B cannot update Creator A's profile");

  const { data: created, error: createError } = await author.client.rpc("create_wiki_entity", {
    p_entity_type: "student",
    p_slug: slug,
    p_name: "API 测试学生",
  });
  assert.ifError(createError);
  assert.equal(created.version, 1);
  studentId = created.id;

  const { data: edited, error: editError } = await contributor.client.rpc("apply_wiki_revision", {
    p_entity_type: "student",
    p_entity_id: studentId,
    p_expected_version: 1,
    p_patch: { summary: "另一位 Creator 的补充" },
    p_summary: "API 共同编辑测试",
  });
  assert.ifError(editError);
  assert.equal(edited.version, 2);

  const { error: conflictError } = await author.client.rpc("apply_wiki_revision", {
    p_entity_type: "student",
    p_entity_id: studentId,
    p_expected_version: 1,
    p_patch: { name: "过期覆盖" },
    p_summary: "应当冲突",
  });
  assert.equal(conflictError?.message, "WIKI_VERSION_CONFLICT");

  const { data: revisions, error: revisionsError } = await author.client
    .from("wiki_revisions").select("editor_id, snapshot")
    .eq("entity_type", "student").eq("entity_id", studentId);
  assert.ifError(revisionsError);
  assert.equal(revisions.length, 2);
  assert.ok(revisions.some((revision) => revision.editor_id === contributor.id));

  const anonymous = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: deniedError } = await anonymous.rpc("create_wiki_entity", {
    p_entity_type: "college", p_slug: `denied-${suffix}`, p_name: "拒绝创建",
  });
  assert.equal(deniedError?.code, "42501");

  console.log("Local API integration passed: signup, login, Profile RLS, Wiki RPC, conflict, and anonymous denial.");
} finally {
  if (studentId) {
    const { error: revisionCleanupError } = await admin.from("wiki_revisions")
      .delete().eq("entity_type", "student").eq("entity_id", studentId);
    assert.ifError(revisionCleanupError);
    const { error: studentCleanupError } = await admin.from("students")
      .delete().eq("id", studentId);
    assert.ifError(studentCleanupError);
  }
  for (const userId of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    assert.ifError(error);
  }
}
