/**
 * Which step (0..max) a touch lands on, for a slider `width` wide whose thumb
 * is `thumb` wide: the thumb's center runs from thumb/2 to width - thumb/2.
 */
export function stepFromTouch(
	x: number,
	width: number,
	thumb: number,
	max: number,
): number {
	if (width <= thumb || max <= 0) return 0;
	const f = (x - thumb / 2) / (width - thumb);
	return Math.round(Math.min(1, Math.max(0, f)) * max);
}

/** A saved step (anything could be in the db) as a whole number from 0 to max. */
export function clampStep(
	value: unknown,
	max: number,
	fallback: number,
): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.min(max, Math.max(0, Math.round(value)));
}
