import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:3000";
const paths = ["/", "/login", "/forum", "/wiki", "/images/ktu-university-seal.png"];

for (const pathname of paths) {
  const response = await fetch(new URL(pathname, base), { redirect: "manual" });
  assert.equal(response.status, 200, `${pathname}: expected HTTP 200`);
  console.log(`${pathname}: ${response.status} ${response.headers.get("content-type")}`);
}

const login = await (await fetch(new URL("/login", base))).text();
const action = login.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
assert.ok(action, "login Server Action input missing");

const form = new FormData();
form.set(action, "");
form.set("email", "invalid-address");
form.set("password", "short");
const response = await fetch(new URL("/login", base), {
  method: "POST",
  body: form,
  redirect: "manual",
});
assert.equal(response.status, 303, "invalid login should redirect with a validation error");
const redirect = new URL(response.headers.get("location"), base);
assert.equal(redirect.pathname, "/login");
assert.ok(redirect.searchParams.get("error"));
console.log(`POST /login: ${response.status} (validation redirect)`);
