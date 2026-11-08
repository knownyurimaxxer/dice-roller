import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/constants";
import {
	isSwipeUp,
	SWIPE_MAX_MS,
	SWIPE_MAX_SIDEWAYS,
	SWIPE_MIN_DISTANCE,
	type TouchPoint,
} from "../src/utils/swipe";

const from: TouchPoint = { x: 200, y: 900, t: 0 };
const to = (dx: number, dy: number, ms: number): TouchPoint => ({
	x: from.x + dx,
	y: from.y + dy,
	t: from.t + ms,
});

describe("isSwipeUp", () => {
	it("accepts a quick, mostly straight swipe up", () => {
		expect(isSwipeUp(from, to(0, -300, 200))).toBe(true);
		expect(isSwipeUp(from, to(40, -200, 400))).toBe(true);
		expect(isSwipeUp(from, to(-60, -250, 150))).toBe(true);
	});

	it("needs to go far enough up", () => {
		expect(isSwipeUp(from, to(0, -(SWIPE_MIN_DISTANCE - 1), 100))).toBe(false);
		expect(isSwipeUp(from, to(0, -SWIPE_MIN_DISTANCE, 100))).toBe(true);
		expect(isSwipeUp(from, to(0, -5, 50))).toBe(false); // a tap that wobbled
	});

	it("does not take a swipe down, or no movement, for a swipe up", () => {
		expect(isSwipeUp(from, to(0, 300, 200))).toBe(false);
		expect(isSwipeUp(from, to(0, 0, 200))).toBe(false);
	});

	it("is not fooled by a sideways slide", () => {
		expect(isSwipeUp(from, to(300, -100, 200))).toBe(false);
		// right on the limit still counts, just past it does not
		const up = 200;
		expect(isSwipeUp(from, to(up * SWIPE_MAX_SIDEWAYS, -up, 200))).toBe(true);
		expect(isSwipeUp(from, to(up * SWIPE_MAX_SIDEWAYS + 1, -up, 200))).toBe(
			false,
		);
	});

	it("has to be quick: a slow drag is not a swipe", () => {
		expect(isSwipeUp(from, to(0, -300, SWIPE_MAX_MS))).toBe(true);
		expect(isSwipeUp(from, to(0, -300, SWIPE_MAX_MS + 1))).toBe(false);
	});

	it("ignores a clock that went backwards", () => {
		expect(isSwipeUp(from, to(0, -300, -10))).toBe(false);
	});
});

describe("the setting", () => {
	it("is off by default", () => {
		expect(DEFAULT_SETTINGS.swipeToRoll).toBe(false);
	});
});
