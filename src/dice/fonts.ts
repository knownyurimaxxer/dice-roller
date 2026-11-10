/**
 * The fonts the numbers on the dice can be set in. Each one is the heaviest
 * weight of its family, so they all look about as bold as the default, and
 * Playfair Display is the italic. Plain TypeScript, so it can be tested.
 *
 * To add a font: put its file in assets/fonts, add it to FONTS in
 * tools/generate_glyphs.py (then run `npm run glyphs`), to the list below, and
 * to the require() list in App.tsx.
 */
export const DICE_FONTS = ["inter", "poppins", "orbitron", "playfair"] as const;
export type DiceFontId = (typeof DICE_FONTS)[number];

export const DEFAULT_DICE_FONT: DiceFontId = "inter";

/** The name shown in Settings. Font names are proper names: they are not translated. */
export const DICE_FONT_NAMES: Record<DiceFontId, string> = {
	inter: "Inter",
	poppins: "Poppins",
	orbitron: "Orbitron",
	playfair: "Playfair Display",
};

/** The name each font is loaded under in the app (for the text in Settings). */
export const DICE_FONT_FAMILIES: Record<DiceFontId, string> = {
	inter: "Inter-Black",
	poppins: "Poppins-Black",
	orbitron: "Orbitron-Black",
	playfair: "PlayfairDisplay-BlackItalic",
};

export function isDiceFont(value: unknown): value is DiceFontId {
	return (
		typeof value === "string" &&
		(DICE_FONTS as readonly string[]).includes(value)
	);
}
