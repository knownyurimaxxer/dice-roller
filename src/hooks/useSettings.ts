import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, HAPTIC_STRENGTH } from "../constants";
import { normalizeSpec } from "../dice/roll";
import { getAllSettings, setSetting } from "../storage/db";
import { Settings, UpdateSetting } from "../types";
import { normalizeLayout } from "../utils/orientation";
import { normalizeDiceStyle } from "../utils/diceStyle";
import { clampStep } from "../utils/slider";
import { clampSensitivity } from "../utils/throw";

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
				dice: normalizeDiceStyle(get<unknown>("dice", null)),
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
				// Saved under its own name; a missing or odd value starts at the default.
				hapticLevel: clampStep(
					get<unknown>("hapticLevel", DEFAULT_SETTINGS.hapticLevel),
					HAPTIC_STRENGTH.max,
					HAPTIC_STRENGTH.default,
				),
				swipeToRoll: get<unknown>("swipeToRoll", false) === true,
				throwToRoll: get<unknown>("throwToRoll", false) === true,
				throwSensitivity: clampSensitivity(
					get<unknown>("throwSensitivity", DEFAULT_SETTINGS.throwSensitivity),
				),
				orientation: normalizeLayout(get<unknown>("orientation", null)),
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
