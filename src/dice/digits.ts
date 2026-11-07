/**
 * A tiny stroke font for the numbers on the dice (0-9). The dice are drawn
 * with raw WebGL, which has no text, so each digit is a few thick line
 * segments turned into triangles. Plain TypeScript, no dependencies.
 */
export type P2 = [number, number];

// Every digit is drawn in a box 1 wide and 1 high, origin at the bottom left.
const FLIP = (pts: P2[]): P2[] => pts.map(([x, y]) => [1 - x, 1 - y]);
const SIX: P2[] = [
	[0.9, 0.95],
	[0.5, 1],
	[0.1, 0.85],
	[0, 0.5],
	[0, 0.2],
	[0.2, 0.02],
	[0.6, 0],
	[0.95, 0.15],
	[1, 0.35],
	[0.9, 0.52],
	[0.5, 0.6],
	[0.1, 0.5],
];

export const DIGIT_STROKES: Record<string, P2[][]> = {
	"0": [
		[
			[0.15, 0],
			[0.85, 0],
			[1, 0.15],
			[1, 0.85],
			[0.85, 1],
			[0.15, 1],
			[0, 0.85],
			[0, 0.15],
			[0.15, 0],
		],
	],
	"1": [
		[
			[0.15, 0.78],
			[0.55, 1],
			[0.55, 0],
		],
	],
	"2": [
		[
			[0, 0.8],
			[0.15, 0.95],
			[0.5, 1],
			[0.85, 0.95],
			[1, 0.8],
			[1, 0.65],
			[0, 0],
			[1, 0],
		],
	],
	"3": [
		[
			[0, 0.95],
			[0.5, 1],
			[0.9, 0.9],
			[1, 0.75],
			[0.9, 0.6],
			[0.45, 0.52],
			[0.9, 0.44],
			[1, 0.28],
			[0.9, 0.1],
			[0.5, 0],
			[0, 0.05],
		],
	],
	"4": [
		[
			[0.75, 0],
			[0.75, 1],
			[0, 0.3],
			[1, 0.3],
		],
	],
	"5": [
		[
			[0.95, 1],
			[0.1, 1],
			[0.05, 0.55],
			[0.5, 0.62],
			[0.9, 0.55],
			[1, 0.35],
			[0.9, 0.1],
			[0.5, 0],
			[0, 0.08],
		],
	],
	"6": [SIX],
	"7": [
		[
			[0, 1],
			[1, 1],
			[0.35, 0],
		],
	],
	"8": [
		[
			[0.5, 0.52],
			[0.1, 0.62],
			[0.05, 0.85],
			[0.3, 1],
			[0.7, 1],
			[0.95, 0.85],
			[0.9, 0.62],
			[0.5, 0.52],
			[0.05, 0.38],
			[0, 0.15],
			[0.3, 0],
			[0.7, 0],
			[1, 0.15],
			[0.95, 0.38],
			[0.5, 0.52],
		],
	],
	"9": [FLIP(SIX)],
};

/** 6 and 9 get an underline so they can't be mistaken for each other. */
const UNDERLINE: P2[] = [
	[0.1, -0.2],
	[0.9, -0.2],
];

const DIGIT_W = 0.62; // digit width / height
const GAP = 0.2; // space between digits / height
const STROKE = 0.15; // stroke width / height

/** Width of a text drawn with `height`. */
export function textWidth(text: string, height: number): number {
	const n = text.length;
	return n === 0 ? 0 : (n * DIGIT_W + (n - 1) * GAP) * height;
}

const area2 = (a: P2, b: P2, c: P2) =>
	(b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

/**
 * The text as flat triangles in 2D, centered on the origin and facing the
 * viewer (counter-clockwise). Returns a list of [a, b, c] points.
 */
export function textTriangles(text: string, height: number): [P2, P2, P2][] {
	const tris: [P2, P2, P2][] = [];
	const push = (a: P2, b: P2, c: P2) =>
		tris.push(area2(a, b, c) >= 0 ? [a, b, c] : [a, c, b]);
	const tw = STROKE * height;
	const total = textWidth(text, height);
	let x0 = -total / 2;
	for (const ch of text) {
		const strokes = DIGIT_STROKES[ch];
		if (strokes) {
			const lines = [...strokes];
			if (ch === "6" || ch === "9") lines.push(UNDERLINE);
			const map = ([x, y]: P2): P2 => [
				x0 + x * DIGIT_W * height,
				(y - 0.5) * height,
			];
			for (const line of lines) {
				const pts = line.map(map);
				for (let i = 0; i + 1 < pts.length; i++) {
					const p = pts[i];
					const q = pts[i + 1];
					const dx = q[0] - p[0];
					const dy = q[1] - p[1];
					const len = Math.hypot(dx, dy) || 1;
					const mx = (-dy / len) * (tw / 2);
					const my = (dx / len) * (tw / 2);
					const a: P2 = [p[0] + mx, p[1] + my];
					const b: P2 = [p[0] - mx, p[1] - my];
					const c: P2 = [q[0] - mx, q[1] - my];
					const d: P2 = [q[0] + mx, q[1] + my];
					push(a, b, c);
					push(a, c, d);
				}
				// A small hexagon on every joint keeps the corners closed.
				for (const p of pts) {
					for (let k = 0; k < 6; k++) {
						const a0 = (k / 6) * Math.PI * 2;
						const a1 = ((k + 1) / 6) * Math.PI * 2;
						push(
							p,
							[p[0] + Math.cos(a0) * (tw / 2), p[1] + Math.sin(a0) * (tw / 2)],
							[p[0] + Math.cos(a1) * (tw / 2), p[1] + Math.sin(a1) * (tw / 2)],
						);
					}
				}
			}
		}
		x0 += (DIGIT_W + GAP) * height;
	}
	return tris;
}
