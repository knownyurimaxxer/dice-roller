import { describe, expect, it } from "vitest";
import { PRESETS } from "../src/constants";
import { exportTheme, parseTheme } from "../src/utils/themeIO";

const navy = PRESETS["Navy"];

describe("exportTheme", () => {
	it("writes only the four color names, no app name", () => {
		expect(JSON.parse(exportTheme(navy))).toEqual({
			background: "#001935",
			card: "#FFFFFF",
			text: "#222222",
			accent: "#00B8FF",
		});
	});

	it("round-trips every preset", () => {
		for (const theme of Object.values(PRESETS))
			expect(parseTheme(exportTheme(theme))).toEqual(theme);
	});
});

describe("parseTheme", () => {
	it("is forgiving about what surrounds the JSON", () => {
		const json = exportTheme(navy);
		expect(parseTheme(`  \n${json}\n `)).toEqual(navy);
		expect(parseTheme("```json\n" + json + "\n```")).toEqual(navy);
		expect(parseTheme("My theme:\n" + json + "\nEnjoy!")).toEqual(navy);
	});

	it("accepts colors without # and with 3 digits, in any case", () => {
		expect(
			parseTheme(
				'{"background":"001935","card":"fff","text":"#222","accent":"#00b8ff"}',
			),
		).toEqual({
			background: "#001935",
			card: "#FFFFFF",
			text: "#222222",
			accent: "#00B8FF",
		});
	});

	it("ignores names it doesn't know", () => {
		const text = JSON.stringify({ ...navy, name: "Navy", radius: 8 });
		expect(parseTheme(text)).toEqual(navy);
	});

	it("rejects anything that isn't a complete theme", () => {
		expect(parseTheme("")).toBeNull();
		expect(parseTheme("hello")).toBeNull();
		expect(parseTheme("{not json}")).toBeNull();
		expect(parseTheme("[1, 2, 3]")).toBeNull();
		expect(parseTheme('{"background":"#001935"}')).toBeNull();
		expect(parseTheme(JSON.stringify({ ...navy, accent: "blue" }))).toBeNull();
		expect(parseTheme(JSON.stringify({ ...navy, card: 5 }))).toBeNull();
		expect(parseTheme(JSON.stringify({ ...navy, text: null }))).toBeNull();
	});
});
