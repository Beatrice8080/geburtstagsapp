/**
 * calendar-view.js – Monthly calendar view.
 *
 * Always rendered as the base layer (z-index 0).
 * Navigation: prev/next month, "Heute" button.
 * Day cells are clickable and open the Tages-Detailansicht.
 *
 * Birthday dots are computed from storage on every render so that
 * changes made in the form view are immediately reflected.
 */

import {
  getToday,
  getMonthName,
  formatMonthYear,
  daysInMonth,
  firstWeekdayOfMonth,
} from '../utils.js';
import { getDaysWithBirthdays } from '../storage.js';

export class CalendarView {
  /**
   * @param {HTMLElement} container
   * @param {Object}      app  – App instance (router)
   */
  constructor(container, app) {
    this.container = container;
    this.app       = app;

    const today  = getToday();
    this.month   = today.month;
    this.year    = today.year;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Renders (or re-renders) the calendar for the currently stored month/year.
   */
  render(_state = {}) {
    this.container.innerHTML = this._buildHTML();
    this._bindEvents();
  }

  /** Re-renders in place (alias for render, used by other views after data changes). */
  refresh() {
    this.render();
  }

  // ─── Month navigation ──────────────────────────────────────────────────────

  _prevMonth() {
    if (this.month === 1) { this.month = 12; this.year -= 1; }
    else                  { this.month -= 1; }
    this.render();
  }

  _nextMonth() {
    if (this.month === 12) { this.month = 1; this.year += 1; }
    else                   { this.month += 1; }
    this.render();
  }

  _goToToday() {
    const today = getToday();
    this.month  = today.month;
    this.year   = today.year;
    this.render();
  }

  // ─── HTML building ─────────────────────────────────────────────────────────

  _buildHTML() {
    const today          = getToday();
    const isCurrentMonth = (this.month === today.month && this.year === today.year);
    const birthdayDays   = getDaysWithBirthdays(this.month);

    return `
      ${this._buildHeader(isCurrentMonth)}
      ${this._buildWeekdays()}
      <div class="calendar-grid-wrapper">
        <div class="calendar-grid">
          ${this._buildDayCells(today, birthdayDays)}
        </div>
      </div>
      ${this._buildFooter()}
    `;
  }

  _buildFooter() {
    return `
      <footer class="calendar-footer">
        <button class="calendar-footer__btn" id="cal-btn-start"
                aria-label="Heutige Geburtstage anzeigen">
          🎂 Geburtstage
        </button>
      </footer>
    `;
  }

  _buildHeader(isCurrentMonth) {
    // Gear icon as inline SVG so no external font/icon library is needed
    const gearIcon = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83
                 l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21
                 a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0
                 -1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0
                 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65
                 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1
                 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0
                 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65
                 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65
                 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                 a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>`;

    return `
      <header class="calendar-header">
        <button class="cal-icon-btn" id="cal-btn-settings" aria-label="Einstellungen">
          ${gearIcon}
        </button>

        <div class="calendar-header__nav">
          <button class="calendar-header__month-btn" id="cal-btn-prev"
                  aria-label="Vorheriger Monat">&#8249;</button>
          <span class="calendar-header__month-text">
            ${formatMonthYear(this.month, this.year)}
          </span>
          <button class="calendar-header__month-btn" id="cal-btn-next"
                  aria-label="Nächster Monat">&#8250;</button>
        </div>

        <button class="calendar-header__today" id="cal-btn-today"
                aria-label="Zum aktuellen Monat"
                style="${isCurrentMonth ? 'visibility:hidden;pointer-events:none' : ''}">
          Heute
        </button>
      </header>
    `;
  }

  _buildWeekdays() {
    const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const cells  = labels.map((l, i) => {
      const weekend = i >= 5 ? ' calendar-weekdays__cell--weekend' : '';
      return `<div class="calendar-weekdays__cell${weekend}">${l}</div>`;
    });
    return `<div class="calendar-weekdays">${cells.join('')}</div>`;
  }

  _buildDayCells(today, birthdayDays) {
    const cells      = [];
    const numDays    = daysInMonth(this.month, this.year);
    // German calendars start on Monday.
    // firstWeekdayOfMonth returns 0=Sun…6=Sat; convert to 0=Mon…6=Sun.
    const rawFirst   = firstWeekdayOfMonth(this.month, this.year);
    const leading    = (rawFirst + 6) % 7;

    for (let i = 0; i < leading; i++) {
      cells.push('<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= numDays; day++) {
      const isToday = (
        this.year  === today.year  &&
        this.month === today.month &&
        day        === today.day
      );
      const hasBirthday = birthdayDays.has(day);

      let cls = 'calendar-day';
      if (isToday)     cls += ' calendar-day--today';
      if (hasBirthday) cls += ' calendar-day--has-birthday';

      const ariaLabel = `${day}. ${getMonthName(this.month)}${hasBirthday ? ', hat Geburtstag' : ''}`;

      cells.push(`
        <div class="${cls}" data-day="${day}"
             role="button" tabindex="0" aria-label="${ariaLabel}">
          <span class="calendar-day__num">${day}</span>
          <span class="calendar-day__dot" aria-hidden="true"></span>
        </div>
      `);
    }

    return cells.join('');
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    const q = (sel) => this.container.querySelector(sel);

    q('#cal-btn-prev')?.addEventListener('click', () => this._prevMonth());
    q('#cal-btn-next')?.addEventListener('click', () => this._nextMonth());
    q('#cal-btn-today')?.addEventListener('click', () => this._goToToday());

    q('#cal-btn-settings')?.addEventListener('click', () => {
      this.app.pushView('settings', {});
    });

    q('#cal-btn-start')?.addEventListener('click', () => this.app.showStartView());

    // Day cell tap / click
    const grid = q('.calendar-grid');
    grid?.addEventListener('click', (e) => this._onDayClick(e));
    grid?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._onDayClick(e);
      }
    });
  }

  _onDayClick(e) {
    const cell = e.target.closest('.calendar-day:not(.calendar-day--empty)');
    if (!cell) return;
    const day = parseInt(cell.dataset.day, 10);
    this.app.pushView('day', { day, month: this.month, year: this.year });
  }
}
