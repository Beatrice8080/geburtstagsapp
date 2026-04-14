/**
 * export.js – CSV export for all birthday entries.
 *
 * Format:
 *   - UTF-8 with BOM (ensures Excel on Windows displays umlauts correctly)
 *   - First row: German column headers
 *   - Columns: Name, Tag, Monat, Jahrgang, Kategorie, Notiz
 *   - Empty optional fields → empty cell (not "null" or "-")
 *   - Filename: geburtstage_export_JJJJ-MM-TT.csv
 */

import { getAllEntries } from './storage.js';
import { getTodayISO }  from './utils.js';

/** Column headers in the order they appear in the CSV. */
const HEADERS = ['Name', 'Tag', 'Monat', 'Jahrgang', 'Kategorie', 'Notiz'];

/**
 * Wraps a cell value in double-quotes and escapes any double-quotes inside.
 * This handles commas, newlines, and quote characters in values.
 *
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
function csvCell(value) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Converts an entry object into a CSV row array.
 * @param {Object} entry
 * @returns {string[]}
 */
function entryToRow(entry) {
  return [
    csvCell(entry.name),
    csvCell(entry.day),
    csvCell(entry.month),
    csvCell(entry.year),       // empty string when null
    csvCell(entry.category),   // empty string when null
    csvCell(entry.note),       // empty string when null
  ];
}

/**
 * Builds the complete CSV string from all stored entries.
 * Rows are sorted by month then day (alphabetical name as tertiary key).
 *
 * @returns {string}  CSV content (WITHOUT BOM – added separately)
 */
function buildCSV() {
  const entries = getAllEntries().slice().sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    if (a.day   !== b.day)   return a.day   - b.day;
    return a.name.localeCompare(b.name, 'de');
  });

  const headerRow = HEADERS.map(csvCell).join(',');
  const dataRows  = entries.map((e) => entryToRow(e).join(','));

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Triggers a CSV download in the browser.
 * Creates a temporary <a> element, clicks it programmatically, then removes it.
 *
 * @throws {Error}  when the download cannot be initiated
 */
export function exportCSV() {
  try {
    const csvContent = buildCSV();

    // UTF-8 BOM: \uFEFF tells Excel this file is UTF-8 encoded
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url      = URL.createObjectURL(blob);
    const filename = `geburtstage_export_${getTodayISO()}.csv`;

    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release the object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    throw new Error('Export fehlgeschlagen. Bitte versuche es erneut.');
  }
}
