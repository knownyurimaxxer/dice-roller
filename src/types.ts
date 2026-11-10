import type { HapticTrigger } from "./constants";
import type { RollSpec } from "./dice/roll";
import type { Layout } from "./utils/orientation";

export type Theme = {
	background: string;
	/** Panels: the controls area, sheets and cards. */
	card: string;
	text: string;
	/** The dice, buttons and highlights. */
	accent: string;
};

/** How the dice look, apart from the theme: see-through, number color, picture. */
export type DiceStyle = {
	/** How see-through the dice are, in percent: 0 (solid) to 90. */
	transparency: number;
	/** Color of the numbers as #RRGGBB, or null to pick whichever reads best. */
	numberColor: string | null;
	/** Whether the numbers become see-through along with the dice. */
	numbersFollowTransparency: boolean;
	/** Link (https) of the picture laid over the dice color, or null for none. */
	imageUrl: string | null;
	/** Where the downloaded copy of that picture is on the phone. Never exported. */
	imageUri: string | null;
	/** How see-through the picture is, in percent: 0 (fully visible) to 90. */
	imageTransparency: number;
};

export type Settings = {
	theme: Theme;
	/** The look of the dice (see DiceStyle). */
	dice: DiceStyle;
	/** "system" (follow the phone), or the code of one of the languages in i18n/LANGUAGES. */
	language: string;
	/** Rolling and clashing dice. */
	soundThrow: boolean;
	/** The little celebration when the result shows. */
	soundResult: boolean;
	/** Master switch for vibration feedback. */
	hapticsEnabled: boolean;
	/** Which haptic triggers are on (only used while hapticsEnabled is on). */
	haptics: Record<HapticTrigger, boolean>;
	/** How strong the vibration is: 0 (softest) to HAPTIC_STRENGTH.max (the original strength). Android only. */
	hapticLevel: number;
	/** Roll the dice with a swipe up anywhere on the screen (off by default). */
	swipeToRoll: boolean;
	/** Roll the dice when the phone is thrown (off by default). */
	throwToRoll: boolean;
	/** How gentle a throw can be, from 1 (hard) to 10 (gentle). */
	throwSensitivity: number;
	/** Which way up the screen stays: it never rotates by itself. */
	orientation: Layout;
	/** The dice, mode and combine option that were selected last. */
	lastSpec: RollSpec;
};

export type UpdateSetting = <K extends keyof Settings>(
	key: K,
	value: Settings[K],
) => void;
