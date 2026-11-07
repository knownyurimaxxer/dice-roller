/**
 * The shape of every die, as plain data: vertices, faces, what number is on
 * each face and the triangles to draw. No React, no GL, no physics, so it can
 * be tested (and previewed) on its own.
 *
 * Physical shapes:
 *   d2 = a coin, d3 = a cube whose opposite faces carry the same number,
 *   d4 / d6 / d8 / d12 / d20 = the platonic solids,
 *   d10 / d14 / d16 / d18 = trapezohedra (kite faces), d100 = two d10s.
 *
 * Faces are listed counter-clockwise seen from outside, so their normals
 * point away from the die.
 */
import { textTriangles, textWidth } from "./digits";

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [
	a[0] + b[0],
	a[1] + b[1],
	a[2] + b[2],
];
export const sub = (a: V3, b: V3): V3 => [
	a[0] - b[0],
	a[1] - b[1],
	a[2] - b[2],
];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [
	a[1] * b[2] - a[2] * b[1],
	a[2] * b[0] - a[0] * b[2],
	a[0] * b[1] - a[1] * b[0],
];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
	const l = len(a) || 1;
	return [a[0] / l, a[1] / l, a[2] / l];
};

export type PhysicalKind =
	"coin" | "d4" | "d6" | "d8" | "d10" | "d12" | "d14" | "d16" | "d18" | "d20";

/** The kind of body that is thrown for a die with this many sides. */
export function physicalKind(sides: number): PhysicalKind {
	if (sides === 2) return "coin";
	if (sides === 3) return "d6";
	if (sides === 100) return "d10";
	return `d${sides}` as PhysicalKind;
}

/** Distance from the center to the farthest corner, in world units. */
export const RADIUS: Record<PhysicalKind, number> = {
	coin: 0.95,
	d4: 1.15,
	d6: 1.15,
	d8: 1.05,
	d10: 1.05,
	d12: 1.05,
	d14: 1.05,
	d16: 1.05,
	d18: 1.05,
	d20: 1.1,
};

export type Face = {
	/** Vertex numbers, counter-clockwise seen from outside. */
	indices: number[];
	normal: V3;
	/** Middle of the face (its area centroid). */
	center: V3;
	/** Distance from the middle to the nearest edge. */
	inradius: number;
	/** Unit vector in the face plane that the number's "up" points to. */
	up: V3;
};

export type Geometry = {
	kind: PhysicalKind;
	vertices: V3[];
	faces: Face[];
	radius: number;
};

/* ---------- building blocks ---------- */

/** Newell's method: normal of a (planar, convex) polygon, not normalized. */
function newell(pts: V3[]): V3 {
	let x = 0;
	let y = 0;
	let z = 0;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		x += (a[1] - b[1]) * (a[2] + b[2]);
		y += (a[2] - b[2]) * (a[0] + b[0]);
		z += (a[0] - b[0]) * (a[1] + b[1]);
	}
	return [x, y, z];
}

/** Orders vertex numbers cyclically around an axis. */
function sortCyclic(indices: number[], verts: V3[], axis: V3): number[] {
	const pts = indices.map((i) => verts[i]);
	const c = mul(
		pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3),
		1 / pts.length,
	);
	const a = norm(axis);
	const helper: V3 = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
	const u = norm(cross(a, helper));
	const w = cross(a, u);
	return [...indices].sort((i, j) => {
		const pi = sub(verts[i], c);
		const pj = sub(verts[j], c);
		return (
			Math.atan2(dot(pi, w), dot(pi, u)) - Math.atan2(dot(pj, w), dot(pj, u))
		);
	});
}

/** Reverses any face that is wound clockwise seen from outside. */
function orient(verts: V3[], faces: number[][]): number[][] {
	const centroid = mul(
		verts.reduce((s, p) => add(s, p), [0, 0, 0] as V3),
		1 / verts.length,
	);
	return faces.map((f) => {
		const pts = f.map((i) => verts[i]);
		const mid = mul(
			pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3),
			1 / pts.length,
		);
		return dot(newell(pts), sub(mid, centroid)) >= 0 ? f : [...f].reverse();
	});
}

type Raw = { vertices: V3[]; faces: number[][]; upMode: "vertex" | "edge" };

function tetrahedron(): Raw {
	const vertices: V3[] = [
		[1, 1, 1],
		[1, -1, -1],
		[-1, 1, -1],
		[-1, -1, 1],
	];
	// Face f is the one opposite vertex f.
	const faces = [0, 1, 2, 3].map((f) => [0, 1, 2, 3].filter((i) => i !== f));
	return { vertices, faces, upMode: "vertex" };
}

function cube(): Raw {
	const vertices: V3[] = [];
	for (const x of [-1, 1])
		for (const y of [-1, 1]) for (const z of [-1, 1]) vertices.push([x, y, z]);
	const faces: number[][] = [];
	for (let axis = 0; axis < 3; axis++)
		for (const s of [-1, 1]) {
			const idx = vertices
				.map((v, i) => (v[axis] === s ? i : -1))
				.filter((i) => i >= 0);
			const a: V3 = [0, 0, 0];
			a[axis] = s;
			faces.push(sortCyclic(idx, vertices, a));
		}
	return { vertices, faces, upMode: "edge" };
}

function octahedron(): Raw {
	const vertices: V3[] = [
		[1, 0, 0],
		[-1, 0, 0],
		[0, 1, 0],
		[0, -1, 0],
		[0, 0, 1],
		[0, 0, -1],
	];
	const faces: number[][] = [];
	for (const sx of [1, -1])
		for (const sy of [1, -1])
			for (const sz of [1, -1])
				faces.push([sx > 0 ? 0 : 1, sy > 0 ? 2 : 3, sz > 0 ? 4 : 5]);
	return { vertices, faces, upMode: "vertex" };
}

function icosahedron(): { vertices: V3[]; faces: number[][] } {
	const p = (1 + Math.sqrt(5)) / 2;
	const vertices: V3[] = [];
	for (const a of [-1, 1])
		for (const b of [-1, 1]) {
			vertices.push([0, a, b * p], [a, b * p, 0], [b * p, 0, a]);
		}
	const near = (i: number, j: number) =>
		Math.abs(len(sub(vertices[i], vertices[j])) - 2) < 1e-6;
	const faces: number[][] = [];
	for (let i = 0; i < 12; i++)
		for (let j = i + 1; j < 12; j++)
			for (let k = j + 1; k < 12; k++)
				if (near(i, j) && near(j, k) && near(i, k)) faces.push([i, j, k]);
	return { vertices, faces };
}

function dodecahedron(): Raw {
	const ico = icosahedron();
	const vertices = ico.faces.map((f) =>
		norm(
			mul(
				f.reduce((s, i) => add(s, ico.vertices[i]), [0, 0, 0] as V3),
				1 / 3,
			),
		),
	);
	const faces: number[][] = [];
	for (let v = 0; v < ico.vertices.length; v++) {
		const around = ico.faces
			.map((f, j) => (f.includes(v) ? j : -1))
			.filter((j) => j >= 0);
		faces.push(sortCyclic(around, vertices, ico.vertices[v]));
	}
	return { vertices, faces, upMode: "edge" };
}

/** A flat cylinder: a coin. Faces 0 and 1 are the two sides (heads, tails). */
function coin(): Raw {
	const n = 24;
	const t = 0.13;
	const vertices: V3[] = [];
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2;
		vertices.push([Math.cos(a), t, Math.sin(a)]);
	}
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2;
		vertices.push([Math.cos(a), -t, Math.sin(a)]);
	}
	const top = Array.from({ length: n }, (_, i) => i);
	const bottom = Array.from({ length: n }, (_, i) => n + i);
	const faces = [top, bottom];
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		faces.push([i, j, n + j, n + i]);
	}
	return { vertices, faces, upMode: "edge" };
}

/**
 * The die with 2n kite faces (n = 5: d10, 7: d14, 8: d16, 9: d18). The poles
 * sit at height `pole`; the zigzag belt in between has its corners at the
 * height that makes every kite flat.
 */
function trapezohedron(n: number): Raw {
	const pole = 0.92;
	const c = Math.cos(Math.PI / n);
	const a = (pole * (1 - c)) / (1 + c);
	const vertices: V3[] = [
		[0, pole, 0],
		[0, -pole, 0],
	];
	for (let k = 0; k < n; k++) {
		const t = (2 * Math.PI * k) / n;
		vertices.push([Math.cos(t), a, Math.sin(t)]);
	}
	for (let k = 0; k < n; k++) {
		const t = (2 * Math.PI * (k + 0.5)) / n;
		vertices.push([Math.cos(t), -a, Math.sin(t)]);
	}
	const U = (k: number) => 2 + (k % n);
	const L = (k: number) => 2 + n + (k % n);
	const faces: number[][] = [];
	for (let k = 0; k < n; k++) faces.push([0, U(k), L(k), U(k + 1)]);
	for (let k = 0; k < n; k++) faces.push([1, L(k), U(k + 1), L(k + 1)]);
	return { vertices, faces, upMode: "vertex" };
}

function rawShape(kind: PhysicalKind): Raw {
	switch (kind) {
		case "coin":
			return coin();
		case "d4":
			return tetrahedron();
		case "d6":
			return cube();
		case "d8":
			return octahedron();
		case "d12":
			return dodecahedron();
		case "d20": {
			const ico = icosahedron();
			return { ...ico, upMode: "vertex" };
		}
		case "d10":
			return trapezohedron(5);
		case "d14":
			return trapezohedron(7);
		case "d16":
			return trapezohedron(8);
		case "d18":
			return trapezohedron(9);
	}
}

const cache = new Map<PhysicalKind, Geometry>();

/** The geometry of a kind of die, centered on the origin. */
export function buildGeometry(kind: PhysicalKind): Geometry {
	const hit = cache.get(kind);
	if (hit) return hit;
	const raw = rawShape(kind);
	const biggest = Math.max(...raw.vertices.map(len));
	const radius = RADIUS[kind];
	const vertices = raw.vertices.map((v) => mul(v, radius / biggest));
	const oriented = orient(vertices, raw.faces);
	const faces: Face[] = oriented.map((indices) => {
		const pts = indices.map((i) => vertices[i]);
		const normal = norm(newell(pts));
		// Area centroid, by fanning the polygon into triangles.
		let area = 0;
		let c: V3 = [0, 0, 0];
		for (let i = 1; i + 1 < pts.length; i++) {
			const a = len(cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0]))) / 2;
			c = add(c, mul(add(add(pts[0], pts[i]), pts[i + 1]), a / 3));
			area += a;
		}
		const center = mul(c, 1 / (area || 1));
		let inradius = Infinity;
		for (let i = 0; i < pts.length; i++) {
			const a = pts[i];
			const b = pts[(i + 1) % pts.length];
			const edge = sub(b, a);
			inradius = Math.min(
				inradius,
				len(cross(sub(center, a), edge)) / (len(edge) || 1),
			);
		}
		const target =
			raw.upMode === "edge" ? mul(add(pts[0], pts[1]), 0.5) : pts[0];
		const upRaw = sub(target, center);
		const up = norm(sub(upRaw, mul(normal, dot(upRaw, normal))));
		return { indices, normal, center, inradius, up };
	});
	const geometry = { kind, vertices, faces, radius };
	cache.set(kind, geometry);
	return geometry;
}

/** The face that looks most nearly opposite to face `i` (its "other side"). */
export function partnerFace(g: Geometry, i: number, taken: boolean[]): number {
	let best = -1;
	let bestDot = -Infinity;
	for (let j = 0; j < g.faces.length; j++) {
		if (j === i || taken[j]) continue;
		const d = -dot(g.faces[i].normal, g.faces[j].normal);
		if (d > bestDot + 1e-9) {
			bestDot = d;
			best = j;
		}
	}
	return best;
}

/**
 * The number on each face (null = a face that never counts, like a coin's
 * edge). Opposite faces add up to sides + 1 (a d3's opposite faces share a
 * number; a d4's numbers sit on its corners, see `cornerLabels`).
 */
export function faceValues(g: Geometry, sides: number): (number | null)[] {
	const n = g.faces.length;
	if (g.kind === "coin")
		return g.faces.map((_, i) => (i === 0 ? 1 : i === 1 ? 2 : null));
	if (g.kind === "d4") return g.faces.map((_, i) => i + 1);
	const values: (number | null)[] = new Array(n).fill(null);
	const taken: boolean[] = new Array(n).fill(false);
	// A d100 is two d10s, which count 1..10 like a plain d10.
	const top = sides === 3 ? 3 : n;
	let next = 1;
	for (let i = 0; i < n; i++) {
		if (taken[i]) continue;
		taken[i] = true;
		const j = partnerFace(g, i, taken);
		if (j < 0) {
			values[i] = next++;
			continue;
		}
		taken[j] = true;
		if (sides === 3) {
			values[i] = next;
			values[j] = next;
		} else {
			values[i] = next;
			values[j] = top + 1 - next;
		}
		next++;
	}
	return values;
}

/* ---------- reading the result ---------- */

export type Quat = { x: number; y: number; z: number; w: number };

export function rotate(q: Quat, v: V3): V3 {
	// v' = v + 2w(q×v) + 2 q×(q×v)
	const qv: V3 = [q.x, q.y, q.z];
	const t = mul(cross(qv, v), 2);
	return add(add(v, mul(t, q.w)), cross(qv, t));
}

/**
 * Which face counts once the die lies still, given how it is turned.
 * Most dice read the face on top; a d4 reads the corner on top, which is the
 * one opposite the face lying on the board.
 * `flat` is 1 when that face is perfectly level and drops as the die leans.
 */
export function readFace(
	g: Geometry,
	values: (number | null)[],
	q: Quat,
): { face: number; value: number; flat: number } {
	const bottomUp = g.kind === "d4";
	let best = -1;
	let bestY = bottomUp ? Infinity : -Infinity;
	let bestFlat = 0;
	g.faces.forEach((f, i) => {
		if (values[i] === null) return;
		const y = rotate(q, f.normal)[1];
		if (bottomUp ? y < bestY : y > bestY) {
			bestY = y;
			best = i;
			bestFlat = Math.abs(y);
		}
	});
	return { face: best, value: values[best] as number, flat: bestFlat };
}

/* ---------- numbers on the faces ---------- */

export type Label = {
	text: string;
	/** Position in the face's own axes, from its middle. */
	x: number;
	y: number;
	/** Turn of the text around the face's normal, counter-clockwise (radians). */
	angle: number;
	/** Height of the digits. */
	height: number;
};

export type LabelRole = "plain" | "tens" | "units";

export function valueText(
	sides: number,
	role: LabelRole,
	value: number,
): string {
	if (role === "tens") return String((value % 10) * 10).padStart(2, "0");
	if (role === "units" || sides === 10) return String(value % 10);
	return String(value);
}

/** Face axes: ey = up, ex = right, seen from outside. */
export function faceAxes(f: Face): { ex: V3; ey: V3 } {
	const ey = f.up;
	return { ex: cross(ey, f.normal), ey };
}

export function buildLabels(
	g: Geometry,
	sides: number,
	role: LabelRole,
): Label[][] {
	const values = faceValues(g, sides);
	return g.faces.map((f, i) => {
		const value = values[i];
		if (value === null) return [];
		if (g.kind === "d4") {
			// A number in each corner, standing on the corner it names.
			const { ex, ey } = faceAxes(f);
			return f.indices.map((vi) => {
				const d = sub(g.vertices[vi], f.center);
				const x = dot(d, ex);
				const y = dot(d, ey);
				return {
					text: String(vi + 1),
					x: x * 0.55,
					y: y * 0.55,
					angle: Math.atan2(-x, y),
					height: f.inradius * 0.62,
				};
			});
		}
		const text = valueText(sides, role, value);
		const room = f.inradius * (g.kind === "coin" ? 0.8 : 0.95);
		const fit = (1.5 * f.inradius) / (textWidth(text, 1) || 1); // keep wide numbers on the face
		return [{ text, x: 0, y: 0, angle: 0, height: Math.min(room, fit) }];
	});
}

/* ---------- the triangles to draw ---------- */

export type Mesh = {
	positions: number[];
	normals: number[];
	colors: number[];
	indices: number[];
	/** The first indices draw the die's body; the numbers come after. */
	bodyIndexCount: number;
};

export type RGB = [number, number, number];

export function buildMesh(
	g: Geometry,
	labels: Label[][],
	body: RGB,
	ink: RGB,
): Mesh {
	const m: Mesh = {
		positions: [],
		normals: [],
		colors: [],
		indices: [],
		bodyIndexCount: 0,
	};
	const vertex = (p: V3, n: V3, c: RGB) => {
		m.positions.push(p[0], p[1], p[2]);
		m.normals.push(n[0], n[1], n[2]);
		m.colors.push(c[0], c[1], c[2]);
		return m.positions.length / 3 - 1;
	};
	for (const f of g.faces) {
		const first = vertex(g.vertices[f.indices[0]], f.normal, body);
		let prev = vertex(g.vertices[f.indices[1]], f.normal, body);
		for (let i = 2; i < f.indices.length; i++) {
			const cur = vertex(g.vertices[f.indices[i]], f.normal, body);
			m.indices.push(first, prev, cur);
			prev = cur;
		}
	}
	m.bodyIndexCount = m.indices.length;
	const lift = g.radius * 0.02; // numbers float a hair above the face
	g.faces.forEach((f, i) => {
		const { ex, ey } = faceAxes(f);
		const base = add(f.center, mul(f.normal, lift));
		for (const label of labels[i] ?? []) {
			const cos = Math.cos(label.angle);
			const sin = Math.sin(label.angle);
			const place = (x: number, y: number): V3 => {
				const lx = label.x + x * cos - y * sin;
				const ly = label.y + x * sin + y * cos;
				return add(base, add(mul(ex, lx), mul(ey, ly)));
			};
			for (const tri of textTriangles(label.text, label.height)) {
				const ids = tri.map(([x, y]) => vertex(place(x, y), f.normal, ink));
				m.indices.push(ids[0], ids[1], ids[2]);
			}
		}
	});
	return m;
}

/** "#RRGGBB" as 0..1 floats. */
export function hexToRgb(hex: string): RGB {
	const h = hex.replace("#", "");
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
}
