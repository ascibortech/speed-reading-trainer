#!/usr/bin/env node
/**
 * Text-boundary enforcement (system-design §2.2, architecture-plan §4.2 / ADR-003).
 *
 * The single inviolable invariant: uploaded text crosses exactly one boundary
 * (file -> browser memory) and never a second. The storage/export layer must be
 * STRUCTURALLY INCAPABLE of touching user text, so a metadata export can never
 * contain it.
 *
 * This script fails CI if any file under packages/storage imports the
 * NormalizedText module, or references the `NormalizedText` symbol, or imports
 * the contracts barrel (which transitively exposes the text module). Storage may
 * only import the text-free metadata subpath: `@srt/contracts/metadata`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const STORAGE_DIR = join(root, "packages", "storage", "src");

/** Patterns that constitute a boundary violation inside the storage layer. */
const FORBIDDEN = [
  {
    re: /from\s+["']@srt\/contracts\/text["']/,
    msg: "imports the NormalizedText text module (@srt/contracts/text)",
  },
  {
    re: /from\s+["']@srt\/contracts["']/,
    msg: "imports the contracts barrel (@srt/contracts) — use @srt/contracts/metadata instead, the barrel exposes the text module",
  },
  {
    re: /\bNormalizedText\b/,
    msg: "references the NormalizedText symbol",
  },
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // directory may not exist yet
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) yield full;
  }
}

/** Strip line and block comments so documentation may mention the boundary. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const violations = [];
for (const file of walk(STORAGE_DIR)) {
  const src = stripComments(readFileSync(file, "utf8"));
  for (const { re, msg } of FORBIDDEN) {
    if (re.test(src)) {
      violations.push(`  ${relative(root, file)} — ${msg}`);
    }
  }
}

if (violations.length > 0) {
  console.error("\n✖ Text-boundary violation in packages/storage:\n");
  console.error(violations.join("\n"));
  console.error(
    "\nThe storage/export layer must never touch user text. Import only " +
      "`@srt/contracts/metadata`.\n",
  );
  process.exit(1);
}

console.log("✓ Text boundary intact: storage layer cannot see user text.");
