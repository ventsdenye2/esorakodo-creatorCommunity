import assert from "node:assert/strict";
import test from "node:test";
import { safeNextPath } from "../src/features/auth/safe-next.mjs";

const origin = "https://campus.kongtian.university";

test("confirmation redirect stays on the configured site", () => {
  for (const value of [null, "https://other.example/path", "//other.example", "///other.example", "/\\other.example", "/wiki\\other.example"]) {
    assert.equal(safeNextPath(value, origin), "/creator");
  }
  assert.equal(safeNextPath("/wiki/student/lin?tab=history#revision", origin), "/wiki/student/lin?tab=history#revision");
  assert.equal(safeNextPath("/%2Fother.example", origin), "/%2Fother.example");
});
