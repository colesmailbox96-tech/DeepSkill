/**
 * Skill data schema — shared type used by both the data layer and the store.
 *
 * Mirrors the pattern established in src/data/items/itemSchema.ts.
 */
export interface Skill {
  id: string
  name: string
  level: number
  experience: number
  experienceToNextLevel: number
  /** Optional flavour text shown in the skills panel tooltip. */
  description?: string
}
