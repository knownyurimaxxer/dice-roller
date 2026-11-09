import type { MessageKey } from "./i18n/locales/en";
import { emptySpec } from "./dice/roll";
import { Settings, Theme } from "./types";
import { DEFAULT_LAYOUT } from "./utils/orientation";
import { THROW_SENSITIVITY_DEFAULT } from "./utils/throw";

/**
 * The font of the big result numbers. The numbers on the dice are cut from the
 * same font file (assets/fonts/Inter-Black.otf, see tools/generate_glyphs.py),
 * so the two always match.
 */
export const NUMBER_FONT = "Inter-Black";

/** Most rolls kept in the history; older ones are dropped. */
export const HISTORY_LIMIT = 200;

export const PRESETS: Record<string, Theme> = {
	Navy: {
		background: "#001935",
		card: "#FFFFFF",
		text: "#222222",
		accent: "#00B8FF",
	},
	Midnight: {
		background: "#0D0D0F",
		card: "#1C1C21",
		text: "#EDEDED",
		accent: "#FF6B9D",
	},
	Paper: {
		background: "#F2EFE9",
		card: "#FFFFFF",
		text: "#2B2B2B",
		accent: "#E4572E",
	},
	Forest: {
		background: "#12251B",
		card: "#1D3A2A",
		text: "#E6F2E9",
		accent: "#9BE564",
	},
	Grape: {
		background: "#2A1B3D",
		card: "#3D2A57",
		text: "#F3E8FF",
		accent: "#FFD166",
	},
};

export const SWATCHES: Record<keyof Theme, string[]> = {
	background: [
		"#001935",
		"#0D0D0F",
		"#12251B",
		"#2A1B3D",
		"#F2EFE9",
		"#1B2A41",
		"#3B1F2B",
		"#FFFFFF",
	],
	card: [
		"#FFFFFF",
		"#1C1C21",
		"#1D3A2A",
		"#3D2A57",
		"#FFF7E6",
		"#24385C",
		"#4A2838",
		"#F0F0F0",
	],
	text: [
		"#222222",
		"#EDEDED",
		"#E6F2E9",
		"#F3E8FF",
		"#2B2B2B",
		"#FFFFFF",
		"#FFD9A0",
		"#000000",
	],
	accent: [
		"#00B8FF",
		"#FF6B9D",
		"#E4572E",
		"#9BE564",
		"#FFD166",
		"#B388FF",
		"#FF8A00",
		"#00E5A8",
	],
};

/** Texts (see i18n) for the color rows in Settings. */
export const ROLE_LABELS: Record<keyof Theme, MessageKey> = {
	background: "role.background",
	card: "role.card",
	text: "role.text",
	accent: "role.accent",
};

/** Texts (see i18n) for the preset names. A preset without one shows its own name. */
export const PRESET_LABELS: Record<string, MessageKey> = {
	Navy: "preset.navy",
	Midnight: "preset.midnight",
	Paper: "preset.paper",
	Forest: "preset.forest",
	Grape: "preset.grape",
};

/** Every moment the app can vibrate. Each one has its own switch in Settings. */
export const HAPTIC_TRIGGERS = ["throw", "clash", "result", "buttons"] as const;
export type HapticTrigger = (typeof HAPTIC_TRIGGERS)[number];

/** Texts (see i18n) for the haptic switches. */
export const HAPTIC_LABELS: Record<HapticTrigger, MessageKey> = {
	throw: "haptics.throw",
	clash: "haptics.clash",
	result: "haptics.result",
	buttons: "haptics.buttons",
};

/**
 * Steps of the vibration-strength slider. 0 is the softest (and the default);
 * the top step is the app's original vibration.
 */
export const HAPTIC_STRENGTH = { min: 0, max: 5, default: 0 } as const;

export const DEFAULT_SETTINGS: Settings = {
	theme: PRESETS["Navy"],
	language: "system",
	soundThrow: true,
	soundResult: true,
	hapticsEnabled: false,
	haptics: Object.fromEntries(HAPTIC_TRIGGERS.map((k) => [k, true])) as Record<
		HapticTrigger,
		boolean
	>,
	hapticLevel: HAPTIC_STRENGTH.default,
	swipeToRoll: false,
	throwToRoll: false,
	throwSensitivity: THROW_SENSITIVITY_DEFAULT,
	orientation: DEFAULT_LAYOUT,
	lastSpec: emptySpec(),
};

export const LINKS = {
	developer: "https://www.tumblr.com/knownyurimaxxer",
	kofi: "https://ko-fi.com/knownyurimaxxer",
	ionicons: "https://ionic.io/ionicons",
	ionic: "https://ionic.io/",
} as const;
