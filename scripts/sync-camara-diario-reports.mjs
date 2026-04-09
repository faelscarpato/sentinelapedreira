import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, "data", "reports");
const camaraPublicRoot = path.join(rootDir, "public", "Documentos camara munucipal 2026");
const camaraGeneratedIndexPath = path.join(rootDir, "src", "app", "data", "generated", "camaraPublicFiles.ts");
const diarioGeneratedReportsPath = path.join(rootDir, "src", "app", "data", "generated", "diarioReports.ts");

const sourceFilePattern = /^(IND|MOC|DIARIO)_(\d+)_((?:19|20)\d{2})(?:_ETA_[A-Z0-9]+)?\.report\.md$/i;

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function getFrontmatter(rawMarkdown) {
  const matched = rawMarkdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!matched) return "";
  return matched[1];
}

function parseFrontmatter(rawMarkdown) {
  const frontmatter = getFrontmatter(rawMarkdown);
  if (!frontmatter) return {};

  const result = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) continue;
    result[key] = value;
  }
  return result;
}

function stripFrontmatter(rawMarkdown) {
  return rawMarkdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function sanitizeMarkdown(rawMarkdown) {
  let content = stripFrontmatter(rawMarkdown).replace(/\r\n/g, "\n");

  content = content.replace(/(^|\n)##\s*Metadados\b[\s\S]*?(?=\n##\s+\S|\n#\s+\S|$)/gi, "\n");
  content = content
    .split("\n")
    .filter(
      (line) =>
        !/^\s*[-*]?\s*(source_id|extraction_file|report_file|url_origem|modo_extracao|tamanho_chars|paginas)\s*:/i.test(
          line,
        ),
    )
    .join("\n");

  content = content.replace(/\n{3,}/g, "\n\n").trim();
  return content;
}

function buildTitle(type, numberRaw, year) {
  const number = Number(numberRaw);

  if (type === "IND") return `# Relatório Técnico - Indicação ${number}/${year}`;
  if (type === "MOC") return `# Relatório Técnico - Moção ${number}/${year}`;
  return `# Relatório Técnico - Diário Oficial nº ${number}/${year}`;
}

function composeReport(type, numberRaw, year, rawMarkdown) {
  const metadata = parseFrontmatter(rawMarkdown);
  const body = sanitizeMarkdown(rawMarkdown);
  const title = buildTitle(type, numberRaw, year);
  const summaryLine = metadata.ementa ? `**Ementa:** ${metadata.ementa}` : "";

  return `${title}\n\n${summaryLine ? `${summaryLine}\n\n` : ""}${body}\n`;
}

function extractSectionContent(markdown, heading) {
  const sectionPattern = new RegExp(`##\\s*${heading}\\b[\\s\\S]*?(?=\\n##\\s+|\\n#\\s+|$)`, "i");
  const matched = markdown.match(sectionPattern);
  if (!matched) return "";
  return matched[0].replace(/^##[^\n]*\n?/, "").trim();
}

function buildSummary(markdown) {
  const resumo = extractSectionContent(markdown, "Resumo Executivo");
  const fallback = markdown.replace(/^#[^\n]*\n?/, "").trim();
  const text = (resumo || fallback).replace(/\s+/g, " ").trim();

  if (!text) return "Relatório técnico disponível para leitura integral.";
  return text.length > 220 ? `${text.slice(0, 220).trimEnd()}...` : text;
}

function extractSourceUrl(rawMarkdown) {
  const metadataLine = rawMarkdown.match(/^\s*-\s*url_origem\s*:\s*(\S+)\s*$/im);
  if (metadataLine?.[1]) return metadataLine[1];

  const parsedFrontmatter = parseFrontmatter(rawMarkdown);
  if (typeof parsedFrontmatter.url_origem === "string" && parsedFrontmatter.url_origem.length > 0) {
    return parsedFrontmatter.url_origem;
  }

  return undefined;
}

function normalizeIsoDate(value, fallbackYear) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return `${fallbackYear}-01-01`;
}

function collectSourceReports() {
  const files = fs.readdirSync(reportsDir).filter((fileName) => sourceFilePattern.test(fileName));
  const selectedByKey = new Map();

  for (const fileName of files) {
    const matched = fileName.match(sourceFilePattern);
    if (!matched) continue;

    const type = matched[1].toUpperCase();
    const numberRaw = matched[2];
    const year = Number(matched[3]);
    const isEtaVariant = /_ETA_/i.test(fileName);
    const key = `${type}:${Number(numberRaw)}:${year}`;
    const existing = selectedByKey.get(key);

    if (!existing || (existing.isEtaVariant && !isEtaVariant)) {
      selectedByKey.set(key, {
        type,
        numberRaw,
        number: Number(numberRaw),
        year,
        fileName,
        isEtaVariant,
      });
    }
  }

  return Array.from(selectedByKey.values());
}

function writePublicReports(entries) {
  const created = {
    IND: 0,
    MOC: 0,
    DIARIO: 0,
  };

  for (const entry of entries) {
    const sourcePath = path.join(reportsDir, entry.fileName);
    const rawMarkdown = fs.readFileSync(sourcePath, "utf8");
    const targetDirectory =
      entry.type === "DIARIO"
        ? path.join(camaraPublicRoot, "DIARIO OFICIAL", "analises")
        : path.join(camaraPublicRoot, entry.type, "analises");
    const targetFileName =
      entry.type === "DIARIO"
        ? `DIARIO_${entry.numberRaw}_${entry.year}.report.md`
        : `${entry.type}_${String(entry.number).padStart(3, "0")}_${entry.year}.report.md`;
    const targetPath = path.join(targetDirectory, targetFileName);

    ensureDirectory(targetDirectory);

    if (fs.existsSync(targetPath)) continue;

    fs.writeFileSync(targetPath, composeReport(entry.type, entry.numberRaw, entry.year, rawMarkdown), "utf8");
    created[entry.type] += 1;
  }

  return created;
}

function collectAvailableCamaraReportKeys() {
  const keys = new Set();

  for (const type of ["IND", "MOC"]) {
    const reportDirectory = path.join(camaraPublicRoot, type, "analises");
    if (!fs.existsSync(reportDirectory)) continue;

    const files = fs.readdirSync(reportDirectory).filter((name) => name.endsWith(".report.md"));
    for (const fileName of files) {
      const matched = fileName.match(new RegExp(`^${type}_(\\d{3})_((?:19|20)\\d{2})\\.report\\.md$`));
      if (!matched) continue;
      const number = Number(matched[1]);
      const year = Number(matched[2]);
      keys.add(`${type}:${number}:${year}`);
    }
  }

  return keys;
}

function updateCamaraGeneratedIndex(availableReportKeys) {
  const original = fs.readFileSync(camaraGeneratedIndexPath, "utf8");
  const lines = original.split(/\r?\n/);

  const updatedLines = lines.map((line) => {
    const matched = line.match(
      /^\s*\{ id: 'camara-public-(ind|moc)-(\d+)-(\d{4})', type: '(IND|MOC)', number: (\d+), year: (\d{4}), numberPadded: '(\d{3})', fileName: '([^']+)', pdfPath: '([^']+)'(?:, reportPath: '[^']+')?, hasReport: (?:true|false) \},$/,
    );
    if (!matched) return line;

    const typeLower = matched[1];
    const idNumber = matched[2];
    const idYear = matched[3];
    const type = matched[4];
    const number = Number(matched[5]);
    const year = Number(matched[6]);
    const numberPadded = matched[7];
    const fileName = matched[8];
    const pdfPath = matched[9];
    const key = `${type}:${number}:${year}`;

    if (!availableReportKeys.has(key)) return line;

    const reportPath = `/Documentos%20camara%20munucipal%202026/${type}/analises/${type}_${numberPadded}_${year}.report.md`;
    return `  { id: 'camara-public-${typeLower}-${idNumber}-${idYear}', type: '${type}', number: ${number}, year: ${year}, numberPadded: '${numberPadded}', fileName: '${fileName}', pdfPath: '${pdfPath}', reportPath: '${reportPath}', hasReport: true },`;
  });

  const updated = updatedLines.join("\n");
  if (updated !== original) {
    fs.writeFileSync(camaraGeneratedIndexPath, updated, "utf8");
    return true;
  }
  return false;
}

function generateDiarioReportsModule(entries) {
  const diarioEntries = entries
    .filter((entry) => entry.type === "DIARIO")
    .sort((left, right) => {
      if (left.year !== right.year) return right.year - left.year;
      return right.number - left.number;
    });

  const reports = [];
  const reportByEditionYear = {};

  for (const entry of diarioEntries) {
    const sourcePath = path.join(reportsDir, entry.fileName);
    const rawMarkdown = fs.readFileSync(sourcePath, "utf8");
    const metadata = parseFrontmatter(rawMarkdown);
    const content = composeReport(entry.type, entry.numberRaw, entry.year, rawMarkdown);
    const reportId = `diario-oficial-${entry.number}-${entry.year}`;
    const sourceUrl = extractSourceUrl(rawMarkdown);

    reports.push({
      id: reportId,
      title: `Diário Oficial nº ${entry.number}`,
      category: "Diário Oficial",
      date: normalizeIsoDate(metadata.data, entry.year),
      summary: buildSummary(content),
      tags: ["Diário Oficial", `Edição ${entry.number}`, `${entry.year}`],
      content,
      sources: sourceUrl ? [sourceUrl] : [],
      confidenceLevel: "preliminary",
      editionNumber: entry.number,
      editionYear: entry.year,
    });

    reportByEditionYear[`${entry.number}-${entry.year}`] = reportId;
  }

  const fileContent = `// AUTO-GERADO por scripts/sync-camara-diario-reports.mjs
// Nao editar manualmente.

export interface DiarioReportEntry {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
  sources: string[];
  confidenceLevel: "high" | "medium" | "preliminary";
  editionNumber: number;
  editionYear: number;
}

export const diarioReports: DiarioReportEntry[] = ${JSON.stringify(reports, null, 2)};

export const diarioReportByEditionYear: Record<string, string> = ${JSON.stringify(reportByEditionYear, null, 2)};
`;

  fs.writeFileSync(diarioGeneratedReportsPath, fileContent, "utf8");
  return reports.length;
}

function main() {
  const selectedEntries = collectSourceReports();
  const created = writePublicReports(selectedEntries);
  const availableCamaraReportKeys = collectAvailableCamaraReportKeys();
  const camaraIndexUpdated = updateCamaraGeneratedIndex(availableCamaraReportKeys);
  const diarioReportsCount = generateDiarioReportsModule(selectedEntries);

  console.log(
    JSON.stringify(
      {
        createdPublicReports: created,
        diarioReportsCount,
        camaraIndexUpdated,
      },
      null,
      2,
    ),
  );
}

main();
