import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "app", "components", "SafeMarkdown.tsx");

if (!fs.existsSync(filePath)) {
  console.error("Arquivo SafeMarkdown.tsx não encontrado.");
  process.exit(1);
}

const content = fs.readFileSync(filePath, "utf8");
const requiredChecks = [
  { label: "rehype-sanitize configurado", test: /rehypeSanitize/.test(content) },
  { label: "skipHtml habilitado", test: /skipHtml/.test(content) },
  { label: "bloqueio de javascript: link", test: /sanitizeHref/.test(content) && /return null;/.test(content) },
  { label: "rel seguro para links externos", test: /noopener noreferrer nofollow/.test(content) },
  { label: "target seguro _blank para links externos", test: /target=\{isExternal \? "_blank"/.test(content) },
];

const failed = requiredChecks.filter((item) => !item.test);

if (failed.length > 0) {
  console.error("Falha no teste de regressão de sanitização de markdown:");
  for (const item of failed) {
    console.error(`- ${item.label}`);
  }
  process.exit(1);
}

console.log("OK: regressão de sanitização de markdown validada.");
