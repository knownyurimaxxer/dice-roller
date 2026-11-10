/**
 * The look of the dice, and moving it between apps / phones. The shared format
 * is a flat JSON object (no app name, no version), like the theme's:
 *
 *   {
 *     "transparency": 20,
 *     "numberFont": "inter",
 *     "numberColor": "auto",
 *     "numbersFollowTransparency": false,
 *     "imageUrl": "https://example.com/wood.png",
 *     "imageTransparency": 30,
 *     "imageSplit": false
 *   }
 *
 * The picture travels as a link, never as the picture itself: the phone that
 * imports it downloads its own copy. Where that copy is stored (`imageUri`)
 * is private to each phone and is never written to the file.
 */
import {
	DEFAULT_DICE_FONT,
	DICE_FONT_NAMES,
	DICE_FONTS,
	isDiceFont,
} from "../dice/fonts";
import type { DiceStyle } from "../types";
import { normalizeHex } from "./color";

/** Transparency moves in steps of this many percent... */
export const TRANSPARENCY_STEP = 5;
/** ...up to this much, so a die (or its picture) can never vanish completely. */
export const TRANSPARENCY_MAX = 90;
/** The longest link that is accepted. */
export const IMAGE_URL_MAX = 2048;

export const DEFAULT_DICE_STYLE: DiceStyle = {
	transparency: 0,
	numberFont: DEFAULT_DICE_FONT,
	numberColor: null,
	numbersFollowTransparency: false,
	imageUrl: null,
	imageUri: null,
	imageTransparency: 0,
	imageSplit: false,
};

/** The part of a DiceStyle that goes into an export file. */
export type DiceSettingsFile = Omit<DiceStyle, "imageUri">;

/** Any number (or nothing sensible) as a transparency: 0..TRANSPARENCY_MAX, in whole steps. */
export function clampTransparency(value: unknown, fallback = 0): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	const stepped = Math.round(value / TRANSPARENCY_STEP) * TRANSPARENCY_STEP;
	return Math.min(TRANSPARENCY_MAX, Math.max(0, stepped));
}

/** How much of the light is kept (1 = solid, 0.1 = nearly invisible) for a transparency in percent. */
export function opacityOf(transparencyPercent: number): number {
	return 1 - clampTransparency(transparencyPercent) / 100;
}

/** An https link to something, as a clean string, or null. Plain http is refused: Android blocks it. */
export function normalizeImageUrl(input: unknown): string | null {
	if (typeof input !== "string") return null;
	const text = input.trim();
	if (text.length === 0 || text.length > IMAGE_URL_MAX) return null;
	let url: URL;
	try {
		url = new URL(text);
	} catch {
		return null;
	}
	if (url.protocol !== "https:" || !url.hostname) return null;
	return text;
}

/** What is saved in the database (anything could be in there) as a proper DiceStyle. */
export function normalizeDiceStyle(raw: unknown): DiceStyle {
	if (!raw || typeof raw !== "object" || Array.isArray(raw))
		return { ...DEFAULT_DICE_STYLE };
	const r = raw as Record<string, unknown>;
	const imageUrl = normalizeImageUrl(r.imageUrl);
	return {
		transparency: clampTransparency(r.transparency),
		// A font that no longer exists (or never did) becomes the default.
		numberFont: isDiceFont(r.numberFont) ? r.numberFont : DEFAULT_DICE_FONT,
		numberColor:
			typeof r.numberColor === "string" ? normalizeHex(r.numberColor) : null,
		numbersFollowTransparency: r.numbersFollowTransparency === true,
		imageUrl,
		// A copy on the phone only counts while there is a link it came from.
		imageUri:
			imageUrl && typeof r.imageUri === "string" && r.imageUri.length > 0
				? r.imageUri
				: null,
		imageTransparency: clampTransparency(r.imageTransparency),
		imageSplit: r.imageSplit === true,
	};
}

export function exportDice(style: DiceStyle): string {
	const out: Record<string, unknown> = {
		transparency: style.transparency,
		numberFont: style.numberFont,
		numberColor: style.numberColor ?? "auto",
		numbersFollowTransparency: style.numbersFollowTransparency,
		imageUrl: style.imageUrl,
		imageTransparency: style.imageTransparency,
		imageSplit: style.imageSplit,
	};
	return JSON.stringify(out, null, 2);
}

/**
 * Reads dice settings from pasted text. Forgiving about what surrounds the
 * JSON (spaces, a ```json fence, a line of chat), about colors ("#abc", "abc",
 * "#AABBCC") and about names that are missing (they take the default). Returns
 * null for text that isn't a JSON object, has none of the known names, or has
 * a value that makes no sense (a number that isn't one, a link that isn't https...).
 */
export function parseDice(text: string): DiceSettingsFile | null {
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start === -1 || end <= start) return null;
	let data: unknown;
	try {
		data = JSON.parse(text.slice(start, end + 1));
	} catch {
		return null;
	}
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;
	const raw = data as Record<string, unknown>;
	const known = [
		"transparency",
		"numberFont",
		"numberColor",
		"numbersFollowTransparency",
		"imageUrl",
		"imageTransparency",
		"imageSplit",
	];
	if (!known.some((k) => k in raw)) return null;

	const out: DiceSettingsFile = {
		transparency: DEFAULT_DICE_STYLE.transparency,
		numberFont: DEFAULT_DICE_STYLE.numberFont,
		numberColor: DEFAULT_DICE_STYLE.numberColor,
		numbersFollowTransparency: DEFAULT_DICE_STYLE.numbersFollowTransparency,
		imageUrl: DEFAULT_DICE_STYLE.imageUrl,
		imageTransparency: DEFAULT_DICE_STYLE.imageTransparency,
		imageSplit: DEFAULT_DICE_STYLE.imageSplit,
	};

	for (const key of ["transparency", "imageTransparency"] as const) {
		if (!(key in raw)) continue;
		const value = raw[key];
		if (typeof value !== "number" || !Number.isFinite(value)) return null;
		out[key] = clampTransparency(value);
	}
	if ("numberFont" in raw) {
		// Names are matched without caring about case or spaces ("Playfair Display").
		const wanted =
			typeof raw.numberFont === "string"
				? raw.numberFont.toLowerCase().replace(/[^a-z]/g, "")
				: "";
		const found = DICE_FONTS.find(
			(id) =>
				wanted === id ||
				wanted === DICE_FONT_NAMES[id].toLowerCase().replace(/[^a-z]/g, ""),
		);
		if (!found) return null;
		out.numberFont = found;
	}
	if ("numberColor" in raw) {
		const value = raw.numberColor;
		if (
			value === null ||
			(typeof value === "string" && /^auto$/i.test(value.trim()))
		) {
			out.numberColor = null;
		} else {
			const hex = typeof value === "string" ? normalizeHex(value) : null;
			if (!hex) return null;
			out.numberColor = hex;
		}
	}
	if ("numbersFollowTransparency" in raw) {
		if (typeof raw.numbersFollowTransparency !== "boolean") return null;
		out.numbersFollowTransparency = raw.numbersFollowTransparency;
	}
	if ("imageSplit" in raw) {
		if (typeof raw.imageSplit !== "boolean") return null;
		out.imageSplit = raw.imageSplit;
	}
	if ("imageUrl" in raw) {
		const value = raw.imageUrl;
		if (value === null || (typeof value === "string" && value.trim() === "")) {
			out.imageUrl = null;
		} else {
			const url = normalizeImageUrl(value);
			if (!url) return null;
			out.imageUrl = url;
		}
	}
	return out;
}
