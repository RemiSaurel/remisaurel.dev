export type CubicBezier = [number, number, number, number]

/** Same curve as the `--ease-out` CSS variable. */
export const EASE_OUT: CubicBezier = [0.23, 1, 0.32, 1]

/** Entrance of page sections and headers. */
export const SECTION_TRANSITION = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94] as CubicBezier,
}
