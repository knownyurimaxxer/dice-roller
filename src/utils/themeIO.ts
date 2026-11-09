/**
 * Moving a theme between apps. The format is a flat JSON object with the four
 * color names the theme is made of, nothing else (no app name, no version):
 *
 *   { "background": "#001935", "card": "#FFFFFF", "text": "#222222", "accent": "#00B8FF" }
 *
 * Any app that names its colors the same way can read it and write it.
 */
import type { Theme } from "../types";
import { normalizeHex } from "./color";

/** The names every theme file must have. */
export const THEME_KEYS = ["background", "card", "text", "accent"] as const;

export function exportTheme(theme: Theme): string {
	const out: Record<string, string> = {};
	for (const key of THEME_KEYS) out[key] = theme[key];
	return JSON.stringify(out, null, 2);
}

/**
 * Reads a theme from pasted text. Forgiving about what surrounds the JSON
 * (spaces, a ```json fence, a line of chat) and about the colors themselves
 * ("#abc", "abc" and "#AABBCC" are all fine); extra names are ignored.
 * Returns null unless all four colors are there and valid.
 */
export function parseTheme(text: string): Theme | null {
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
	const theme = {} as Theme;
	for (const key of THEME_KEYS) {
		const value = raw[key];
		const hex = typeof value === "string" ? normalizeHex(value) : null;
		if (!hex) return null;
		theme[key] = hex;
	}
	return theme;
}
