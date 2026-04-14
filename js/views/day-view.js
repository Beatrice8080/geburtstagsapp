/**
 * day-view.js – Detail view for a single calendar day.
 *
 * Shows all birthday entries for the selected day.
 * Each entry has Edit and Delete buttons.
 * A fixed "Geburtstag hinzufügen" button opens the form view
 * with day and month pre-filled.
 *
 * State expected: { day: number, month: number, year: number }
 */

import {
  formatFullDate,
  formatShortDate,
  calculateAge,
} from '../utils.js';
import { getEntriesForDay } from '../storage.js';

export class DayView {
  /**
   * @param {HTMLElement} container
   * @param {Object}      app
   */
  constructor(container, app) {
    this.container = container;
    this.app       = app;
    /** Current state, kept so refresh() can re-render without arguments */
    this._state    = null;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  render(state) {
    this._state = state;
    const { day, month, year } = state;
    const entries = getEntriesForDay(day, month);

    this.container.innerHTML = this._buildHTML(day, month, year, entries);
    this._bindEvents(day, month, year, entries);
  }

  // ─── HTML building ─────────────────────────────────────────────────────────

  _buildHTML(day, month, year, entries) {
    return `
      <header class="view-header">
        <div class="view-header__left">
          <button class="btn btn--ghost" id="day-btn-back"
                  aria-label="Zurück zum Kalender">
            ‹ Zurück
          </button>
        </div>
        <h1 class="view-header__title" style="font-size:var(--font-md)">
          ${formatShortDate(day, month)}
        </h1>
        <div class="view-header__right"></div>
      </header>

      <div class="scroll-area">
        <p class="day-view__full-date">${formatFullDate(day, month, year)}</p>

        <div id="day-entries-list">
          ${entries.length > 0
            ? entries.map((e) => this._buildEntryCard(e, year)).join('')
            : this._buildEmpty()
          }
        </div>
      </div>

      <!-- Floating action button to add a new entry -->
      <div class="day-view__footer">
        <button class="btn btn--primary btn--full" id="day-btn-add">
          + Geburtstag hinzufügen
        </button>
      </div>
    `;
  }

  _buildEntryCard(entry, displayYear) {
    const ageLine = entry.year
      ? `Jahrgang ${entry.year} · wird ${calculateAge(entry.year, displayYear)} Jahre alt`
      : 'Kein Jahrgang eingetragen';

    const categoryBadge = entry.category
      ? `<span class="badge">${this._esc(entry.category)}</span>`
      : '';

    const noteBlock = entry.note
      ? `<p class="entry-card__note">„${this._esc(entry.note)}"</p>`
      : '';

    return `
      <div class="entry-card animate-fade-in-up" data-id="${entry.id}">
        <div class="entry-card__name">${this._esc(entry.name)}</div>
        <div class="entry-card__meta">${ageLine}</div>
        ${categoryBadge}
        ${noteBlock}
        <div class="entry-card__actions">
          <button class="btn btn--secondary btn--sm day-btn-edit"
                  data-id="${entry.id}" aria-label="${this._esc(entry.name)} bearbeiten">
            Bearbeiten
          </button>
          <button class="btn btn--ghost-danger btn--sm day-btn-delete"
                  data-id="${entry.id}" aria-label="${this._esc(entry.name)} löschen">
            Löschen
          </button>
        </div>
      </div>
    `;
  }

  _buildEmpty() {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">📅</div>
        <p class="empty-state__title">Kein Geburtstag</p>
        <p class="empty-state__text">
          An diesem Tag ist noch kein Geburtstag eingetragen.
        </p>
      </div>
    `;
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents(day, month, year, _entries) {
    const q = (sel) => this.container.querySelector(sel);

    // Back button
    q('#day-btn-back')?.addEventListener('click', () => {
      // Refresh the calendar so new/deleted entries are reflected
      this.app.views.calendar.refresh();
      this.app.popView();
    });

    // Add button
    q('#day-btn-add')?.addEventListener('click', () => {
      this.app.pushView('form', { mode: 'add', day, month, year });
    });

    // Edit buttons (delegated to the entries list)
    q('#day-entries-list')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.day-btn-edit');
      if (editBtn) {
        const id = editBtn.dataset.id;
        this.app.pushView('form', { mode: 'edit', id, day, month, year });
        return;
      }

      const deleteBtn = e.target.closest('.day-btn-delete');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        this.app.showDeleteModal(id, () => {
          // After deletion, re-render this view with updated entries
          this.render({ day, month, year });
          this.app.views.calendar.refresh();
        });
      }
    });
  }

  /** Escapes HTML special characters to prevent XSS. */
  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
