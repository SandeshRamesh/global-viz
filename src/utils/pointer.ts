/**
 * Pointer-capability helpers.
 *
 * Touch input needs different interaction tuning than a mouse: a finger tap is
 * slower to repeat and lands less precisely than a click. We key off the
 * `(pointer: coarse)` media query rather than viewport width, because it
 * describes the actual input device — a 12" tablet is still touch, and a small
 * laptop window is still a mouse.
 *
 * See docs/plans/phase-9bc-tablet-mobile.md for the tablet work this supports.
 */

/** True when the primary input is a finger/stylus rather than a mouse. */
export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(pointer: coarse)').matches
}

/**
 * Double-click / double-tap window in ms.
 *
 * The previous value was 100ms, which is near-unhittable even with a mouse and
 * effectively impossible with a finger — you cannot lift and re-plant a finger
 * that fast. Platform double-click thresholds sit around 500ms; we stay under
 * that so a deliberate single click still feels responsive, because every
 * single-click action is deferred by this amount to see if a second one lands.
 */
export const CLICK_DELAY_MOUSE_MS = 250
export const CLICK_DELAY_TOUCH_MS = 400

export function getClickDelay(): number {
  return isCoarsePointer() ? CLICK_DELAY_TOUCH_MS : CLICK_DELAY_MOUSE_MS
}

/**
 * Layout multipliers applied only on touch devices, to "open up the margins"
 * so nodes are far enough apart to hit reliably.
 *
 * WCAG 2.2 SC 2.5.8 sets 24x24 CSS px as the minimum target; Apple asks for
 * 44pt and Material for 48dp. The radial graph cannot give every one of ~3k
 * nodes a 44px target without destroying the layout, so we do the two things
 * that help without that cost: raise the size floor for the smallest nodes, and
 * widen the gaps between them.
 */
export const TOUCH_MIN_NODE_RADIUS_PX = 6   // 12px diameter floor, up from ~1.6px
export const TOUCH_SPACING_MULTIPLIER = 1.6
export const TOUCH_MAX_SPACING_MULTIPLIER = 1.5
