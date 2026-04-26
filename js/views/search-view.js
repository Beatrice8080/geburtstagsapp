/**
 * search-view.js – Birthday search.
 *
 * Searches all entries by name and/or birth year.
 * Results are restricted to the coming 365 days starting from today.
 * Results are grouped by date and sorted ascending.
 */

import { getAllEntries }             from '../storage.js';
import { getToday, getMonthName, calculateAge } from '../utils.js';

export class SearchView {
  constructor(container, app) {
    this.container = container;
    this.app       = app;
  }

  render(_state = {}) {
    this.container.innerHTML = this._buildHTML();
    this._bindEvents();
  }

  // ─── HTML building ──────────────────────────────────────────────────────────

  _buildHTML() {
    return `
      <header class="view-header">
        <div class="view-header__left">
          <button class="btn btn--ghost" id="search-btn-back" aria-label="Zurück zum Kalender">
            ‹ Zurück
          </button>
        </div>
        <div class="view-header__title">Suche</div>
        <div class="view-header__right"></div>
      </header>
      <div class="search-view-body">
        <div class="search-form">
          <div class="form-group">
            <label class="form-label" for="search-input-name">Name</label>
            <input type="text" id="search-input-name"
                   placeholder="z.B. Anna"
                   autocomplete="off" autocorrect="off" />
          </div>
          <div class="form-group">
            <label class="form-label" for="search-input-year">Jahrgang</label>
            <input type="number" id="search-input-year"
                   placeholder="z.B. 1990"
                   min="1900" max="${getToday().year}" />
          </div>
          <button class="btn btn--primary btn--full" id="search-btn-run">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Suchen
          </button>
        </div>
        <div id="search-results" class="search-results"></div>
      </div>
    `;
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  _bindEvents() {
    const q = (sel) => this.container.querySelector(sel);

    q('#search-btn-back')?.addEventListener('click', () => this.app.popView());
    q('#search-btn-run')?.addEventListener('click', () => this._runSearch());

    this.container.querySelectorAll('#search-input-name, #search-input-year').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._runSearch();
      });
    });

    this.container.addEventListener('click', (e) => {
      const item = e.target.closest('#search-results .cal-day-panel__item');
      if (!item) return;
      this.app.pushView('day', {
        entryId:    item.dataset.entryId,
        day:        parseInt(item.dataset.day,   10),
        month:      parseInt(item.dataset.month, 10),
        year:       parseInt(item.dataset.year,  10),
        fromSearch: true,
      });
    });
  }

  // ─── Search logic ────────────────────────────────────────────────────────────

  _runSearch() {
    const nameQuery = this.container.querySelector('#search-input-name')?.value.trim() ?? '';
    const yearQuery = this.container.querySelector('#search-input-year')?.value.trim() ?? '';
    const results   = this._search(nameQuery, yearQuery);
    const el        = this.container.querySelector('#search-results');
    if (el) el.innerHTML = this._buildResultsHTML(results, nameQuery || yearQuery);
  }

  _search(nameQuery, yearQuery) {
    const today     = getToday();
    const todayDate = new Date(today.year, today.month - 1, today.day);
    const endDate   = new Date(todayDate);
    endDate.setDate(endDate.getDate() + 365);

    const parsedYear = yearQuery ? parseInt(yearQuery, 10) : null;
    const results    = [];

    for (const entry of getAllEntries()) {
      if (nameQuery && !entry.name.toLowerCase().includes(nameQuery.toLowerCase())) continue;
      if (parsedYear !== null && entry.year !== parsedYear) continue;

      let nextBirthday = new Date(today.year, entry.month - 1, entry.day);
      if (nextBirthday < todayDate) {
        nextBirthday = new Date(today.year + 1, entry.month - 1, entry.day);
      }

      if (nextBirthday <= endDate) {
        results.push({ entry, nextBirthday });
      }
    }

    results.sort((a, b) => a.nextBirthday - b.nextBirthday);
    return results;
  }

  // ─── Results HTML ────────────────────────────────────────────────────────────

  _buildResultsHTML(results, hasQuery) {
    if (results.length === 0) {
      if (!hasQuery) return '';
      return `<p class="search-results__empty">Keine Geburtstage gefunden.</p>`;
    }

    const today  = getToday();
    const groups = [];
    const keyMap = new Map();

    for (const { entry, nextBirthday } of results) {
      const key = `${nextBirthday.getFullYear()}-${nextBirthday.getMonth()}-${nextBirthday.getDate()}`;
      if (!keyMap.has(key)) {
        const group = { date: nextBirthday, entries: [] };
        keyMap.set(key, group);
        groups.push(group);
      }
      keyMap.get(key).entries.push(entry);
    }

    const html = [];

    for (const { date, entries } of groups) {
      const day     = date.getDate();
      const month   = date.getMonth() + 1;
      const year    = date.getFullYear();
      const isToday = day === today.day && month === today.month && year === today.year;
      const heading = `${day}. ${getMonthName(month).toUpperCase()} ${year}`;

      html.push(`<div class="search-results__heading">${heading}</div>`);

      for (const entry of entries) {
        const age     = entry.year ? calculateAge(entry.year, year) : null;
        const ageLine = age !== null
          ? `wird ${age} ${age === 1 ? 'Jahr' : 'Jahre'}`
          : 'Kein Jahrgang';
        const todayCls = isToday ? ' cal-day-panel__item--today' : '';

        html.push(`
          <div class="cal-day-panel__item${todayCls}"
               data-entry-id="${this._esc(entry.id)}"
               data-day="${day}" data-month="${month}" data-year="${year}"
               role="button" tabindex="0"
               aria-label="Details für ${this._esc(entry.name)}">
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
              <div class="cal-day-panel__name">${this._esc(entry.name)}</div>
              <div class="cal-day-panel__age">${ageLine}</div>
            </div>
            <span class="cal-day-panel__chevron" aria-hidden="true">›</span>
          </div>
        `);
      }
    }

    return html.join('');
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
