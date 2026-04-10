import * as XLSX from "xlsx";

/**
 * exportToCsv
 * Transforms an array of objects into a CSV string and triggers a download.
 */
export function exportToCsv<T extends Record<string, any>>(data: T[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // header row
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName];
          const stringified =
            value === null || value === undefined ? "" : String(value);
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = stringified.replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
            ? `"${escaped}"`
            : escaped;
        })
        .join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * exportToExcel
 * Uses the xlsx library (already in package.json) to generate an .xlsx file.
 */
export function exportToExcel<T extends Record<string, any>>(data: T[], filename: string, sheetName = "Dados") {
  if (data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Write and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
