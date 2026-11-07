/**
 * From a roll to the physical dice that are thrown, and back from what the
 * dice show to the numbers of the roll. Plain TypeScript.
 */
import type { LabelRole } from "./geometry";
import type { DieSides, RollSpec } from "./roll";

export type Throw = {
	sides: DieSides;
	role: LabelRole;
	/** Which die of its kind this is (0 for the first d20, 1 for the second...). */
	slot: number;
};

/** One body per die, except a d100: a tens die and a units die. */
export function planThrow(spec: RollSpec): Throw[] {
	const out: Throw[] = [];
	for (const { sides, count } of spec.dice)
		for (let slot = 0; slot < count; slot++) {
			if (sides === 100) {
				out.push({ sides, role: "tens", slot });
				out.push({ sides, role: "units", slot });
			} else out.push({ sides, role: "plain", slot });
		}
	return out;
}

/**
 * `read[i]` is the number the i-th thrown body shows (1..N; a d10 shows 10 as
 * "0"). Returns what each die of each kind scored. A d100 is its tens die plus
 * its units die, and 00 + 0 counts as 100.
 */
export function collectValues(
	plan: Throw[],
	read: number[],
): Record<number, number[]> {
	const out: Record<number, number[]> = {};
	const tens: Record<number, number> = {};
	plan.forEach((t, i) => {
		const raw = read[i];
		if (t.sides === 100) {
			if (t.role === "tens") {
				tens[t.slot] = (raw % 10) * 10;
				return;
			}
			const v = (tens[t.slot] ?? 0) + (raw % 10);
			(out[100] ??= [])[t.slot] = v === 0 ? 100 : v;
			return;
		}
		(out[t.sides] ??= [])[t.slot] = raw;
	});
	return out;
}
