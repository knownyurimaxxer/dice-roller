import { describe, expect, it } from "vitest";
import { DIGIT_STROKES, textTriangles, textWidth } from "../src/dice/digits";

describe("stroke font", () => {
	it("has every digit", () => {
		for (const d of "0123456789")
			expect(DIGIT_STROKES[d].length > 0).toBe(true);
	});

	it("keeps every point inside the digit's box", () => {
		for (const d of "0123456789")
			for (const line of DIGIT_STROKES[d])
				for (const [x, y] of line) {
					expect(x).toBeGreaterThanOrEqual(0);
					expect(x).toBeLessThanOrEqual(1);
					expect(y).toBeGreaterThanOrEqual(0);
					expect(y).toBeLessThanOrEqual(1);
				}
	});

	it("makes 9 a turned 6", () => {
		const six = DIGIT_STROKES["6"][0];
		const nine = DIGIT_STROKES["9"][0];
		six.forEach(([x, y], i) => {
			expect(nine[i][0]).toBeCloseTo(1 - x, 9);
			expect(nine[i][1]).toBeCloseTo(1 - y, 9);
		});
	});
});

describe("textTriangles", () => {
	it("draws counter-clockwise triangles", () => {
		for (const text of ["8", "20", "00", "69"])
			for (const [a, b, c] of textTriangles(text, 1))
				expect(
					(b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
				).toBeGreaterThanOrEqual(0);
	});

	it("is centered and as wide as it says", () => {
		const tris = textTriangles("20", 1).flat();
		const xs = tris.map((p) => p[0]);
		const half = textWidth("20", 1) / 2;
		expect(Math.min(...xs)).toBeGreaterThan(-half - 0.1);
		expect(Math.max(...xs)).toBeLessThan(half + 0.1);
		// roughly symmetrical around the middle
		expect(Math.abs(Math.min(...xs) + Math.max(...xs))).toBeLessThan(0.1);
	});

	it("scales with the height and grows with more digits", () => {
		expect(textWidth("20", 2)).toBeCloseTo(textWidth("20", 1) * 2, 9);
		expect(textWidth("100", 1)).toBeGreaterThan(textWidth("10", 1));
		expect(textWidth("", 1)).toBe(0);
		expect(textTriangles("", 1)).toEqual([]);
	});

	it("underlines 6 and 9 only", () => {
		const count = (t: string) => textTriangles(t, 1).length;
		const lowest = (t: string) =>
			Math.min(
				...textTriangles(t, 1)
					.flat()
					.map((p) => p[1]),
			);
		expect(lowest("6")).toBeLessThan(lowest("8") - 0.1);
		expect(lowest("9")).toBeLessThan(lowest("8") - 0.1);
		expect(count("8")).toBeGreaterThan(0);
	});
});
