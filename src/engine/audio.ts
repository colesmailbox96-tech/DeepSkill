/**
 * Phase 49 — Audio Foundation
 * Phase 69 — Region-Specific Music and Ambience Pass
 *
 * A procedural audio engine built on the Web Audio API.  No external asset
 * files are needed — all sounds are synthesised via oscillators and noise
 * buffers.
 *
 * Features
 * ────────
 *  • Ambient loops that morph per world region (hushwood, bog, chapel,
 *    quarry, shoreline, ashfen, hollow_vault).
 *  • Per-region LFO modulation (lfoFreq / lfoDepth) for distinct filter motion.
 *  • Secondary high-pass air-noise layer (airLevel) giving each region an
 *    upper-frequency character (forest air, sea spray, quarry dust, …).
 *  • Per-region peaceful music motifs — distinct melodic phrases keyed to the
 *    current AudioRegion; combat sequence is shared.
 *  • One-shot SFX for gathering, crafting, and interaction events.
 *  • Per-channel gain nodes (master / music / sfx / ambient) that sync
 *    with useAudioStore for live volume / mute adjustment.
 *
 * Usage
 * ─────
 *  import { audioManager, getAudioRegion } from './audio'
 *
 *  // On first user gesture:
 *  audioManager.init()
 *
 *  // Per-frame (after player position update):
 *  audioManager.setRegion(getAudioRegion(pos.x, pos.z))
 *
 *  // On gather events:
 *  audioManager.playSfx('chop')
 *
 *  // On entering combat:
 *  audioManager.setMusicMode('combat')
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Unique identifier for an audio region. */
export type AudioRegion = 'hushwood' | 'bog' | 'chapel' | 'quarry' | 'shoreline' | 'ashfen' | 'hollow_vault' | 'marrowfen'

/** Type of one-shot sound effect. */
export type SfxType =
  | 'chop'
  | 'mine'
  | 'forage'
  | 'fish_cast'
  | 'interact'
  | 'collect'

/** Music routing mode. */
export type MusicMode = 'peaceful' | 'combat'

// ─── Region config ────────────────────────────────────────────────────────────

interface RegionConfig {
  /** BiquadFilter type used to shape the white-noise ambient. */
  filterType: BiquadFilterType
  /** Filter cutoff frequency (Hz). */
  filterFreq: number
  /** Filter resonance (Q). */
  filterQ: number
  /** Optional low-frequency drone oscillator (Hz), or null for none. */
  droneFreq: number | null
  /** Gain of the drone relative to the ambient gain node (0–1). */
  droneLevel: number
  /**
   * Phase 69 — LFO modulation frequency (Hz) applied to the noise filter
   * cutoff.  Gives each region a distinct motion (waves, wind gusts, …).
   * Set to 0 for a static filter.
   */
  lfoFreq: number
  /**
   * Phase 69 — Depth of the LFO modulation in Hz (how much the filter
   * cutoff swings above and below its base value).
   */
  lfoDepth: number
  /**
   * Phase 69 — Level (0–1) of the secondary high-pass air-noise layer.
   * Adds upper-frequency character: forest air, sea spray, stone dust, etc.
   */
  airLevel: number
}

const REGION_CONFIG: Record<AudioRegion, RegionConfig> = {
  // Hushwood: bright forest air with a gentle, sighing wind.
  hushwood: {
    filterType: 'bandpass',
    filterFreq: 600,
    filterQ: 0.8,
    droneFreq: null,
    droneLevel: 0,
    lfoFreq: 0.05,   // very slow sway — a languid breath through the canopy
    lfoDepth: 45,
    airLevel: 0.15,  // airy high-frequency rustle
  },
  // Bog: heavy, humid stillness with a deep sub-bass rumble.
  bog: {
    filterType: 'lowpass',
    filterFreq: 200,
    filterQ: 2.5,
    droneFreq: 55,
    droneLevel: 0.12,
    lfoFreq: 0.08,   // slow ripple across the water surface
    lfoDepth: 22,
    airLevel: 0.05,  // thick, damp air — barely any high-frequency content
  },
  // Chapel: reverberant stone chamber with a resonant ceremonial drone.
  chapel: {
    filterType: 'bandpass',
    filterFreq: 300,
    filterQ: 1.2,
    droneFreq: 60,
    droneLevel: 0.18,
    lfoFreq: 0.03,   // almost imperceptible swell — like torches breathing
    lfoDepth: 60,
    airLevel: 0.08,  // dusty stone chamber
  },
  // Quarry: oppressive, grinding low-end with mechanical flutter.
  quarry: {
    filterType: 'lowpass',
    filterFreq: 140,
    filterQ: 3.0,
    droneFreq: 80,
    droneLevel: 0.08,
    lfoFreq: 0.12,   // irregular machine-like flutter
    lfoDepth: 18,
    airLevel: 0.20,  // heavy rock-dust in the air
  },
  // Shoreline: open coastal soundscape with rolling wave motion.
  shoreline: {
    filterType: 'bandpass',
    filterFreq: 350,
    filterQ: 1.0,
    droneFreq: null,
    droneLevel: 0,
    lfoFreq: 0.15,   // ~6-second wave cycle (unchanged from Phase 49)
    lfoDepth: 120,   // wide sweep for surf character
    airLevel: 0.22,  // sea spray and open sky
  },
  // Phase 57 — Ashfen Copse: deep forest stillness with a low mineral resonance.
  ashfen: {
    filterType: 'lowpass',
    filterFreq: 160,
    filterQ: 2.2,
    droneFreq: 68,
    droneLevel: 0.14,
    lfoFreq: 0.06,   // slow, ancient forest pulse
    lfoDepth: 32,
    airLevel: 0.10,  // damp undergrowth vapour
  },
  // Phase 65 — Hollow Vault Steps: oppressive underground silence broken by
  // a deep resonant drone from the warding inscriptions in the stone.
  hollow_vault: {
    filterType: 'lowpass',
    filterFreq: 100,
    filterQ: 3.5,
    droneFreq: 45,
    droneLevel: 0.22,
    lfoFreq: 0.02,   // near-static — the vault barely breathes
    lfoDepth: 10,
    airLevel: 0.03,  // almost no high-frequency content underground
  },
  // Phase 74 — Marrowfen: thick, fetid air with a constant low gurgle from
  // the gas vents.  Heavier than the bog; deeper drone signals real danger.
  marrowfen: {
    filterType: 'lowpass',
    filterFreq: 160,
    filterQ: 2.8,
    droneFreq: 48,
    droneLevel: 0.20,
    lfoFreq: 0.07,   // slow bubbling motion like fen gas rising through water
    lfoDepth: 28,
    airLevel: 0.04,  // almost no open air — dense canopy and humid miasma
  },
}

// ─── Pentatonic music sequences ───────────────────────────────────────────────

/** Frequency (Hz) of each note in the C-major pentatonic scale. */
const C_PENTA = [261.63, 293.66, 329.63, 392.0, 440.0] // C4 D4 E4 G4 A4

/** Note sequences: [freq index, duration in seconds]. */
const PEACEFUL_SEQ: [number, number][] = [
  [0, 0.45], [2, 0.35], [4, 0.55], [3, 0.35],
  [2, 0.45], [1, 0.35], [0, 0.65], [0, 0.3],
]
const COMBAT_SEQ: [number, number][] = [
  [0, 0.25], [2, 0.2 ], [4, 0.3 ], [2, 0.2 ],
  [3, 0.25], [4, 0.2 ], [3, 0.3 ], [0, 0.2 ],
]

/**
 * Phase 69 — Per-region peaceful music motifs.
 *
 * Each region has a distinct melodic phrase using the C-major pentatonic
 * scale (indices 0–4 → C4 D4 E4 G4 A4).  The global PEACEFUL_SEQ is kept
 * as a fallback but is no longer scheduled directly.
 */
const REGION_PEACEFUL_SEQ: Record<AudioRegion, [number, number][]> = {
  // Hushwood: airy and sparse — upper notes with long gaps between them,
  // evoking birdsong drifting through a canopy.
  hushwood: [
    [4, 0.6], [3, 0.5], [4, 0.7], [2, 0.45],
    [3, 0.55], [4, 0.5], [0, 0.9],
  ],
  // Bog: slow and murky — low notes with heavy rests; things move reluctantly
  // here.
  bog: [
    [0, 0.8], [1, 0.6], [0, 1.0], [2, 0.5],
    [1, 0.7], [0, 0.9],
  ],
  // Chapel: solemn and reverberant — step-wise ascending and descending
  // phrases, like a simple chant echoing off stone walls.
  chapel: [
    [0, 1.0], [2, 0.75], [3, 0.85], [4, 0.65],
    [3, 0.85], [2, 0.7], [0, 1.2],
  ],
  // Quarry: earthy and rhythmic — mid-range notes in a steady, work-song
  // pulse.
  quarry: [
    [2, 0.3], [0, 0.35], [1, 0.3], [2, 0.4],
    [1, 0.3], [0, 0.45],
  ],
  // Shoreline: flowing and arpeggic — a rising-then-falling phrase that
  // mirrors the motion of waves.
  shoreline: [
    [0, 0.4], [2, 0.35], [4, 0.45], [3, 0.35],
    [2, 0.4], [1, 0.35], [0, 0.6],
  ],
  // Ashfen: brooding and minor-tinged — lower notes with irregular pacing,
  // suggesting unseen movement in the deep forest.
  ashfen: [
    [1, 0.55], [0, 0.75], [2, 0.5], [1, 0.65],
    [0, 0.85],
  ],
  // Hollow Vault: ominous and sparse — only three very slow, low notes;
  // long silences between them heighten unease.
  hollow_vault: [
    [0, 1.1], [2, 0.9], [0, 1.3],
  ],
  // Phase 74 — Marrowfen: dark and dissonant — low two-note motifs interrupted
  // by long rests; the silence feels as threatening as the notes.
  marrowfen: [
    [0, 0.9], [1, 0.7], [0, 1.2], [1, 0.85],
  ],
}

// ─── AudioManager ─────────────────────────────────────────────────────────────

class AudioManager {
  private ctx: AudioContext | null = null

  // Gain nodes (hierarchy: master → channel)
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private ambientGain: GainNode | null = null

  // Ambient: looping noise source → filter → noiseGain → ambientGain
  private noiseBuffer: AudioBuffer | null = null
  private noiseSource: AudioBufferSourceNode | null = null
  private noiseFilter: BiquadFilterNode | null = null
  private noiseNodeGain: GainNode | null = null

  // Ambient drone (optional per-region oscillator)
  private droneOsc: OscillatorNode | null = null
  private droneGain: GainNode | null = null

  // LFO for filter modulation (frequency and depth per region — Phase 69)
  private lfoOsc: OscillatorNode | null = null
  private lfoGain: GainNode | null = null

  // Phase 69 — Secondary high-pass air-noise layer (sea spray, dust, forest air, …)
  private airSource: AudioBufferSourceNode | null = null
  private airFilter: BiquadFilterNode | null = null
  private airGain: GainNode | null = null

  // State
  private currentRegion: AudioRegion | null = null
  private currentMusicMode: MusicMode = 'peaceful'

  // Music scheduler
  private musicTimer: ReturnType<typeof setInterval> | null = null
  private noteIndex: number = 0
  private nextNoteTime: number = 0

  // Volume settings
  private _masterVol = 0.8
  private _musicVol = 0.35
  private _sfxVol = 0.7
  private _ambientVol = 0.45
  private _isMuted = false

  // ── Initialisation ──────────────────────────────────────────────────────────

  /**
   * Create (or resume) the AudioContext and wire up the gain hierarchy.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  init(): void {
    if (this.ctx) {
      // Resume suspended context (e.g. after the browser paused it).
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume()
      }
      return
    }

    try {
      this.ctx = new AudioContext()
    } catch {
      // AudioContext is unavailable (unsupported browser or sandboxed environment).
      // All subsequent audio calls will silently no-op since ctx remains null.
      return
    }

    // Build gain hierarchy
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this._isMuted ? 0 : this._masterVol
    this.masterGain.connect(this.ctx.destination)

    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = this._musicVol
    this.musicGain.connect(this.masterGain)

    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = this._sfxVol
    this.sfxGain.connect(this.masterGain)

    this.ambientGain = this.ctx.createGain()
    this.ambientGain.gain.value = this._ambientVol
    this.ambientGain.connect(this.masterGain)

    // Generate white-noise buffer (2 s, stereo)
    this.noiseBuffer = this._makeNoiseBuffer(2)

    // Wire up ambient noise chain (starts silent; region sets it active)
    this.noiseFilter = this.ctx.createBiquadFilter()
    this.noiseNodeGain = this.ctx.createGain()
    this.noiseNodeGain.gain.value = 0
    this.noiseFilter.connect(this.noiseNodeGain)
    this.noiseNodeGain.connect(this.ambientGain)

    // Drone gain (starts silent)
    this.droneGain = this.ctx.createGain()
    this.droneGain.gain.value = 0
    this.droneGain.connect(this.ambientGain)

    // LFO for filter modulation (Phase 69: per-region freq + depth)
    this.lfoOsc = this.ctx.createOscillator()
    this.lfoOsc.type = 'sine'
    this.lfoOsc.frequency.value = 0.05 // default; overridden per region
    this.lfoGain = this.ctx.createGain()
    this.lfoGain.gain.value = 0
    this.lfoOsc.connect(this.lfoGain)
    this.lfoGain.connect(this.noiseFilter.frequency)
    this.lfoOsc.start()

    // Phase 69 — Secondary air-noise layer: highpass-filtered noise giving
    // each region an upper-frequency texture (spray, dust, rustling leaves, …).
    this.airFilter = this.ctx.createBiquadFilter()
    this.airFilter.type = 'highpass'
    this.airFilter.frequency.value = 3000
    this.airFilter.Q.value = 0.5
    this.airGain = this.ctx.createGain()
    this.airGain.gain.value = 0
    this.airFilter.connect(this.airGain)
    this.airGain.connect(this.ambientGain)
    this._startAirNoise()

    // Start noise loop
    this._startNoise()

    // Start music scheduler
    this._startMusicScheduler()

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
  }

  // ── Volume / mute ───────────────────────────────────────────────────────────

  /**
   * Update all four channel gains at once.  Values are clamped to [0, 1].
   */
  setVolumes(master: number, music: number, sfx: number, ambient: number): void {
    this._masterVol  = Math.max(0, Math.min(1, master))
    this._musicVol   = Math.max(0, Math.min(1, music))
    this._sfxVol     = Math.max(0, Math.min(1, sfx))
    this._ambientVol = Math.max(0, Math.min(1, ambient))
    this._applyGains()
  }

  /** Toggle global mute on or off. */
  setMuted(muted: boolean): void {
    this._isMuted = muted
    this._applyGains()
  }

  // ── Region ─────────────────────────────────────────────────────────────────

  /**
   * Update the ambient soundscape to match the current world region.
   * Should be called each frame (or whenever the player crosses a zone
   * boundary); the method is cheap when the region has not changed.
   *
   * Phase 69: transitions now apply per-region LFO (frequency + depth) and
   * the secondary air-noise layer, and reset the music motif.
   */
  setRegion(region: AudioRegion): void {
    if (!this.ctx || !this.noiseFilter || !this.noiseNodeGain || !this.droneGain || !this.lfoGain || !this.lfoOsc || !this.airGain) return
    if (region === this.currentRegion) return
    this.currentRegion = region

    const cfg = REGION_CONFIG[region]
    const now = this.ctx.currentTime
    // Use a slightly longer time constant for smoother region crossfades (Phase 69).
    const crossfadeTau = 1.5

    // Apply noise filter settings
    this.noiseFilter.type = cfg.filterType
    this.noiseFilter.frequency.setTargetAtTime(cfg.filterFreq, now, crossfadeTau)
    this.noiseFilter.Q.setTargetAtTime(cfg.filterQ, now, crossfadeTau)

    // Ensure the base noise layer is active and smoothly crossfaded for this region
    this.noiseNodeGain.gain.setTargetAtTime(0.25, now, crossfadeTau)

    // Drone
    if (cfg.droneFreq !== null) {
      this._ensureDrone(cfg.droneFreq)
      this.droneGain.gain.setTargetAtTime(cfg.droneLevel, now, crossfadeTau)
    } else {
      // Fade the drone out, then stop and disconnect its oscillator to avoid
      // keeping it running silently and wasting CPU.
      this.droneGain.gain.setTargetAtTime(0, now, crossfadeTau)
      if (this.droneOsc) {
        const stopAt = now + crossfadeTau * 5.0 // allow gain to reach ~0 before stopping
        try {
          this.droneOsc.stop(stopAt)
        } catch {
          // Ignore errors if the oscillator was already stopped.
        }
        this.droneOsc.disconnect()
        this.droneOsc = null
      }
    }

    // Phase 69 — Per-region LFO: update both frequency and modulation depth.
    if (cfg.lfoFreq > 0 && cfg.lfoDepth > 0) {
      this.lfoOsc.frequency.setTargetAtTime(cfg.lfoFreq, now, crossfadeTau)
      this.lfoGain.gain.setTargetAtTime(cfg.lfoDepth, now, crossfadeTau)
    } else {
      this.lfoGain.gain.setTargetAtTime(0, now, crossfadeTau)
    }

    // Phase 69 — Secondary air-noise layer level.
    this.airGain.gain.setTargetAtTime(cfg.airLevel, now, crossfadeTau)

    // Phase 69 — Reset peaceful music motif so the region's phrase starts fresh.
    if (this.currentMusicMode === 'peaceful') {
      this.noteIndex = 0
    }
  }

  // ── Music mode ──────────────────────────────────────────────────────────────

  /**
   * Switch between peaceful and combat music modes.  The next note played
   * by the scheduler will draw from the new sequence.
   */
  setMusicMode(mode: MusicMode): void {
    if (mode === this.currentMusicMode) return
    this.currentMusicMode = mode
    this.noteIndex = 0
  }

  // ── SFX ─────────────────────────────────────────────────────────────────────

  /**
   * Play a short synthesised sound effect.  If the AudioContext has not yet
   * been initialised (requires a user gesture), this call silently no-ops.
   */
  playSfx(type: SfxType): void {
    if (!this.ctx || !this.sfxGain) {
      this.init()
      if (!this.ctx || !this.sfxGain) return
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()

    switch (type) {
      case 'chop':       this._sfxChop();      break
      case 'mine':       this._sfxMine();      break
      case 'forage':     this._sfxForage();    break
      case 'fish_cast':  this._sfxFishCast();  break
      case 'interact':   this._sfxInteract();  break
      case 'collect':    this._sfxCollect();   break
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  /** Stop all audio and release Web Audio resources. */
  dispose(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }
    try {
      this.noiseSource?.stop()
      this.droneOsc?.stop()
      this.lfoOsc?.stop()
      this.airSource?.stop()
    } catch { /* ignore stop-before-start errors */ }
    void this.ctx?.close()
    this.ctx = null
    this.masterGain = null
    this.musicGain = null
    this.sfxGain = null
    this.ambientGain = null
    this.noiseBuffer = null
    this.noiseSource = null
    this.noiseFilter = null
    this.noiseNodeGain = null
    this.droneOsc = null
    this.droneGain = null
    this.lfoOsc = null
    this.lfoGain = null
    this.airSource = null
    this.airFilter = null
    this.airGain = null
    this.currentRegion = null
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _applyGains(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain || !this.ambientGain) return
    this.masterGain.gain.value  = this._isMuted ? 0 : this._masterVol
    this.musicGain.gain.value   = this._musicVol
    this.sfxGain.gain.value     = this._sfxVol
    this.ambientGain.gain.value = this._ambientVol
  }

  /** Create a 2-second stereo white-noise buffer. */
  private _makeNoiseBuffer(durationSec: number): AudioBuffer {
    const ctx = this.ctx!
    const sampleRate = ctx.sampleRate
    const frameCount = Math.floor(sampleRate * durationSec)
    const buf = ctx.createBuffer(2, frameCount, sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch)
      for (let i = 0; i < frameCount; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }
    return buf
  }

  /** Start the looping noise source. */
  private _startNoise(): void {
    if (!this.ctx || !this.noiseBuffer || !this.noiseFilter) return
    this.noiseSource?.stop()
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    src.connect(this.noiseFilter)
    src.start()
    this.noiseSource = src
  }

  /**
   * Phase 69 — Start the secondary air-noise source (looping, highpass).
   * Uses the same white-noise buffer as the primary ambient layer.
   */
  private _startAirNoise(): void {
    if (!this.ctx || !this.noiseBuffer || !this.airFilter) return
    this.airSource?.stop()
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    src.connect(this.airFilter)
    src.start()
    this.airSource = src
  }

  /** Ensure a drone oscillator is running at the given frequency. */
  private _ensureDrone(freq: number): void {
    if (!this.ctx || !this.droneGain) return
    if (this.droneOsc) {
      this.droneOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.5)
      return
    }
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(this.droneGain)
    osc.start()
    this.droneOsc = osc
  }

  // ── Music scheduler ─────────────────────────────────────────────────────────

  private _startMusicScheduler(): void {
    if (!this.ctx) return
    this.nextNoteTime = this.ctx.currentTime + 2.0 // initial silence
    this.musicTimer = setInterval(() => this._scheduleMusicNotes(), 100)
  }

  private _scheduleMusicNotes(): void {
    if (!this.ctx || !this.musicGain) return
    // Look-ahead window: 200 ms
    const lookAhead = 0.2
    // Phase 69 — Use the region-specific peaceful motif when not in combat.
    const seq = this.currentMusicMode === 'combat'
      ? COMBAT_SEQ
      : (this.currentRegion ? REGION_PEACEFUL_SEQ[this.currentRegion] : PEACEFUL_SEQ)

    while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
      this._scheduleSingleNote(seq)
      const [, dur] = seq[this.noteIndex % seq.length]
      this.nextNoteTime += dur + 0.05 // tiny gap between notes
      this.noteIndex = (this.noteIndex + 1) % seq.length
    }
  }

  private _scheduleSingleNote(seq: [number, number][]): void {
    if (!this.ctx || !this.musicGain) return
    const [freqIdx, dur] = seq[this.noteIndex % seq.length]
    const freq = C_PENTA[freqIdx]
    const t = this.nextNoteTime

    // Sine oscillator for soft melodic tone
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq

    // Soft attack/release envelope
    const env = this.ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.18, t + 0.03)
    env.gain.setTargetAtTime(0, t + dur * 0.6, dur * 0.25)

    osc.connect(env)
    env.connect(this.musicGain)

    osc.start(t)
    osc.stop(t + dur + 0.1)
    osc.addEventListener('ended', () => {
      osc.disconnect()
      env.disconnect()
    })
  }

  // ── Individual SFX implementations ─────────────────────────────────────────

  private _sfxChop(): void {
    const ctx = this.ctx!
    const out = this.sfxGain!
    const t = ctx.currentTime

    // Thuddy impact: short noise burst with fast decay
    const noiseBuf = this._makeNoiseBuffer(0.15)
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf

    const filt = ctx.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.value = 800

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.6, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12)

    src.connect(filt)
    filt.connect(env)
    env.connect(out)
    src.start(t)
    src.stop(t + 0.15)
    src.addEventListener('ended', () => { src.disconnect(); filt.disconnect(); env.disconnect() })
  }

  private _sfxMine(): void {
    const ctx = this.ctx!
    const out = this.sfxGain!
    const t = ctx.currentTime

    // Metallic clank: short high-pitched sine with fast attack/release
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, t)
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.06)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.5, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.14)

    osc.connect(env)
    env.connect(out)
    osc.start(t)
    osc.stop(t + 0.15)
    osc.addEventListener('ended', () => { osc.disconnect(); env.disconnect() })
  }

  private _sfxForage(): void {
    const ctx = this.ctx!
    const out = this.sfxGain!
    const t = ctx.currentTime

    // Soft rustle: very short, filtered noise
    const noiseBuf = this._makeNoiseBuffer(0.1)
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf

    const filt = ctx.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.value = 2000
    filt.Q.value = 1.2

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.25, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.09)

    src.connect(filt)
    filt.connect(env)
    env.connect(out)
    src.start(t)
    src.stop(t + 0.1)
    src.addEventListener('ended', () => { src.disconnect(); filt.disconnect(); env.disconnect() })
  }

  private _sfxFishCast(): void {
    const ctx = this.ctx!
    const out = this.sfxGain!
    const t = ctx.currentTime

    // Swoosh: frequency sweep from high to low over ~0.3 s
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(1200, t)
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.28)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.3, t + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

    osc.connect(env)
    env.connect(out)
    osc.start(t)
    osc.stop(t + 0.32)
    osc.addEventListener('ended', () => { osc.disconnect(); env.disconnect() })
  }

  private _sfxInteract(): void {
    const ctx = this.ctx!
    const out = this.sfxGain!
    const t = ctx.currentTime

    // Soft UI ping: single sine tone
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 880

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.25, t + 0.01)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.18)

    osc.connect(env)
    env.connect(out)
    osc.start(t)
    osc.stop(t + 0.2)
    osc.addEventListener('ended', () => { osc.disconnect(); env.disconnect() })
  }

  private _sfxCollect(): void {
    const ctx = this.ctx!
    const out = this.sfxGain!
    const t = ctx.currentTime

    // Success chime: two ascending sine tones
    const freqs = [523.25, 659.25] // C5, E5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const start = t + i * 0.1
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, start)
      env.gain.linearRampToValueAtTime(0.22, start + 0.015)
      env.gain.exponentialRampToValueAtTime(0.001, start + 0.22)

      osc.connect(env)
      env.connect(out)
      osc.start(start)
      osc.stop(start + 0.25)
      osc.addEventListener('ended', () => { osc.disconnect(); env.disconnect() })
    })
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/** Shared audio manager — import and use anywhere. */
export const audioManager = new AudioManager()

// ─── Region helper ────────────────────────────────────────────────────────────

/**
 * Derive the current audio region from player world-space coordinates.
 * This mirrors the zone layout established by the world-building phases.
 */
export function getAudioRegion(x: number, z: number): AudioRegion {
  // Hollow Vault Steps — deeper than the chapel; narrow z band within the chapel x range.
  if (x <= -60 && z >= -10 && z <= 10) return 'hollow_vault'
  if (x <= -32) return 'chapel'
  // Marrowfen — deep south fen zone, checked before the broad bog catch-all.
  if (z >= 60 && x >= -28 && x <= 28) return 'marrowfen'
  if (z >= 19)  return 'bog'
  // Ashfen Copse must be checked before the broader east/south region checks
  // because it lies in the far-northeast corner of the map.
  if (x >= 34 && z <= -54 && z >= -92) return 'ashfen'
  // Shoreline: eastern band, excluding the deep-north quarry strip.
  if (x >= 19 && z > -19) return 'shoreline'
  // Quarry: primarily identified by being sufficiently far north.
  if (z <= -19) return 'quarry'
  return 'hushwood'
}
