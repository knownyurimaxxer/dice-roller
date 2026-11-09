/**
 * Color helpers for the color picker. Colors travel through the app as
 * "#RRGGBB" strings; the picker works in HSL (hue 0-360, saturation and
 * lightness 0-100) because that is what its three sliders show.
 */

export type Hsl = { h: number; s: number; l: number };

/**
 * Turns what a person typed ("#1a2b3c", "1A2B3C", "#abc", "abc") into
 * "#RRGGBB" in capitals, or null when it isn't a color.
 */
export function normalizeHex(input: string): string | null {
	const h = input.trim().replace(/^#/, "");
	if (/^[0-9a-fA-F]{3}$/.test(h)) {
		const [r, g, b] = h;
		return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
	}
	if (/^[0-9a-fA-F]{6}$/.test(h)) return `#${h}`.toUpperCase();
	return null;
}

export function hexToHsl(hex: string): Hsl {
	const n = normalizeHex(hex) ?? "#000000";
	const r = parseInt(n.slice(1, 3), 16) / 255;
	const g = parseInt(n.slice(3, 5), 16) / 255;
	const b = parseInt(n.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	const l = (max + min) / 2;
	if (d === 0) return { h: 0, s: 0, l: l * 100 };
	const s = d / (1 - Math.abs(2 * l - 1));
	let h: number;
	if (max === r) h = ((g - b) / d) % 6;
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
	const sat = Math.min(100, Math.max(0, s)) / 100;
	const lig = Math.min(100, Math.max(0, l)) / 100;
	const hue = ((h % 360) + 360) % 360;
	const c = (1 - Math.abs(2 * lig - 1)) * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = lig - c / 2;
	const [r, g, b] =
		hue < 60
			? [c, x, 0]
			: hue < 120
				? [x, c, 0]
				: hue < 180
					? [0, c, x]
					: hue < 240
						? [0, x, c]
						: hue < 300
							? [x, 0, c]
							: [c, 0, x];
	const part = (v: number) =>
		Math.round((v + m) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}
