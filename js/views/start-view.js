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
import { getEntriesForDay, getAllEntries } from '../storage.js';

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
        <header class="start-sheet__header">
          <h1 class="start-sheet__title">Die nächsten<br>Geburtstage.</h1>
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
        ${entries.map((e) => this._buildEntryCard(e, year, isToday)).join('')}
      </div>
    `;
  }

  _buildEntryCard(entry, displayYear, isToday = false) {
    const age     = entry.year ? calculateAge(entry.year, displayYear) : null;
    const agePart = age !== null
      ? ` · wird ${age} ${age === 1 ? 'Jahr' : 'Jahre'}`
      : '';
    const categoryPart = entry.category
      ? `<span class="badge">${entry.category}</span>`
      : '';
    const notePart = entry.note
      ? `<p class="entry-card__note">„${entry.note}"</p>`
      : '';

    const todayDeco = isToday ? `
      <div class="entry-card__today-circle-lg" aria-hidden="true"></div>
      <div class="entry-card__today-circle-sm" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="white" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      </div>
    ` : '';

    const upcomingDeco = !isToday ? `
      <div class="entry-card__upcoming-circle-lg" aria-hidden="true"></div>
      <div class="entry-card__upcoming-circle-sm" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="var(--color-accent)" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      </div>
    ` : '';

    return `
      <div class="entry-card${isToday ? ' entry-card--today' : ' entry-card--upcoming'}"
           data-entry-id="${this._esc(entry.id)}"
           data-day="${entry.day}"
           data-month="${entry.month}"
           data-year="${displayYear}"
           role="button" tabindex="0"
           aria-label="Details für ${this._esc(entry.name)}">
        ${isToday ? todayDeco : upcomingDeco}
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
    const next = this._findNextBirthdays();

    const cards = next
      ? next.entries.map((e) => {
          const age     = e.year ? calculateAge(e.year, next.year) : null;
          const ageLine = age !== null
            ? `wird ${age} ${age === 1 ? 'Jahr' : 'Jahre'}`
            : 'Kein Jahrgang';
          return `
            <div class="cal-day-panel__item empty-next-card"
                 data-entry-id="${this._esc(e.id)}"
                 data-day="${e.day}" data-month="${e.month}" data-year="${next.year}"
                 role="button" tabindex="0"
                 aria-label="Details für ${this._esc(e.name)}">
              <div class="cal-day-panel__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 12 20 22 4 22 4 12"/>
                  <rect x="2" y="7" width="20" height="5"/>
                  <line x1="12" y1="22" x2="12" y2="7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </div>
              <div class="cal-day-panel__info">
                <div class="cal-day-panel__name">${this._esc(e.name)}</div>
                <div class="cal-day-panel__age">${ageLine}</div>
              </div>
              <span class="cal-day-panel__chevron" aria-hidden="true">›</span>
            </div>
          `;
        }).join('')
      : '';

    const plural       = next && next.entries.length > 1;
    const nextLabel    = next
      ? `<p class="empty-state__text">
           ${plural ? 'Nächste Geburtstage' : 'Nächster Geburtstag'} in ${next.days} ${next.days === 1 ? 'Tag' : 'Tagen'}:
         </p>`
      : '';

    return `
      <div class="animate-fade-in-up">
        <div class="empty-state${next ? ' empty-state--compact' : ''}">
          <div class="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <p class="empty-state__title">Keine Geburtstage.</p>
          <p class="empty-state__text">
            Heute und in den kommenden beiden Tagen stehen keine Geburtstage an.
          </p>
          ${nextLabel}
        </div>
        ${cards}
      </div>
    `;
  }

  _findNextBirthdays() {
    const entries = getAllEntries();
    if (entries.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let minDays  = Infinity;
    let nextDay  = null;
    let nextMonth = null;
    let nextYear = null;

    for (const entry of entries) {
      let next = new Date(today.getFullYear(), entry.month - 1, entry.day);
      next.setHours(0, 0, 0, 0);
      if (next <= today) {
        next = new Date(today.getFullYear() + 1, entry.month - 1, entry.day);
      }
      const diff = Math.round((next - today) / 86400000);
      if (diff < minDays) {
        minDays   = diff;
        nextDay   = entry.day;
        nextMonth = entry.month;
        nextYear  = next.getFullYear();
      }
    }

    if (nextDay === null) return null;

    const nextEntries = entries.filter((e) => e.day === nextDay && e.month === nextMonth);
    return { entries: nextEntries, days: minDays, year: nextYear, day: nextDay, month: nextMonth };
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
    this.container.querySelectorAll('.entry-card').forEach((card) => {
      card.addEventListener('click', () => {
        const entryId = card.dataset.entryId;
        const day     = +card.dataset.day;
        const month   = +card.dataset.month;
        const year    = +card.dataset.year;
        this.app.pushViewFromStart('day', { entryId, day, month, year, fromStart: true });
      });
    });

    this.container.querySelectorAll('.empty-next-card').forEach((card) => {
      card.addEventListener('click', () => {
        const entryId = card.dataset.entryId;
        const day     = +card.dataset.day;
        const month   = +card.dataset.month;
        const year    = +card.dataset.year;
        this.app.pushViewFromStart('day', { entryId, day, month, year, fromStart: true });
      });
    });
  }
}
