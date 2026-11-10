import { describe, expect, it } from "vitest";
import { DICE_FONTS } from "../src/dice/fonts";
import {
	buildGeometry,
	buildLabels,
	buildMesh,
	segmentOf,
	cross,
	dot,
	faceValues,
	len,
	partnerFace,
	physicalKind,
	RADIUS,
	readFace,
	rotate,
	sub,
	valueText,
	type LabelRole,
	type PhysicalKind,
} from "../src/dice/geometry";

const KINDS: PhysicalKind[] = [
	"coin",
	"d4",
	"d6",
	"d8",
	"d10",
	"d12",
	"d14",
	"d16",
	"d18",
	"d20",
];
const FACES: Record<PhysicalKind, number> = {
	coin: 26,
	d4: 4,
	d6: 6,
	d8: 8,
	d10: 10,
	d12: 12,
	d14: 14,
	d16: 16,
	d18: 18,
	d20: 20,
};
const SIDES: Record<PhysicalKind, number> = {
	coin: 2,
	d4: 4,
	d6: 6,
	d8: 8,
	d10: 10,
	d12: 12,
	d14: 14,
	d16: 16,
	d18: 18,
	d20: 20,
};
const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };

describe("physicalKind", () => {
	it("maps every die to a body", () => {
		expect(physicalKind(2)).toBe("coin");
		expect(physicalKind(3)).toBe("d6");
		expect(physicalKind(100)).toBe("d10");
		expect(physicalKind(20)).toBe("d20");
		expect(physicalKind(14)).toBe("d14");
	});
});

describe.each(KINDS)("%s geometry", (kind) => {
	const g = buildGeometry(kind);

	it("has the right number of faces", () => {
		expect(g.faces).toHaveLength(FACES[kind]);
	});

	it("is a closed solid (Euler: V - E + F = 2)", () => {
		const edges = new Set<string>();
		for (const f of g.faces)
			f.indices.forEach((a, i) => {
				const b = f.indices[(i + 1) % f.indices.length];
				edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
			});
		expect(g.vertices.length - edges.size + g.faces.length).toBe(2);
	});

	it("has flat faces whose normals point outward", () => {
		for (const f of g.faces) {
			for (const i of f.indices)
				expect(
					Math.abs(dot(f.normal, sub(g.vertices[i], g.vertices[f.indices[0]]))),
				).toBeLessThan(1e-9);
			expect(dot(f.normal, f.center)).toBeGreaterThan(0);
			expect(Math.abs(len(f.normal) - 1)).toBeLessThan(1e-9);
		}
	});

	it("is convex (no vertex is in front of any face)", () => {
		for (const f of g.faces)
			for (const v of g.vertices)
				expect(dot(f.normal, sub(v, f.center))).toBeLessThan(1e-9);
	});

	it("is centered and has the size it is meant to have", () => {
		const farthest = Math.max(...g.vertices.map(len));
		expect(Math.abs(farthest - RADIUS[kind])).toBeLessThan(1e-9);
		const mean = g.vertices.reduce((s, v) => s + v[1], 0) / g.vertices.length;
		expect(Math.abs(mean)).toBeLessThan(1e-9);
	});

	it("can lie on every counted face (its center of mass is over the face)", () => {
		for (const f of g.faces) {
			if (kind === "coin" && f.indices.length === 4) continue; // the rim: a coin balanced on its edge
			const foot: [number, number, number] = [
				f.normal[0] * dot(f.normal, f.center),
				f.normal[1] * dot(f.normal, f.center),
				f.normal[2] * dot(f.normal, f.center),
			];
			f.indices.forEach((vi, i) => {
				const a = g.vertices[vi];
				const b = g.vertices[f.indices[(i + 1) % f.indices.length]];
				// counter-clockwise from outside: the foot is on the inner side of every edge
				expect(dot(cross(sub(b, a), sub(foot, a)), f.normal)).toBeGreaterThan(
					-1e-9,
				);
			});
		}
	});

	it("has an 'up' on every face that lies in the face and is unit length", () => {
		for (const f of g.faces) {
			expect(Math.abs(dot(f.up, f.normal))).toBeLessThan(1e-9);
			expect(Math.abs(len(f.up) - 1)).toBeLessThan(1e-9);
			expect(Math.abs(len(cross(f.up, f.normal)) - 1)).toBeLessThan(1e-9);
			expect(f.inradius).toBeGreaterThan(0);
		}
	});
});

describe("face numbers", () => {
	for (const kind of KINDS.filter((k) => k !== "coin" && k !== "d4")) {
		it(`${kind}: every number 1..N appears once, and opposite faces add up to N + 1`, () => {
			const g = buildGeometry(kind);
			const n = SIDES[kind];
			const values = faceValues(g, n) as number[];
			expect([...values].sort((a, b) => a - b)).toEqual(
				Array.from({ length: n }, (_, i) => i + 1),
			);
			// Odd trapezohedra (d10, d14, d18) and the platonic solids have an exact
			// opposite face; the d16 has no exact one, so only check the others.
			if (kind === "d16") return;
			const taken = g.faces.map(() => false);
			g.faces.forEach((_, i) => {
				const j = partnerFace(g, i, taken);
				expect(dot(g.faces[i].normal, g.faces[j].normal)).toBeLessThan(-0.99);
				expect(values[i] + values[j]).toBe(n + 1);
			});
		});
	}

	it("d3: opposite faces of the cube carry the same number", () => {
		const g = buildGeometry("d6");
		const values = faceValues(g, 3) as number[];
		expect([...values].sort()).toEqual([1, 1, 2, 2, 3, 3]);
		const taken = g.faces.map(() => false);
		g.faces.forEach((_, i) => {
			const j = partnerFace(g, i, taken);
			expect(values[i]).toBe(values[j]);
		});
	});

	it("coin: heads and tails are the flat sides, the edge never counts", () => {
		const values = faceValues(buildGeometry("coin"), 2);
		expect(values.slice(0, 2)).toEqual([1, 2]);
		expect(values.slice(2).every((v) => v === null)).toBe(true);
	});

	it("d4: a number per corner (face i is opposite corner i)", () => {
		const g = buildGeometry("d4");
		expect(faceValues(g, 4)).toEqual([1, 2, 3, 4]);
		g.faces.forEach((f, i) => {
			// the face opposite corner i does not contain vertex i
			expect(f.indices.includes(i)).toBe(false);
		});
	});

	it("shows the numbers the way dice do", () => {
		expect(valueText(10, "plain", 10)).toBe("0"); // a d10 has a 0, not a 10
		expect(valueText(10, "plain", 7)).toBe("7");
		expect(valueText(20, "plain", 20)).toBe("20");
		expect(valueText(100, "tens", 10)).toBe("00");
		expect(valueText(100, "tens", 6)).toBe("60");
		expect(valueText(100, "units", 10)).toBe("0");
		expect(valueText(100, "units", 4)).toBe("4");
	});
});

describe("readFace", () => {
	it("reads the face on top", () => {
		const g = buildGeometry("d6");
		const values = faceValues(g, 6);
		// Turn the die so that each face in turn looks up: the value read is that face's.
		g.faces.forEach((f, i) => {
			// rotation taking the face normal to +y: axis = n × y, angle = angle between
			const up: [number, number, number] = [0, 1, 0];
			const axis = cross(f.normal, up);
			const l = len(axis);
			const angle = Math.atan2(l, dot(f.normal, up));
			const k =
				l < 1e-9
					? ([1, 0, 0] as const)
					: ([axis[0] / l, axis[1] / l, axis[2] / l] as const);
			const s = Math.sin(angle / 2);
			const q = {
				x: k[0] * s,
				y: k[1] * s,
				z: k[2] * s,
				w: Math.cos(angle / 2),
			};
			const r = readFace(g, values, q);
			expect(r.value).toBe(values[i]);
			expect(r.flat).toBeGreaterThan(0.999);
		});
	});

	it("tells how flat the die lies", () => {
		const g = buildGeometry("d20");
		const r = readFace(g, faceValues(g, 20), IDENTITY);
		expect(r.flat).toBeGreaterThan(0);
		expect(r.flat).toBeLessThanOrEqual(1);
		// a d20 left in this pose leans: it is not lying on a face
		expect(r.flat).toBeLessThan(0.99);
	});

	it("reads a d4 by the corner that points up (the face down names it)", () => {
		const g = buildGeometry("d4");
		const values = faceValues(g, 4);
		// Put face 2 (opposite corner 2) on the bottom: corner 2, number 3, points up.
		const f = g.faces[2];
		const down: [number, number, number] = [0, -1, 0];
		const axis = cross(f.normal, down);
		const l = len(axis);
		const angle = Math.atan2(l, dot(f.normal, down));
		const k = [axis[0] / l, axis[1] / l, axis[2] / l];
		const s = Math.sin(angle / 2);
		const q = { x: k[0] * s, y: k[1] * s, z: k[2] * s, w: Math.cos(angle / 2) };
		expect(readFace(g, values, q).value).toBe(3);
		// and that corner really is the highest one
		const heights = g.vertices.map((v) => rotate(q, v)[1]);
		expect(heights.indexOf(Math.max(...heights))).toBe(2);
	});
});

describe("segmentOf", () => {
	it("reads the pieces left to right, then top to bottom", () => {
		// 6 pieces: 3 columns, 2 rows.
		const first = segmentOf(0, 6);
		const third = segmentOf(2, 6);
		const fourth = segmentOf(3, 6);
		expect(first.u).toBeCloseTo(1 / 6);
		expect(first.v).toBeCloseTo(1 / 4);
		expect(third.u).toBeCloseTo(5 / 6);
		expect(third.v).toBeCloseTo(1 / 4);
		expect(fourth.u).toBeCloseTo(1 / 6);
		expect(fourth.v).toBeCloseTo(3 / 4);
	});
	it("keeps a piece square on a square picture", () => {
		expect(segmentOf(0, 6).size).toBeCloseTo(1 / 3);
		expect(segmentOf(0, 20).size).toBeCloseTo(1 / 5);
		expect(segmentOf(0, 1).size).toBe(1);
	});
	it("stays inside the picture for any index", () => {
		for (const count of [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20])
			for (let i = -1; i <= count + 1; i++) {
				const c = segmentOf(i, count);
				expect(c.u - c.size / 2).toBeGreaterThanOrEqual(-1e-9);
				expect(c.u + c.size / 2).toBeLessThanOrEqual(1 + 1e-9);
				expect(c.v - c.size / 2).toBeGreaterThanOrEqual(-1e-9);
				expect(c.v + c.size / 2).toBeLessThanOrEqual(1 + 1e-9);
			}
	});
});

describe("buildMesh", () => {
	it("makes triangles that fit in 16-bit indices, with numbers drawn after the body", () => {
		for (const kind of KINDS) {
			const g = buildGeometry(kind);
			const m = buildMesh(
				g,
				buildLabels(g, SIDES[kind], "plain"),
				[1, 0, 0],
				[0, 0, 1],
			);
			const vertices = m.positions.length / 3;
			expect(vertices).toBeLessThan(65536);
			expect(m.normals).toHaveLength(m.positions.length);
			expect(m.colors).toHaveLength(m.positions.length);
			expect(m.uvs).toHaveLength((m.positions.length / 3) * 2);
			expect(m.indices.length % 3).toBe(0);
			expect(m.bodyIndexCount).toBeGreaterThan(0);
			expect(m.bodyIndexCount).toBeLessThanOrEqual(m.indices.length);
			expect(Math.max(...m.indices)).toBeLessThan(vertices);
		}
	});

	it("fits in 16-bit indices in every number font, for every kind of label", () => {
		for (const font of DICE_FONTS)
			for (const kind of KINDS) {
				const g = buildGeometry(kind);
				const roles: [number, LabelRole][] =
					kind === "d10"
						? [
								[10, "plain"],
								[100, "tens"],
								[100, "units"],
							]
						: [[SIDES[kind], "plain"]];
				for (const [sides, role] of roles) {
					const m = buildMesh(
						g,
						buildLabels(g, sides, role, font),
						[1, 0, 0],
						[0, 0, 1],
						font,
					);
					expect(m.positions.length / 3).toBeLessThan(65536);
				}
			}
	});

	it("lays a picture on every face, inside the picture's square", () => {
		for (const kind of KINDS) {
			const g = buildGeometry(kind);
			const m = buildMesh(
				g,
				buildLabels(g, SIDES[kind], "plain"),
				[1, 0, 0],
				[0, 0, 1],
			);
			const bodyVertices =
				Math.max(...m.indices.slice(0, m.bodyIndexCount)) + 1;
			for (let i = 0; i < bodyVertices * 2; i++) {
				expect(m.uvs[i]).toBeGreaterThanOrEqual(-1e-9);
				expect(m.uvs[i]).toBeLessThanOrEqual(1 + 1e-9);
			}
		}
	});

	it("cuts a picture into one piece per side, each piece in its own cell", () => {
		for (const kind of KINDS) {
			const g = buildGeometry(kind);
			const sides = SIDES[kind];
			const values = faceValues(g, sides);
			const m = buildMesh(
				g,
				buildLabels(g, sides, "plain"),
				[1, 0, 0],
				[0, 0, 1],
				undefined,
				values,
			);
			const count = Math.max(1, ...values.map((v) => v ?? 0));
			const cellsUsed = new Set<number>();
			let vertex = 0;
			g.faces.forEach((f, i) => {
				const cell = segmentOf(
					values[i] === null ? 0 : (values[i] as number) - 1,
					count,
				);
				const half = cell.size / 2;
				for (let k = 0; k < f.indices.length; k++, vertex++) {
					const u = m.uvs[vertex * 2];
					const v = m.uvs[vertex * 2 + 1];
					expect(u).toBeGreaterThanOrEqual(cell.u - half - 1e-9);
					expect(u).toBeLessThanOrEqual(cell.u + half + 1e-9);
					expect(v).toBeGreaterThanOrEqual(cell.v - half - 1e-9);
					expect(v).toBeLessThanOrEqual(cell.v + half + 1e-9);
				}
				cellsUsed.add(
					Math.round(cell.u * 1000) * 10000 + Math.round(cell.v * 1000),
				);
			});
			// Every piece is used by some face (a d3's opposite faces share one).
			expect(cellsUsed.size).toBe(count);
		}
	});

	it("keeps the whole picture on every face when the pieces are not asked for", () => {
		const g = buildGeometry("d6");
		const plain = buildMesh(
			g,
			buildLabels(g, 6, "plain"),
			[1, 0, 0],
			[0, 0, 1],
		);
		const none = buildMesh(
			g,
			buildLabels(g, 6, "plain"),
			[1, 0, 0],
			[0, 0, 1],
			undefined,
			null,
		);
		expect(none.uvs).toEqual(plain.uvs);
		// A cube face is a square: its corners sit at 0.5 +- 0.5/sqrt(2) on each axis.
		expect(Math.min(...plain.uvs.slice(0, 8))).toBeCloseTo(
			0.5 - Math.SQRT1_2 / 2,
		);
		expect(Math.max(...plain.uvs.slice(0, 8))).toBeCloseTo(
			0.5 + Math.SQRT1_2 / 2,
		);
	});

	it("draws no numbers on the edge of a coin", () => {
		const g = buildGeometry("coin");
		const labels = buildLabels(g, 2, "plain");
		expect(labels[0]).toHaveLength(1);
		expect(labels[1]).toHaveLength(1);
		expect(labels.slice(2).every((l) => l.length === 0)).toBe(true);
	});

	it("draws a number in each corner of every d4 face", () => {
		const g = buildGeometry("d4");
		for (const l of buildLabels(g, 4, "plain")) expect(l).toHaveLength(3);
	});

	it("draws numbers that point the right way (counter-clockwise seen from outside)", () => {
		const g = buildGeometry("d20");
		const m = buildMesh(g, buildLabels(g, 20, "plain"), [0, 0, 0], [1, 1, 1]);
		let bad = 0;
		for (let i = m.bodyIndexCount; i < m.indices.length; i += 3) {
			const p = [0, 1, 2].map((k) => {
				const v = m.indices[i + k] * 3;
				return [m.positions[v], m.positions[v + 1], m.positions[v + 2]] as [
					number,
					number,
					number,
				];
			});
			const n = cross(sub(p[1], p[0]), sub(p[2], p[0]));
			const nv = m.indices[i] * 3;
			const normal: [number, number, number] = [
				m.normals[nv],
				m.normals[nv + 1],
				m.normals[nv + 2],
			];
			if (dot(n, normal) <= 0) bad++;
		}
		expect(bad).toBe(0);
	});
});
