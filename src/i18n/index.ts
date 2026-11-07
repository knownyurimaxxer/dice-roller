/**
 * The language system. Everything here is plain TypeScript (no React, no
 * Expo), so it can be tested on its own.
 *
 * Adding a language:
 *   1. copy locales/en.ts to locales/xx.ts and translate the values
 *      (type it as `Messages`, so the compiler tells you what is missing);
 *   2. add one line to LANGUAGES below.
 * It then shows up in Settings by itself.
 */
import { en, MessageKey, Messages } from "./locales/en";
import { es } from "./locales/es";
import { ca } from "./locales/ca";
import { gl } from "./locales/gl";
import { eu } from "./locales/eu";
import { pt } from "./locales/pt";

export type { MessageKey, Messages };

export type Language = {
	/** BCP 47 code: "en", "es", or with a region ("pt-BR"). */
	code: string;
	/** The language's own name, as shown in the picker. */
	name: string;
	messages: Messages;
};

export const LANGUAGES: Language[] = [
	{ code: "en", name: "English", messages: en },
	{ code: "es", name: "Español", messages: es },
	{ code: "ca", name: "Català", messages: ca },
	{ code: "gl", name: "Galego", messages: gl },
	{ code: "eu", name: "Euskara", messages: eu },
	{ code: "pt", name: "Português", messages: pt },
];

/** Used when neither the chosen nor the phone's language is available. */
export const FALLBACK_LANGUAGE = "en";
/** The saved setting that means "follow the phone". */
export const SYSTEM_LANGUAGE = "system";

const baseOf = (tag: string) => tag.split("-")[0];

/**
 * The best available language for a list of preferred ones (the phone's
 * languages, most wanted first). For each, in order: the same tag ("pt-BR"),
 * then its language ("pt"), then any regional variant of it. Nothing matches:
 * the fallback.
 */
export function pickLanguage(
	preferred: string[],
	available: string[] = LANGUAGES.map((l) => l.code),
	fallback: string = FALLBACK_LANGUAGE,
): string {
	for (const raw of preferred) {
		const tag = raw.toLowerCase().replace(/_/g, "-");
		const hit =
			available.find((a) => a.toLowerCase() === tag) ??
			available.find((a) => a.toLowerCase() === baseOf(tag)) ??
			available.find((a) => baseOf(a.toLowerCase()) === baseOf(tag));
		if (hit) return hit;
	}
	return fallback;
}

/**
 * The code of the language to use for a saved setting: a language we have,
 * or (for "system", and for a language that no longer exists) the phone's.
 */
export function resolveLanguage(setting: string, deviceTags: string[]): string {
	const chosen = LANGUAGES.find((l) => l.code === setting);
	return chosen ? chosen.code : pickLanguage(deviceTags);
}

export type Translate = (
	key: MessageKey,
	params?: Record<string, string | number>,
) => string;

/**
 * Looks a text up and fills in its {placeholders}. A text a language doesn't
 * have yet is shown in English, never as a blank or a raw key.
 */
export function makeTranslator(messages: Messages): Translate {
	return (key, params) => {
		const raw: string = messages[key] ?? en[key];
		return params
			? raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
					name in params ? String(params[name]) : whole,
				)
			: raw;
	};
}

export type I18n = {
	/** Code of the language in use. */
	language: string;
	/** Code of the language the phone's settings lead to (what "System default" means). */
	systemLanguage: string;
	/** Locale for dates and numbers. */
	locale: string;
	t: Translate;
};

export function buildI18n(setting: string, deviceTags: string[]): I18n {
	const code = resolveLanguage(setting, deviceTags);
	const lang = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
	return {
		language: lang.code,
		systemLanguage: pickLanguage(deviceTags),
		locale: lang.code,
		t: makeTranslator(lang.messages),
	};
}

/**
 * For the few places that aren't React components (a system alert opened from
 * deep in a renderer). Components should use `useT()` so they redraw when
 * the language changes.
 */
let active: Translate = makeTranslator(en);
export const setActiveTranslator = (t: Translate) => {
	active = t;
};
export const translate: Translate = (key, params) => active(key, params);
