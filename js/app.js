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
import { SearchView }   from './views/search-view.js';

// Duration must be >= --transition-normal (300 ms) in variables.css
const NAV_LOCK_MS = 350;

class App {
  constructor() {
    /** @type {Array<{ name: string, state: Object }>} */
    this.navStack = [];

    /** @type {Object.<string, object>} */
    this.views = {};

    /** @type {DeleteDialog} */
    this.deleteDialog = null;

    /** Tracks whether the start overlay is open (set before rAF so _updateTabBar is accurate). */
    this._startViewOpen = false;

    /** Prevents double-navigation during view transitions. */
    this._navigating = false;
  }

  _lockNav() {
    this._navigating = true;
    setTimeout(() => { this._navigating = false; }, NAV_LOCK_MS);
  }

  // ─── Initialisation ────────────────────────────────────────────────────────

  init() {
    this.views = {
      calendar: new CalendarView(document.getElementById('view-calendar'), this),
      day:      new DayView(document.getElementById('view-day'),      this),
      form:     new FormView(document.getElementById('view-form'),     this),
      settings: new SettingsView(document.getElementById('view-settings'), this),
      search:   new SearchView(document.getElementById('view-search'), this),
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

    this._bindTabBar();

    // Show the start view instantly on load (no slide-in animation)
    this.showStartView(true);
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
    if (this._navigating) return;
    this._lockNav();

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
    this._animateIn(this.views[name].container);
    this._updateTabBar();
  }

  /**
   * Pop the current view and return to the previous one.
   * Optionally pass refreshed state to re-render the previous view.
   *
   * @param {Object} [refreshState]
   */
  popView(refreshState) {
    if (this._navigating || this.navStack.length <= 1) return;
    this._lockNav();

    const current  = this.navStack.pop();
    const previous = this._currentEntry();

    // Animate the outgoing view off to the right
    this._animateOut(this.views[current.name].container);

    // If new state is provided, re-render the previous view
    if (refreshState !== undefined) {
      previous.state = refreshState;
      this.views[previous.name].render(refreshState);
    }

    // Bring the previous view back from the parallax position
    this._setViewClass(this.views[previous.name].container, 'active');
    this._updateTabBar();
  }

  /**
   * Push a view while closing the start overlay — both transitions fire in the
   * same animation frame so the calendar is never exposed between them.
   *
   * @param {string} name
   * @param {Object} [state={}]
   */
  pushViewFromStart(name, state = {}) {
    if (this._navigating) return;
    this._lockNav();

    this.views[name].render(state);
    this.navStack.push({ name, state });

    const el      = this.views[name].container;
    const startEl = this.views.start.container;
    const calEl   = this.views.calendar.container;

    // Snap new view to off-screen right (starting position for slide-in)
    el.style.transition = 'none';
    el.classList.remove('view--active', 'view--behind', 'view--forward', 'view--ahead', 'view--no-transition');
    el.offsetHeight; // eslint-disable-line no-unused-expressions
    el.style.transition = '';

    // Snap calendar behind instantly — invisible behind start overlay at this point
    calEl.classList.remove('view--active');
    calEl.style.transition = 'none';
    calEl.style.transform  = '';
    calEl.classList.add('view--behind');
    calEl.offsetHeight; // eslint-disable-line no-unused-expressions
    calEl.style.transition = '';

    // Both transitions start in the SAME frame → start and day views move together,
    // their edges always meeting so the calendar is never visible between them.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('view--active');         // day: 100% → 0%
        startEl.classList.remove('view--active'); // start: 0% → −100%
        startEl.classList.add('view--closing');
      });
    });

    this._startViewOpen = false;
    this._updateTabBar();
  }

  /**
   * Return from a pushed view back to the start overlay — both transitions fire
   * in the same frame so the calendar is never exposed between them.
   */
  backToStartView() {
    if (this._navigating) return;
    this._lockNav();

    const current = this._currentEntry();
    const el      = this.views[current.name].container;
    const startEl = this.views.start.container;
    const calEl   = this.views.calendar.container;

    // Re-render start view with fresh data before snapping it into position
    this.views.start.render({});

    // Snap start view to off-screen left (ready to slide in); remove view--closing
    // first so view--active can win (both classes share the same specificity)
    startEl.classList.remove('view--closing');
    startEl.style.transition = 'none';
    startEl.classList.remove('view--active');
    startEl.offsetHeight; // eslint-disable-line no-unused-expressions
    startEl.style.transition = '';

    // Snap calendar to parallax position — invisible behind day view at this point
    calEl.classList.remove('view--behind');
    calEl.classList.add('view--active');
    calEl.style.transition = 'none';
    calEl.style.transform  = 'translateX(28%)';
    calEl.offsetHeight; // eslint-disable-line no-unused-expressions
    calEl.style.transition = '';

    // Both transitions start in the SAME frame → no gap where calendar shows through
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove('view--active', 'view--behind'); // day: 0% → 100%
        startEl.classList.add('view--active');               // start: −100% → 0%
      });
    });

    this._startViewOpen = true;
    this.navStack.pop();
    this._updateTabBar();
  }

  /**
   * Pop all views and return directly to the calendar.
   * @param {'right'|'left'} direction – 'left' slides current view left; calendar parallax-slides left too
   */
  popToCalendar(direction = 'right') {
    if (this._navigating || this.navStack.length <= 1) return;
    this._lockNav();

    const current = this._currentEntry();
    const el      = this.views[current.name].container;
    const calEl   = this.views.calendar.container;

    if (direction === 'left') {
      // Snap intermediate views to hidden instantly
      for (let i = 1; i < this.navStack.length - 1; i++) {
        const intermediateEl = this.views[this.navStack[i].name].container;
        intermediateEl.classList.add('view--no-transition');
        intermediateEl.classList.remove('view--active', 'view--behind', 'view--forward', 'view--ahead');
      }

      // Snap calendar to +28% via inline style – inline styles have highest
      // specificity and avoid any CSS class cascade/batching issues.
      calEl.classList.remove('view--active', 'view--behind', 'view--forward', 'view--ahead');
      calEl.style.transition = 'none';
      calEl.style.transform  = 'translateX(28%)';

      // Reflow: commits the snap position
      calEl.offsetHeight; // eslint-disable-line no-unused-expressions

      // Re-enable transitions (clear inline overrides)
      calEl.style.transition = '';
      for (let i = 1; i < this.navStack.length - 1; i++) {
        this.views[this.navStack[i].name].container.classList.remove('view--no-transition');
      }

      // Update stack now so navStack is already correct inside the rAF
      this.navStack = [this.navStack[0]];
      this._updateTabBar();

      // Double rAF ensures the browser has painted calEl at +28% (with
      // transitions re-enabled) before we change both transforms.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Clear inline transform so CSS class takes over
          calEl.style.transform = '';
          calEl.classList.add('view--active'); // CSS: translateX(0) → transition fires
          el.classList.remove('view--active', 'view--behind');
          el.classList.add('view--forward');   // 0% → -100%
        });
      });

      return;
    }

    // Standard back: snap intermediate views, animate day right, calendar -28% → 0%
    for (let i = 1; i < this.navStack.length - 1; i++) {
      const intermediateEl = this.views[this.navStack[i].name].container;
      intermediateEl.classList.add('view--no-transition');
      intermediateEl.classList.remove('view--active', 'view--behind', 'view--forward', 'view--ahead');
    }
    el.offsetHeight; // eslint-disable-line no-unused-expressions
    for (let i = 1; i < this.navStack.length - 1; i++) {
      this.views[this.navStack[i].name].container.classList.remove('view--no-transition');
    }
    this._animateOut(el);
    this._setViewClass(calEl, 'active');

    // Reset stack to just the calendar
    this.navStack = [this.navStack[0]];
    this._updateTabBar();
  }

  /**
   * Replace the current stack entry with a different view.
   * Useful when the form navigates back to a refreshed day view.
   *
   * @param {string} name
   * @param {Object} [state={}]
   */
  replaceView(name, state = {}) {
    if (this._navigating) return;
    this._lockNav();

    const current = this._currentEntry();
    if (current) {
      this._animateOut(this.views[current.name].container);
      this.navStack.pop();
    }
    this.navStack.push({ name, state });
    this.views[name].render(state);
    this._animateIn(this.views[name].container);
    this._updateTabBar();
  }

  // ─── Start overlay ─────────────────────────────────────────────────────────

  /**
   * Shows the Aktuell view (slides in from the left over the calendar).
   * @param {boolean} [instant=false] – skip animation (used on initial load)
   */
  showStartView(instant = false) {
    const el    = this.views.start.container;
    const calEl = this.views.calendar.container;
    this.views.start.render({});
    this._startViewOpen = true;
    el.classList.remove('view--closing');

    if (instant) {
      el.classList.add('view--no-transition', 'view--active');
      el.offsetHeight; // commit instantly
      el.classList.remove('view--no-transition');
      this._updateTabBar();
      return;
    }

    // Snap start view to left off-screen, then animate in
    el.style.transition = 'none';
    el.classList.remove('view--active');
    el.offsetHeight;
    el.style.transition = '';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('view--active');          // -100% → 0%
        calEl.style.transform = 'translateX(28%)'; // calendar drifts right (parallax)
      });
    });
    this._updateTabBar();
  }

  /**
   * Dismisses the Aktuell view (slides out to the left).
   */
  closeStartView() {
    const el    = this.views.start.container;
    const calEl = this.views.calendar.container;
    this._startViewOpen = false;
    el.classList.add('view--closing');
    el.classList.remove('view--active');
    // Removing the inline transform lets view--base (translateX(0)) take over,
    // which triggers the CSS transition: 28% → 0% (calendar slides back).
    calEl.style.transform = '';
    this._updateTabBar();
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
  _animateIn(el) {
    // Suppress transition while snapping to the off-screen starting position.
    // Without this, removing classes like view--forward (-100%) would trigger
    // an unwanted transition to the CSS default (100%) before the rAF fires.
    el.style.transition = 'none';
    el.classList.remove('view--active', 'view--behind', 'view--forward', 'view--ahead', 'view--no-transition');
    el.offsetHeight; // eslint-disable-line no-unused-expressions – commits snap to translateX(100%)
    el.style.transition = '';

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
  _animateOut(el) {
    el.classList.remove('view--active', 'view--behind');
    // translateX(100%) is the default (hidden) state in base.css,
    // so simply removing view--active triggers the CSS transition.
  }

  // ─── Tab bar ───────────────────────────────────────────────────────────────

  _bindTabBar() {
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;
    tabBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-bar__btn');
      if (!btn) return;
      this._onTabClick(btn.dataset.tab);
    });
    this._updateTabBar();
  }

  _onTabClick(tab) {
    const current = this._currentEntry();

    if (tab === 'liste') {
      if (current?.name === 'settings') this.popView();
      if (!this._startViewOpen) this.showStartView();
    } else if (tab === 'kalender') {
      if (this._startViewOpen) this.closeStartView();
      if (current?.name === 'settings') this.popView();
    } else if (tab === 'mehr') {
      if (this._startViewOpen) this.closeStartView();
      if (current?.name !== 'settings') this.pushView('settings', {});
    }
  }

  _updateTabBar() {
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;

    const current = this._currentEntry();
    const hideFor = ['form', 'day', 'search'];

    if (current && hideFor.includes(current.name)) {
      tabBar.hidden = true;
      return;
    }
    tabBar.hidden = false;

    tabBar.querySelectorAll('.tab-bar__btn').forEach((btn) => {
      btn.classList.remove('tab-bar__btn--active');
    });

    if (this._startViewOpen) {
      tabBar.querySelector('[data-tab="liste"]')?.classList.add('tab-bar__btn--active');
    } else if (current?.name === 'settings') {
      tabBar.querySelector('[data-tab="mehr"]')?.classList.add('tab-bar__btn--active');
    } else {
      tabBar.querySelector('[data-tab="kalender"]')?.classList.add('tab-bar__btn--active');
    }
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
