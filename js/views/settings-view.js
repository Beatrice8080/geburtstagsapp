/**
 * settings-view.js – Settings screen.
 *
 * Sections (in order):
 *   1. Daten          – CSV export / import
 *   2. Benachrichtigungen – status note
 *   3. App            – version number
 */

import { exportCSV }         from '../export.js';
import { processCSVImport } from '../import.js';

const APP_VERSION = '1.1.0';

export class SettingsView {
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
    this.container.innerHTML = this._buildHTML();
    this._bindEvents();
  }

  // ─── HTML building ─────────────────────────────────────────────────────────

  _buildHTML() {
    return `
      <header class="view-header">
        <div class="view-header__left">
          <button class="btn btn--ghost" id="settings-btn-back">‹ Zurück</button>
        </div>
        <h1 class="view-header__title" style="font-size:var(--font-md)">Einstellungen</h1>
        <div class="view-header__right"></div>
      </header>

      <div class="scroll-area">

        <!-- Section: Daten -->
        <div class="section-header">Daten</div>
        <div class="list-group" style="margin:0 var(--space-16)">
          <div class="list-item">
            <p style="font-size:var(--font-sm);color:var(--text-secondary);margin-bottom:var(--space-12)">
              Exportiert alle gespeicherten Geburtstage als
              CSV-Datei (UTF-8 mit BOM, kompatibel mit Excel).
            </p>
            <button class="btn btn--secondary btn--full" id="settings-btn-export">
              📤 Exportieren
            </button>
            <div class="form-error" id="export-error" role="alert"
                 style="margin-top:var(--space-8)"></div>
          </div>
          <div class="list-item">
            <p style="font-size:var(--font-sm);color:var(--text-secondary);margin-bottom:var(--space-12)">
              Importiert Geburtstage aus einer CSV-Datei im gleichen Format
              wie der Export. Bestehende Einträge werden nicht überschrieben.
            </p>
            <input type="file" accept=".csv" id="import-file-input"
                   style="display:none" aria-hidden="true">
            <button class="btn btn--secondary btn--full" id="settings-btn-import">
              📥 Importieren
            </button>
          </div>
        </div>

        <!-- Section: Benachrichtigungen -->
        <div class="section-header" style="margin-top:var(--space-8)">Benachrichtigungen</div>
        <div class="list-group" style="margin:0 var(--space-16)">
          <div class="list-item">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-8)">
              <span style="font-weight:600">Status</span>
              <span class="badge" style="background:var(--color-danger-light);color:var(--color-danger)">
                Nicht verfügbar
              </span>
            </div>
            <div class="info-box--neutral" style="
              background-color:var(--bg-secondary);
              border-radius:var(--radius-sm);
              padding:var(--space-12);
              font-size:var(--font-sm);
              color:var(--text-secondary);
              line-height:1.6;
            ">
              Diese App kann keine Benachrichtigungen senden,
              die erscheinen, wenn sie nicht geöffnet ist.
              Das ist eine technische Einschränkung von
              iOS-Web-Apps ohne Server.<br><br>
              <strong style="color:var(--text-primary)">Tipp:</strong>
              Öffne die App regelmäßig – beim Start siehst du
              sofort, wer heute oder in den nächsten Tagen
              Geburtstag hat.
            </div>
          </div>
        </div>

        <!-- Section: App -->
        <div class="section-header" style="margin-top:var(--space-8)">App</div>
        <div class="list-group" style="margin:0 var(--space-16)">
          <div class="list-item" style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:500">Version</span>
            <span style="color:var(--text-secondary);font-size:var(--font-sm)">${APP_VERSION}</span>
          </div>
        </div>

        <p class="version-label">Geburtstagsapp · Alle Daten lokal gespeichert</p>

      </div>
    `;
  }

  // ─── Result modals ─────────────────────────────────────────────────────────

  _showSuccessModal({ imported, skippedDuplicates, errorLines }) {
    const hasErrors  = errorLines.length > 0;

    const importedText  = imported === 1
      ? '1 Eintrag wurde neu importiert.'
      : `${imported} Einträge wurden neu importiert.`;
    const duplicateText = skippedDuplicates === 1
      ? '1 schon vorhandener Eintrag wurde nicht mehr importiert.'
      : `${skippedDuplicates} schon vorhandene Einträge wurden nicht mehr importiert.`;
    const errorCountText = errorLines.length === 1
      ? '1 Zeile wurde übersprungen:'
      : `${errorLines.length} Zeilen wurden übersprungen:`;

    const statsHTML = `
      <p style="margin-bottom:var(--space-8)">${importedText}</p>
      <p style="margin-bottom:${hasErrors ? 'var(--space-16)' : '0'}">${duplicateText}</p>
    `;

    const errorsHTML = hasErrors ? `
      <p style="margin-bottom:var(--space-8)">${errorCountText}</p>
      ${errorLines.map((l) => `<p style="color:var(--color-danger);margin-bottom:var(--space-4)">${l}</p>`).join('')}
    ` : '';

    this._showModal({
      iconHTML: `<span style="
        display:inline-flex;align-items:center;justify-content:center;
        width:28px;height:28px;border-radius:50%;
        background:#dcfce7;color:#16a34a;
        font-size:16px;font-weight:700;flex-shrink:0;
      ">✓</span>`,
      title:   'Der Import wurde erfolgreich abgeschlossen',
      bodyHTML: statsHTML + errorsHTML,
    });
  }

  _showAbortModal(message) {
    this._showModal({
      iconHTML: `<span style="
        display:inline-flex;align-items:center;justify-content:center;
        width:28px;height:28px;border-radius:50%;
        background:#fee2e2;color:var(--color-danger);
        font-size:16px;font-weight:700;flex-shrink:0;
      ">✕</span>`,
      title:   'Der Import wurde abgebrochen',
      bodyHTML: `<p style="color:var(--color-danger)">${message}</p>`,
    });
  }

  _showModal({ iconHTML, title, bodyHTML }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal modal--visible';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="modal__backdrop" id="import-modal-backdrop"></div>
      <div class="modal__sheet">
        <div class="modal__drag-handle" aria-hidden="true"></div>
        <h2 class="modal__title" style="
          color:var(--text-primary);
          display:flex;align-items:center;gap:var(--space-8);
        ">
          ${iconHTML}${title}
        </h2>
        <div class="modal__body" style="color:var(--text-primary)">
          ${bodyHTML}
        </div>
        <div class="btn-row">
          <button class="btn btn--primary btn--full" id="import-modal-ok">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    const close = () => {
      document.body.removeChild(overlay);
      document.body.classList.remove('modal-open');
    };

    overlay.querySelector('#import-modal-ok').addEventListener('click', close);
    overlay.querySelector('#import-modal-backdrop').addEventListener('click', close);
    requestAnimationFrame(() => overlay.querySelector('#import-modal-ok')?.focus());
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    const q = (sel) => this.container.querySelector(sel);

    q('#settings-btn-back')?.addEventListener('click', () => this.app.popView());

    q('#settings-btn-export')?.addEventListener('click', () => {
      const errorEl = q('#export-error');
      try {
        exportCSV();
        errorEl.textContent = '';
        errorEl.classList.remove('form-error--visible');
      } catch (err) {
        errorEl.textContent = err.message ?? 'Export fehlgeschlagen. Bitte versuche es erneut.';
        errorEl.classList.add('form-error--visible');
      }
    });

    q('#settings-btn-import')?.addEventListener('click', () => {
      q('#import-file-input')?.click();
    });

    q('#import-file-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = ''; // reset so the same file can be selected again

      const importBtn = q('#settings-btn-import');
      importBtn.disabled    = true;
      importBtn.textContent = 'Importieren…';

      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = (ev) => resolve(ev.target.result);
          reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
          reader.readAsText(file, 'UTF-8');
        });

        const result = processCSVImport(text);
        this._showSuccessModal(result);
      } catch (err) {
        this._showAbortModal(err.message ?? 'Unbekannter Fehler.');
      } finally {
        importBtn.disabled    = false;
        importBtn.textContent = '📥 Importieren';
      }
    });
  }
}
