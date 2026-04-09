import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envFiles = fs
  .readdirSync(rootDir)
  .filter((fileName) => fileName.startsWith(".env") && fileName.endsWith(".example"));
const allowedViteVars = new Set([
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_APP_BASE_URL",
]);

const suspiciousNameRegex = /(SECRET|TOKEN|PASSWORD|SERVICE_ROLE|PRIVATE|OPENAI|GROQ|NVIDIA)/i;
const suspiciousValueRegex = /(sb_secret_|sk-[a-z0-9]|AIza|BEGIN PRIVATE KEY|service_role)/i;

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator < 0) return null;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      return { key, value };
    })
    .filter(Boolean);
}

const violations = [];

for (const fileName of envFiles) {
  const absolutePath = path.join(rootDir, fileName);
  if (!fs.existsSync(absolutePath)) continue;

  const content = fs.readFileSync(absolutePath, "utf8");
  const rows = parseEnv(content);

  for (const row of rows) {
    const { key, value } = row;
    if (!key.startsWith("VITE_")) continue;

    const allowed = allowedViteVars.has(key);
    const suspiciousByName = suspiciousNameRegex.test(key) && !allowed;
    const suspiciousByValue = suspiciousValueRegex.test(value) && !allowed;

    if (suspiciousByName || suspiciousByValue) {
      violations.push({
        fileName,
        key,
        reason: suspiciousByName
          ? "nome de variável sugere segredo em VITE_*"
          : "valor de variável sugere segredo em VITE_*",
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Falha: possível segredo exposto em variável VITE_*");
  for (const violation of violations) {
    console.error(`- ${violation.fileName}: ${violation.key} (${violation.reason})`);
  }
  process.exit(1);
}

console.log("OK: nenhuma variável VITE_* com indício de segredo foi encontrada.");
