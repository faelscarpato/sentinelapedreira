import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

if (!fs.existsSync(migrationsDir)) {
  console.error("Diretório de migrations não encontrado:", migrationsDir);
  process.exit(1);
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const allSql = migrationFiles
  .map((file) => fs.readFileSync(path.join(migrationsDir, file), "utf8"))
  .join("\n");

const createTableRegex = /create\s+table\s+if\s+not\s+exists\s+public\.([a-zA-Z0-9_]+)/gi;
const rlsRegex = /alter\s+table\s+public\.([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi;

const createdTables = new Set();
const rlsTables = new Set();

let createMatch = createTableRegex.exec(allSql);
while (createMatch) {
  createdTables.add(createMatch[1]);
  createMatch = createTableRegex.exec(allSql);
}

let rlsMatch = rlsRegex.exec(allSql);
while (rlsMatch) {
  rlsTables.add(rlsMatch[1]);
  rlsMatch = rlsRegex.exec(allSql);
}

const tablesWithoutRls = [...createdTables].filter((table) => !rlsTables.has(table));

if (tablesWithoutRls.length > 0) {
  console.error("Falha: tabelas públicas sem RLS habilitado:");
  for (const table of tablesWithoutRls) {
    console.error(`- public.${table}`);
  }
  process.exit(1);
}

console.log(`OK: ${createdTables.size} tabela(s) públicas com RLS habilitado nas migrations.`);
