/**
 * delete-dialog.js – Delete confirmation bottom sheet.
 *
 * Rendered inside #modal-delete. Uses the .modal and .modal--visible
 * CSS classes for fade-in + sheet slide-up animation.
 *
 * Usage:
 *   dialog.show(entryId, () => { /* do the deletion *\/ });
 *   dialog.hide();
 */

import { deleteEntry } from '../storage.js';

export class DeleteDialog {
  /**
   * @param {HTMLElement} container  – the #modal-delete div
   * @param {Object}      app
   */
  constructor(container, app) {
    this.container  = container;
    this.app        = app;
    this._onConfirm = null;

    this._render();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Shows the modal for the given entry id.
   * @param {string}   entryId
   * @param {Function} onConfirm  – called after successful deletion
   */
  show(entryId, onConfirm) {
    this._entryId   = entryId;
    this._onConfirm = onConfirm;

    this.container.setAttribute('aria-hidden', 'false');
    this.container.classList.add('modal--visible');
    document.body.classList.add('modal-open');

    // Focus the cancel button for accessibility
    requestAnimationFrame(() => {
      this.container.querySelector('#modal-btn-cancel')?.focus();
    });
  }

  hide() {
    this.container.classList.remove('modal--visible');
    this.container.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    this._entryId   = null;
    this._onConfirm = null;
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  _render() {
    this.container.innerHTML = `
      <div class="modal__backdrop" id="modal-backdrop"></div>
      <div class="modal__sheet">
        <div class="modal__drag-handle" aria-hidden="true"></div>
        <h2 class="modal__title" id="modal-delete-title">Eintrag löschen</h2>
        <p class="modal__body">
          Möchtest du diesen Eintrag wirklich löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div class="btn-row">
          <button class="btn btn--secondary" id="modal-btn-cancel">Abbrechen</button>
          <button class="btn btn--danger"    id="modal-btn-confirm">Löschen</button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const q = (sel) => this.container.querySelector(sel);

    q('#modal-btn-cancel')?.addEventListener('click', () => this.hide());

    // Tap on backdrop also closes the modal
    q('#modal-backdrop')?.addEventListener('click', () => this.hide());

    q('#modal-btn-confirm')?.addEventListener('click', () => {
      if (!this._entryId) return;

      try {
        deleteEntry(this._entryId);
      } catch {
        // Deletion failure is silent here; the view will simply not refresh
        console.error('Deletion failed for id:', this._entryId);
      }

      const cb = this._onConfirm;
      this.hide();
      cb?.();
    });
  }
}
