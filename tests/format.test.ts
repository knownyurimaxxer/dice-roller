import { describe, expect, it } from "vitest";
import {
	contrastRatio,
	legibleAccent,
	mixColors,
	readableOn,
	shade,
	timeAgo,
} from "../src/utils/format";

describe("readableOn", () => {
	it("picks black on light colors and white on dark ones", () => {
		expect(readableOn("#FFFFFF")).toBe("#000000");
		expect(readableOn("#F2EFE9")).toBe("#000000");
		expect(readableOn("#001935")).toBe("#FFFFFF");
		expect(readableOn("#E4572E")).toBe("#FFFFFF");
	});
});

describe("mixColors and shade", () => {
	it("mixes two colors", () => {
		expect(mixColors("#000000", "#FFFFFF", 0)).toBe("#000000");
		expect(mixColors("#000000", "#FFFFFF", 1)).toBe("#ffffff");
		expect(mixColors("#000000", "#FFFFFF", 0.5)).toBe("#808080");
		expect(mixColors("#FF0000", "#0000FF", 0.5)).toBe("#800080");
	});

	it("lightens toward white and darkens toward black", () => {
		expect(shade("#808080", 0)).toBe("#808080");
		expect(shade("#000000", 1)).toBe("#ffffff");
		expect(shade("#FFFFFF", -1)).toBe("#000000");
		expect(shade("#00B8FF", 0.2)).not.toBe("#00B8FF");
	});
});

describe("contrast", () => {
	it("is 21 for black on white and 1 for the same color", () => {
		expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
		expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
		expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 9);
	});

	it("keeps the accent where it can be read and falls back where it can't", () => {
		// cyan on the dark navy background: fine; cyan on a white card: too faint
		expect(legibleAccent("#00B8FF", "#001935", "#222222")).toBe("#00B8FF");
		expect(legibleAccent("#00B8FF", "#FFFFFF", "#222222")).toBe("#222222");
	});
});

describe("timeAgo", () => {
	const now = 1_700_000_000_000;
	it("goes from just now to days", () => {
		expect(timeAgo(now - 5_000, undefined, undefined, now)).toBe("just now");
		expect(timeAgo(now - (5 * 60_000 + 500), undefined, undefined, now)).toBe(
			"5m",
		);
		expect(
			timeAgo(now - (3 * 3_600_000 + 500), undefined, undefined, now),
		).toBe("3h");
		expect(
			timeAgo(now - (2 * 86_400_000 + 500), undefined, undefined, now),
		).toBe("2d");
	});

	it("shows the date for old rolls, in the locale", () => {
		const old = now - 30 * 86_400_000;
		expect(timeAgo(old, undefined, "es", now)).toBe(
			new Date(old).toLocaleDateString("es"),
		);
	});
});
