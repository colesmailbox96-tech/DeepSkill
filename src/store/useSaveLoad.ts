/**
 * Phase 06 — save/load placeholder hooks.
 *
 * Full persistence will be implemented in a later phase.
 * These stubs define the public API so downstream code can import them now.
 */
import { useCallback } from 'react'
import { useGameStore } from './useGameStore'

/** Placeholder: serialise and persist game state (localStorage, server, etc.). */
export function useSaveGame(): () => void {
  return useCallback(() => {
    // TODO: Implement save persistence (e.g. localStorage / IndexedDB / server).
    const state = useGameStore.getState()
    console.log('[Save] game state snapshot:', state)
  }, [])
}

/** Placeholder: load persisted game state and hydrate the store. */
export function useLoadGame(): () => void {
  return useCallback(() => {
    // TODO: Implement load persistence — read saved data and call store setters.
    console.log('[Load] load game — not yet implemented')
  }, [])
}
