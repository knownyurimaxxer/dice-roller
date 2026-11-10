import { describe, expect, it } from "vitest";
import { textTriangles, textWidth } from "../src/dice/digits";
import { DICE_FONTS } from "../src/dice/fonts";
import { GLYPH_SETS } from "../src/dice/glyphs";

const signedArea = (a: number[], b: number[], c: number[]) =>
	((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;

describe.each([...DICE_FONTS])("%s number font glyphs", (font) => {
	const GLYPHS = GLYPH_SETS[font];

	it("has every digit", () => {
		for (const d of "0123456789") {
			expect(GLYPHS[d].indices.length).toBeGreaterThan(0);
			expect(GLYPHS[d].indices.length % 3).toBe(0);
			expect(GLYPHS[d].advance).toBeGreaterThan(0);
		}
	});

	it("points only at vertices that exist", () => {
		for (const d of "0123456789") {
			const g = GLYPHS[d];
			const n = g.vertices.length / 2;
			for (const i of g.indices) {
				expect(i).toBeGreaterThanOrEqual(0);
				expect(i).toBeLessThan(n);
			}
		}
	});

	it("keeps every digit between the baseline and the top", () => {
		for (const d of "0123456789")
			for (let i = 1; i < GLYPHS[d].vertices.length; i += 2) {
				expect(GLYPHS[d].vertices[i]).toBeGreaterThanOrEqual(0);
				expect(GLYPHS[d].vertices[i]).toBeLessThanOrEqual(1);
			}
	});

	it("leaves the holes of 0, 4, 6, 8 and 9 open", () => {
		// the inked area is smaller than the glyph's bounding box by at least the hole
		for (const d of "04689") {
			const g = GLYPHS[d];
			let ink = 0;
			for (let i = 0; i < g.indices.length; i += 3) {
				const p = [0, 1, 2].map((k) => [
					g.vertices[g.indices[i + k] * 2],
					g.vertices[g.indices[i + k] * 2 + 1],
				]);
				ink += signedArea(p[0], p[1], p[2]);
			}
			expect(ink).toBeLessThan((g.xMax - g.xMin) * 0.85);
		}
	});
});

describe("every font", () => {
	it("has glyphs for every font in the list, and only those", () => {
		expect(Object.keys(GLYPH_SETS).sort()).toEqual([...DICE_FONTS].sort());
	});

	it("draws different shapes for different fonts", () => {
		const shape = (font: (typeof DICE_FONTS)[number]) =>
			JSON.stringify(textTriangles("8", 1, font));
		for (const a of DICE_FONTS)
			for (const b of DICE_FONTS)
				if (a !== b) expect(shape(a)).not.toBe(shape(b));
	});

	it("keeps text centered and counter-clockwise in each font", () => {
		for (const font of DICE_FONTS) {
			const tris = textTriangles("20", 1, font);
			for (const [a, b, c] of tris)
				expect(signedArea(a, b, c)).toBeGreaterThanOrEqual(0);
			const xs = tris.flat().map((p) => p[0]);
			const half = textWidth("20", 1, font) / 2;
			expect(Math.min(...xs)).toBeCloseTo(-half, 2);
			expect(Math.max(...xs)).toBeCloseTo(half, 2);
		}
	});
});

describe("textTriangles", () => {
	it("draws counter-clockwise triangles", () => {
		for (const text of ["8", "20", "00", "69"])
			for (const [a, b, c] of textTriangles(text, 1))
				expect(signedArea(a, b, c)).toBeGreaterThanOrEqual(0);
	});

	it("is centered and as wide as it says", () => {
		const tris = textTriangles("20", 1).flat();
		const xs = tris.map((p) => p[0]);
		const half = textWidth("20", 1) / 2;
		expect(Math.min(...xs)).toBeCloseTo(-half, 2);
		expect(Math.max(...xs)).toBeCloseTo(half, 2);
	});

	it("is centered vertically on the origin", () => {
		const ys = textTriangles("8", 1)
			.flat()
			.map((p) => p[1]);
		expect(Math.min(...ys)).toBeCloseTo(-0.5, 1);
		expect(Math.max(...ys)).toBeCloseTo(0.5, 1);
	});

	it("scales with the height and grows with more digits", () => {
		expect(textWidth("20", 2)).toBeCloseTo(textWidth("20", 1) * 2, 9);
		expect(textWidth("100", 1)).toBeGreaterThan(textWidth("10", 1));
		expect(textWidth("", 1)).toBe(0);
		expect(textTriangles("", 1)).toEqual([]);
	});

	it("underlines 6 and 9 only", () => {
		const lowest = (t: string) =>
			Math.min(
				...textTriangles(t, 1)
					.flat()
					.map((p) => p[1]),
			);
		expect(lowest("6")).toBeLessThan(lowest("8") - 0.1);
		expect(lowest("9")).toBeLessThan(lowest("8") - 0.1);
		expect(lowest("0")).toBeCloseTo(lowest("8"), 1);
	});
});
