import { useCallback, useEffect, useState } from "react";
import type { Favorite, RollSpec } from "../dice/roll";
import {
	addFavorite,
	deleteFavorite,
	getFavorites,
	renameFavorite,
} from "../storage/db";

/** The saved rolls ("favorites"), newest first. */
export function useFavorites() {
	const [favorites, setFavorites] = useState<Favorite[]>([]);

	const reload = useCallback(async () => {
		try {
			setFavorites(await getFavorites());
		} catch (e) {
			console.warn("Could not read favorites", e);
		}
	}, []);

	useEffect(() => {
		reload();
	}, [reload]);

	const add = useCallback(
		async (name: string, spec: RollSpec) => {
			await addFavorite(name.trim(), spec);
			await reload();
		},
		[reload],
	);

	const rename = useCallback(
		async (id: number, name: string) => {
			await renameFavorite(id, name.trim());
			await reload();
		},
		[reload],
	);

	const remove = useCallback(
		async (id: number) => {
			await deleteFavorite(id);
			await reload();
		},
		[reload],
	);

	return { favorites, add, rename, remove };
}
