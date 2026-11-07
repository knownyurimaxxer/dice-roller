import { makeTranslator, Translate } from "../i18n";
import { en } from "../i18n/locales/en";

/** What these helpers say when no translator is given. */
const english = makeTranslator(en);

/** Black or white, whichever is readable on top of `hex`. */
export function readableOn(hex: string): "#000000" | "#FFFFFF" {
	const h = hex.replace("#", "");
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
		? "#000000"
		: "#FFFFFF";
}

const channel = (c: number) => {
	const v = c / 255;
	return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

function luminance(hex: string): number {
	const h = hex.replace("#", "");
	const [r, g, b] = [0, 2, 4].map((i) =>
		channel(parseInt(h.slice(i, i + 2), 16)),
	);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast between two colors: 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** The accent where it can be read on `background`, otherwise `fallback` (the text color). */
export function legibleAccent(
	accent: string,
	background: string,
	fallback: string,
): string {
	return contrastRatio(accent, background) >= 3 ? accent : fallback;
}

const toHex = (n: number) =>
	Math.round(Math.max(0, Math.min(255, n)))
		.toString(16)
		.padStart(2, "0");

/** A color between `a` and `b`: t = 0 is `a`, t = 1 is `b`. */
export function mixColors(a: string, b: string, t: number): string {
	const pa = a.replace("#", "");
	const pb = b.replace("#", "");
	const ch = (p: string, i: number) => parseInt(p.slice(i, i + 2), 16);
	return (
		"#" +
		[0, 2, 4]
			.map((i) => toHex(ch(pa, i) + (ch(pb, i) - ch(pa, i)) * t))
			.join("")
	);
}

/** Lighter (amount > 0, toward white) or darker (amount < 0, toward black). */
export function shade(hex: string, amount: number): string {
	return amount >= 0
		? mixColors(hex, "#FFFFFF", amount)
		: mixColors(hex, "#000000", -amount);
}

/** "just now", "5m", "3h", "2d", then the date. `t` and `locale` come from useI18n(). */
export function timeAgo(
	ts: number,
	t: Translate = english,
	locale?: string,
	now: number = Date.now(),
): string {
	const s = Math.floor((now - ts) / 1000);
	if (s < 60) return t("time.now");
	if (s < 3600) return t("time.minutes", { n: Math.floor(s / 60) });
	if (s < 86400) return t("time.hours", { n: Math.floor(s / 3600) });
	if (s < 604800) return t("time.days", { n: Math.floor(s / 86400) });
	return new Date(ts).toLocaleDateString(locale);
}
