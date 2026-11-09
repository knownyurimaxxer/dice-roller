/**
 * Recognizing a throwing motion from the phone's accelerometer. Plain
 * TypeScript (no React, no Expo), so it can be tested on its own.
 *
 * A throw is a sharp, sustained push. The gravity part of each reading is
 * filtered out, and a push counts when ALL of these hold:
 *   - it is stronger than the threshold (the sensitivity setting);
 *   - it lasts a moment: a knock or a table bump is over in a flash;
 *   - the phone was not already moving a lot (a "background" level of
 *     movement over the last third of a second), which keeps running or a
 *     bumpy ride from rolling the dice. A phone held in the air, a wind-up
 *     before the throw, or a swing back and forth are all fine: the check is
 *     how much it was moving, not whether it was perfectly still;
 *   - it is not one of a series of strong impacts (running, jolting);
 *   - it is not right after the previous throw.
 *
 * (An earlier version insisted on 150 ms of perfect stillness right before the
 * push. Any wind-up broke that, so a re-throw with the phone already in hand
 * was almost never recognized. Simulated, it caught about 1 in 6 throws from
 * rest and none that began with a swing; this one catches about 3 in 4.)
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

// How quickly the estimate of gravity follows the readings, as a time (not
// "per reading"), so phones that report slower behave the same. For the first
// moments of a push it follows slowly, so the push isn't mistaken for gravity
// and filtered out. After that it speeds up again: a push is over quickly, but
// turning the phone changes the readings for good, and must be caught up with.
const GRAVITY_CALM_S = 0.2;
const GRAVITY_PUSH_S = 0.8;
const GRAVITY_SLOW_MS = 150;

const CALM = 0.3; // below this push (g) a movement counts as over
const BACKGROUND_S = 0.35; // how far back "how much was it moving" looks
const BACKGROUND_CAP = 0.6; // one big push can't count for more than this
const BACKGROUND_MAX = 0.4; // more movement than this beforehand: not a throw
const SUSTAIN_MS = 30; // a throw keeps pushing at least this long...
const COARSE_MS = 50; // ...unless readings come this far apart or more
const RHYTHM_MS = 1500; // a series of strong pushes within this time...
const RHYTHM_MAX = 1; // ...of more than this many is running, not a throw
const STRONG = 0.7; // a push this fraction of the threshold counts as strong
const COOLDOWN_MS = 1500; // no second throw right after one

export class ThrowDetector {
	private gx = 0;
	private gy = 0;
	private gz = 0;
	private primed = false;
	private lastNow = 0;
	private background = 0;
	private inBurst = false;
	private burstFired = false;
	private burstStart = 0;
	private burstPeak = 0;
	private strong: number[] = [];
	private lastThrow = -Infinity;

	constructor(public threshold: number) {}

	/** Forget everything seen so far (for when the sensor is switched on again). */
	reset() {
		this.primed = false;
		this.background = 0;
		this.inBurst = false;
		this.burstFired = false;
		this.strong = [];
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
			this.lastNow = now;
			return false;
		}
		const gap = Math.min(250, Math.max(5, now - this.lastNow));
		this.lastNow = now;
		const seconds = gap / 1000;

		const slow = this.inBurst && now - this.burstStart < GRAVITY_SLOW_MS;
		const follow =
			1 - Math.exp(-seconds / (slow ? GRAVITY_PUSH_S : GRAVITY_CALM_S));
		this.gx += (x - this.gx) * follow;
		this.gy += (y - this.gy) * follow;
		this.gz += (z - this.gz) * follow;
		const push = Math.hypot(x - this.gx, y - this.gy, z - this.gz);

		// How much the phone was moving just before this reading.
		const before = this.background;
		this.background +=
			(Math.min(push, BACKGROUND_CAP) - this.background) *
			(1 - Math.exp(-seconds / BACKGROUND_S));

		if (push < CALM) {
			if (this.inBurst && this.burstPeak >= this.threshold * STRONG) {
				this.strong.push(this.burstStart);
				if (this.strong.length > 20) this.strong.shift();
			}
			this.inBurst = false;
			this.burstFired = false;
			return false;
		}

		if (!this.inBurst) {
			this.inBurst = true;
			this.burstFired = false;
			this.burstStart = now;
			this.burstPeak = 0;
		}
		this.burstPeak = Math.max(this.burstPeak, push);

		if (
			this.burstFired ||
			push < this.threshold ||
			before > BACKGROUND_MAX ||
			now - this.lastThrow < COOLDOWN_MS
		)
			return false;
		if (now - this.burstStart < SUSTAIN_MS && gap < COARSE_MS) return false;
		this.strong = this.strong.filter((t) => now - t <= RHYTHM_MS);
		if (this.strong.length > RHYTHM_MAX) return false;

		this.burstFired = true;
		this.lastThrow = now;
		return true;
	}
}
