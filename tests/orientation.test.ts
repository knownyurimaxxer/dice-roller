import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/constants";
import {
	DEFAULT_LAYOUT,
	LAYOUTS,
	normalizeLayout,
} from "../src/utils/orientation";

describe("normalizeLayout", () => {
	it("keeps a saved layout", () => {
		expect(normalizeLayout("portrait")).toBe("portrait");
		expect(normalizeLayout("landscape")).toBe("landscape");
	});

	it("turns anything else into the default (vertical)", () => {
		for (const bad of [
			undefined,
			null,
			"",
			"sideways",
			"LANDSCAPE",
			1,
			true,
			{},
		])
			expect(normalizeLayout(bad)).toBe("portrait");
		expect(DEFAULT_LAYOUT).toBe("portrait");
	});

	it("has exactly the two layouts the setting offers", () => {
		expect([...LAYOUTS]).toEqual(["portrait", "landscape"]);
	});

	it("starts vertical for everyone", () => {
		expect(DEFAULT_SETTINGS.orientation).toBe("portrait");
	});
});
