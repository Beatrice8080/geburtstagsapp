/**
 * app.js – Application entry point and view router.
 *
 * Manages a navigation stack and coordinates transitions between views.
 * Each view is a class instance that controls its own DOM container.
 *
 * Navigation model:
 *   pushView(name, state)  – open a new view (slides in from right)
 *   popView(state?)        – go back to previous view (slides right)
 *   replaceView(name, state) – swap current view without adding to history
 *   showStartView()        – show the start overlay above the calendar
 *   closeStartView()       – dismiss the start overlay
 */

import { StartView }    from './views/start-view.js';
import { CalendarView } from './views/calendar-view.js';
import { DayView }      from './views/day-view.js';
import { FormView }     from './views/form-view.js';
import { DeleteDialog } from './views/delete-dialog.js';
import { SettingsView } from './views/settings-view.js';

class App {
  constructor() {
    /** @type {Array<{ name: string, state: Object }>} */
    this.navStack = [];

    /** @type {Object.<string, object>} */
    this.views = {};

    /** @type {DeleteDialog} */
    this.deleteDialog = null;
  }

  // ─── Initialisation ────────────────────────────────────────────────────────

  init() {
    this.views = {
      calendar: new CalendarView(document.getElementById('view-calendar'), this),
      day:      new DayView(document.getElementById('view-day'),      this),
      form:     new FormView(document.getElementById('view-form'),     this),
      settings: new SettingsView(document.getElementById('view-settings'), this),
      start:    new StartView(document.getElementById('view-start'),   this),
    };

    this.deleteDialog = new DeleteDialog(
      document.getElementById('modal-delete'),
      this
    );

    // The calendar is the persistent base layer – render it immediately
    // without any transition (it is always behind other views).
    this.views.calendar.render({});
    this.navStack.push({ name: 'calendar', state: {} });

    // Show the start overlay on top of the calendar
    this.showStartView();
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  /**
   * Push a new view onto the navigation stack (navigate forward).
   * The current view slides partially left; the new view slides in from right.
   *
   * @param {string} name   – key in this.views
   * @param {Object} [state={}]
   */
  pushView(name, state = {}) {
    const prev = this._currentEntry();

    // Render the new view before making it visible
    this.views[name].render(state);

    // Push to stack first so _currentEntry() reflects the new state
    this.navStack.push({ name, state });

    // Animate outgoing view to parallax position
    if (prev) {
      this._setViewClass(this.views[prev.name].container, 'behind');
    }

    // Animate incoming view from the right
    this._animateIn(this.views[name].container, 'right');
  }

  /**
   * Pop the current view and return to the previous one.
   * Optionally pass refreshed state to re-render the previous view.
   *
   * @param {Object} [refreshState]
   */
  popView(refreshState) {
    if (this.navStack.length <= 1) return;

    const current  = this.navStack.pop();
    const previous = this._currentEntry();

    // Animate the outgoing view off to the right
    this._animateOut(this.views[current.name].container, 'right');

    // If new state is provided, re-render the previous view
    if (refreshState !== undefined) {
      previous.state = refreshState;
      this.views[previous.name].render(refreshState);
    }

    // Bring the previous view back from the parallax position
    this._setViewClass(this.views[previous.name].container, 'active');
  }

  /**
   * Replace the current stack entry with a different view.
   * Useful when the form navigates back to a refreshed day view.
   *
   * @param {string} name
   * @param {Object} [state={}]
   */
  replaceView(name, state = {}) {
    const current = this._currentEntry();
    if (current) {
      this._animateOut(this.views[current.name].container, 'right');
      this.navStack.pop();
    }
    this.navStack.push({ name, state });
    this.views[name].render(state);
    this._animateIn(this.views[name].container, 'right');
  }

  // ─── Start overlay ─────────────────────────────────────────────────────────

  /**
   * Shows the start overlay (slides up from the bottom).
   * The calendar base layer is already visible behind it.
   */
  showStartView() {
    const el = this.views.start.container;
    this.views.start.render({});
    // Remove closing class in case it was dismissed before
    el.classList.remove('view--closing');
    // Trigger slide-up: class added after a microtask so the browser
    // registers the starting state first
    requestAnimationFrame(() => {
      el.classList.add('view--active');
    });
  }

  /**
   * Dismisses the start overlay (slides back down).
   */
  closeStartView() {
    const el = this.views.start.container;
    el.classList.add('view--closing');
    el.classList.remove('view--active');
  }

  // ─── Delete modal ──────────────────────────────────────────────────────────

  /**
   * Shows the delete confirmation modal.
   *
   * @param {string}   entryId
   * @param {Function} onConfirm  – called when the user confirms deletion
   */
  showDeleteModal(entryId, onConfirm) {
    this.deleteDialog.show(entryId, onConfirm);
  }

  hideDeleteModal() {
    this.deleteDialog.hide();
  }

  // ─── View helpers ──────────────────────────────────────────────────────────

  /**
   * Sets a view container to a named state by managing CSS classes.
   * States: 'active' | 'behind' | 'hidden'
   *
   * @param {HTMLElement} el
   * @param {'active'|'behind'|'hidden'} state
   */
  _setViewClass(el, state) {
    el.classList.remove('view--active', 'view--behind');
    if (state === 'active') el.classList.add('view--active');
    if (state === 'behind') el.classList.add('view--behind');
    // 'hidden' = no extra class (translateX(100%) from base styles)
  }

  /**
   * Animates a view sliding INTO the viewport from `direction`.
   *
   * @param {HTMLElement} el
   * @param {'right'|'left'} direction
   */
  _animateIn(el, direction) {
    // Start off-screen (right = default from base.css, already set)
    el.classList.remove('view--active', 'view--behind', 'view--no-transition');

    // Let the browser register the starting position, then transition in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('view--active');
      });
    });
  }

  /**
   * Animates a view sliding OUT of the viewport to `direction`.
   *
   * @param {HTMLElement} el
   * @param {'right'|'left'} direction
   */
  _animateOut(el, direction) {
    el.classList.remove('view--active', 'view--behind');
    // translateX(100%) is the default (hidden) state in base.css,
    // so simply removing view--active triggers the CSS transition.
  }

  /** @returns {{ name: string, state: Object }|null} */
  _currentEntry() {
    return this.navStack[this.navStack.length - 1] ?? null;
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());

export default app;
