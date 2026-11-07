import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { getLocales } from "expo-localization";

/** The phone's languages, most wanted first ("es-ES", "en-GB"...). */
function readTags(): string[] {
	try {
		return getLocales()
			.map((l) => l.languageTag)
			.filter(Boolean);
	} catch (e) {
		console.warn("Could not read the phone's language", e);
		return [];
	}
}

/** Follows the phone's languages: re-read when the app comes back to the foreground. */
export function useDeviceLanguageTags(): string[] {
	const [tags, setTags] = useState(readTags);
	useEffect(() => {
		const sub = AppState.addEventListener("change", (state) => {
			if (state !== "active") return;
			setTags((prev) => {
				const next = readTags();
				return next.join() === prev.join() ? prev : next;
			});
		});
		return () => sub.remove();
	}, []);
	return tags;
}
