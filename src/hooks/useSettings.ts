import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../constants";
import { normalizeSpec } from "../dice/roll";
import { getAllSettings, setSetting } from "../storage/db";
import { Settings, UpdateSetting } from "../types";

export function useSettings() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		(async () => {
			const saved = await getAllSettings();
			const get = <T>(key: string, fallback: T): T =>
				key in saved ? (saved[key] as T) : fallback;
			const savedHaptics = get<unknown>("haptics", null);
			setSettings({
				theme: { ...DEFAULT_SETTINGS.theme, ...get("theme", {}) },
				language: get("language", DEFAULT_SETTINGS.language),
				soundThrow: get("soundThrow", DEFAULT_SETTINGS.soundThrow),
				soundResult: get("soundResult", DEFAULT_SETTINGS.soundResult),
				hapticsEnabled: get("hapticsEnabled", DEFAULT_SETTINGS.hapticsEnabled),
				// A trigger added in a later version starts on, like the others.
				haptics: {
					...DEFAULT_SETTINGS.haptics,
					...(savedHaptics && typeof savedHaptics === "object"
						? savedHaptics
						: {}),
				},
				lastSpec: normalizeSpec(get<unknown>("lastSpec", null)),
			});
			setReady(true);
		})();
	}, []);

	const update: UpdateSetting = useCallback((key, value) => {
		setSettings((s) => ({ ...s, [key]: value }));
		setSetting(key, value).catch((e) =>
			console.warn("Could not save setting", key, e),
		);
	}, []);

	return { settings, ready, update };
}
