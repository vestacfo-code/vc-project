/**
 * Wrap each Edge function's serve() call with sentryServe.
 * Run: node scripts/wrap-sentry-edge-functions.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("supabase/functions");
const IMPORT_LINE = `import { sentryServe } from "../_shared/sentry-edge.ts";\n`;

function insertImport(content, slug) {
  if (content.includes("sentry-edge.ts")) return content;
  if (content.startsWith("// @ts-nocheck")) {
    const nl = content.indexOf("\n");
    const rest = content.slice(nl + 1);
    // Preserve optional xhr side-effect import first
    if (rest.startsWith('import "')) {
      const m = rest.match(/^import "[^"]+";?\r?\n/);
      if (m) {
        return content.slice(0, nl + 1) + m[0] + IMPORT_LINE + rest.slice(m[0].length);
      }
    }
    return content.slice(0, nl + 1) + IMPORT_LINE + rest;
  }
  if (content.startsWith('import "')) {
    const m = content.match(/^import "[^"]+";?\r?\n/);
    if (m) {
      return m[0] + IMPORT_LINE + content.slice(m[0].length);
    }
  }
  return IMPORT_LINE + content;
}

function transform(content, slug) {
  let s = insertImport(content, slug);
  s = s.replace(
    /serve\(async \(req((?:: Request)?)\)((?:: Promise<Response>)?) => \{/g,
    (_m, g1, g2) =>
      `serve(sentryServe("${slug}", async (req${g1})${g2} => {`,
  );
  s = s.replace(/\bserve\(handler\)\s*;/g, `serve(sentryServe("${slug}", handler));`);
  return s;
}

for (const name of fs.readdirSync(root)) {
  const dir = path.join(root, name);
  if (!fs.statSync(dir).isDirectory()) continue;
  const p = path.join(dir, "index.ts");
  if (!fs.existsSync(p)) continue;
  const raw = fs.readFileSync(p, "utf8");
  if (!raw.includes("serve(")) continue;
  if (raw.includes("sentryServe(")) continue;
  const next = transform(raw, name);
  if (next === raw) {
    console.warn("No replacement applied:", name);
    continue;
  }
  fs.writeFileSync(p, next);
  console.log("Updated", name);
}
