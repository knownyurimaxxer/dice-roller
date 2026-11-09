import { describe, expect, it } from "vitest";
import {
	THROW_SENSITIVITY_DEFAULT,
	ThrowDetector,
	throwThreshold,
} from "../src/utils/throw";

/**
 * Simulated phone motion: throws (from rest, with a swing, with the phone
 * already raised, soon after turning it) and things that must not roll the
 * dice (walking, running, taps, turning, putting the phone down, a bumpy
 * ride). The noise is seeded, so the results are the same on every run.
 */
/* ---------- signals ---------- */
function rng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
type V = [number, number, number];
type Sig = (t: number) => V; // t in seconds -> accelerometer reading (g, gravity included)
const gauss = (r: () => number) =>
	Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const pulse = (t: number, t0: number, dur: number, amp: number) =>
	t >= t0 && t < t0 + dur ? amp * Math.sin((Math.PI * (t - t0)) / dur) : 0;
const rotZ = (deg: number): V => [
	Math.sin((deg * Math.PI) / 180),
	0,
	Math.cos((deg * Math.PI) / 180),
]; // gravity as seen at a tilt

/** noise + optional tremor + gravity orientation (which may change over time) */
function base(
	r: () => number,
	tilt: (t: number) => number,
	sigma: number,
	tremor: number,
): Sig {
	const f1 = 1.2 + r() * 1.0,
		f2 = 2.5 + r() * 2,
		p1 = r() * 6.28,
		p2 = r() * 6.28;
	return (t) => {
		const g = rotZ(tilt(t));
		const tr =
			tremor *
			(Math.sin(2 * Math.PI * f1 * t + p1) +
				0.6 * Math.sin(2 * Math.PI * f2 * t + p2));
		return [
			g[0] + tr + sigma * gauss(r),
			g[1] + 0.6 * tr + sigma * gauss(r),
			g[2] + 0.4 * tr + sigma * gauss(r),
		];
	};
}
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** a throw starting at t0: wind-up, a short pause, the push, then catching it */
function throwAt(
	t0: number,
	A: number,
	D: number,
	wind: number,
	pause: number,
	tw = 0.15,
): Sig {
	const tp = t0 + tw + pause;
	return (t) => [
		0,
		-pulse(t, t0, tw, wind * A) +
			pulse(t, tp, D, A) -
			pulse(t, tp + D, 0.12, 0.6 * A),
		0,
	];
}
function scenario(
	kind: string,
	seed: number,
): { sig: Sig; throwAt?: number; dur: number } {
	const r = rng(seed);
	const A = 1.5 + r() * 2.0,
		D = 0.08 + r() * 0.12,
		wind = r() * 0.5,
		pause = r() * 0.1;
	const t0 = 1.5;
	const th = throwAt(t0, A, D, wind, pause);
	const swing = throwAt(
		t0,
		A,
		D,
		0.3 + r() * 0.3,
		r() * 0.05,
		0.2 + r() * 0.25,
	); // a continuous back-and-forth
	switch (kind) {
		case "rest": {
			const b = base(r, () => 0, 0.02, 0);
			return { sig: (t) => add(b(t), th(t)), throwAt: t0, dur: 3.2 };
		}
		case "handheld": {
			const b = base(r, () => 35, 0.03, 0.06);
			return { sig: (t) => add(b(t), th(t)), throwAt: t0, dur: 3.2 };
		}
		case "swing": {
			const b = base(r, () => 35, 0.03, 0.06);
			return { sig: (t) => add(b(t), swing(t)), throwAt: t0, dur: 3.2 };
		}
		case "rethrow": {
			const b = base(
				r,
				(t) => 55 - Math.min(1, t / 1.2) * 35,
				0.03,
				0.08 + r() * 0.1,
			);
			return { sig: (t) => add(b(t), swing(t)), throwAt: t0, dur: 3.2 };
		}
		case "turn-throw": {
			const b = base(
				r,
				(t) => (t < 0.8 ? 0 : Math.min(90, ((t - 0.8) / 0.35) * 90)),
				0.03,
				0.04,
			);
			return { sig: (t) => add(b(t), th(t)), throwAt: t0, dur: 3.2 };
		}
		case "after-result": {
			// arm raised, noticeable hand motion, phone still settling to a new tilt
			const b = base(
				r,
				(t) => 55 - Math.min(1, t / 1.2) * 35,
				0.03,
				0.1 + r() * 0.12,
			);
			return { sig: (t) => add(b(t), th(t)), throwAt: t0, dur: 3.2 };
		}
		case "after-catch": {
			// the previous catch is still ringing out
			const b = base(r, (t) => 50 - Math.min(1, t / 0.8) * 30, 0.03, 0.04);
			return {
				sig: (t) =>
					add(add(b(t), th(t)), [
						0,
						0.9 * Math.exp(-t / 0.5) * Math.sin(2 * Math.PI * 3 * t),
						0,
					]),
				throwAt: t0,
				dur: 3.2,
			};
		}
		case "walking": {
			const b = base(r, () => 30, 0.03, 0.0);
			return {
				sig: (t) => {
					let s: V = b(t);
					for (let k = 0; k < 14; k++)
						s = add(s, [
							0.0,
							0,
							pulse(t, 0.3 + k * 0.5, 0.12, 0.7 + 0.3 * Math.sin(k)),
						]);
					return s;
				},
				dur: 7.5,
			};
		}
		case "running": {
			const b = base(r, () => 30, 0.05, 0.0);
			return {
				sig: (t) => {
					let s: V = b(t);
					for (let k = 0; k < 22; k++)
						s = add(s, [
							0,
							0,
							pulse(t, 0.2 + k * 0.33, 0.08, 2.4 + 0.5 * Math.sin(k * 1.7)),
						]);
					return s;
				},
				dur: 7.5,
			};
		}
		case "tap": {
			const b = base(r, () => 0, 0.02, 0);
			return { sig: (t) => add(b(t), [0, 0, pulse(t, 4, 0.03, 0.6)]), dur: 6 };
		}
		case "tilt": {
			const b = base(
				r,
				(t) => (t < 4 ? 0 : Math.min(90, ((t - 4) / 0.35) * 90)),
				0.02,
				0,
			);
			return { sig: b, dur: 6 };
		}
		case "put-down": {
			const b = base(r, () => 20, 0.02, 0.03);
			return {
				sig: (t) =>
					add(b(t), [
						0,
						0,
						-pulse(t, 3.4, 0.5, 0.15) + pulse(t, 4, 0.025, 1.6 + r() * 1.6),
					]),
				dur: 6,
			};
		}
		case "bus": {
			const b = base(r, () => 20, 0.09, 0);
			return { sig: (t) => add(b(t), [0, 0, pulse(t, 4, 0.1, 1.2)]), dur: 6 };
		}
		default:
			throw new Error(kind);
	}
}

/** how many times a detector fires, and whether it fired at the throw (within 0.5 s of its push) */
function run(
	make: () => { push(x: number, y: number, z: number, now: number): boolean },
	kind: string,
	seed: number,
	dtMs: number,
) {
	const s = scenario(kind, seed);
	const det = make();
	let fires = 0;
	let hit = false;
	const warm = s.throwAt === undefined ? 3000 : 0;
	for (let ms = 0; ms < s.dur * 1000; ms += dtMs) {
		const [x, y, z] = s.sig(ms / 1000);
		if (det.push(x, y, z, ms) && ms >= warm) {
			fires++;
			if (
				s.throwAt !== undefined &&
				ms / 1000 >= s.throwAt &&
				ms / 1000 <= s.throwAt + 0.7
			)
				hit = true;
		}
	}
	return { fires, hit };
}

const SEEDS = 40;
const hits = (kind: string, sens: number, step = 20) => {
	let n = 0;
	for (let i = 0; i < SEEDS; i++)
		if (
			run(() => new ThrowDetector(throwThreshold(sens)), kind, 1000 + i, step)
				.hit
		)
			n++;
	return n / SEEDS;
};
const falseTriggers = (kind: string, sens: number) => {
	let n = 0;
	for (let i = 0; i < SEEDS; i++)
		if (
			run(() => new ThrowDetector(throwThreshold(sens)), kind, 5000 + i, 20)
				.fires > 0
		)
			n++;
	return n / SEEDS;
};

describe("throw detection on simulated motion", () => {
	for (const kind of ["rest", "swing", "rethrow", "turn-throw"])
		it(`catches most ${kind} throws at the default sensitivity`, () => {
			// the rest are throws gentler than the threshold asks for
			expect(hits(kind, THROW_SENSITIVITY_DEFAULT)).toBeGreaterThanOrEqual(
				0.55,
			);
		});

	for (const kind of ["rest", "swing", "rethrow", "turn-throw"])
		it(`catches nearly every ${kind} throw at a high sensitivity`, () => {
			expect(hits(kind, 7)).toBeGreaterThanOrEqual(0.8);
		});

	it("does not mistake everyday motion for a throw", () => {
		for (const sens of [THROW_SENSITIVITY_DEFAULT, 7])
			for (const kind of [
				"walking",
				"running",
				"tap",
				"tilt",
				"put-down",
				"bus",
			])
				expect(falseTriggers(kind, sens)).toBe(0);
	});

	it("still catches a good share of throws from a slow sensor", () => {
		expect(hits("swing", 7, 60)).toBeGreaterThanOrEqual(0.5);
	});
});
