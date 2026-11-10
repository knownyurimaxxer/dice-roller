/**
 * The floor the dice land on: one big flat slab, the same color as the
 * background, so the screen itself looks like the board. Same triangle
 * format as the dice meshes.
 */
import type { Mesh, RGB, V3 } from "./geometry";

const REACH = 150; // far beyond anything the camera can see

function addBox(m: Mesh, lo: V3, hi: V3, color: RGB) {
	for (let a = 0; a < 3; a++)
		for (const s of [1, -1]) {
			const b = (a + 1) % 3;
			const c = (a + 2) % 3;
			const n: V3 = [0, 0, 0];
			n[a] = s;
			const at = s > 0 ? hi[a] : lo[a];
			// Corners in counter-clockwise order seen from outside.
			const bc: [number, number][] = [
				[lo[b], lo[c]],
				[hi[b], lo[c]],
				[hi[b], hi[c]],
				[lo[b], hi[c]],
			];
			if (s < 0) bc.reverse();
			const first = m.positions.length / 3;
			for (const [pb, pc] of bc) {
				const p: V3 = [0, 0, 0];
				p[a] = at;
				p[b] = pb;
				p[c] = pc;
				m.positions.push(p[0], p[1], p[2]);
				m.normals.push(n[0], n[1], n[2]);
				m.colors.push(color[0], color[1], color[2]);
				m.uvs.push(0, 0);
			}
			m.indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
		}
}

/** The floor, with its top at y = 0. */
export function buildFloorMesh(color: RGB): Mesh {
	const m: Mesh = {
		positions: [],
		normals: [],
		colors: [],
		uvs: [],
		indices: [],
		bodyIndexCount: 0,
	};
	addBox(m, [-REACH, -0.6, -REACH], [REACH, 0, REACH], color);
	m.bodyIndexCount = m.indices.length;
	return m;
}
