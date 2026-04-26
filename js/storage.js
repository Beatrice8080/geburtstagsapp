/**
 * storage.js – localStorage abstraction for birthday entries.
 *
 * All data is stored under a single key as a JSON array.
 * Each entry conforms to the data model defined in the requirements.
 *
 * Data model:
 *   id        {string}       UUID, auto-generated
 *   name      {string}       required, max 100 chars
 *   day       {number}       1–31
 *   month     {number}       1–12
 *   year      {number|null}  1900–current year, or null
 *   category  {string|null}  "Familie" | "Freund*innen" | "Kolleg*innen" | "Sonstige" | null
 *   note      {string|null}  max 500 chars, or null
 *   createdAt {string}       ISO timestamp
 *   updatedAt {string}       ISO timestamp
 */

import { generateUUID } from './utils.js';

const STORAGE_KEY = 'geburtstagsapp_entries';

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns all stored entries.
 * Returns an empty array when storage is empty or corrupted.
 * @returns {Array<Object>}
 */
export function getAllEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Returns a single entry by its id, or null if not found.
 * @param {string} id
 * @returns {Object|null}
 */
export function getEntryById(id) {
  return getAllEntries().find((e) => e.id === id) ?? null;
}

/**
 * Returns all entries whose day and month match the given values.
 * Sorted by name alphabetically.
 *
 * @param {number} day
 * @param {number} month
 * @returns {Array<Object>}
 */
export function getEntriesForDay(day, month) {
  return getAllEntries()
    .filter((e) => e.day === day && e.month === month)
    .sort((a, b) => a.name.localeCompare(b, 'de'));
}

/**
 * Returns all entries that have a birthday on the given day and month,
 * regardless of stored year. Used to mark calendar days and to build
 * the upcoming-birthdays list.
 *
 * @param {number} month
 * @returns {Set<number>}  set of day-numbers that have at least one entry
 */
export function getDaysWithBirthdays(month) {
  const days = new Set();
  getAllEntries()
    .filter((e) => e.month === month)
    .forEach((e) => days.add(e.day));
  return days;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Saves a new entry to storage.
 * Automatically assigns id, createdAt, and updatedAt.
 *
 * @param {{ name, day, month, year, category, note }} data
 * @returns {Object}  the complete saved entry
 * @throws {Error}    if localStorage write fails
 */
export function saveEntry(data) {
  const entries = getAllEntries();
  const now = new Date().toISOString();

  const entry = {
    id:        generateUUID(),
    name:      data.name.trim(),
    day:       data.day,
    month:     data.month,
    year:      data.year ?? null,
    category:  data.category ?? null,
    note:      data.note?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  entries.push(entry);
  persist(entries);
  return entry;
}

/**
 * Updates an existing entry identified by id.
 * Preserves id and createdAt; sets updatedAt to now.
 *
 * @param {string} id
 * @param {{ name, day, month, year, category, note }} updates
 * @returns {Object|null}  the updated entry, or null if id not found
 * @throws {Error}         if localStorage write fails
 */
export function updateEntry(id, updates) {
  const entries = getAllEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return null;

  entries[index] = {
    ...entries[index],
    name:      updates.name.trim(),
    day:       updates.day,
    month:     updates.month,
    year:      updates.year ?? null,
    category:  updates.category ?? null,
    note:      updates.note?.trim() || null,
    updatedAt: new Date().toISOString(),
  };

  persist(entries);
  return entries[index];
}

/**
 * Deletes the entry with the given id.
 *
 * @param {string} id
 * @returns {boolean}  true if the entry was found and deleted
 * @throws {Error}     if localStorage write fails
 */
export function deleteEntry(id) {
  const entries = getAllEntries();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  persist(filtered);
  return true;
}

// ─── Internal ────────────────────────────────────────────────────────────────

/**
 * Writes the entries array to localStorage.
 * Throws a user-facing error when storage is unavailable or full.
 *
 * @param {Array<Object>} entries
 */
function persist(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    throw new Error('Speichern fehlgeschlagen. Bitte versuche es erneut.');
  }
}
