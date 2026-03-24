/**
 * Phase 89 — Accessibility Store
 *
 * Persists user accessibility preferences to localStorage so they survive
 * page reloads independently of the main game save.
 *
 * - reducedMotion: when true, a `reduce-motion` class is applied to
 *   <html> which overrides all CSS animations / transitions to instant.
 *   Mirrors `prefers-reduced-motion: reduce` for users who cannot set the
 *   OS-level media query.
 *
 * - fontScale: controls the root font-size (14 / 16 / 18 px) used for rems.
 *   For `sm` / `lg`, a `font-scale--sm` / `font-scale--lg` class is applied
 *   to <html>; `md` uses the default root font-size with no extra class.
 */
import { create } from 'zustand'

export type FontScale = 'sm' | 'md' | 'lg'

const STORAGE_KEY = 'veilmarch_accessibility_v1'

interface AccessibilityState {
  reducedMotion: boolean
  fontScale: FontScale
  isOpen: boolean

  setReducedMotion: (v: boolean) => void
  setFontScale: (v: FontScale) => void
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

function loadPrefs(): Pick<AccessibilityState, 'reducedMotion' | 'fontScale'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return {
        reducedMotion:
          typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : false,
        fontScale: (['sm', 'md', 'lg'] as const).includes(parsed.fontScale as FontScale)
          ? (parsed.fontScale as FontScale)
          : 'md',
      }
    }
  } catch {
    // Ignore — corrupt or absent pref data; fall back to defaults.
  }
  return { reducedMotion: false, fontScale: 'md' }
}

function savePrefs(reducedMotion: boolean, fontScale: FontScale): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reducedMotion, fontScale }))
  } catch {
    // Ignore — quota or private-browsing restrictions.
  }
}

const initial = loadPrefs()

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  reducedMotion: initial.reducedMotion,
  fontScale: initial.fontScale,
  isOpen: false,

  setReducedMotion: (v) => {
    set({ reducedMotion: v })
    savePrefs(v, get().fontScale)
  },
  setFontScale: (v) => {
    set({ fontScale: v })
    savePrefs(get().reducedMotion, v)
  },
  openPanel:   () => set({ isOpen: true }),
  closePanel:  () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
}))
