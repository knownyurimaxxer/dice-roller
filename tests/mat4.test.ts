import { describe, expect, it } from "vitest";
import {
	buildCamera,
	cameraFor,
	identity,
	lookAt,
	modelMatrix,
	multiply,
	perspective,
	shadowMatrix,
} from "../src/dice/mat4";

const apply = (m: number[], p: [number, number, number]) => [
	m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
	m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
	m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
	m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15],
];

describe("matrices", () => {
	it("multiplying by the identity changes nothing", () => {
		const m = modelMatrix(
			{ x: 0.1, y: 0.2, z: 0.3, w: Math.sqrt(1 - 0.14) },
			[1, 2, 3],
			1.5,
		);
		expect(multiply(identity(), m)).toEqual(m);
		expect(multiply(m, identity())).toEqual(m);
	});

	it("applies the right-hand matrix first", () => {
		const move = modelMatrix({ x: 0, y: 0, z: 0, w: 1 }, [10, 0, 0], 1);
		const grow = modelMatrix({ x: 0, y: 0, z: 0, w: 1 }, [0, 0, 0], 2);
		const [x] = apply(multiply(move, grow), [1, 0, 0]); // grow first: 2, then move: 12
		expect(x).toBeCloseTo(12, 9);
	});

	it("models a quarter turn around y", () => {
		const s = Math.SQRT1_2;
		const m = modelMatrix({ x: 0, y: s, z: 0, w: s }, [0, 0, 0], 1);
		const [x, y, z] = apply(m, [1, 0, 0]);
		expect(x).toBeCloseTo(0, 9);
		expect(y).toBeCloseTo(0, 9);
		expect(z).toBeCloseTo(-1, 9); // +x turns to -z (right-handed, around +y)
	});

	it("puts the eye at the origin of the view", () => {
		const v = lookAt([3, 4, 5], [0, 0, 0], [0, 1, 0]);
		const [x, y, z] = apply(v, [3, 4, 5]);
		expect(Math.hypot(x, y, z)).toBeLessThan(1e-9);
		// the target is straight ahead (-z), at the eye's distance
		const t = apply(v, [0, 0, 0]);
		expect(t[0]).toBeCloseTo(0, 9);
		expect(t[1]).toBeCloseTo(0, 9);
		expect(t[2]).toBeCloseTo(-Math.hypot(3, 4, 5), 9);
	});

	it("squashes onto the floor along the light", () => {
		const light: [number, number, number] = [-0.5, 1, 0.5];
		const m = shadowMatrix(light, 0.03);
		const p: [number, number, number] = [1, 2, 3];
		const [x, y, z, w] = apply(m, p);
		expect(w).toBeCloseTo(1, 9);
		expect(y).toBeCloseTo(0.03, 9);
		// the shadow is on the line from the point away from the light
		const t = (2 - 0.03) / light[1];
		expect(x).toBeCloseTo(1 - light[0] * t, 9);
		expect(z).toBeCloseTo(3 - light[2] * t, 9);
	});
});

describe("camera", () => {
	it("looks down at the floor from the near side", () => {
		const cam = buildCamera(1, 20);
		expect(cam.eye[0]).toBe(0);
		expect(cam.eye[1]).toBeGreaterThan(0);
		expect(cam.eye[2]).toBeGreaterThan(0);
		expect(Math.hypot(...cam.eye)).toBeCloseTo(20, 9);
	});

	it("keeps the dice's distance from the lens beyond the near plane", () => {
		// the highest a die gets is a few units; the lens is much farther than that
		const cam = cameraFor(0.46, 5.5);
		expect(cam.eye[1] - 8).toBeGreaterThan(4);
	});

	it("builds a perspective that keeps the aspect ratio", () => {
		const p = perspective(Math.PI / 2, 2, 1, 10);
		expect(p[5] / p[0]).toBeCloseTo(2, 9);
	});
});
