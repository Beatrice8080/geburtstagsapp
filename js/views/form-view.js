/**
 * form-view.js – Add / Edit birthday entry form.
 *
 * Used for both adding and editing. The "mode" field in state
 * determines which variant is shown:
 *
 *   mode: 'add'  → state: { day, month, year }
 *   mode: 'edit' → state: { id, day, month, year }
 *
 * In edit mode, the day and month fields are editable.
 * In add mode, day and month are taken from the calling day-view.
 */

import { getToday, formatShortDate, isValidDate, getMonthName } from '../utils.js';
import { saveEntry, updateEntry, getEntryById }                  from '../storage.js';

const CURRENT_YEAR  = getToday().year;
const MIN_YEAR      = 1900;
const MAX_NAME_LEN  = 100;
const MAX_NOTE_LEN  = 500;

const ICON_SAVE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

const CATEGORIES = [
  { value: '',               label: 'Keine Kategorie' },
  { value: 'Familie',        label: 'Familie'         },
  { value: 'Freund*innen',   label: 'Freund*innen'    },
  { value: 'Kolleg*innen',   label: 'Kolleg*innen'    },
  { value: 'Sonstige',       label: 'Sonstige'         },
];

export class FormView {
  /**
   * @param {HTMLElement} container
   * @param {Object}      app
   */
  constructor(container, app) {
    this.container = container;
    this.app       = app;
    this._state    = null;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  render(state) {
    this._state = state;
    const isEdit = state.mode === 'edit';

    // In edit mode, load the existing entry; in add mode start with defaults
    const existing = isEdit ? getEntryById(state.id) : null;
    const prefill  = existing ?? {
      name:     '',
      day:      state.day,
      month:    state.month,
      year:     null,
      category: null,
      note:     null,
    };

    this.container.innerHTML = this._buildHTML(isEdit, prefill, state);
    this._bindEvents(isEdit, state);
  }

  // ─── HTML building ─────────────────────────────────────────────────────────

  _buildHTML(isEdit, data, state) {
    const subtitle = isEdit
      ? 'Datum ist änderbar'
      : formatShortDate(state.day, state.month);
    const headerTitle = isEdit ? 'Bearbeiten' : 'Hinzufügen';

    return `
      <header class="view-header">
        <div class="view-header__left">
          <button class="btn btn--ghost" id="form-btn-cancel">Abbrechen</button>
        </div>
        <h1 class="view-header__title" style="font-size:var(--font-md)">${headerTitle}</h1>
        <div class="view-header__right"></div>
      </header>

      <div class="scroll-area">
        <div class="form-body">

          ${!isEdit ? `
            <div class="form-date-display">
              <span class="form-date-display__label">Datum</span>
              <span class="form-date-display__value">${subtitle}</span>
            </div>
          ` : ''}

          <!-- Day + Month fields (only shown in edit mode) -->
          ${isEdit ? this._buildDateFields(data) : ''}

          <!-- Name -->
          <div class="form-group">
            <label class="form-label form-label--required" for="field-name">Name</label>
            <input type="text" id="field-name" name="name"
                   maxlength="${MAX_NAME_LEN}"
                   value="${this._esc(data.name)}"
                   placeholder="z.B. Maria Müller"
                   autocomplete="name"
                   autocorrect="off" />
            <div class="form-counter" id="name-counter">
              ${data.name.length} / ${MAX_NAME_LEN}
            </div>
            <div class="form-error" id="name-error" role="alert"></div>
          </div>

          <!-- Year (optional) -->
          <div class="form-group">
            <label class="form-label" for="field-year">Jahrgang (optional)</label>
            <div class="select-wrapper">
              <select id="field-year" name="year">
                <option value="">Kein Jahrgang</option>
                ${this._buildYearOptions(data.year)}
              </select>
            </div>
          </div>

          <!-- Category (optional) -->
          <div class="form-group">
            <label class="form-label" for="field-category">Kategorie (optional)</label>
            <div class="select-wrapper">
              <select id="field-category" name="category">
                ${CATEGORIES.map((c) => `
                  <option value="${c.value}"
                    ${data.category === c.value ? 'selected' : ''}>
                    ${c.label}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Note (optional) -->
          <div class="form-group">
            <label class="form-label" for="field-note">Notiz (optional)</label>
            <textarea id="field-note" name="note"
                      maxlength="${MAX_NOTE_LEN}"
                      placeholder="z.B. Liebt Schokoladenkuchen …"
                      >${this._esc(data.note ?? '')}</textarea>
            <div class="form-counter" id="note-counter">
              ${(data.note ?? '').length} / ${MAX_NOTE_LEN}
            </div>
          </div>

          <!-- Global save error -->
          <div class="form-error" id="save-error" role="alert"></div>

        </div>
      </div>

      <div class="day-view__footer">
        <button class="btn btn--primary btn--full" id="form-btn-save">
          ${ICON_SAVE} ${isEdit ? 'Änderungen speichern' : 'Geburtstag speichern'}
        </button>
      </div>
    `;
  }

  _buildDateFields(data) {
    // Build day select (1–31)
    const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1)
      .map((d) => `<option value="${d}" ${data.day === d ? 'selected' : ''}>${d}</option>`)
      .join('');

    // Build month select (1–12)
    const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
      .map((m) => `
        <option value="${m}" ${data.month === m ? 'selected' : ''}>
          ${m}. ${getMonthName(m)}
        </option>
      `).join('');

    return `
      <div class="form-group">
        <label class="form-label form-label--required">Datum</label>
        <div class="form-date-row">
          <div class="select-wrapper" style="flex:1">
            <select id="field-day" name="day" aria-label="Tag">
              ${dayOptions}
            </select>
          </div>
          <div class="select-wrapper" style="flex:2">
            <select id="field-month" name="month" aria-label="Monat">
              ${monthOptions}
            </select>
          </div>
        </div>
        <div class="form-error" id="date-error" role="alert"></div>
      </div>
    `;
  }

  _buildYearOptions(selectedYear) {
    // Newest year first so the user scrolls down for older ones
    const options = [];
    for (let y = CURRENT_YEAR; y >= MIN_YEAR; y--) {
      options.push(`
        <option value="${y}" ${selectedYear === y ? 'selected' : ''}>${y}</option>
      `);
    }
    return options.join('');
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents(isEdit, state) {
    const q = (sel) => this.container.querySelector(sel);

    // Live character counter for name
    q('#field-name')?.addEventListener('input', (e) => {
      q('#name-counter').textContent = `${e.target.value.length} / ${MAX_NAME_LEN}`;
      this._clearError('name-error');
    });

    // Live character counter for note
    q('#field-note')?.addEventListener('input', (e) => {
      q('#note-counter').textContent = `${e.target.value.length} / ${MAX_NOTE_LEN}`;
    });

    // Clear date error when day/month changes
    q('#field-day')?.addEventListener('change',   () => this._clearError('date-error'));
    q('#field-month')?.addEventListener('change', () => this._clearError('date-error'));

    // Cancel
    q('#form-btn-cancel')?.addEventListener('click', () => this.app.popView());

    // Save
    q('#form-btn-save')?.addEventListener('click', () => {
      this._handleSave(isEdit, state);
    });
  }

  // ─── Save logic ────────────────────────────────────────────────────────────

  _handleSave(isEdit, state) {
    const q        = (sel) => this.container.querySelector(sel);
    let   hasError = false;

    // Collect values
    const name     = q('#field-name')?.value.trim() ?? '';
    const yearRaw  = q('#field-year')?.value;
    const year     = yearRaw ? parseInt(yearRaw, 10) : null;
    const category = q('#field-category')?.value || null;
    const note     = q('#field-note')?.value.trim() || null;

    // Day / month: from fields in edit mode, from state in add mode
    const day   = isEdit
      ? parseInt(q('#field-day')?.value,   10)
      : state.day;
    const month = isEdit
      ? parseInt(q('#field-month')?.value, 10)
      : state.month;

    // ── Validation ──────────────────────────────────────────────────────────

    if (!name) {
      this._showError('name-error', 'Bitte gib einen Namen ein.');
      hasError = true;
    } else if (name.length > MAX_NAME_LEN) {
      this._showError('name-error', `Der Name darf maximal ${MAX_NAME_LEN} Zeichen lang sein.`);
      hasError = true;
    }

    if (note && note.length > MAX_NOTE_LEN) {
      // The maxlength attribute already prevents this, but keep as a safety net
      hasError = true;
    }

    if (isEdit && !isValidDate(day, month)) {
      this._showError('date-error', 'Dieses Datum existiert nicht. Bitte überprüfe Tag und Monat.');
      hasError = true;
    }

    if (hasError) return;

    // ── Persist ─────────────────────────────────────────────────────────────

    try {
      if (isEdit) {
        updateEntry(state.id, { name, day, month, year, category, note });
      } else {
        saveEntry({ name, day, month, year, category, note });
      }
    } catch {
      this._showError('save-error', 'Speichern fehlgeschlagen. Bitte versuche es erneut.');
      return;
    }

    // Navigate back to day view with updated state
    // Use the new day/month (may have changed in edit mode)
    this.app.popView({ day, month, year: state.year });
  }

  // ─── Error helpers ────────────────────────────────────────────────────────

  _showError(id, message) {
    const el = this.container.querySelector(`#${id}`);
    if (!el) return;
    el.textContent = message;
    el.classList.add('form-error--visible');

    // Highlight the corresponding input
    const inputId = id.replace('-error', '');
    const input   = this.container.querySelector(`#field-${inputId}`);
    input?.classList.add('input--error');
  }

  _clearError(id) {
    const el = this.container.querySelector(`#${id}`);
    if (!el) return;
    el.textContent = '';
    el.classList.remove('form-error--visible');

    const inputId = id.replace('-error', '');
    const input   = this.container.querySelector(`#field-${inputId}`);
    input?.classList.remove('input--error');
  }

  /** Escapes HTML special characters to prevent XSS. */
  _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
