/**
 * Telling a swipe up from everything else a finger does: a tap, a slow drag,
 * a sideways slide. Plain TypeScript (no React, no Expo), so it can be tested
 * on its own. Distances are in dp, times in milliseconds.
 */
export type TouchPoint = { x: number; y: number; t: number };

/** The finger must travel at least this far upward. */
export const SWIPE_MIN_DISTANCE = 90;
/** ...within this time (a slow drag is not a swipe). */
export const SWIPE_MAX_MS = 700;
/** ...and not drift sideways more than this fraction of the distance it went up. */
export const SWIPE_MAX_SIDEWAYS = 0.6;

export function isSwipeUp(from: TouchPoint, to: TouchPoint): boolean {
	const up = from.y - to.y;
	const sideways = Math.abs(to.x - from.x);
	const ms = to.t - from.t;
	return (
		up >= SWIPE_MIN_DISTANCE &&
		sideways <= up * SWIPE_MAX_SIDEWAYS &&
		ms >= 0 &&
		ms <= SWIPE_MAX_MS
	);
}
