import type { SoundDefinition } from '@web-kits/audio'

// Picked from the first-party @web-kits/audio patches (MIT, Raphael Salaja):
// https://github.com/raphaelsalaja/audio/tree/main/.web-kits
// Only the sounds the site actually uses are kept here.

/** "Minimal" patch: pure sine blips, used across the site. */
export const MINIMAL = {
  tap: { source: { type: 'sine', frequency: 1200 }, envelope: { attack: 0, decay: 0.012, sustain: 0, release: 0.004 }, gain: 0.08 },
  toggleOn: { layers: [
    { source: { type: 'sine', frequency: 880 }, envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.006 }, gain: 0.08 },
    { source: { type: 'sine', frequency: 1320 }, envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.006 }, delay: 0.03, gain: 0.07 },
  ] },
  toggleOff: { layers: [
    { source: { type: 'sine', frequency: 1320 }, envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.006 }, gain: 0.08 },
    { source: { type: 'sine', frequency: 880 }, envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.006 }, delay: 0.03, gain: 0.07 },
  ] },
  pop: { source: { type: 'sine', frequency: { start: 400, end: 200 } }, envelope: { attack: 0, decay: 0.04, sustain: 0, release: 0.012 }, gain: 0.1 },
  success: { layers: [
    { source: { type: 'sine', frequency: 523 }, envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.015 }, gain: 0.1 },
    { source: { type: 'sine', frequency: 784 }, envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.015 }, delay: 0.06, gain: 0.08 },
  ] },
} satisfies Record<string, SoundDefinition>

/** "Retro" patch: square-wave chiptune, reserved for the Tetris easter egg. */
export const RETRO = {
  tap: { source: { type: 'square', frequency: 880 }, envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.006 }, gain: 0.15 },
  click: { source: { type: 'square', frequency: 660 }, envelope: { attack: 0, decay: 0.025, sustain: 0, release: 0.008 }, gain: 0.18 },
  tabSwitch: { source: { type: 'square', frequency: { start: 660, end: 880 } }, envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.01 }, gain: 0.14 },
  toggleOn: { layers: [
    { source: { type: 'square', frequency: 523 }, envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.01 }, gain: 0.16 },
    { source: { type: 'square', frequency: 784 }, envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.01 }, delay: 0.04, gain: 0.14 },
  ] },
  toggleOff: { layers: [
    { source: { type: 'square', frequency: 784 }, envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.01 }, gain: 0.16 },
    { source: { type: 'square', frequency: 523 }, envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.01 }, delay: 0.04, gain: 0.14 },
  ] },
  pageEnter: { source: { type: 'square', frequency: { start: 440, end: 880 } }, envelope: { attack: 0, decay: 0.08, sustain: 0, release: 0.025 }, gain: 0.1 },
  swoosh: { source: { type: 'square', frequency: { start: 220, end: 1760 } }, envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.025 }, gain: 0.1 },
  pop: { source: { type: 'square', frequency: { start: 660, end: 220 } }, envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.015 }, gain: 0.2 },
  success: { layers: [
    { source: { type: 'square', frequency: 523 }, envelope: { attack: 0, decay: 0.06, sustain: 0, release: 0.02 }, gain: 0.16 },
    { source: { type: 'square', frequency: 659 }, envelope: { attack: 0, decay: 0.06, sustain: 0, release: 0.02 }, delay: 0.06, gain: 0.14 },
    { source: { type: 'square', frequency: 784 }, envelope: { attack: 0, decay: 0.06, sustain: 0, release: 0.02 }, delay: 0.12, gain: 0.12 },
    { source: { type: 'square', frequency: 1047 }, envelope: { attack: 0, decay: 0.08, sustain: 0, release: 0.025 }, delay: 0.18, gain: 0.1 },
  ] },
  notification: { layers: [
    { source: { type: 'square', frequency: 660 }, envelope: { attack: 0, decay: 0.06, sustain: 0, release: 0.02 }, gain: 0.16 },
    { source: { type: 'square', frequency: 880 }, envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.015 }, delay: 0.07, gain: 0.14 },
  ] },
  error: { layers: [
    { source: { type: 'square', frequency: { start: 440, end: 220 } }, envelope: { attack: 0, decay: 0.08, sustain: 0, release: 0.025 }, gain: 0.2 },
    { source: { type: 'square', frequency: { start: 330, end: 165 } }, envelope: { attack: 0, decay: 0.06, sustain: 0, release: 0.02 }, delay: 0.04, gain: 0.14 },
  ] },
} satisfies Record<string, SoundDefinition>
