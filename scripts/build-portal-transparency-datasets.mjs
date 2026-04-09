import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(projectRoot, "data");
const outputDir = path.join(projectRoot, "public", "data", "portal-transparencia");

const DATASET_SPECS = [
  {
    id: "convenios-terceiro-setor",
    title: "Convênios ou Termos de Repasse ao Terceiro Setor",
    domain: "terceiro_setor",
    sourceFile: "Portal Transp. Convênios ou Termos de Repasse ao TS.csv",
  },
  {
    id: "convenios-gerais",
    title: "Convênios Gerais",
    domain: "terceiro_setor",
    sourceFile: "Portal Transp. Convenios.csv",
  },
  {
    id: "emendas-impositivas-2026",
    title: "Emendas Impositivas (Art. 166-A) - 2026",
    domain: "contas_publicas",
    sourceFile: "Portal Transp. Emendas Impositivas (art. 166-A da CF) - Exercício 2026.csv",
  },
  {
    id: "licitacoes-2026",
    title: "Licitações",
    domain: "contas_publicas",
    sourceFile: "Portal Transp. Licitações.txt.txt",
  },
  {
    id: "transferencias-entidades-2026",
    title: "Transferências entre Entidades - 2026",
    domain: "repasses",
    sourceFile: "Portal Transp. Transferências entre Entidades - Exercício 2026.csv",
  },
  {
    id: "patrimonio-imoveis",
    title: "Relação de Bens Imóveis do Patrimônio",
    domain: "patrimonio",
    sourceFile: "Portal Transparencia Relação de Bens Imóveis do Patrimônio.csv",
  },
  {
    id: "patrimonio-intangiveis",
    title: "Relação de Bens Intangíveis do Patrimônio",
    domain: "patrimonio",
    sourceFile: "Portal Transparencia Relação de bens Intangíveis do Patrimônio.csv",
  },
  {
    id: "patrimonio-veiculos",
    title: "Relação de Veículos do Patrimônio",
    domain: "patrimonio",
    sourceFile: "Portal Transparencia Relação de Veículos do Patrimônio.csv",
  },
  {
    id: "repasses-pedreira-completo",
    title: "Repasses Pedreira Completo",
    domain: "repasses_tce",
    sourceFile: "repasses pedreira completo.xlsx",
    format: "xlsx",
  },
  {
    id: "despesas-pedreira-2025",
    title: "Despesas Pedreira 2025",
    domain: "contas_publicas",
    sourceFile: "despesas-pedreira-2025.csv",
  },
  {
    id: "receitas-pedreira-2025",
    title: "Receitas Pedreira 2025",
    domain: "contas_publicas",
    sourceFile: "receitas-pedreira-2025.csv",
  },
  {
    id: "licitacoes-pedreira-completo",
    title: "Licitações Pedreira Completo",
    domain: "contas_publicas",
    sourceFile: "licitacoes completo.csv",
  },
];

function normalizeHeader(value) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized.length > 0 ? normalized : "coluna";
}

function normalizeText(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBrNumber(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const cleaned = normalized
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const matched = normalized.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!matched) return null;

  const [, dd, mm, yyyy, hh = "00", min = "00", ss = "00"] = matched;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}-03:00`;
}

function scoreDecodedText(text) {
  const replacementCount = (text.match(/�/g) ?? []).length;
  const mojibakeCount = (text.match(/[ÃÂ][\x80-\xBF]/g) ?? []).length;
  return replacementCount * 4 + mojibakeCount;
}

function readTextSmart(filePath) {
  const buffer = fs.readFileSync(filePath);
  const utf8 = buffer.toString("utf8");
  const latin1 = buffer.toString("latin1");

  const utf8Score = scoreDecodedText(utf8);
  const latin1Score = scoreDecodedText(latin1);

  return utf8Score <= latin1Score ? utf8 : latin1;
}

function parseDelimitedContent(content, delimiter = ";") {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];
    const prevChar = index > 0 ? content[index - 1] : "";

    if (char === "\"") {
      if (inQuotes) {
        if (nextChar === "\"") {
          current += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
        continue;
      }

      const isFieldBoundary =
        current.length === 0 &&
        (prevChar === "" || prevChar === delimiter || prevChar === "\n" || prevChar === "\r");

      if (isFieldBoundary) {
        inQuotes = true;
        continue;
      }
    }

    if (!inQuotes && char === delimiter) {
      row.push(current);
      current = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function shouldParseAsNumber(key) {
  return /^vl_/.test(key)
    || /(valor|receita|arrecadacao|despesa|empenhado|liquidado|pago|previsto|concedida|recebida|contra_partida|inscrito|saldo|cancelado|estorno)/.test(
      key,
    );
}

function shouldParseAsDate(key) {
  return /(data|inicio|fim|encerramento|abert)/.test(key);
}

function parseDelimitedDataset(filePath) {
  const raw = readTextSmart(filePath).replace(/^\uFEFF/, "");
  const records = parseDelimitedContent(raw, ";");
  if (records.length === 0) {
    return { columns: [], rows: [] };
  }

  const sourceHeaders = records[0];
  const headerMap = [];
  const nameCounter = new Map();

  for (const sourceHeader of sourceHeaders) {
    const base = normalizeHeader(sourceHeader);
    const count = nameCounter.get(base) ?? 0;
    nameCounter.set(base, count + 1);
    const normalizedName = count === 0 ? base : `${base}_${count + 1}`;
    headerMap.push({ source: sourceHeader.trim(), normalized: normalizedName });
  }

  const rows = records.slice(1).map((values) => {
    const row = {};

    headerMap.forEach((header, index) => {
      const rawValue = values[index];
      const text = normalizeText(rawValue);

      if (!text) {
        row[header.normalized] = null;
        return;
      }

      if (shouldParseAsNumber(header.normalized)) {
        const numeric = parseBrNumber(text);
        row[header.normalized] = numeric ?? text;
        return;
      }

      if (header.normalized === "mes") {
        const monthValue = Number.parseInt(text, 10);
        row[header.normalized] = Number.isFinite(monthValue) ? monthValue : text;
        return;
      }

      if (shouldParseAsDate(header.normalized)) {
        row[header.normalized] = parseDate(text) ?? text;
        return;
      }

      row[header.normalized] = text;
    });

    return row;
  }).filter((row) => Object.values(row).some((value) => value !== null));

  return {
    columns: headerMap,
    rows,
  };
}

function parseXlsxDataset(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { columns: [], rows: [] };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rowsRaw = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
  const headersRaw = Object.keys(rowsRaw[0] ?? {});

  const headerMap = [];
  const nameCounter = new Map();

  for (const sourceHeader of headersRaw) {
    const base = normalizeHeader(sourceHeader);
    const count = nameCounter.get(base) ?? 0;
    nameCounter.set(base, count + 1);
    const normalizedName = count === 0 ? base : `${base}_${count + 1}`;
    headerMap.push({ source: sourceHeader, normalized: normalizedName });
  }

  const rows = rowsRaw.map((rawRow) => {
    const row = {};

    headerMap.forEach((header) => {
      const value = rawRow[header.source];

      if (value == null || value === "") {
        row[header.normalized] = null;
        return;
      }

      if (value instanceof Date) {
        row[header.normalized] = value.toISOString();
        return;
      }

      if (typeof value === "number") {
        row[header.normalized] = Number.isFinite(value) ? value : null;
        return;
      }

      const text = normalizeText(value);
      if (!text) {
        row[header.normalized] = null;
        return;
      }

      if (header.normalized === "exercicio" || header.normalized === "codigo_ibge") {
        const asInt = Number.parseInt(text, 10);
        row[header.normalized] = Number.isFinite(asInt) ? asInt : text;
        return;
      }

      if (shouldParseAsNumber(header.normalized) || header.normalized === "vl_pago") {
        const numeric = parseBrNumber(text);
        row[header.normalized] = numeric ?? text;
        return;
      }

      row[header.normalized] = text;
    });

    return row;
  }).filter((row) => Object.values(row).some((value) => value !== null));

  return {
    columns: headerMap,
    rows,
  };
}

function buildDatasetSummary(rows) {
  const numericTotals = {};
  const numericCounts = {};
  const dateRanges = {};
  const topValues = {};

  const topValueCandidates = [
    "situacao",
    "modalidade",
    "tipo",
    "origem",
    "entidade_pagadora",
    "entidade_recebedora",
    "favorecido",
    "localizacao",
  ];

  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        numericTotals[key] = (numericTotals[key] ?? 0) + value;
        numericCounts[key] = (numericCounts[key] ?? 0) + 1;
      }

      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        const timestamp = Date.parse(value);
        if (Number.isFinite(timestamp)) {
          const current = dateRanges[key] ?? { min: timestamp, max: timestamp };
          current.min = Math.min(current.min, timestamp);
          current.max = Math.max(current.max, timestamp);
          dateRanges[key] = current;
        }
      }
    }
  }

  for (const key of topValueCandidates) {
    const counter = new Map();
    for (const row of rows) {
      const value = row[key];
      if (typeof value !== "string" || value.length === 0) continue;
      counter.set(value, (counter.get(value) ?? 0) + 1);
    }

    if (counter.size > 0) {
      topValues[key] = Array.from(counter.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 6)
        .map(([value, count]) => ({ value, count }));
    }
  }

  const normalizedDateRanges = Object.fromEntries(
    Object.entries(dateRanges).map(([key, range]) => [
      key,
      {
        min: new Date(range.min).toISOString(),
        max: new Date(range.max).toISOString(),
      },
    ]),
  );

  return {
    numericTotals,
    numericCounts,
    dateRanges: normalizedDateRanges,
    topValues,
  };
}

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function build() {
  ensureDirectory(outputDir);

  const generatedAt = new Date().toISOString();
  const manifest = {
    generatedAt,
    sourceDir: path.relative(projectRoot, sourceDir).replace(/\\/g, "/"),
    outputDir: path.relative(projectRoot, outputDir).replace(/\\/g, "/"),
    datasets: [],
  };

  for (const spec of DATASET_SPECS) {
    const sourcePath = path.join(sourceDir, spec.sourceFile);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Arquivo de origem não encontrado: ${spec.sourceFile}`);
    }

    const parsed = spec.format === "xlsx"
      ? parseXlsxDataset(sourcePath)
      : parseDelimitedDataset(sourcePath);
    const summary = buildDatasetSummary(parsed.rows);
    const sourceStats = fs.statSync(sourcePath);
    const outputFile = `${spec.id}.json`;
    const outputPath = path.join(outputDir, outputFile);

    const payload = {
      id: spec.id,
      title: spec.title,
      domain: spec.domain,
      sourceFile: spec.sourceFile,
      generatedAt,
      sourceUpdatedAt: sourceStats.mtime.toISOString(),
      rowCount: parsed.rows.length,
      columns: parsed.columns,
      summary,
      rows: parsed.rows,
    };

    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

    manifest.datasets.push({
      id: spec.id,
      title: spec.title,
      domain: spec.domain,
      sourceFile: spec.sourceFile,
      outputFile,
      rowCount: parsed.rows.length,
      columnCount: parsed.columns.length,
      columns: parsed.columns.map((column) => column.normalized),
      summary,
      sourceUpdatedAt: sourceStats.mtime.toISOString(),
    });
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const totalRows = manifest.datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0);
  console.log(
    `[portal-data] datasets=${manifest.datasets.length} rows=${totalRows} output=${path.relative(projectRoot, outputDir)}`,
  );
}

build();
