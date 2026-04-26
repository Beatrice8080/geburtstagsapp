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
  formatShortDate,
  calculateAge,
  daysInMonth,
  firstWeekdayOfMonth,
} from '../utils.js';
import { getDaysWithBirthdays, getEntriesForDay } from '../storage.js';

export class CalendarView {
  /**
   * @param {HTMLElement} container
   * @param {Object}      app  – App instance (router)
   */
  constructor(container, app) {
    this.container = container;
    this.app       = app;

    const today      = getToday();
    this.month       = today.month;
    this.year        = today.year;
    this.selectedDay = today.day;  // pre-select today on open

    // Panel events registered once here – this.container persists across
    // render() calls (only innerHTML changes), so listeners added in
    // _bindEvents() would accumulate. Constructor runs exactly once.
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('#cal-panel-add-btn')) {
        this.app.pushView('form', {
          mode: 'add',
          day: this.selectedDay,
          month: this.month,
          year: this.year,
        });
        return;
      }
      const item = e.target.closest('.cal-day-panel__item');
      if (item) {
        this.app.pushView('day', {
          entryId: item.dataset.entryId,
          day: this.selectedDay,
          month: this.month,
          year: this.year,
        });
      }
    });
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
    this.selectedDay = null;
    this.render();
  }

  _nextMonth() {
    if (this.month === 12) { this.month = 1; this.year += 1; }
    else                   { this.month += 1; }
    this.selectedDay = null;
    this.render();
  }

  _goToToday() {
    const today      = getToday();
    this.month       = today.month;
    this.year        = today.year;
    this.selectedDay = today.day;
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
      <div class="calendar-scroll-area">
        <div class="calendar-grid-wrapper">
          <div class="calendar-grid">
            ${this._buildDayCells(today, birthdayDays)}
          </div>
        </div>
        <div id="cal-day-panel">
          ${this.selectedDay ? this._buildDayPanel(this.selectedDay, this.month, this.year) : ''}
        </div>
      </div>
    `;
  }

  _buildDayPanel(day, month, year) {
    const entries = getEntriesForDay(day, month);
    const heading = `<div class="cal-day-panel__heading">${formatShortDate(day, month)}</div>`;

    if (entries.length === 0) {
      return `
        ${heading}
        <p class="cal-day-panel__empty">Kein Geburtstag an diesem Tag.</p>
        <div class="cal-day-panel__footer">
          <button class="btn btn--secondary btn--full" id="cal-panel-add-btn">
            + Geburtstag hinzufügen
          </button>
        </div>
      `;
    }

    const today   = getToday();
    const isToday = (day === today.day && month === today.month && year === today.year);

    const items = entries.map((e) => {
      const age     = e.year ? calculateAge(e.year, year) : null;
      const ageLine = age !== null
        ? `wird ${age} ${age === 1 ? 'Jahr' : 'Jahre'}`
        : 'Kein Jahrgang';
      const todayCls = isToday ? ' cal-day-panel__item--today' : '';
      return `
        <div class="cal-day-panel__item${todayCls}" data-entry-id="${e.id}"
             role="button" tabindex="0" aria-label="Details für ${this._esc(e.name)}">
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
    }).join('');

    return `
      ${heading}
      <div class="cal-day-panel__list">${items}</div>
      <div class="cal-day-panel__footer">
        <button class="btn btn--secondary btn--full" id="cal-panel-add-btn">
          + Geburtstag hinzufügen
        </button>
      </div>
    `;
  }

  _buildHeader(isCurrentMonth) {
    return `
      <header class="calendar-header">
        <button class="calendar-header__today" id="cal-btn-today"
                aria-label="Zum aktuellen Monat"
                style="${isCurrentMonth ? 'visibility:hidden;pointer-events:none' : ''}">
          Heute
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

        <button class="cal-icon-btn" id="cal-btn-search" aria-label="Suche">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
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
      const hasBirthday  = birthdayDays.has(day);
      const isSelected   = day === this.selectedDay;

      let cls = 'calendar-day';
      if (isToday)     cls += ' calendar-day--today';
      if (hasBirthday) cls += ' calendar-day--has-birthday';
      if (isSelected)  cls += ' calendar-day--selected';

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
    q('#cal-btn-search')?.addEventListener('click', () => this.app.pushView('search', {}));

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

    // Remove selection highlight from previously selected cell
    this.container.querySelector('.calendar-day--selected')
      ?.classList.remove('calendar-day--selected');

    if (this.selectedDay === day) {
      // Clicking same day again keeps selection unchanged
      cell.classList.add('calendar-day--selected');
      return;
    }
    this.selectedDay = day;
    cell.classList.add('calendar-day--selected');

    // Update panel without full re-render (no new listeners needed –
    // the container-level listener set in _bindEvents handles all panel clicks)
    const panel = this.container.querySelector('#cal-day-panel');
    if (panel) {
      panel.innerHTML = this.selectedDay
        ? this._buildDayPanel(this.selectedDay, this.month, this.year)
        : '';
    }
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
