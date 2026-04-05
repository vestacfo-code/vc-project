#!/usr/bin/env node
/**
 * Collapse invalid Tailwind classes like border-vesta-navy/10/90 → border-vesta-navy/90
 * (produced when a shade already had opacity, e.g. border-slate-200/90).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

/** Prefix may include variant colons, brackets, and hyphens (e.g. hover:border-vesta-navy). */
const RE =
  /([a-zA-Z0-9_\[\]&*.,():#%\-]*vesta-(?:navy-muted|navy|gold|mist|cream))((?:\/[0-9.]+)+)\b/g;

function fix(content) {
  return content.replace(RE, (full, name, opacities) => {
    const segments = opacities.split("/").filter(Boolean);
    if (segments.length <= 1) return full;
    return `${name}/${segments[segments.length - 1]}`;
  });
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith(".")) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|css)$/.test(name.name) && !name.name.endsWith(".test.ts") && !name.name.endsWith(".test.tsx"))
      acc.push(p);
  }
  return acc;
}

let changed = 0;
const files = fs.existsSync(path.join(ROOT, "src")) ? walk(path.join(ROOT, "src")) : [];
if (fs.existsSync(path.join(ROOT, "src", "index.css"))) files.push(path.join(ROOT, "src", "index.css"));

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const after = fix(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
  }
}

console.log(`fix-vesta-double-opacity: updated ${changed} file(s)`);
