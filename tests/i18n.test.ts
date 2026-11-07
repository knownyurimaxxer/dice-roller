import { describe, expect, it } from "vitest";
import { PRESET_LABELS, PRESETS, ROLE_LABELS } from "../src/constants";
import {
	buildI18n,
	FALLBACK_LANGUAGE,
	LANGUAGES,
	makeTranslator,
	pickLanguage,
	resolveLanguage,
	SYSTEM_LANGUAGE,
} from "../src/i18n";
import { en } from "../src/i18n/locales/en";
import { timeAgo } from "../src/utils/format";

const placeholders = (text: string) =>
	(text.match(/\{\w+\}/g) ?? []).sort().join(",");

describe("pickLanguage", () => {
	const have = ["en", "es", "pt-BR"];

	it("takes the phone's language when we have it", () => {
		expect(pickLanguage(["es-ES"], have)).toBe("es");
		expect(pickLanguage(["es"], have)).toBe("es");
	});

	it("is not case sensitive and accepts underscores", () => {
		expect(pickLanguage(["ES_es"], have)).toBe("es");
		expect(pickLanguage(["pt-br"], have)).toBe("pt-BR");
	});

	it("matches a regional variant to the language we have", () => {
		expect(pickLanguage(["pt-PT"], have)).toBe("pt-BR");
		expect(pickLanguage(["pt"], have)).toBe("pt-BR");
	});

	it("tries the phone's next language when the first isn't available", () => {
		expect(pickLanguage(["fr-FR", "es-ES", "en-GB"], have)).toBe("es");
	});

	it("falls back to English when nothing matches", () => {
		expect(pickLanguage(["fr-FR", "ja-JP"], have)).toBe("en");
		expect(pickLanguage([], have)).toBe("en");
		expect(pickLanguage(["xx"], ["es"], "es")).toBe("es");
	});

	it("uses the real list of languages by default", () => {
		expect(pickLanguage(["es-MX"])).toBe("es");
		expect(pickLanguage(["de-DE"])).toBe(FALLBACK_LANGUAGE);
	});
});

describe("resolveLanguage", () => {
	it("follows the phone for the system setting", () => {
		expect(resolveLanguage(SYSTEM_LANGUAGE, ["es-ES"])).toBe("es");
		expect(resolveLanguage(SYSTEM_LANGUAGE, ["fr-FR"])).toBe("en");
		expect(resolveLanguage(SYSTEM_LANGUAGE, [])).toBe("en");
	});

	it("uses a chosen language whatever the phone says", () => {
		expect(resolveLanguage("en", ["es-ES"])).toBe("en");
		expect(resolveLanguage("es", ["fr-FR"])).toBe("es");
	});

	it("treats a language that no longer exists like the system setting", () => {
		expect(resolveLanguage("klingon", ["es-ES"])).toBe("es");
		expect(resolveLanguage("klingon", ["fr-FR"])).toBe("en");
	});
});

describe("makeTranslator", () => {
	it("looks texts up and fills in placeholders", () => {
		const t = makeTranslator(en);
		expect(t("common.cancel")).toBe("Cancel");
		expect(t("time.minutes", { n: 5 })).toBe("5m");
		expect(t("roll.addDie", { die: "d20" })).toBe("Add a d20");
	});

	it("leaves a placeholder alone when it isn't given", () => {
		expect(makeTranslator(en)("time.minutes")).toBe("{n}m");
		expect(makeTranslator(en)("time.minutes", { x: 1 })).toBe("{n}m");
	});

	it("shows English for a text the language doesn't have yet", () => {
		const partial = { ...LANGUAGES[1].messages } as Record<string, string>;
		delete partial["common.cancel"];
		const t = makeTranslator(partial as typeof en);
		expect(t("common.cancel")).toBe("Cancel");
		expect(t("common.delete")).toBe(LANGUAGES[1].messages["common.delete"]);
	});
});

describe("buildI18n", () => {
	it("gives the language, its locale and its texts", () => {
		const es = buildI18n(SYSTEM_LANGUAGE, ["es-ES"]);
		expect(es.language).toBe("es");
		expect(es.locale).toBe("es");
		expect(es.t("common.done")).toBe("Listo");
		const fallback = buildI18n(SYSTEM_LANGUAGE, ["fr-FR"]);
		expect(fallback.language).toBe("en");
		expect(fallback.t("common.done")).toBe("Done");
	});
});

describe("systemLanguage", () => {
	it("is the phone's language, whatever language is chosen", () => {
		expect(buildI18n("en", ["es-ES"]).systemLanguage).toBe("es");
		expect(buildI18n("es", ["fr-FR"]).systemLanguage).toBe("en");
		expect(buildI18n(SYSTEM_LANGUAGE, ["es-ES"]).systemLanguage).toBe("es");
	});
});

describe("every language file", () => {
	const keys = Object.keys(en);

	it("has English, which is the fallback", () => {
		expect(LANGUAGES.some((l) => l.code === FALLBACK_LANGUAGE)).toBe(true);
	});

	it("has a unique code and a name", () => {
		const codes = LANGUAGES.map((l) => l.code);
		expect(new Set(codes).size).toBe(codes.length);
		expect(codes.includes(SYSTEM_LANGUAGE)).toBe(false);
		for (const l of LANGUAGES) expect(l.name.trim().length > 0).toBe(true);
	});

	for (const lang of LANGUAGES) {
		it(`${lang.code}: has exactly the keys of English, none empty`, () => {
			expect(Object.keys(lang.messages).sort()).toEqual([...keys].sort());
			for (const k of keys)
				expect(
					(lang.messages as Record<string, string>)[k].trim().length > 0,
				).toBe(true);
		});

		it(`${lang.code}: keeps the {placeholders} of every text`, () => {
			for (const k of keys)
				expect(placeholders((lang.messages as Record<string, string>)[k])).toBe(
					placeholders((en as Record<string, string>)[k]),
				);
		});
	}
});

describe("labels in constants", () => {
	it("has a text for every preset and every color row", () => {
		for (const name of Object.keys(PRESETS))
			expect(PRESET_LABELS[name] in en).toBe(true);
		for (const key of Object.values(ROLE_LABELS)) expect(key in en).toBe(true);
	});
});

describe("timeAgo in another language", () => {
	const es = buildI18n("es", []);

	it("use the translator they are given", () => {
		expect(timeAgo(Date.now() - 5_000, es.t)).toBe("ahora mismo");
		expect(timeAgo(Date.now() - (5 * 60_000 + 500), es.t)).toBe("5 min");
		expect(timeAgo(Date.now() - (3 * 3_600_000 + 500), es.t)).toBe("3 h");
	});

	it("format the old-roll date for the locale", () => {
		const old = Date.now() - 30 * 86_400_000;
		expect(timeAgo(old, es.t, "es")).toBe(
			new Date(old).toLocaleDateString("es"),
		);
	});
});

describe("haptic labels in constants", () => {
	it("has a text for every haptic switch", async () => {
		const { HAPTIC_LABELS, HAPTIC_TRIGGERS } = await import("../src/constants");
		for (const id of HAPTIC_TRIGGERS)
			expect(HAPTIC_LABELS[id] in en).toBe(true);
	});
});
