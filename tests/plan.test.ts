import { describe, expect, it } from "vitest";
import { collectValues, planThrow } from "../src/dice/plan";
import type { RollSpec } from "../src/dice/roll";

const spec = (dice: [number, number][]): RollSpec => ({
	dice: dice.map(([sides, count]) => ({ sides, count })) as RollSpec["dice"],
	mode: "regular",
	combine: "total",
});

describe("planThrow", () => {
	it("makes one body per die, in order", () => {
		const plan = planThrow(
			spec([
				[6, 2],
				[20, 1],
			]),
		);
		expect(plan.map((p) => `${p.sides}:${p.slot}`)).toEqual([
			"6:0",
			"6:1",
			"20:0",
		]);
		expect(plan.every((p) => p.role === "plain")).toBe(true);
	});

	it("makes a tens die and a units die for every d100", () => {
		const plan = planThrow(spec([[100, 2]]));
		expect(plan.map((p) => `${p.role}:${p.slot}`)).toEqual([
			"tens:0",
			"units:0",
			"tens:1",
			"units:1",
		]);
	});

	it("throws nothing for an empty roll", () => {
		expect(planThrow(spec([]))).toEqual([]);
	});
});

describe("collectValues", () => {
	it("hands each die's number to its kind", () => {
		const plan = planThrow(
			spec([
				[6, 2],
				[20, 1],
			]),
		);
		expect(collectValues(plan, [3, 5, 17])).toEqual({ 6: [3, 5], 20: [17] });
	});

	it("builds a d100 from its two dice (a d10 shows 10 as 0)", () => {
		const plan = planThrow(spec([[100, 1]]));
		expect(collectValues(plan, [5, 7])[100]).toEqual([57]); // 50 + 7
		expect(collectValues(plan, [10, 3])[100]).toEqual([3]); // 00 + 3
		expect(collectValues(plan, [4, 10])[100]).toEqual([40]); // 40 + 0
	});

	it("counts 00 and 0 as 100", () => {
		const plan = planThrow(spec([[100, 1]]));
		expect(collectValues(plan, [10, 10])[100]).toEqual([100]);
	});

	it("keeps several d100 apart", () => {
		const plan = planThrow(spec([[100, 2]]));
		expect(collectValues(plan, [2, 3, 9, 1])[100]).toEqual([23, 91]);
	});
});
