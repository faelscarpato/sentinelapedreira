/**
 * compact-large-json.mjs
 *
 * Compacts large JSON dataset files in public/data/portal-transparencia/
 * to fit within GitHub's 25 MB file size limit.
 *
 * Strategy:
 *   1. Minify (remove pretty-print whitespace) — typically 50-60% reduction
 *   2. If still > 24 MB, split into monthly chunks (part-01, part-02, …)
 *
 * Usage:
 *   node scripts/compact-large-json.mjs
 */

import { readFileSync, writeFileSync, statSync, unlinkSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const MAX_SIZE_BYTES = 24 * 1024 * 1024; // 24 MB (safe margin under 25 MB)
const DATA_DIR = join(import.meta.dirname, "..", "public", "data", "portal-transparencia");

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function processFile(filePath) {
  const name = basename(filePath);
  const originalSize = statSync(filePath).size;

  if (originalSize <= MAX_SIZE_BYTES) {
    console.log(`✅ ${name} — ${formatMB(originalSize)} — already under limit, skipping.`);
    return;
  }

  console.log(`\n🔧 Processing ${name} — ${formatMB(originalSize)}`);

  // Step 1: Read & parse
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  const rowCount = Array.isArray(data.rows) ? data.rows.length : 0;

  console.log(`   Rows: ${rowCount}, Columns: ${data.columns?.length ?? "?"}`);

  // Step 2: Minify in-place
  const minified = JSON.stringify(data);
  const minifiedSize = Buffer.byteLength(minified, "utf-8");
  console.log(`   Minified: ${formatMB(minifiedSize)}`);

  if (minifiedSize <= MAX_SIZE_BYTES) {
    writeFileSync(filePath, minified, "utf-8");
    console.log(`   ✅ Minified in-place — saved ${formatMB(originalSize - minifiedSize)}`);
    return;
  }

  // Step 3: Still too large — split by chunks
  console.log(`   ⚠️  Still ${formatMB(minifiedSize)} after minify — splitting into parts...`);

  // Calculate how many parts are needed
  const estimatedRowSize = minifiedSize / rowCount;
  const rowsPerPart = Math.floor(MAX_SIZE_BYTES / estimatedRowSize * 0.85); // 85% safety factor
  const totalParts = Math.ceil(rowCount / rowsPerPart);

  console.log(`   Splitting into ${totalParts} parts (~${rowsPerPart} rows each)`);

  // Build metadata (everything except rows)
  const { rows, ...metadata } = data;

  // Remove old part files if they exist
  const baseName = name.replace(/\.json$/, "");
  const existingParts = readdirSync(DATA_DIR).filter(
    (f) => f.startsWith(baseName + ".part-") && f.endsWith(".json")
  );
  for (const oldPart of existingParts) {
    unlinkSync(join(DATA_DIR, oldPart));
  }

  const partFilenames = [];

  for (let i = 0; i < totalParts; i++) {
    const start = i * rowsPerPart;
    const end = Math.min(start + rowsPerPart, rowCount);
    const partRows = rows.slice(start, end);

    const partData = {
      ...metadata,
      rowCount: partRows.length,
      totalParts,
      partIndex: i,
      partRange: `${start + 1}-${end} of ${rowCount}`,
      rows: partRows,
    };

    const partName = `${baseName}.part-${String(i + 1).padStart(2, "0")}.json`;
    const partPath = join(DATA_DIR, partName);
    const partContent = JSON.stringify(partData);
    const partSize = Buffer.byteLength(partContent, "utf-8");

    writeFileSync(partPath, partContent, "utf-8");
    partFilenames.push(partName);
    console.log(`   📄 ${partName} — ${formatMB(partSize)} (${partRows.length} rows)`);
  }

  // Replace original file with a manifest pointer
  const pointer = {
    ...metadata,
    rowCount,
    split: true,
    totalParts,
    parts: partFilenames,
    rows: [], // empty — rows are in part files
  };

  writeFileSync(filePath, JSON.stringify(pointer), "utf-8");
  const pointerSize = Buffer.byteLength(JSON.stringify(pointer), "utf-8");
  console.log(`   📋 ${name} — replaced with pointer manifest (${formatMB(pointerSize)})`);
  console.log(`   ✅ Split complete — ${totalParts} parts created`);
}

// --- Main ---
console.log("=== Large JSON Compactor ===\n");
console.log(`Directory: ${DATA_DIR}`);
console.log(`Limit: ${formatMB(MAX_SIZE_BYTES)}\n`);

const files = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json") && !f.includes(".part-") && f !== "manifest.json")
  .map((f) => join(DATA_DIR, f));

for (const file of files) {
  processFile(file);
}

console.log("\n=== Done ===");
