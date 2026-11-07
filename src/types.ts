import type { HapticTrigger } from "./constants";
import type { RollSpec } from "./dice/roll";

export type Theme = {
	background: string;
	/** Panels: the controls area, sheets and cards. */
	card: string;
	text: string;
	/** The dice, buttons and highlights. */
	accent: string;
};

export type Settings = {
	theme: Theme;
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
	/** Roll the dice when the phone is thrown (off by default). */
	throwToRoll: boolean;
	/** How gentle a throw can be, from 1 (hard) to 10 (gentle). */
	throwSensitivity: number;
	/** The dice, mode and combine option that were selected last. */
	lastSpec: RollSpec;
};

export type UpdateSetting = <K extends keyof Settings>(
	key: K,
	value: Settings[K],
) => void;
