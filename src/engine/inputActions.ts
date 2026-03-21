/**
 * Phase 53 — Input Unification Pass
 *
 * Shared action abstraction for all named player inputs.  Both the desktop
 * keyboard handler in App.tsx and the virtual buttons in MobileControls route
 * through this common type so the two input paths are guaranteed to stay
 * behavior-identical.
 *
 *  Panel-toggle actions whose logic lives inside individual panel components
 *  (toggle-inventory / toggle-skills / toggle-journal / toggle-ledger) are
 *  resolved by re-dispatching a synthetic KeyboardEvent on `window` so those
 *  components' self-contained key listeners fire exactly once — the same code
 *  path that a real key-press would follow.
 *
 *  All other actions (interact, station panels, audio, save) are resolved
 *  directly by the App.tsx `onInputAction` callback, which has access to the
 *  required game-loop context (player position, interaction target, etc.).
 */

/** Every discrete player action that can originate from keyboard or mobile UI. */
export type InputAction =
  | 'interact'
  | 'toggle-inventory'
  | 'toggle-skills'
  | 'toggle-journal'
  | 'toggle-ledger'
  | 'toggle-audio'
  | 'toggle-save'
  | 'toggle-smithing'
  | 'toggle-carving'
  | 'toggle-tinkering'
  | 'toggle-surveying'
  | 'toggle-warding'

/**
 * Map from keyboard code to InputAction.  Used by App.tsx's `onKeyDown` to
 * translate raw browser key events into the shared action vocabulary.
 *
 * Self-managed panel keys (I / K / J / L) are intentionally absent here.
 * Those panels install their own `window.addEventListener('keydown')` handler,
 * so real key presses are handled directly by the component.  The mobile path
 * still reaches those panels through `onInputAction` → `dispatchPanelKey`,
 * which re-dispatches a synthetic event that the panel's own handler catches.
 * Keeping them out of this table prevents a real key press from triggering
 * App's onKeyDown → onInputAction → dispatchPanelKey → synthetic event → panel
 * handler in addition to the direct panel handler (double-toggle / loop).
 */
export const KEY_TO_ACTION: Readonly<Record<string, InputAction>> = {
  KeyE: 'interact',
  KeyM: 'toggle-audio',
  KeyP: 'toggle-save',
  KeyF: 'toggle-smithing',
  KeyV: 'toggle-carving',
  KeyT: 'toggle-tinkering',
  KeyY: 'toggle-surveying',
  KeyG: 'toggle-warding',
}

/**
 * Key codes whose panel toggle logic is self-contained inside the panel
 * component (via its own `window.addEventListener('keydown')` handler).
 * For these actions the unified dispatcher re-dispatches a synthetic
 * `KeyboardEvent` so the panel's existing handler fires without duplication.
 */
const SELF_MANAGED_PANEL_ACTIONS = new Set<InputAction>([
  'toggle-inventory',
  'toggle-skills',
  'toggle-journal',
  'toggle-ledger',
])

/**
 * Map from InputAction back to the keyboard code used by self-managed panels.
 * Only populated for actions in `SELF_MANAGED_PANEL_ACTIONS`.
 */
const ACTION_TO_KEY: Readonly<Partial<Record<InputAction, string>>> = {
  'toggle-inventory': 'KeyI',
  'toggle-skills':    'KeyK',
  'toggle-journal':   'KeyJ',
  'toggle-ledger':    'KeyL',
}

/**
 * Dispatch a synthetic keyboard event for self-managed panel actions so their
 * built-in key listeners fire through the unified path.
 *
 * Only call this for actions in `SELF_MANAGED_PANEL_ACTIONS`.
 */
export function dispatchPanelKey(action: InputAction): void {
  if (!SELF_MANAGED_PANEL_ACTIONS.has(action)) return
  const code = ACTION_TO_KEY[action]
  if (!code) return
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))
}
