/**
 * The rules of a roll. Plain TypeScript (no React, no Expo), so it can be
 * tested on its own.
 *
 *  - A roll is a list of dice (how many of each kind), a mode and a way to
 *    combine the kinds.
 *  - Mode "regular" adds the dice of a kind together. "advantage" and
 *    "disadvantage" are "pick one" modes: the pool is a single kind of die,
 *    its dice are doubled when the mode is chosen (a d20 becomes two d20), and
 *    only the highest (or lowest) die of the whole pool counts.
 *  - Combine "total" adds the result of every kind into one number;
 *    "separate" shows one result per kind (only matters in regular mode, the
 *    only one that allows several kinds).
 */
export const DIE_SIDES = [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 100] as const;
export type DieSides = (typeof DIE_SIDES)[number];

export type RollMode = "regular" | "advantage" | "disadvantage";
export type CombineMode = "total" | "separate";
export const ROLL_MODES: RollMode[] = ["regular", "advantage", "disadvantage"];

export type DieCount = { sides: DieSides; count: number };
export type RollSpec = {
	dice: DieCount[];
	mode: RollMode;
	combine: CombineMode;
};

export const MAX_PER_TYPE = 10;
/** Most dice that can lie on the board at once (a d100 is two of them). */
export const MAX_BODIES = 20;

/** How many physical dice one die of this kind needs. */
export const bodiesPer = (sides: number): number => (sides === 100 ? 2 : 1);

export const emptySpec = (): RollSpec => ({
	dice: [],
	mode: "regular",
	combine: "total",
});

const isSides = (n: unknown): n is DieSides =>
	DIE_SIDES.includes(n as DieSides);

export const countOf = (spec: RollSpec, sides: number): number =>
	spec.dice.find((d) => d.sides === sides)?.count ?? 0;

export const totalDice = (spec: RollSpec): number =>
	spec.dice.reduce((n, d) => n + d.count, 0);

/** How many physical dice are thrown for this roll. */
export const totalBodies = (spec: RollSpec): number =>
	spec.dice.reduce((n, d) => n + d.count * bodiesPer(d.sides), 0);

/** How many kinds of die are in the roll. */
export const kindCount = (spec: RollSpec): number => spec.dice.length;

/**
 * Sets how many dice of one kind there are, within the limits (per kind and
 * overall, counting a d100 as two). Kinds with 0 dice disappear; the rest are
 * kept in order.
 */
export function setCount(
	spec: RollSpec,
	sides: DieSides,
	wanted: number,
): RollSpec {
	const others = totalBodies(spec) - countOf(spec, sides) * bodiesPer(sides);
	const room = Math.floor((MAX_BODIES - others) / bodiesPer(sides));
	const count = Math.max(0, Math.min(MAX_PER_TYPE, room, Math.round(wanted)));
	const dice = spec.dice.filter((d) => d.sides !== sides);
	if (count > 0) dice.push({ sides, count });
	dice.sort((a, b) => a.sides - b.sides);
	return { ...spec, dice };
}

/** Advantage and disadvantage: the pool is one kind of die, thrown doubled. */
export const isPickMode = (mode: RollMode): boolean => mode !== "regular";

/** The kind with the most dice (the larger die when tied): the one a pool keeps. */
function bestKind(dice: DieCount[]): DieCount | undefined {
	return [...dice].sort((a, b) => b.count - a.count || b.sides - a.sides)[0];
}

/**
 * Makes a spec follow the rules of its mode. In advantage / disadvantage the
 * pool is a single kind of die with at least two dice; anything else is cut
 * down to that (keeping the kind with the most dice).
 */
export function conform(spec: RollSpec): RollSpec {
	if (!isPickMode(spec.mode) || spec.dice.length === 0) return spec;
	const keep = bestKind(spec.dice) as DieCount;
	const pool = setCount(
		{ ...spec, dice: [] },
		keep.sides,
		Math.max(2, keep.count),
	);
	return countOf(pool, keep.sides) >= 2 ? pool : { ...spec, dice: [] };
}

/**
 * Changes the mode. Going to advantage / disadvantage keeps one kind and
 * doubles its dice; going back to regular halves them again (rounding up), so
 * switching there and back leaves the dice as they were.
 */
export function setMode(spec: RollSpec, mode: RollMode): RollSpec {
	if (mode === spec.mode) return spec;
	const next: RollSpec = { ...spec, mode };
	if (!isPickMode(spec.mode) && isPickMode(mode)) {
		const keep = bestKind(spec.dice);
		if (!keep) return next;
		return conform(setCount({ ...next, dice: [] }, keep.sides, keep.count * 2));
	}
	if (isPickMode(spec.mode) && !isPickMode(mode)) {
		const keep = spec.dice[0];
		if (!keep) return next;
		return setCount(
			{ ...next, dice: [] },
			keep.sides,
			Math.ceil(keep.count / 2),
		);
	}
	return next; // advantage <-> disadvantage: same dice
}

/**
 * What tapping a die does. In regular mode it adds or removes one die. In
 * advantage / disadvantage the pool is one kind: tapping another kind starts a
 * new pool of two dice, and taking dice away below two empties the pool.
 */
export function tapDie(
	spec: RollSpec,
	sides: DieSides,
	delta: 1 | -1,
): RollSpec {
	if (!isPickMode(spec.mode))
		return setCount(spec, sides, countOf(spec, sides) + delta);
	const pool = spec.dice[0];
	if (!pool || pool.sides !== sides) {
		if (delta < 0) return spec;
		return conform(setCount({ ...spec, dice: [] }, sides, 2));
	}
	if (pool.count + delta < 2) return { ...spec, dice: [] };
	return setCount(spec, sides, pool.count + delta);
}

/**
 * Whatever came out of the database, turned into a usable spec. With
 * `conformPool` off a roll from the past is shown exactly as it was thrown.
 */
export function normalizeSpec(raw: unknown, conformPool = true): RollSpec {
	const out = emptySpec();
	if (!raw || typeof raw !== "object") return out;
	const r = raw as Record<string, unknown>;
	if (ROLL_MODES.includes(r.mode as RollMode)) out.mode = r.mode as RollMode;
	if (r.combine === "total" || r.combine === "separate")
		out.combine = r.combine;
	let spec: RollSpec = out;
	if (Array.isArray(r.dice)) {
		for (const item of r.dice) {
			const d = item as { sides?: unknown; count?: unknown };
			if (isSides(d?.sides) && typeof d.count === "number")
				spec = setCount(spec, d.sides, d.count);
		}
	}
	return conformPool ? conform(spec) : spec;
}

/** "2d20 + d6" (or "2d20 · d6" when separate), with ▲ / ▼ for advantage / disadvantage. */
export function specLabel(spec: RollSpec): string {
	if (spec.dice.length === 0) return "";
	const parts = spec.dice.map((d) =>
		d.count === 1 ? `d${d.sides}` : `${d.count}d${d.sides}`,
	);
	const joined = parts.join(spec.combine === "total" ? " + " : " · ");
	const mark =
		spec.mode === "advantage" ? " ▲" : spec.mode === "disadvantage" ? " ▼" : "";
	return joined + mark;
}

export type GroupResult = {
	sides: DieSides;
	/** What each die showed, in the order they were thrown. */
	values: number[];
	/** Positions in `values` that count (all of them, or the one that was kept). */
	kept: number[];
	/** The group's number: the sum, the highest or the lowest. */
	result: number;
};

export type RollResult = {
	groups: GroupResult[];
	/** Every group's result added together. */
	total: number;
};

export function evaluate(
	spec: RollSpec,
	values: Record<number, number[]>,
): RollResult {
	const groups: GroupResult[] = spec.dice.map(({ sides }) => {
		const vals = values[sides] ?? [];
		if (vals.length === 0) return { sides, values: [], kept: [], result: 0 };
		if (spec.mode === "regular")
			return {
				sides,
				values: vals,
				kept: vals.map((_, i) => i),
				result: vals.reduce((a, b) => a + b, 0),
			};
		const target =
			spec.mode === "advantage" ? Math.max(...vals) : Math.min(...vals);
		return {
			sides,
			values: vals,
			kept: [vals.indexOf(target)],
			result: target,
		};
	});
	return { groups, total: groups.reduce((n, g) => n + g.result, 0) };
}

/** The highest number the roll can reach (used to cheer a perfect roll). */
export function maxPossible(spec: RollSpec): number {
	return spec.dice.reduce(
		(n, d) => n + (spec.mode === "regular" ? d.sides * d.count : d.sides),
		0,
	);
}

export type HistoryEntry = {
	id: number;
	createdAt: number;
	spec: RollSpec;
	result: RollResult;
};

export type Favorite = {
	id: number;
	name: string;
	spec: RollSpec;
	createdAt: number;
};

/** Name shown for a favorite that was saved without one. */
export const favoriteTitle = (f: { name: string; spec: RollSpec }): string =>
	f.name.trim() || specLabel(f.spec);

/** What the dice of one kind showed: "14 (7)" (the ones that didn't count in parentheses). */
export const groupDetail = (g: GroupResult): string =>
	g.values.map((v, i) => (g.kept.includes(i) ? `${v}` : `(${v})`)).join(" ");

/**
 * The kinds of die worth listing under the result. With several kinds, all of
 * them (a lone d20 next to two d6 still shows what it rolled); with one kind,
 * only when more than one die was thrown (one die is just the result itself).
 */
export function listedGroups(r: RollResult): GroupResult[] {
	return r.groups.length > 1
		? r.groups
		: r.groups.filter((g) => g.values.length > 1);
}

/** The result as a short line: the total, or one number per kind. */
export function resultSummary(spec: RollSpec, r: RollResult): string {
	if (spec.combine === "separate" && r.groups.length > 1)
		return r.groups.map((g) => g.result).join(" · ");
	return String(r.total);
}
