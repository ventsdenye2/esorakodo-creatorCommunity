import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const localEnv = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith("#"))
  .map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
const url = localEnv.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.equal(url, "http://127.0.0.1:54321", "this test only targets the local API");
assert.ok(anonKey && serviceKey, "local anon and service role keys are required");

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const password = `KtU!${randomUUID()}a`;
const users = [
  { email: `forum-a-${suffix}@example.test`, handle: `forum_a_${suffix}` },
  { email: `forum-b-${suffix}@example.test`, handle: `forum_b_${suffix}` },
];
const createdUserIds = [];
const createdAccountIds = [];
let topicId;

async function listFloors(client) {
  const { data, error } = await client.from("forum_messages")
    .select("id,floor_no,body,reply_to_message_id").eq("topic_id", topicId).order("floor_no");
  assert.ifError(error);
  return data;
}

try {
  for (const user of users) {
    user.client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await user.client.auth.signUp({
      email: user.email, password,
      options: { data: { handle: user.handle, display_name: user.handle } },
    });
    assert.ifError(error);
    assert.ok(data.user?.id);
    user.id = data.user.id;
    createdUserIds.push(user.id);
    if (!data.session) {
      const { error: confirmationError } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
      assert.ifError(confirmationError);
    }
    const { error: loginError } = await user.client.auth.signInWithPassword({ email: user.email, password });
    assert.ifError(loginError);
    const { data: account, error: accountError } = await user.client.from("forum_accounts")
      .insert({ created_by: user.id, handle: `${user.handle}_role`, display_name: `${user.handle} role` })
      .select("id").single();
    assert.ifError(accountError);
    user.accountId = account.id;
    createdAccountIds.push(account.id);
  }
  const [author, other] = users;
  const anonymous = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: topic, error: topicError } = await author.client.from("forum_topics")
    .insert({ creator_id: author.id, title: `Forum QA ${suffix}`, board: "campus" })
    .select("id").single();
  assert.ifError(topicError);
  topicId = topic.id;

  for (const [reader, expected] of [[other.client, 0], [anonymous, 0]]) {
    const { data, error } = await reader.from("forum_topics").select("id").eq("id", topicId);
    assert.ifError(error);
    assert.equal(data.length, expected, "non-owners cannot see draft topics");
  }
  const initial = [
    { forum_account_id: author.accountId, body: "First" },
    { forum_account_id: author.accountId, body: "Second", reply_to_floor_no: 1 },
    { forum_account_id: author.accountId, body: "Third", reply_to_floor_no: 1 },
  ];
  const { error: saveError } = await author.client.rpc("replace_forum_draft_messages", {
    p_topic_id: topicId, p_messages: initial,
  });
  assert.ifError(saveError);
  const first = await listFloors(author.client);
  assert.deepEqual(first.map((floor) => floor.body), ["First", "Second", "Third"]);
  assert.equal(first[1].reply_to_message_id, first[0].id);

  const { data: hidden, error: hiddenError } = await other.client.from("forum_messages")
    .select("id").eq("topic_id", topicId);
  assert.ifError(hiddenError);
  assert.deepEqual(hidden, [], "Creator B cannot see Creator A's draft floors");
  const { error: otherSaveError } = await other.client.rpc("replace_forum_draft_messages", {
    p_topic_id: topicId, p_messages: [],
  });
  assert.equal(otherSaveError?.message, "FORUM_TOPIC_NOT_OWNED");
  const { error: otherPublishError } = await other.client.rpc("publish_forum_topic", { p_topic_id: topicId });
  assert.equal(otherPublishError?.message, "FORUM_TOPIC_NOT_OWNED");
  const { error: borrowedAccountError } = await author.client.rpc("replace_forum_draft_messages", {
    p_topic_id: topicId, p_messages: [{ forum_account_id: other.accountId, body: "Borrowed identity" }],
  });
  assert.equal(borrowedAccountError?.message, "FORUM_ACCOUNT_NOT_OWNED");
  assert.deepEqual((await listFloors(author.client)).map((floor) => floor.body), ["First", "Second", "Third"],
    "rejected replacement must preserve the previous complete draft");

  const reordered = [
    { forum_account_id: author.accountId, body: "Third" },
    { forum_account_id: author.accountId, body: "First" },
    { forum_account_id: author.accountId, body: "Second", reply_to_floor_no: 2 },
  ];
  const { error: reorderError } = await author.client.rpc("replace_forum_draft_messages", {
    p_topic_id: topicId, p_messages: reordered,
  });
  assert.ifError(reorderError);
  let floors = await listFloors(author.client);
  assert.deepEqual(floors.map((floor) => floor.body), ["Third", "First", "Second"]);
  assert.equal(floors[2].reply_to_message_id, floors[1].id, "reply still targets original First floor");

  const { error: removeError } = await author.client.rpc("replace_forum_draft_messages", {
    p_topic_id: topicId,
    p_messages: [{ forum_account_id: author.accountId, body: "First" },
      { forum_account_id: author.accountId, body: "Second", reply_to_floor_no: 1 }],
  });
  assert.ifError(removeError);
  floors = await listFloors(author.client);
  assert.deepEqual(floors.map((floor) => floor.body), ["First", "Second"]);
  assert.equal(floors[1].reply_to_message_id, floors[0].id);

  const { error: publishError } = await author.client.rpc("publish_forum_topic", { p_topic_id: topicId });
  assert.ifError(publishError);
  for (const reader of [other.client, anonymous]) {
    const { data, error } = await reader.from("forum_topics")
      .select("id,status").eq("id", topicId).single();
    assert.ifError(error);
    assert.equal(data.status, "published");
    assert.equal((await listFloors(reader)).length, 2);
  }
  const { error: frozenError } = await author.client.rpc("replace_forum_draft_messages", {
    p_topic_id: topicId, p_messages: [],
  });
  assert.equal(frozenError?.message, "FORUM_TOPIC_NOT_DRAFT");
  assert.equal((await listFloors(author.client)).length, 2);
  console.log("Forum API passed: two Creator draft isolation, RPC ownership, atomic rollback, reordered replies, deletion, anonymous publication, and frozen history.");
} finally {
  if (topicId) {
    assert.match(topicId, /^[0-9a-f-]{36}$/i);
    assert.match(users[0].id, /^[0-9a-f-]{36}$/i);
    // Published rows are immutable even to API service_role; only the local database test runner removes fixtures.
    const sql = `begin;
      do $guard$ begin
        if not exists (select 1 from public.forum_topics where id = '${topicId}'
          and creator_id = '${users[0].id}' and title = 'Forum QA ${suffix}') then
          raise exception 'forum fixture ownership mismatch';
        end if;
      end $guard$;
      set local session_replication_role = replica;
      delete from public.forum_messages where topic_id = '${topicId}';
      delete from public.forum_topic_hashtags where topic_id = '${topicId}';
      delete from public.forum_topics where id = '${topicId}'; commit;`;
    execFileSync("docker", ["exec", "supabase_db_ktu-community", "psql", "-U", "postgres", "-d", "postgres",
      "-v", "ON_ERROR_STOP=1", "-c", sql], { stdio: "pipe" });
  }
  for (const id of createdAccountIds) {
    const { error } = await admin.from("forum_accounts").delete().eq("id", id);
    assert.ifError(error);
  }
  for (const id of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    assert.ifError(error);
  }
}
