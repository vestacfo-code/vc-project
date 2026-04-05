#!/usr/bin/env node
/**
 * Replaces generic Tailwind slate/gray/zinc utilities and common off-brand
 * arbitrary hex classes with Vesta brand tokens (see BRAND_KIT.md).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

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

/** @type {{ re: RegExp; to: string }[]} */
const RULES = [];

function addSlatePrefix(prefix, fromShade, toToken) {
  const esc = String(fromShade).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  RULES.push({
    re: new RegExp(`\\b${prefix}-slate-${esc}(\\/[0-9.]+)?\\b`, "g"),
    to: `${toToken}$1`,
  });
}

const textMap = [
  ["950", "text-vesta-navy"],
  ["900", "text-vesta-navy"],
  ["800", "text-vesta-navy"],
  ["700", "text-vesta-navy/90"],
  ["600", "text-vesta-navy/80"],
  ["500", "text-vesta-navy/65"],
  ["400", "text-vesta-navy-muted"],
  ["300", "text-vesta-navy/60"],
  ["200", "text-vesta-navy/50"],
];
for (const [shade, token] of textMap) addSlatePrefix("text", shade, token);

const bgMap = [
  ["950", "bg-vesta-navy"],
  ["900", "bg-vesta-navy"],
  ["800", "bg-vesta-navy-muted/30"],
  ["700", "bg-vesta-navy-muted/25"],
  ["600", "bg-vesta-navy-muted/20"],
  ["500", "bg-vesta-navy-muted/15"],
  ["200", "bg-vesta-mist/50"],
  ["100", "bg-vesta-mist/40"],
  ["50", "bg-vesta-mist/25"],
];
for (const [shade, token] of bgMap) addSlatePrefix("bg", shade, token);

const borderMap = [
  ["800", "border-vesta-navy/25"],
  ["700", "border-vesta-navy/20"],
  ["600", "border-vesta-navy/18"],
  ["500", "border-vesta-navy/15"],
  ["400", "border-vesta-navy/12"],
  ["300", "border-vesta-navy/15"],
  ["200", "border-vesta-navy/10"],
  ["100", "border-vesta-navy/8"],
  ["50", "border-vesta-mist/50"],
];
for (const [shade, token] of borderMap) addSlatePrefix("border", shade, token);

const ringMap = [
  ["500", "ring-vesta-navy/20"],
  ["400", "ring-vesta-navy/18"],
  ["300", "ring-vesta-navy/20"],
  ["200", "ring-vesta-navy/15"],
  ["100", "ring-vesta-navy/10"],
];
for (const [shade, token] of ringMap) addSlatePrefix("ring", shade, token);

const divideMap = [
  ["300", "divide-vesta-navy/15"],
  ["200", "divide-vesta-navy/10"],
  ["100", "divide-vesta-navy/8"],
];
for (const [shade, token] of divideMap) addSlatePrefix("divide", shade, token);

const strokeMap = [
  ["600", "stroke-vesta-navy/80"],
  ["500", "stroke-vesta-navy/65"],
  ["400", "stroke-vesta-navy-muted"],
  ["300", "stroke-vesta-navy/40"],
  ["200", "stroke-vesta-mist"],
];
for (const [shade, token] of strokeMap) addSlatePrefix("stroke", shade, token);

const fillMap = [
  ["900", "fill-vesta-navy"],
  ["800", "fill-vesta-navy"],
  ["600", "fill-vesta-navy-muted"],
  ["500", "fill-vesta-navy-muted"],
  ["400", "fill-vesta-navy-muted"],
  ["300", "fill-vesta-mist"],
];
for (const [shade, token] of fillMap) addSlatePrefix("fill", shade, token);

// Gradient stops
RULES.push(
  { re: /\bfrom-slate-950(\/[0-9.]+)?\b/g, to: "from-vesta-navy$1" },
  { re: /\bfrom-slate-900(\/[0-9.]+)?\b/g, to: "from-vesta-navy$1" },
  { re: /\bto-slate-950(\/[0-9.]+)?\b/g, to: "to-vesta-navy$1" },
  { re: /\bto-slate-900(\/[0-9.]+)?\b/g, to: "to-vesta-navy-muted$1" },
  { re: /\bto-slate-800(\/[0-9.]+)?\b/g, to: "to-vesta-navy$1" },
  { re: /\bvia-slate-800(\/[0-9.]+)?\b/g, to: "via-vesta-navy-muted$1" },
);

const statePrefixes = ["hover", "focus", "focus-visible", "active", "group-hover"];
for (const sp of statePrefixes) {
  RULES.push(
    { re: new RegExp(`\\b${sp}:bg-slate-200(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:bg-vesta-mist/50$1` },
    { re: new RegExp(`\\b${sp}:bg-slate-100(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:bg-vesta-mist/35$1` },
    { re: new RegExp(`\\b${sp}:bg-slate-50(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:bg-vesta-mist/25$1` },
    { re: new RegExp(`\\b${sp}:text-slate-600(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:text-vesta-navy/80$1` },
    { re: new RegExp(`\\b${sp}:text-slate-700(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:text-vesta-navy$1` },
    { re: new RegExp(`\\b${sp}:border-slate-500(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:border-vesta-navy/18$1` },
    { re: new RegExp(`\\b${sp}:border-slate-400(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:border-vesta-navy/15$1` },
    { re: new RegExp(`\\b${sp}:border-slate-300(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:border-vesta-navy/20$1` },
    { re: new RegExp(`\\b${sp}:border-slate-200(\\/[0-9.]+)?\\b`, "g"), to: `${sp}:border-vesta-navy/15$1` },
  );
}

for (const [shade, toke] of textMap) {
  RULES.push({
    re: new RegExp(`\\bplaceholder:text-slate-${shade}(\\/[0-9.]+)?\\b`, "g"),
    to: `placeholder:${toke}$1`,
  });
}
for (const [shade, toke] of borderMap) {
  for (const sp of ["focus", "focus-visible"]) {
    RULES.push({
      re: new RegExp(`\\b${sp}:border-slate-${shade}(\\/[0-9.]+)?\\b`, "g"),
      to: `${sp}:${toke}$1`,
    });
  }
}

// Arbitrary selectors: scrollbar, etc.
RULES.push(
  { re: /\[&::-webkit-scrollbar-track\]:bg-slate-100\b/g, to: "[&::-webkit-scrollbar-track]:bg-vesta-mist/40" },
  { re: /\[&::-webkit-scrollbar-thumb\]:bg-slate-300\b/g, to: "[&::-webkit-scrollbar-thumb]:bg-vesta-navy/25" },
  { re: /\[&::-webkit-scrollbar-thumb\]:bg-slate-400\b/g, to: "[&::-webkit-scrollbar-thumb]:bg-vesta-navy-muted/40" },
);

function addNeutralFamily(family) {
  const F = family;
  for (const [shade, toke] of textMap) {
    RULES.push({
      re: new RegExp(`\\btext-${F}-${shade}(\\/[0-9.]+)?\\b`, "g"),
      to: `${toke}$1`,
    });
  }
  for (const [shade, toke] of bgMap) {
    RULES.push({
      re: new RegExp(`\\bbg-${F}-${shade}(\\/[0-9.]+)?\\b`, "g"),
      to: `${toke}$1`,
    });
  }
  for (const [shade, toke] of borderMap) {
    RULES.push({
      re: new RegExp(`\\bborder-${F}-${shade}(\\/[0-9.]+)?\\b`, "g"),
      to: `${toke}$1`,
    });
  }
  for (const [shade, toke] of ringMap) {
    RULES.push({
      re: new RegExp(`\\bring-${F}-${shade}(\\/[0-9.]+)?\\b`, "g"),
      to: `${toke}$1`,
    });
  }
  for (const [shade, toke] of divideMap) {
    RULES.push({
      re: new RegExp(`\\bdivide-${F}-${shade}(\\/[0-9.]+)?\\b`, "g"),
      to: `${toke}$1`,
    });
  }
}

addNeutralFamily("gray");
addNeutralFamily("zinc");

for (const [shade, toke] of textMap) {
  RULES.push({
    re: new RegExp(`\\bplaceholder:text-gray-${shade}(\\/[0-9.]+)?\\b`, "g"),
    to: `placeholder:${toke}$1`,
  });
  RULES.push({
    re: new RegExp(`\\bplaceholder:text-zinc-${shade}(\\/[0-9.]+)?\\b`, "g"),
    to: `placeholder:${toke}$1`,
  });
}

// Docs / Integrations legacy palette → Vesta
/** Longest first so e.g. border-[#7ba3e8]/50 runs before border-[#7ba3e8]. */
const LITERAL_REPLACEMENTS = [
  ["border-[#7ba3e8]/50", "border-vesta-navy-muted/50"],
  ["bg-[#0e131f]", "bg-vesta-navy"],
  ["text-[#dde2f3]", "text-vesta-mist"],
  ["text-[#d3c5ac]", "text-vesta-gold"],
  ["text-[#9c8f79]", "text-vesta-gold/80"],
  ["bg-[#1a202c]", "bg-vesta-navy-muted/25"],
  ["bg-[#161c28]", "bg-vesta-navy-muted/20"],
  ["bg-[#080e1a]", "bg-vesta-navy"],
  ["border-[#7ba3e8]", "border-vesta-navy-muted"],
  ["text-[#7ba3e8]", "text-vesta-navy-muted"],
  ["bg-[#7ba3e8]", "bg-vesta-navy-muted"],
  ["from-[#ffe1a7]", "from-vesta-gold/90"],
  ["to-[#fbbf24]", "to-vesta-gold"],
  ["text-[#402d00]", "text-vesta-navy"],
  ["ring-white/[0.06]", "ring-vesta-mist/10"],
  ["ring-white/[0.04]", "ring-vesta-mist/8"],
  ["ring-white/[0.08]", "ring-vesta-mist/12"],
];

// Typography: prefer brand kit fonts over ad-hoc Inter/Manrope
RULES.push(
  { re: /font-\[Inter,system-ui,sans-serif\]/g, to: "font-sans" },
  { re: /font-\['Manrope',system-ui,sans-serif\]/g, to: "font-sans" },
);

/** Collapse border-vesta-navy/10/90 → border-vesta-navy/90 (see fix-vesta-double-opacity.mjs). */
const DOUBLE_OPACITY_RE =
  /([a-zA-Z0-9_\[\]&*.,():#%\-]*vesta-(?:navy-muted|navy|gold|mist|cream))((?:\/[0-9.]+)+)\b/g;

function collapseDoubleVestaOpacity(content) {
  return content.replace(DOUBLE_OPACITY_RE, (full, name, opacities) => {
    const segments = opacities.split("/").filter(Boolean);
    if (segments.length <= 1) return full;
    return `${name}/${segments[segments.length - 1]}`;
  });
}

function transform(content) {
  let out = content;
  for (const { re, to } of RULES) {
    out = out.replace(re, to);
  }
  for (const [from, to] of LITERAL_REPLACEMENTS) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return collapseDoubleVestaOpacity(out);
}

const files = walk(SRC);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
  }
}

console.log(`apply-vesta-brand-classes: updated ${changed} file(s) under src/`);
