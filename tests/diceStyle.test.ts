import { describe, expect, it } from "vitest";
import {
	clampTransparency,
	DEFAULT_DICE_STYLE,
	exportDice,
	normalizeDiceStyle,
	normalizeImageUrl,
	opacityOf,
	parseDice,
} from "../src/utils/diceStyle";

const style = {
	transparency: 20,
	numberFont: "playfair" as const,
	numberColor: "#FFD166",
	numbersFollowTransparency: true,
	imageUrl: "https://example.com/wood.png",
	imageUri: "file:///private/dice-1.png",
	imageTransparency: 35,
};

describe("clampTransparency / opacityOf", () => {
	it("keeps whole steps of 5 between 0 and 90", () => {
		expect(clampTransparency(0)).toBe(0);
		expect(clampTransparency(22)).toBe(20);
		expect(clampTransparency(100)).toBe(90);
		expect(clampTransparency(-5)).toBe(0);
	});
	it("falls back for anything that isn't a number", () => {
		expect(clampTransparency("x")).toBe(0);
		expect(clampTransparency(NaN, 10)).toBe(10);
	});
	it("turns transparency into opacity", () => {
		expect(opacityOf(0)).toBe(1);
		expect(opacityOf(90)).toBeCloseTo(0.1);
	});
});

describe("normalizeImageUrl", () => {
	it("accepts https links only", () => {
		expect(normalizeImageUrl(" https://a.com/x.png ")).toBe(
			"https://a.com/x.png",
		);
		expect(normalizeImageUrl("http://a.com/x.png")).toBeNull();
		expect(normalizeImageUrl("file:///x.png")).toBeNull();
		expect(normalizeImageUrl("not a link")).toBeNull();
		expect(normalizeImageUrl("")).toBeNull();
		expect(normalizeImageUrl(5)).toBeNull();
	});
});

describe("normalizeDiceStyle", () => {
	it("gives the defaults for nothing or nonsense", () => {
		expect(normalizeDiceStyle(null)).toEqual(DEFAULT_DICE_STYLE);
		expect(normalizeDiceStyle("x")).toEqual(DEFAULT_DICE_STYLE);
		expect(normalizeDiceStyle([])).toEqual(DEFAULT_DICE_STYLE);
	});
	it("keeps a good style as it is", () => {
		expect(normalizeDiceStyle(style)).toEqual(style);
	});
	it("drops the local copy when there is no link", () => {
		expect(
			normalizeDiceStyle({ ...style, imageUrl: null }).imageUri,
		).toBeNull();
	});
	it("repairs odd values one by one", () => {
		const n = normalizeDiceStyle({
			transparency: 999,
			numberColor: "zzz",
			numbersFollowTransparency: "yes",
			numberFont: "Comic Sans",
			imageUrl: "ftp://x",
		});
		expect(n.transparency).toBe(90);
		expect(n.numberFont).toBe("inter");
		expect(n.numberColor).toBeNull();
		expect(n.numbersFollowTransparency).toBe(false);
		expect(n.imageUrl).toBeNull();
	});
});

describe("exportDice", () => {
	it("writes the five names, and never the local copy", () => {
		expect(JSON.parse(exportDice(style))).toEqual({
			transparency: 20,
			numberFont: "playfair",
			numberColor: "#FFD166",
			numbersFollowTransparency: true,
			imageUrl: "https://example.com/wood.png",
			imageTransparency: 35,
		});
	});
	it("writes auto for the automatic number color", () => {
		expect(JSON.parse(exportDice(DEFAULT_DICE_STYLE)).numberColor).toBe("auto");
	});
	it("round-trips", () => {
		const { imageUri, ...file } = style;
		expect(imageUri).toBeTruthy();
		expect(parseDice(exportDice(style))).toEqual(file);
		expect(parseDice(exportDice(DEFAULT_DICE_STYLE))).toEqual({
			transparency: 0,
			numberFont: "inter",
			numberColor: null,
			numbersFollowTransparency: false,
			imageUrl: null,
			imageTransparency: 0,
		});
	});
});

describe("parseDice", () => {
	const json = exportDice(style);
	const { imageUri: _ignored, ...file } = style;

	it("is forgiving about what surrounds the JSON", () => {
		expect(parseDice(`\n ${json} \n`)).toEqual(file);
		expect(parseDice("```json\n" + json + "\n```")).toEqual(file);
		expect(parseDice("My dice:\n" + json + "\nEnjoy!")).toEqual(file);
	});
	it("fills in missing names with the defaults", () => {
		expect(parseDice('{"transparency": 40}')).toEqual({
			transparency: 40,
			numberFont: "inter",
			numberColor: null,
			numbersFollowTransparency: false,
			imageUrl: null,
			imageTransparency: 0,
		});
	});
	it("reads the font by id or by name, in any case", () => {
		expect(parseDice('{"numberFont":"orbitron"}')?.numberFont).toBe("orbitron");
		expect(parseDice('{"numberFont":"Playfair Display"}')?.numberFont).toBe(
			"playfair",
		);
		expect(parseDice('{"numberFont":"POPPINS"}')?.numberFont).toBe("poppins");
		expect(parseDice('{"numberFont":"Comic Sans"}')).toBeNull();
		expect(parseDice('{"numberFont":3}')).toBeNull();
	});
	it("accepts colors without # and with 3 digits", () => {
		expect(parseDice('{"numberColor":"fd6"}')?.numberColor).toBe("#FFDD66");
		expect(parseDice('{"numberColor":"AUTO"}')?.numberColor).toBeNull();
	});
	it("treats an empty or null link as no image", () => {
		expect(parseDice('{"imageUrl":""}')?.imageUrl).toBeNull();
		expect(parseDice('{"imageUrl":null}')?.imageUrl).toBeNull();
	});
	it("rounds transparency into range", () => {
		expect(
			parseDice('{"transparency":100,"imageTransparency":-3}'),
		).toMatchObject({
			transparency: 90,
			imageTransparency: 0,
		});
	});
	it("refuses what makes no sense", () => {
		expect(parseDice("")).toBeNull();
		expect(parseDice("{ nope")).toBeNull();
		expect(parseDice("[1,2]")).toBeNull();
		expect(parseDice("{}")).toBeNull();
		expect(parseDice('{"colour":"red"}')).toBeNull();
		expect(parseDice('{"transparency":"lots"}')).toBeNull();
		expect(parseDice('{"numberColor":"red"}')).toBeNull();
		expect(parseDice('{"numbersFollowTransparency":"yes"}')).toBeNull();
		expect(parseDice('{"imageUrl":"http://a.com/x.png"}')).toBeNull();
	});
});
