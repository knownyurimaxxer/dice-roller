/**
 * Recognizing a throwing motion from the phone's accelerometer. Plain
 * TypeScript (no React, no Expo), so it can be tested on its own.
 *
 * A throw is a sharp push that starts from a phone held still: the gravity
 * part of the reading is filtered out, and a push counts when it is stronger
 * than the threshold AND the phone had been calm just before it. That way
 * walking, riding a bus or tapping the screen don't roll the dice.
 */

export const THROW_SENSITIVITY_MIN = 1;
export const THROW_SENSITIVITY_MAX = 10;
export const THROW_SENSITIVITY_DEFAULT = 5;

/** A saved sensitivity that makes sense: a whole number from 1 to 10. */
export function clampSensitivity(value: unknown): number {
	const n =
		typeof value === "number" && Number.isFinite(value)
			? Math.round(value)
			: THROW_SENSITIVITY_DEFAULT;
	return Math.min(THROW_SENSITIVITY_MAX, Math.max(THROW_SENSITIVITY_MIN, n));
}

const HARDEST = 2.8; // push (in g) needed at the lowest sensitivity
const GENTLEST = 0.8; // push (in g) needed at the highest sensitivity

/** How strong a push (in g, gravity removed) must be to count as a throw. */
export function throwThreshold(sensitivity: number): number {
	const f =
		(clampSensitivity(sensitivity) - THROW_SENSITIVITY_MIN) /
		(THROW_SENSITIVITY_MAX - THROW_SENSITIVITY_MIN);
	return HARDEST - f * (HARDEST - GENTLEST);
}

/** How fast the accelerometer is read. */
export const THROW_SAMPLE_MS = 20;

const GRAVITY_SMOOTHING = 0.9; // how slowly the gravity estimate follows
const CALM = 0.3; // below this push (g) the phone counts as still
const CALM_MS = 150; // how long it must have been still before a throw
const COOLDOWN_MS = 1500; // no second throw right after one

export class ThrowDetector {
	private gx = 0;
	private gy = 0;
	private gz = 0;
	private primed = false;
	private inBurst = false;
	private burstFired = false;
	private calmSince: number | null = null;
	private calmBefore = 0;
	private lastThrow = -Infinity;

	constructor(public threshold: number) {}

	/** Forget everything seen so far (for when the sensor is switched on again). */
	reset() {
		this.primed = false;
		this.inBurst = false;
		this.burstFired = false;
		this.calmSince = null;
		this.calmBefore = 0;
		this.lastThrow = -Infinity;
	}

	/**
	 * Feed one accelerometer reading (x, y, z in g, gravity included) taken at
	 * `now` (ms). Returns true at the moment a throw is recognized.
	 */
	push(x: number, y: number, z: number, now: number): boolean {
		if (!this.primed) {
			this.gx = x;
			this.gy = y;
			this.gz = z;
			this.primed = true;
			this.calmSince = now;
			return false;
		}
		const k = GRAVITY_SMOOTHING;
		this.gx = k * this.gx + (1 - k) * x;
		this.gy = k * this.gy + (1 - k) * y;
		this.gz = k * this.gz + (1 - k) * z;
		const push = Math.hypot(x - this.gx, y - this.gy, z - this.gz);

		if (push < CALM) {
			if (this.inBurst) {
				this.inBurst = false;
				this.calmSince = now;
			} else if (this.calmSince === null) {
				this.calmSince = now;
			}
			return false;
		}

		if (!this.inBurst) {
			// A movement starts: how long was the phone still before it?
			this.inBurst = true;
			this.burstFired = false;
			this.calmBefore = this.calmSince === null ? 0 : now - this.calmSince;
			this.calmSince = null;
		}
		if (
			!this.burstFired &&
			push >= this.threshold &&
			this.calmBefore >= CALM_MS &&
			now - this.lastThrow >= COOLDOWN_MS
		) {
			this.burstFired = true;
			this.lastThrow = now;
			return true;
		}
		return false;
	}
}
