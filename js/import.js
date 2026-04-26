/**
 * import.js – CSV import for birthday entries.
 *
 * Expected format (identical to export.js output):
 *   First row: column headers (skipped)
 *   Columns: Name, Tag, Monat, Jahrgang, Kategorie, Notiz
 *
 * Rules:
 *   - Invalid rows are skipped; the rest are imported
 *   - Duplicates (same name case-insensitive + day + month) are silently skipped
 *   - Imported entries are added to existing data (nothing is overwritten)
 *   - Leading zeros in day/month are handled transparently via parseInt
 */

import { getAllEntries, saveEntry } from './storage.js';
import { isValidDate, getMonthName } from './utils.js';

const VALID_CATEGORIES = new Set(['', 'Familie', 'Freund*innen', 'Kolleg*innen', 'Sonstige']);

// ─── CSV parsing ──────────────────────────────────────────────────────────────

/**
 * Detects whether the CSV uses commas or semicolons as separator.
 * Checks the header line; falls back to comma.
 *
 * @param {string} headerLine
 * @returns {',' | ';'}
 */
function detectSeparator(headerLine) {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas     = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ';' : ',';
}

/**
 * Parses a single CSV line into an array of field strings.
 * Handles RFC-4180 quoting: fields wrapped in double-quotes,
 * internal double-quotes escaped as "".
 *
 * @param {string} line
 * @param {',' | ';'} sep  field separator
 * @returns {string[]}
 */
function parseCSVLine(line, sep) {
  const fields = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === '"') {
      let field = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === sep) i++;
    } else {
      const sepPos = line.indexOf(sep, i);
      if (sepPos === -1) {
        fields.push(line.slice(i).trim());
        break;
      } else {
        fields.push(line.slice(i, sepPos).trim());
        i = sepPos + 1;
      }
    }
  }

  return fields;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a parsed CSV row.
 * Leading zeros in day/month (e.g. "01", "02") are handled by parseInt.
 *
 * @param {string[]} fields  [name, day, month, year, category, note]
 * @returns {{ valid: true, entry: Object } | { valid: false, reason: string }}
 */
function validateRow(fields) {
  const [rawName, rawDay, rawMonth, rawYear, rawCategory, rawNote] = fields;

  const name = (rawName ?? '').trim();
  if (!name) return { valid: false, reason: 'Name fehlt' };

  const day = parseInt(rawDay, 10);
  if (!rawDay?.trim() || isNaN(day)) {
    return { valid: false, reason: 'Tag fehlt oder ungültig' };
  }

  const month = parseInt(rawMonth, 10);
  if (!rawMonth?.trim() || isNaN(month)) {
    return { valid: false, reason: 'Monat fehlt oder ungültig' };
  }

  if (!isValidDate(day, month)) {
    const monthStr = month >= 1 && month <= 12 ? getMonthName(month) : String(month);
    return { valid: false, reason: `Ungültiges Datum (${day}. ${monthStr})` };
  }

  let year = null;
  if (rawYear?.trim()) {
    year = parseInt(rawYear, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear) {
      return { valid: false, reason: `Ungültiger Jahrgang (${rawYear.trim()})` };
    }
  }

  const category = (rawCategory ?? '').trim();
  if (!VALID_CATEGORIES.has(category)) {
    return { valid: false, reason: `Ungültige Kategorie (${rawCategory?.trim() ?? ''})` };
  }

  const note = (rawNote ?? '').trim() || null;

  return {
    valid: true,
    entry: { name, day, month, year, category: category || null, note },
  };
}

// ─── Duplicate check ──────────────────────────────────────────────────────────

/**
 * Returns true when candidate matches an existing entry
 * (case-insensitive name + same day + same month).
 *
 * @param {{ name: string, day: number, month: number }} candidate
 * @param {Object[]} existingEntries
 * @returns {boolean}
 */
function isDuplicate(candidate, existingEntries) {
  const nameLower = candidate.name.toLowerCase();
  return existingEntries.some(
    (e) =>
      e.name.toLowerCase() === nameLower &&
      e.day === candidate.day &&
      e.month === candidate.month,
  );
}

// ─── Main import function ─────────────────────────────────────────────────────

/**
 * Parses CSV text and imports valid, non-duplicate entries into storage.
 *
 * @param {string} csvText  Raw file content (UTF-8, BOM optional)
 * @returns {{ imported: number, skippedDuplicates: number, errorLines: string[] }}
 */
export function processCSVImport(csvText) {
  // Normalize line endings and strip BOM
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const stripped   = normalized.charCodeAt(0) === 0xFEFF ? normalized.slice(1) : normalized;

  const lines = stripped.split('\n');

  // Detect separator from header row; skip header; ignore blank lines
  const sep       = detectSeparator(lines[0] ?? '');
  const dataLines = lines.slice(1).filter((l) => l.trim() !== '');

  const errorLines = [];
  let imported          = 0;
  let skippedDuplicates = 0;
  let existingEntries   = getAllEntries();

  for (let i = 0; i < dataLines.length; i++) {
    const lineNumber = i + 2; // 1-based; header occupies line 1
    const fields = parseCSVLine(dataLines[i], sep);
    const result = validateRow(fields);

    if (!result.valid) {
      errorLines.push(`Zeile ${lineNumber}: ${result.reason}`);
      continue;
    }

    if (isDuplicate(result.entry, existingEntries)) {
      skippedDuplicates++;
      continue;
    }

    try {
      const saved = saveEntry(result.entry);
      existingEntries.push(saved); // keep local list current for subsequent duplicate checks
      imported++;
    } catch {
      errorLines.push(`Zeile ${lineNumber}: Speichern fehlgeschlagen`);
    }
  }

  return { imported, skippedDuplicates, errorLines };
}
