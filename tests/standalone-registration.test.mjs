import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";

async function withServer(registration, run) {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const env = { ...process.env, HOST: "127.0.0.1", PORT: String(port), NODE_ENV: "production" };
  delete env.KTU_REGISTRATION_ENABLED;
  if (registration !== undefined) env.KTU_REGISTRATION_ENABLED = registration;
  const child = spawn(process.execPath, [fileURLToPath(new URL("../dist/standalone/server.js", import.meta.url))], {
    env, stdio: "ignore", windowsHide: true,
  });
  const exited = once(child, "exit");
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error("Standalone exited before readiness");
      try {
        const response = await fetch(`${base}/login`);
        if (response.status === 200) { ready = true; break; }
      } catch { /* Startup has not bound its port yet. */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, "Standalone did not become ready");
    await run(base);
  } finally {
    child.kill();
    await exited;
  }
}

test("restricted registration rejects a stale form submission while login remains available", async () => {
  let action;
  await withServer(undefined, async base => {
    const response = await fetch(`${base}/register`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /建立 Creator 档案/);
    action = html.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
    assert.ok(action, "Default configuration must preserve registration");
  });

  await withServer("false", async base => {
    const register = await fetch(`${base}/register`);
    assert.equal(register.status, 200);
    const html = await register.text();
    assert.match(html, /暂未开放注册/);
    assert.doesNotMatch(html, /name="email"|name="\$ACTION_ID_/);

    // A form loaded before the switch must also be rejected by the action.
    // Invalid fields guarantee this test never creates an account on failure.
    const stale = new FormData();
    stale.set(action, "");
    stale.set("email", "invalid-address");
    const response = await fetch(`${base}/register`, { method: "POST", body: stale, redirect: "manual" });
    assert.equal(response.status, 303);
    const target = new URL(response.headers.get("location"), base);
    assert.equal(target.pathname, "/register");
    assert.match(target.searchParams.get("error") ?? "", /受限测试阶段/);

    const login = await (await fetch(`${base}/login`)).text();
    const loginAction = login.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
    assert.ok(loginAction, "Login form must remain available");
    const invalidLogin = new FormData();
    invalidLogin.set(loginAction, "");
    invalidLogin.set("email", "invalid-address");
    invalidLogin.set("password", "short");
    const result = await fetch(`${base}/login`, { method: "POST", body: invalidLogin, redirect: "manual" });
    assert.equal(result.status, 303);
    assert.equal(new URL(result.headers.get("location"), base).pathname, "/login");
  });
});
