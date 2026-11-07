import { describe, expect, it } from "vitest";
import {
	bodiesPer,
	conform,
	countOf,
	emptySpec,
	evaluate,
	favoriteTitle,
	groupDetail,
	kindCount,
	MAX_BODIES,
	MAX_PER_TYPE,
	maxPossible,
	normalizeSpec,
	resultSummary,
	setCount,
	setMode,
	specLabel,
	tapDie,
	totalBodies,
	totalDice,
	type RollSpec,
} from "../src/dice/roll";

const spec = (
	dice: [number, number][],
	mode: RollSpec["mode"] = "regular",
	combine: RollSpec["combine"] = "total",
): RollSpec => ({
	dice: dice.map(([sides, count]) => ({ sides, count })) as RollSpec["dice"],
	mode,
	combine,
});

describe("setCount", () => {
	it("adds, changes and removes kinds of die, keeping them sorted", () => {
		let s = emptySpec();
		s = setCount(s, 20, 2);
		s = setCount(s, 6, 1);
		expect(s.dice).toEqual([
			{ sides: 6, count: 1 },
			{ sides: 20, count: 2 },
		]);
		s = setCount(s, 6, 0);
		expect(s.dice).toEqual([{ sides: 20, count: 2 }]);
		expect(countOf(s, 6)).toBe(0);
		expect(countOf(s, 20)).toBe(2);
	});

	it("never goes below zero or above the limit for a kind", () => {
		expect(countOf(setCount(emptySpec(), 6, -3), 6)).toBe(0);
		expect(countOf(setCount(emptySpec(), 6, 99), 6)).toBe(MAX_PER_TYPE);
	});

	it("stops at the overall limit of physical dice", () => {
		let s = emptySpec();
		for (const sides of [4, 6, 8, 10] as const)
			s = setCount(s, sides, MAX_PER_TYPE);
		expect(totalBodies(s)).toBe(MAX_BODIES);
		expect(totalDice(s)).toBe(MAX_BODIES);
		// No room left for one more.
		expect(countOf(setCount(s, 12, 1), 12)).toBe(0);
	});

	it("counts a d100 as two physical dice", () => {
		expect(bodiesPer(100)).toBe(2);
		expect(bodiesPer(20)).toBe(1);
		const s = setCount(emptySpec(), 100, 3);
		expect(totalDice(s)).toBe(3);
		expect(totalBodies(s)).toBe(6);
		let full = emptySpec();
		for (const sides of [4, 6] as const)
			full = setCount(full, sides, MAX_PER_TYPE);
		// 20 bodies already used: not even one d100 fits
		expect(countOf(setCount(full, 100, 1), 100)).toBe(0);
		// 19 used: a d100 (2 bodies) doesn't fit, a d8 does
		const nineteen = setCount(full, 6, 9);
		expect(countOf(setCount(nineteen, 100, 1), 100)).toBe(0);
		expect(countOf(setCount(nineteen, 8, 1), 8)).toBe(1);
	});

	it("does not change the mode or the way kinds are combined", () => {
		const s = setCount(spec([], "advantage", "separate"), 20, 1);
		expect(s.mode).toBe("advantage");
		expect(s.combine).toBe("separate");
	});
});

describe("normalizeSpec", () => {
	it("keeps a good spec", () => {
		const s = spec(
			[
				[6, 2],
				[20, 1],
			],
			"regular",
			"separate",
		);
		expect(normalizeSpec(JSON.parse(JSON.stringify(s)))).toEqual(s);
		const pool = spec([[20, 4]], "advantage");
		expect(normalizeSpec(JSON.parse(JSON.stringify(pool)))).toEqual(pool);
	});

	it("repairs garbage instead of failing", () => {
		expect(normalizeSpec(null)).toEqual(emptySpec());
		expect(normalizeSpec("x")).toEqual(emptySpec());
		expect(normalizeSpec({ dice: "no", mode: "wow", combine: 5 })).toEqual(
			emptySpec(),
		);
		const s = normalizeSpec({
			dice: [
				{ sides: 7, count: 2 },
				{ sides: 8, count: "3" },
				{ sides: 6, count: 500 },
				null,
			],
			mode: "advantage",
		});
		expect(s.dice).toEqual([{ sides: 6, count: MAX_PER_TYPE }]);
		expect(s.mode).toBe("advantage");
		expect(s.combine).toBe("total");
	});
});

describe("specLabel", () => {
	it("writes the dice like a player would", () => {
		expect(specLabel(emptySpec())).toBe("");
		expect(specLabel(spec([[20, 1]]))).toBe("d20");
		expect(
			specLabel(
				spec([
					[6, 2],
					[20, 1],
				]),
			),
		).toBe("2d6 + d20");
	});

	it("marks advantage and disadvantage, and separate kinds", () => {
		expect(specLabel(spec([[20, 2]], "advantage"))).toBe("2d20 ▲");
		expect(specLabel(spec([[20, 2]], "disadvantage"))).toBe("2d20 ▼");
		expect(
			specLabel(
				spec(
					[
						[6, 2],
						[20, 1],
					],
					"regular",
					"separate",
				),
			),
		).toBe("2d6 · d20");
	});

	it("uses the label as the name of a favorite saved without one", () => {
		const s = spec([[20, 2]], "advantage");
		expect(favoriteTitle({ name: "  ", spec: s })).toBe("2d20 ▲");
		expect(favoriteTitle({ name: "Attack", spec: s })).toBe("Attack");
	});
});

describe("evaluate", () => {
	it("adds the dice together in regular mode", () => {
		const r = evaluate(spec([[6, 3]]), { 6: [2, 5, 4] });
		expect(r.groups[0].result).toBe(11);
		expect(r.groups[0].kept).toEqual([0, 1, 2]);
		expect(r.total).toBe(11);
	});

	it("keeps the highest die with advantage", () => {
		const r = evaluate(spec([[20, 2]], "advantage"), { 20: [7, 14] });
		expect(r.groups[0].result).toBe(14);
		expect(r.groups[0].kept).toEqual([1]);
	});

	it("keeps the lowest die with disadvantage", () => {
		const r = evaluate(spec([[20, 3]], "disadvantage"), { 20: [9, 3, 15] });
		expect(r.groups[0].result).toBe(3);
		expect(r.groups[0].kept).toEqual([1]);
	});

	it("keeps only one die when several tie", () => {
		const r = evaluate(spec([[20, 2]], "advantage"), { 20: [12, 12] });
		expect(r.groups[0].kept).toEqual([0]);
		expect(r.total).toBe(12);
	});

	it("applies the mode to each kind on its own, then adds the kinds", () => {
		const r = evaluate(
			spec(
				[
					[6, 1],
					[20, 2],
				],
				"advantage",
			),
			{ 6: [4], 20: [3, 17] },
		);
		expect(r.groups.map((g) => g.result)).toEqual([4, 17]);
		expect(r.total).toBe(21);
	});

	it("keeps a result per kind when they are separate", () => {
		const s = spec(
			[
				[6, 1],
				[20, 1],
			],
			"regular",
			"separate",
		);
		const r = evaluate(s, { 6: [4], 20: [17] });
		expect(r.groups.map((g) => g.result)).toEqual([4, 17]);
		expect(resultSummary(s, r)).toBe("4 · 17");
		expect(
			resultSummary(
				spec([
					[6, 1],
					[20, 1],
				]),
				r,
			),
		).toBe("21");
		expect(
			resultSummary(
				spec([[20, 1]], "regular", "separate"),
				evaluate(spec([[20, 1]]), { 20: [9] }),
			),
		).toBe("9");
	});

	it("copes with a kind that has no values", () => {
		const r = evaluate(spec([[6, 1]]), {});
		expect(r.total).toBe(0);
	});

	it("describes the dice of a kind, with the ones that didn't count in parentheses", () => {
		const r = evaluate(spec([[20, 3]], "advantage"), { 20: [4, 18, 9] });
		expect(groupDetail(r.groups[0])).toBe("(4) 18 (9)");
		expect(groupDetail(evaluate(spec([[6, 2]]), { 6: [1, 2] }).groups[0])).toBe(
			"1 2",
		);
	});
});

describe("maxPossible", () => {
	it("is the best the roll can do", () => {
		expect(
			maxPossible(
				spec([
					[6, 2],
					[20, 1],
				]),
			),
		).toBe(32);
		expect(maxPossible(spec([[20, 2]], "advantage"))).toBe(20);
		expect(maxPossible(spec([[20, 2]], "disadvantage"))).toBe(20);
		expect(maxPossible(emptySpec())).toBe(0);
	});
});

describe("kindCount", () => {
	it("counts the kinds, not the dice", () => {
		expect(
			kindCount(
				spec([
					[6, 3],
					[20, 1],
				]),
			),
		).toBe(2);
		expect(kindCount(emptySpec())).toBe(0);
	});
});

describe("advantage and disadvantage pools", () => {
	it("conform cuts a pool down to one kind of at least two dice", () => {
		// the kind with the most dice stays, the larger die wins a tie
		expect(
			conform(
				spec(
					[
						[6, 3],
						[20, 1],
					],
					"advantage",
				),
			).dice,
		).toEqual([{ sides: 6, count: 3 }]);
		expect(
			conform(
				spec(
					[
						[6, 2],
						[20, 2],
					],
					"disadvantage",
				),
			).dice,
		).toEqual([{ sides: 20, count: 2 }]);
		expect(conform(spec([[20, 1]], "advantage")).dice).toEqual([
			{ sides: 20, count: 2 },
		]);
		// regular rolls are left alone
		const regular = spec([
			[6, 3],
			[20, 1],
		]);
		expect(conform(regular)).toEqual(regular);
		expect(conform(spec([], "advantage")).dice).toEqual([]);
	});

	it("normalizeSpec applies the pool rules (unless told not to)", () => {
		const raw = {
			dice: [
				{ sides: 20, count: 1 },
				{ sides: 6, count: 1 },
			],
			mode: "advantage",
		};
		expect(normalizeSpec(raw).dice).toEqual([{ sides: 20, count: 2 }]);
		expect(normalizeSpec(raw, false).dice).toEqual([
			{ sides: 6, count: 1 },
			{ sides: 20, count: 1 },
		]);
	});

	it("choosing advantage doubles the dice and keeps one kind", () => {
		const s = setMode(spec([[20, 1]]), "advantage");
		expect(s.mode).toBe("advantage");
		expect(s.dice).toEqual([{ sides: 20, count: 2 }]);
		expect(
			setMode(
				spec([
					[6, 3],
					[20, 1],
				]),
				"disadvantage",
			).dice,
		).toEqual([{ sides: 6, count: 6 }]);
		expect(setMode(spec([]), "advantage").dice).toEqual([]);
	});

	it("going back to regular halves the dice, so there and back changes nothing", () => {
		for (const count of [1, 2, 3, 5]) {
			const start = spec([[20, count]]);
			expect(setMode(setMode(start, "advantage"), "regular").dice).toEqual(
				start.dice,
			);
		}
	});

	it("switching between advantage and disadvantage keeps the dice", () => {
		const adv = setMode(spec([[8, 2]]), "advantage");
		const dis = setMode(adv, "disadvantage");
		expect(dis.mode).toBe("disadvantage");
		expect(dis.dice).toEqual(adv.dice);
		expect(setMode(dis, "disadvantage")).toBe(dis);
	});

	it("doubling respects the limits", () => {
		const s = setMode(spec([[20, 7]]), "advantage");
		expect(s.dice).toEqual([{ sides: 20, count: MAX_PER_TYPE }]);
		// the pool is what gets thrown: 4 d100 doubled is 8 (16 bodies), fine...
		expect(setMode(spec([[100, 4]]), "advantage").dice).toEqual([
			{ sides: 100, count: 8 },
		]);
		// ...but 6 doubled is 12, and only 10 d100 (20 bodies) fit on the board
		expect(setMode(spec([[100, 6]]), "advantage").dice).toEqual([
			{ sides: 100, count: 10 },
		]);
	});

	it("tapping in regular mode adds and removes one die", () => {
		let s = tapDie(spec([]), 20, 1);
		s = tapDie(s, 6, 1);
		expect(s.dice).toEqual([
			{ sides: 6, count: 1 },
			{ sides: 20, count: 1 },
		]);
		s = tapDie(s, 6, -1);
		expect(s.dice).toEqual([{ sides: 20, count: 1 }]);
	});

	it("the first tap in advantage mode gives a doubled pool", () => {
		const s = tapDie(spec([], "advantage"), 20, 1);
		expect(s.dice).toEqual([{ sides: 20, count: 2 }]);
		expect(tapDie(s, 20, 1).dice).toEqual([{ sides: 20, count: 3 }]);
	});

	it("tapping another die in advantage mode starts a new pool", () => {
		const s = tapDie(spec([[20, 4]], "advantage"), 6, 1);
		expect(s.dice).toEqual([{ sides: 6, count: 2 }]);
		// taking away a die that isn't in the pool does nothing
		const pool = spec([[20, 4]], "advantage");
		expect(tapDie(pool, 6, -1)).toBe(pool);
	});

	it("taking a pool below two dice empties it", () => {
		const s = tapDie(spec([[20, 3]], "disadvantage"), 20, -1);
		expect(s.dice).toEqual([{ sides: 20, count: 2 }]);
		expect(tapDie(s, 20, -1).dice).toEqual([]);
		expect(tapDie(s, 20, -1).mode).toBe("disadvantage");
	});

	it("a pool keeps only the highest or lowest die of all of them", () => {
		const r = evaluate(spec([[20, 4]], "advantage"), { 20: [3, 17, 9, 11] });
		expect(r.total).toBe(17);
		expect(r.groups[0].kept).toEqual([1]);
		expect(
			evaluate(spec([[20, 4]], "disadvantage"), { 20: [3, 17, 9, 11] }).total,
		).toBe(3);
	});
});
