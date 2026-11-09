import { describe, expect, it } from "vitest";
import {
	clampSensitivity,
	THROW_SAMPLE_MS,
	THROW_SENSITIVITY_DEFAULT,
	THROW_SENSITIVITY_MAX,
	THROW_SENSITIVITY_MIN,
	ThrowDetector,
	throwThreshold,
} from "../src/utils/throw";

type Reading = [number, number, number];
const STILL: Reading = [0, 0, 1]; // lying flat: just gravity

/** Feeds readings one sample apart; returns the times at which a throw fired. */
function run(det: ThrowDetector, readings: Reading[], start = 0): number[] {
	const fired: number[] = [];
	readings.forEach(([x, y, z], i) => {
		const t = start + i * THROW_SAMPLE_MS;
		if (det.push(x, y, z, t)) fired.push(t);
	});
	return fired;
}
const still = (ms: number): Reading[] =>
	Array.from({ length: Math.round(ms / THROW_SAMPLE_MS) }, () => STILL);
/** A push along x of `g` for `ms`, then back to rest. */
const push = (g: number, ms: number): Reading[] =>
	Array.from({ length: Math.round(ms / THROW_SAMPLE_MS) }, () => [g, 0, 1]);

describe("sensitivity", () => {
	it("makes a higher sensitivity react to gentler throws", () => {
		for (let s = THROW_SENSITIVITY_MIN; s < THROW_SENSITIVITY_MAX; s++)
			expect(throwThreshold(s + 1)).toBeLessThan(throwThreshold(s));
	});

	it("keeps a saved value in range, and a bad one at the default", () => {
		expect(clampSensitivity(0)).toBe(THROW_SENSITIVITY_MIN);
		expect(clampSensitivity(99)).toBe(THROW_SENSITIVITY_MAX);
		expect(clampSensitivity(4.4)).toBe(4);
		for (const bad of ["7", null, undefined, NaN, {}])
			expect(clampSensitivity(bad)).toBe(THROW_SENSITIVITY_DEFAULT);
	});
});

describe("ThrowDetector", () => {
	const det = () =>
		new ThrowDetector(throwThreshold(THROW_SENSITIVITY_DEFAULT));

	it("recognizes a hard push from a phone held still", () => {
		expect(
			run(det(), [...still(500), ...push(3.5, 80), ...still(300)]),
		).toHaveLength(1);
	});

	it("ignores a gentle movement", () => {
		expect(
			run(det(), [...still(500), ...push(0.6, 200), ...still(300)]),
		).toEqual([]);
	});

	it("ignores a phone at rest, on any side", () => {
		expect(run(det(), [...still(1000)])).toEqual([]);
		expect(
			run(
				det(),
				Array.from({ length: 50 }, () => [1, 0, 0] as Reading),
			),
		).toEqual([]);
	});

	it("needs the phone to have been still just before the push", () => {
		// restless movement (like walking) right up to the push
		const restless: Reading[] = Array.from({ length: 40 }, (_, i) => [
			i % 2 ? 0.5 : -0.5,
			0,
			1,
		]);
		expect(run(det(), [...restless, ...push(3.5, 80)])).toEqual([]);
	});

	it("fires once per throw, and waits before the next one", () => {
		const d = det();
		const two = [
			...still(500),
			...push(3.5, 80),
			...still(300),
			...push(3.5, 80), // 0.4 s later: too soon
			...still(300),
		];
		expect(run(d, two)).toHaveLength(1);
		// a second throw after the cooldown counts
		expect(
			run(d, [...still(1600), ...push(3.5, 80), ...still(200)], 10_000),
		).toHaveLength(1);
	});

	it("reacts to a gentle throw only at a high sensitivity", () => {
		const gentle = [...still(500), ...push(1.2, 80), ...still(300)];
		expect(run(new ThrowDetector(throwThreshold(1)), gentle)).toEqual([]);
		expect(run(new ThrowDetector(throwThreshold(10)), gentle)).toHaveLength(1);
	});

	it("follows a threshold that is changed on the fly", () => {
		const d = new ThrowDetector(throwThreshold(1));
		const gentle = [...still(500), ...push(1.2, 80), ...still(300)];
		expect(run(d, gentle)).toEqual([]);
		d.threshold = throwThreshold(10);
		expect(run(d, gentle, 10_000)).toHaveLength(1);
	});

	it("starts over after a reset", () => {
		const d = det();
		run(d, [...still(500), ...push(3.5, 80)]);
		d.reset();
		// right after a reset the phone has not been seen still yet
		expect(run(d, push(3.5, 80), 20_000)).toEqual([]);
		expect(run(d, [...still(500), ...push(3.5, 80)], 30_000)).toHaveLength(1);
	});

	it("recognizes a throw that starts with a wind-up", () => {
		const windUp: Reading[] = Array.from({ length: 6 }, () => [-1, 0, 1]);
		expect(
			run(det(), [...still(500), ...windUp, ...push(3.5, 80), ...still(300)]),
		).toHaveLength(1);
	});

	it("recognizes a throw after a short pause at the end of the wind-up", () => {
		const windUp: Reading[] = Array.from({ length: 6 }, () => [-1, 0, 1]);
		expect(
			run(det(), [
				...still(500),
				...windUp,
				...still(60),
				...push(3.5, 80),
				...still(300),
			]),
		).toHaveLength(1);
	});

	it("recognizes a throw by a phone that was already moving a little", () => {
		// a hand holding the phone up: a restless 0.45 g for a third of a second
		const fidget: Reading[] = Array.from({ length: 15 }, (_, i) => [
			i % 2 ? 0.45 : -0.45,
			0,
			1,
		]);
		expect(
			run(det(), [...still(400), ...fidget, ...push(3.5, 80), ...still(300)]),
		).toHaveLength(1);
	});

	it("recognizes a throw soon after the phone was turned", () => {
		// flat, then stood upright (the pull of gravity changes direction), then thrown
		const upright: Reading[] = Array.from({ length: 50 }, () => [1, 0, 0]);
		const thrown: Reading[] = Array.from({ length: 4 }, () => [4.5, 0, 0]);
		expect(
			run(det(), [...still(500), ...upright, ...thrown, ...still(300)]),
		).toHaveLength(1);
	});

	it("does not take a single knock for a throw", () => {
		expect(
			run(det(), [...still(500), ...push(3.5, THROW_SAMPLE_MS), ...still(300)]),
		).toEqual([]);
	});

	it("still recognizes a throw when the sensor reports slowly", () => {
		// readings 100 ms apart: one reading has to be enough
		const slow = (readings: Reading[]) => {
			const d = det();
			const fired: number[] = [];
			readings.forEach(([x, y, z], i) => {
				if (d.push(x, y, z, i * 100)) fired.push(i);
			});
			return fired;
		};
		const calm: Reading[] = Array.from({ length: 10 }, () => STILL);
		expect(slow([...calm, [3.5, 0, 1], [3.5, 0, 1], ...calm])).toHaveLength(1);
	});

	it("does not keep rolling while running, only reacts to the first impact", () => {
		// ten hard impacts, a third of a second apart
		const stride: Reading[] = [...push(3.5, 80), ...still(260)];
		const running = Array.from({ length: 10 }, () => stride).flat();
		expect(run(det(), [...still(500), ...running])).toHaveLength(1);
	});
});
