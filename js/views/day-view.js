/**
 * day-view.js – Detail view for a single birthday entry.
 *
 * State expected: { entryId: string, day: number, month: number, year: number }
 */

import {
  getToday,
  calculateAge,
} from '../utils.js';
import { getEntryById } from '../storage.js';

export class DayView {
  constructor(container, app) {
    this.container = container;
    this.app       = app;
    this._state    = null;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  render(state) {
    const entryId = state.entryId ?? this._state?.entryId;
    this._state   = { ...state, entryId };

    const { year } = this._state;
    const entry = entryId ? getEntryById(entryId) : null;

    if (!entry) {
      this.app.views.calendar.refresh();
      this.app.popView();
      return;
    }

    this.container.innerHTML = this._buildHTML(entry, year);
    this._bindEvents(entry, year);
  }

  // ─── HTML building ─────────────────────────────────────────────────────────

  _buildHTML(entry, year) {
    const today   = getToday();
    const isToday = entry.day === today.day && entry.month === today.month;
    const age     = entry.year ? calculateAge(entry.year, year) : null;

    const todayDate = new Date(today.year, today.month - 1, today.day);
    let nextBirthday = new Date(today.year, entry.month - 1, entry.day);
    if (nextBirthday < todayDate) nextBirthday = new Date(today.year + 1, entry.month - 1, entry.day);
    const daysUntil = Math.round((nextBirthday - todayDate) / 86400000);

    const dateObj    = new Date(year, entry.month - 1, entry.day);
    const fullDate   = dateObj.toLocaleDateString('de-DE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return `
      <header class="view-header">
        <div class="view-header__left">
          <button class="btn btn--ghost" id="day-btn-back" aria-label="Zurück">
            ‹ Zurück
          </button>
        </div>
        ${(this._state.fromSearch || this._state.fromStart) ? `
        <div class="view-header__right">
          <button class="btn btn--ghost" id="day-btn-to-calendar" aria-label="Zum Kalender">
            Zum Kalender ›
          </button>
        </div>` : ''}
      </header>

      <div class="scroll-area">
        ${this._buildHero(entry, isToday, daysUntil, fullDate, age)}
        ${this._buildInfoSection(entry)}
        <div class="dv-actions">
          <button class="btn btn--secondary" id="day-btn-edit"
                  aria-label="${this._esc(entry.name)} bearbeiten">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Bearbeiten
          </button>
          <button class="btn btn--danger-soft" id="day-btn-delete"
                  aria-label="${this._esc(entry.name)} löschen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Löschen
          </button>
        </div>
      </div>
    `;
  }

  _buildHero(entry, isToday, daysUntil, fullDate, age) {
    const countdownStatLabel = isToday ? ' ' : 'IN';
    const countdownStatValue = isToday
      ? 'HEUTE'
      : `${daysUntil} <span class="dv-hero__stat-unit">${daysUntil === 1 ? 'Tag' : 'Tagen'}</span>`;

    const statsHTML = [
      age !== null ? `
        <div class="dv-hero__stat">
          <span class="dv-hero__stat-label">WIRD</span>
          <div class="dv-hero__stat-value">${age} <span class="dv-hero__stat-unit">${age === 1 ? 'Jahr' : 'Jahre'}</span></div>
        </div>` : '',
      entry.year ? `
        <div class="dv-hero__stat">
          <span class="dv-hero__stat-label">JAHRGANG</span>
          <div class="dv-hero__stat-value">${entry.year}</div>
        </div>` : '',
      `<div class="dv-hero__stat${isToday ? ' dv-hero__stat--today' : ''}">
        <span class="dv-hero__stat-label">${countdownStatLabel}</span>
        <div class="dv-hero__stat-value">${countdownStatValue}</div>
      </div>`,
    ].join('');

    return `
      <div class="dv-hero${isToday ? ' dv-hero--today' : ''}">
        <div class="dv-hero__deco-lg" aria-hidden="true"></div>
        <div class="dv-hero__deco-sm" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"/>
            <rect x="2" y="7" width="20" height="5"/>
            <line x1="12" y1="22" x2="12" y2="7"/>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
          </svg>
        </div>
        <div class="dv-hero__body">
          <div class="dv-hero__name">${this._esc(entry.name)}</div>
          <div class="dv-hero__date">${fullDate}</div>
          <div class="dv-hero__stats">${statsHTML}</div>
        </div>
      </div>
    `;
  }

  _buildInfoSection(entry) {
    const rows = [];

    if (entry.category) {
      rows.push(`
        <div class="dv-info__row">
          <span class="dv-info__key">Kategorie</span>
          <span class="badge">${this._esc(entry.category)}</span>
        </div>
      `);
    }

    if (entry.note) {
      rows.push(`
        <div class="dv-note">
          <span class="dv-note__label">NOTIZ</span>
          <p class="dv-note__text">„${this._esc(entry.note)}"</p>
        </div>
      `);
    }

    if (rows.length === 0) return '';
    return `<div class="dv-info">${rows.join('')}</div>`;
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents(entry, year) {
    const q = (sel) => this.container.querySelector(sel);

    q('#day-btn-back')?.addEventListener('click', () => {
      if (this._state.fromStart) {
        this.app.backToStartView();
        return;
      }
      this.app.views.calendar.refresh();
      this.app.popView();
    });

    q('#day-btn-to-calendar')?.addEventListener('click', () => {
      const cal       = this.app.views.calendar;
      cal.month       = entry.month;
      cal.year        = this._state.year;
      cal.selectedDay = entry.day;
      cal.refresh();
      this.app.popToCalendar('left');
    });

    q('#day-btn-edit')?.addEventListener('click', () => {
      this.app.pushView('form', {
        mode: 'edit',
        id: entry.id,
        day: entry.day,
        month: entry.month,
        year,
      });
    });

    q('#day-btn-delete')?.addEventListener('click', () => {
      this.app.showDeleteModal(entry.id, () => {
        this.app.views.calendar.refresh();
        this.app.popView();
      });
    });
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
