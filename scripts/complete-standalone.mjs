import { cpSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceModules = path.join(root, "node_modules");
const targetModules = path.join(root, "dist", "standalone", "node_modules");
const rootPackage = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

if (!existsSync(targetModules)) {
  throw new Error("No standalone output found. Run vinext build first.");
}

// Vinext's standalone emitter currently omits React peer dependencies.
// Copy runtime packages from npm ci's locked installation, including transitives.
const pending = Object.keys(rootPackage.dependencies);
const visited = new Set();

while (pending.length > 0) {
  const name = pending.shift();
  if (visited.has(name)) continue;
  visited.add(name);

  const source = path.join(sourceModules, name);
  const target = path.join(targetModules, name);
  if (!existsSync(source)) {
    throw new Error(`Missing installed runtime dependency: ${name}`);
  }

  const manifest = JSON.parse(readFileSync(path.join(source, "package.json"), "utf8"));
  if (!existsSync(target)) {
    cpSync(source, target, {
      recursive: true,
      dereference: true,
      filter: (entry) => !path.relative(source, entry).split(path.sep).includes("node_modules"),
    });
  }

  pending.push(...Object.keys(manifest.dependencies ?? {}));
  for (const optional of Object.keys(manifest.optionalDependencies ?? {})) {
    if (existsSync(path.join(sourceModules, optional))) pending.push(optional);
  }
}

console.log(`Standalone runtime dependencies complete (${visited.size} packages).`);
