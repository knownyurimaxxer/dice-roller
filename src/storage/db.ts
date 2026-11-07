/**
 * Internal database (SQLite). Holds everything the app remembers:
 *   - settings: theme, language, sound, haptics, the last selected dice
 *   - favorites: named rolls (the dice, mode and combine option)
 *   - history: every roll made, with what each die showed
 */
import * as SQLite from "expo-sqlite";
import { HISTORY_LIMIT } from "../constants";
import {
	normalizeSpec,
	type Favorite,
	type HistoryEntry,
	type RollResult,
	type RollSpec,
} from "../dice/roll";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = (async () => {
			const db = await SQLite.openDatabaseAsync("dice-roller.db");
			await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS favorites (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT NOT NULL,
          spec       TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS history (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          spec       TEXT NOT NULL,
          result     TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
			return db;
		})();
	}
	return dbPromise;
}

/** Opens the database ahead of time so the first real query doesn't wait for it. */
export function warmDb(): void {
	getDb().catch((e) => console.warn("Could not open the database", e));
}

/* ---- settings ---- */

export async function getAllSettings(): Promise<Record<string, unknown>> {
	const out: Record<string, unknown> = {};
	try {
		const db = await getDb();
		const rows = await db.getAllAsync<{ key: string; value: string }>(
			"SELECT key, value FROM settings",
		);
		rows.forEach((r) => {
			try {
				out[r.key] = JSON.parse(r.value);
			} catch {
				/* unreadable value: behaves as if it was never saved */
			}
		});
	} catch {
		/* no database: every setting falls back to its default */
	}
	return out;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
	const db = await getDb();
	await db.runAsync(
		"INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
		[key, JSON.stringify(value)],
	);
}

/* ---- favorites ---- */

type FavoriteRow = {
	id: number;
	name: string;
	spec: string;
	created_at: number;
};

const parse = (text: string): unknown => {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
};

export async function getFavorites(): Promise<Favorite[]> {
	const db = await getDb();
	const rows = await db.getAllAsync<FavoriteRow>(
		"SELECT id, name, spec, created_at FROM favorites ORDER BY created_at DESC, id DESC",
	);
	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		spec: normalizeSpec(parse(r.spec)),
		createdAt: r.created_at,
	}));
}

export async function addFavorite(name: string, spec: RollSpec): Promise<void> {
	const db = await getDb();
	await db.runAsync(
		"INSERT INTO favorites (name, spec, created_at) VALUES (?, ?, ?)",
		[name, JSON.stringify(spec), Date.now()],
	);
}

export async function renameFavorite(id: number, name: string): Promise<void> {
	const db = await getDb();
	await db.runAsync("UPDATE favorites SET name = ? WHERE id = ?", [name, id]);
}

export async function deleteFavorite(id: number): Promise<void> {
	const db = await getDb();
	await db.runAsync("DELETE FROM favorites WHERE id = ?", [id]);
}

/* ---- history ---- */

type HistoryRow = {
	id: number;
	spec: string;
	result: string;
	created_at: number;
};

export async function getHistory(): Promise<HistoryEntry[]> {
	const db = await getDb();
	const rows = await db.getAllAsync<HistoryRow>(
		"SELECT id, spec, result, created_at FROM history ORDER BY created_at DESC, id DESC LIMIT ?",
		[HISTORY_LIMIT],
	);
	const out: HistoryEntry[] = [];
	for (const r of rows) {
		const result = parse(r.result) as RollResult | null;
		if (!result || !Array.isArray(result.groups)) continue;
		out.push({
			id: r.id,
			createdAt: r.created_at,
			spec: normalizeSpec(parse(r.spec), false), // as it was thrown
			result,
		});
	}
	return out;
}

/** Saves a roll and drops the oldest ones past the limit. Returns the saved entry. */
export async function addHistory(
	spec: RollSpec,
	result: RollResult,
): Promise<HistoryEntry> {
	const db = await getDb();
	const createdAt = Date.now();
	const res = await db.runAsync(
		"INSERT INTO history (spec, result, created_at) VALUES (?, ?, ?)",
		[JSON.stringify(spec), JSON.stringify(result), createdAt],
	);
	await db.runAsync(
		"DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY created_at DESC, id DESC LIMIT ?)",
		[HISTORY_LIMIT],
	);
	return { id: res.lastInsertRowId, createdAt, spec, result };
}

export async function clearHistory(): Promise<void> {
	const db = await getDb();
	await db.runAsync("DELETE FROM history");
}
