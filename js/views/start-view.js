/**
 * start-view.js – Start overlay shown every time the app opens.
 *
 * Displays birthdays for today and the next 2 days (3 days total),
 * grouped by day. Closing the view reveals the calendar behind it.
 *
 * This view uses the .view--overlay CSS class (slides up from bottom).
 */

import {
  getUpcomingDays,
  formatShortDate,
  formatFullDate,
  calculateAge,
} from '../utils.js';
import { getEntriesForDay } from '../storage.js';

export class StartView {
  /**
   * @param {HTMLElement} container
   * @param {Object}      app
   */
  constructor(container, app) {
    this.container = container;
    this.app       = app;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  render(_state = {}) {
    const days    = getUpcomingDays(3); // today + next 2 days
    const groups  = days.map((d) => ({
      ...d,
      entries: getEntriesForDay(d.day, d.month),
    }));

    this.container.innerHTML = this._buildHTML(groups);
    this._bindEvents();
  }

  // ─── HTML building ─────────────────────────────────────────────────────────

  _buildHTML(groups) {
    const hasAnyEntry = groups.some((g) => g.entries.length > 0);

    return `
      <div class="start-sheet">
        <div class="start-sheet__handle" aria-hidden="true"></div>

        <header class="start-sheet__header">
          <h1 class="start-sheet__title">🎂 Geburtstage</h1>
          <button class="start-sheet__close" id="start-btn-close"
                  aria-label="Schließen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div class="start-sheet__body scroll-area">
          ${hasAnyEntry
            ? groups.map((g) => this._buildGroup(g)).join('')
            : this._buildEmpty()
          }
        </div>
      </div>
    `;
  }

  _buildGroup(group) {
    if (group.entries.length === 0) return '';

    const { day, month, year, entries } = group;
    const today   = new Date();
    const isToday = (day === today.getDate() && month === today.getMonth() + 1);
    const label   = isToday
      ? 'Heute'
      : this._relativeLabel(day, month, today);

    return `
      <div class="day-group animate-fade-in-up">
        <div class="day-group__label">${label}</div>
        <div class="day-group__date">${formatFullDate(day, month, year)}</div>
        ${entries.map((e) => this._buildEntryCard(e, year)).join('')}
      </div>
    `;
  }

  _buildEntryCard(entry, displayYear) {
    const agePart = entry.year
      ? ` · wird ${calculateAge(entry.year, displayYear)} Jahre alt`
      : '';
    const categoryPart = entry.category
      ? `<span class="badge">${entry.category}</span>`
      : '';
    const notePart = entry.note
      ? `<p class="entry-card__note">„${entry.note}"</p>`
      : '';

    return `
      <div class="entry-card">
        <div class="entry-card__name">${this._esc(entry.name)}</div>
        <div class="entry-card__meta">
          ${entry.year ? `Jahrgang ${entry.year}${agePart}` : 'Kein Jahrgang eingetragen'}
        </div>
        ${categoryPart}
        ${notePart}
      </div>
    `;
  }

  _buildEmpty() {
    return `
      <div class="empty-state animate-fade-in-up">
        <div class="empty-state__icon">🎉</div>
        <p class="empty-state__title">Keine Geburtstage heute</p>
        <p class="empty-state__text">
          In den nächsten drei Tagen stehen keine Geburtstage an.
        </p>
      </div>
    `;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Returns "Morgen" or "Übermorgen" relative to today.
   * @param {number} day
   * @param {number} month
   * @param {Date}   today
   * @returns {string}
   */
  _relativeLabel(day, month, today) {
    const target = new Date(today.getFullYear(), month - 1, day);
    const diff   = Math.round(
      (target - new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      / 86400000
    );
    if (diff === 1) return 'Morgen';
    if (diff === 2) return 'Übermorgen';
    return formatShortDate(day, month);
  }

  /** Escapes HTML special characters to prevent XSS. */
  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    this.container.querySelector('#start-btn-close')
      ?.addEventListener('click', () => this.app.closeStartView());
  }
}
