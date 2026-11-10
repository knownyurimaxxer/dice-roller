/**
 * The numbers on the dice. The dice are drawn with raw WebGL, which has no
 * text, so the digits come from glyphs.ts: the outlines of each number font
 * (see fonts.ts) already cut into triangles. Plain TypeScript, no dependencies.
 */
import { DEFAULT_DICE_FONT, type DiceFontId } from "./fonts";
import { GLYPH_SETS, type Glyph } from "./glyphs";

export type P2 = [number, number];

/** 6 and 9 get an underline so they can't be mistaken for each other. */
const UNDERLINE = { y0: -0.24, y1: -0.12, overhang: 0 };

/** The digits of a font (the default font's when the font isn't known). */
const glyphsOf = (font: DiceFontId): Record<string, Glyph> =>
	GLYPH_SETS[font] ?? GLYPH_SETS[DEFAULT_DICE_FONT];

/** Width of the ink of a text drawn with `height` (the height of one digit). */
export function textWidth(
	text: string,
	height: number,
	font: DiceFontId = DEFAULT_DICE_FONT,
): number {
	const chars = [...text];
	if (chars.length === 0) return 0;
	// Characters the font has no glyph for are skipped but still take a "0" of room.
	const glyphs = glyphsOf(font);
	const glyphOf = (ch: string) => glyphs[ch] ?? glyphs["0"];
	let w = 0;
	for (const ch of chars) w += glyphOf(ch).advance;
	const first = glyphOf(chars[0]);
	const last = glyphOf(chars[chars.length - 1]);
	return (w - first.xMin - (last.advance - last.xMax)) * height;
}

/**
 * The text as flat triangles in 2D, centered on the origin and facing the
 * viewer (counter-clockwise). Returns a list of [a, b, c] points.
 */
export function textTriangles(
	text: string,
	height: number,
	font: DiceFontId = DEFAULT_DICE_FONT,
): [P2, P2, P2][] {
	const tris: [P2, P2, P2][] = [];
	const chars = [...text];
	if (chars.length === 0) return tris;
	const glyphs = glyphsOf(font);
	const glyphOf = (ch: string) => glyphs[ch] ?? glyphs["0"];
	// pen position in units of the digit height, so the ink is centered
	let pen = -textWidth(text, 1, font) / 2 - glyphOf(chars[0]).xMin;
	const at = (x: number, y: number): P2 => [x * height, (y - 0.5) * height];
	for (const ch of chars) {
		const g = glyphs[ch];
		if (g) {
			const v = g.vertices;
			for (let i = 0; i < g.indices.length; i += 3) {
				const p = (k: number): P2 =>
					at(pen + v[g.indices[i + k] * 2], v[g.indices[i + k] * 2 + 1]);
				tris.push([p(0), p(1), p(2)]);
			}
			if (ch === "6" || ch === "9") {
				const a = pen + g.xMin - UNDERLINE.overhang;
				const b = pen + g.xMax + UNDERLINE.overhang;
				const { y0, y1 } = UNDERLINE;
				tris.push([at(a, y0), at(b, y0), at(b, y1)]);
				tris.push([at(a, y0), at(b, y1), at(a, y1)]);
			}
		}
		pen += glyphOf(ch).advance;
	}
	return tris;
}
