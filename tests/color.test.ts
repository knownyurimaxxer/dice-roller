import { describe, expect, it } from "vitest";
import { hexToHsl, hslToHex, normalizeHex } from "../src/utils/color";

describe("normalizeHex", () => {
	it("accepts 6 and 3 digits, with or without #", () => {
		expect(normalizeHex("#1a2b3c")).toBe("#1A2B3C");
		expect(normalizeHex("1A2B3C")).toBe("#1A2B3C");
		expect(normalizeHex("#abc")).toBe("#AABBCC");
		expect(normalizeHex("  f0f ")).toBe("#FF00FF");
	});

	it("rejects anything else", () => {
		expect(normalizeHex("")).toBeNull();
		expect(normalizeHex("#12")).toBeNull();
		expect(normalizeHex("#12345")).toBeNull();
		expect(normalizeHex("#GGGGGG")).toBeNull();
		expect(normalizeHex("#1234567")).toBeNull();
	});
});

describe("hexToHsl / hslToHex", () => {
	it("knows the basic colors", () => {
		expect(hslToHex(0, 100, 50)).toBe("#FF0000");
		expect(hslToHex(120, 100, 50)).toBe("#00FF00");
		expect(hslToHex(240, 100, 50)).toBe("#0000FF");
		expect(hslToHex(0, 0, 0)).toBe("#000000");
		expect(hslToHex(0, 0, 100)).toBe("#FFFFFF");
		expect(hexToHsl("#FF0000")).toEqual({ h: 0, s: 100, l: 50 });
	});

	it("gives grays a zero saturation", () => {
		expect(hexToHsl("#808080").s).toBe(0);
	});

	it("clamps out-of-range values", () => {
		expect(hslToHex(360, 150, 50)).toBe("#FF0000");
		expect(hslToHex(-120, 100, 50)).toBe("#0000FF");
		expect(hslToHex(0, 100, 200)).toBe("#FFFFFF");
	});

	it("round-trips every color of the app's own swatches and presets", () => {
		const samples = [
			"#001935",
			"#0D0D0F",
			"#12251B",
			"#2A1B3D",
			"#F2EFE9",
			"#00B8FF",
			"#FF6B9D",
			"#E4572E",
			"#9BE564",
			"#FFD166",
			"#B388FF",
			"#00E5A8",
			"#123456",
			"#FEDCBA",
		];
		for (const hex of samples) {
			const { h, s, l } = hexToHsl(hex);
			expect(hslToHex(h, s, l)).toBe(hex);
		}
	});
});
