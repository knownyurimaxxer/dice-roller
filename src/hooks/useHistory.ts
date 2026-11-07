import { useCallback, useEffect, useState } from "react";
import type { HistoryEntry, RollResult, RollSpec } from "../dice/roll";
import { addHistory, clearHistory, getHistory } from "../storage/db";

/** Every roll made, newest first. */
export function useHistory() {
	const [history, setHistory] = useState<HistoryEntry[]>([]);

	useEffect(() => {
		getHistory()
			.then(setHistory)
			.catch((e) => console.warn("Could not read history", e));
	}, []);

	const add = useCallback(async (spec: RollSpec, result: RollResult) => {
		try {
			const entry = await addHistory(spec, result);
			setHistory((h) => [entry, ...h]);
		} catch (e) {
			console.warn("Could not save the roll", e);
		}
	}, []);

	const clear = useCallback(async () => {
		await clearHistory();
		setHistory([]);
	}, []);

	return { history, add, clear };
}
