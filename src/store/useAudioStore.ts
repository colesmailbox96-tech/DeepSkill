/**
 * Phase 49 — Audio Store
 *
 * Zustand store for audio settings (volume levels, mute, panel open/close).
 * Changes here are consumed by AudioSettingsPanel and applied to the
 * audioManager singleton in App.tsx via a store subscription.
 */

import { create } from 'zustand'

interface AudioState {
  /** 0–1 overall output level. */
  masterVolume: number
  /** 0–1 music channel level. */
  musicVolume: number
  /** 0–1 sound-effect channel level. */
  sfxVolume: number
  /** 0–1 ambient channel level. */
  ambientVolume: number
  /** When true the master gain is set to zero. */
  isMuted: boolean
  /** Whether the audio settings panel is visible. */
  isOpen: boolean

  setMasterVolume:  (v: number) => void
  setMusicVolume:   (v: number) => void
  setSfxVolume:     (v: number) => void
  setAmbientVolume: (v: number) => void
  toggleMute:       () => void
  openPanel:        () => void
  closePanel:       () => void
  togglePanel:      () => void
}

export const useAudioStore = create<AudioState>((set) => ({
  masterVolume:  0.8,
  musicVolume:   0.35,
  sfxVolume:     0.7,
  ambientVolume: 0.45,
  isMuted:       false,
  isOpen:        false,

  setMasterVolume:  (v) => set({ masterVolume:  Math.max(0, Math.min(1, v)) }),
  setMusicVolume:   (v) => set({ musicVolume:   Math.max(0, Math.min(1, v)) }),
  setSfxVolume:     (v) => set({ sfxVolume:     Math.max(0, Math.min(1, v)) }),
  setAmbientVolume: (v) => set({ ambientVolume: Math.max(0, Math.min(1, v)) }),
  toggleMute:       ()  => set((s) => ({ isMuted: !s.isMuted })),
  openPanel:        ()  => set({ isOpen: true }),
  closePanel:       ()  => set({ isOpen: false }),
  togglePanel:      ()  => set((s) => ({ isOpen: !s.isOpen })),
}))
