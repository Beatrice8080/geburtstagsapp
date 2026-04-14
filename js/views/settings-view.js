/**
 * settings-view.js – Settings screen.
 *
 * Sections:
 *   1. Benachrichtigungen – status note and instructions
 *   2. Daten – CSV export button
 *   3. App – version number
 */

import { exportCSV } from '../export.js';

const APP_VERSION = '1.0.0';

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

        <!-- Section: Benachrichtigungen -->
        <div class="section-header">Benachrichtigungen</div>
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

        <!-- Section: Daten -->
        <div class="section-header" style="margin-top:var(--space-8)">Daten</div>
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
  }
}
