/**
 * utils.js – Date helpers, formatting, and ID generation.
 *
 * All functions are pure (no side-effects, no DOM access)
 * so they can safely be imported by any other module.
 */

// ──�� German locale strings ────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const WEEKDAY_NAMES = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
  'Donnerstag', 'Freitag', 'Samstag',
];

// ─── ID generation ────────────────────────────────────────────────────────────

/**
 * Returns a random UUID v4 string.
 * Uses crypto.randomUUID() when available, falls back to Math.random().
 * @returns {string}
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is unavailable
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns { day, month, year } for today's local date.
 * @returns {{ day: number, month: number, year: number }}
 */
export function getToday() {
  const now = new Date();
  return {
    day:   now.getDate(),
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  };
}

/**
 * Returns today's date as an ISO string (YYYY-MM-DD).
 * @returns {string}
 */
export function getTodayISO() {
  const { year, month, day } = getToday();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Checks whether a given day/month combination is valid.
 * Uses an arbitrary non-leap year (2001) by default so that 29 Feb is invalid.
 * To allow 29 Feb in a leap year, pass the actual target year.
 *
 * @param {number} day
 * @param {number} month
 * @param {number} [year=2001]
 * @returns {boolean}
 */
export function isValidDate(day, month, year = 2001) {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const d = new Date(year, month - 1, day);
  return d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Calculates how old someone born in `birthYear` will be in `atYear`.
 * Does NOT account for whether the birthday has passed yet in that year;
 * that is intentional (we show the age they will turn this year).
 *
 * @param {number} birthYear
 * @param {number} atYear
 * @returns {number}
 */
export function calculateAge(birthYear, atYear) {
  return atYear - birthYear;
}

/**
 * Returns an array of { day, month, year } objects for today plus the
 * next `count - 1` days (total `count` days starting from today).
 *
 * @param {number} count
 * @returns {Array<{ day: number, month: number, year: number }>}
 */
export function getUpcomingDays(count) {
  const result = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    result.push({
      day:   d.getDate(),
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
    });
  }
  return result;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Returns the German name of a month (1-indexed).
 * @param {number} month  1–12
 * @returns {string}
 */
export function getMonthName(month) {
  return MONTH_NAMES[month - 1] ?? '';
}

/**
 * Returns the German weekday name for a given Date object.
 * @param {Date} date
 * @returns {string}
 */
export function getWeekdayName(date) {
  return WEEKDAY_NAMES[date.getDay()];
}

/**
 * Formats a date as "Wochentag, TT. Monat JJJJ"
 * e.g. "Montag, 14. April 2026"
 *
 * @param {number} day
 * @param {number} month
 * @param {number} year
 * @returns {string}
 */
export function formatFullDate(day, month, year) {
  const date = new Date(year, month - 1, day);
  return `${getWeekdayName(date)}, ${day}. ${getMonthName(month)} ${year}`;
}

/**
 * Formats a date as "TT. Monat" (without year), e.g. "14. April"
 *
 * @param {number} day
 * @param {number} month
 * @returns {string}
 */
export function formatShortDate(day, month) {
  return `${day}. ${getMonthName(month)}`;
}

/**
 * Formats a month + year as "Monat JJJJ", e.g. "April 2026".
 *
 * @param {number} month
 * @param {number} year
 * @returns {string}
 */
export function formatMonthYear(month, year) {
  return `${getMonthName(month)} ${year}`;
}

/**
 * Returns the number of days in a given month/year
 * (correctly handles leap years).
 *
 * @param {number} month  1–12
 * @param {number} year
 * @returns {number}
 */
export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns the weekday index (0=Sun … 6=Sat) of the first day
 * of the given month/year.
 *
 * @param {number} month
 * @param {number} year
 * @returns {number}
 */
export function firstWeekdayOfMonth(month, year) {
  return new Date(year, month - 1, 1).getDay();
}
