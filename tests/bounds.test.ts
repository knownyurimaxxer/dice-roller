import { describe, expect, it } from "vitest";
import {
	floorArea,
	floorBounds,
	NO_INSETS,
	sameBounds,
	wallsOf,
} from "../src/dice/bounds";
import { buildCamera, cameraFor, floorPoint, project } from "../src/dice/mat4";

const SHAPES = [
	["a tall phone", 0.46],
	["a square screen", 1],
	["a wide phone", 2.1],
] as const;

describe("floorPoint", () => {
	it("looks at the middle of the floor from the middle of the screen", () => {
		const p = floorPoint(buildCamera(0.5, 20), 0, 0);
		expect(p?.x).toBeCloseTo(0, 6);
		expect(p?.z).toBeCloseTo(0, 6);
	});

	it("is the inverse of projecting", () => {
		const cam = buildCamera(0.6, 25);
		for (const [nx, ny] of [
			[0.7, -0.5],
			[-0.3, 0.8],
			[0.9, 0.9],
			[-1, -1],
		]) {
			const p = floorPoint(cam, nx, ny);
			expect(p === null).toBe(false);
			const s = project(cam.viewProj, [p!.x, 0, p!.z]);
			expect(s.x).toBeCloseTo(nx, 6);
			expect(s.y).toBeCloseTo(ny, 6);
		}
	});

	it("finds nothing when looking at the sky", () => {
		// far above the top of the screen the line of sight rises above the horizon
		expect(floorPoint(buildCamera(1, 20), 0, 10)).toBe(null);
	});
});

describe.each(SHAPES)("%s", (_name, aspect) => {
	const cam = cameraFor(aspect, 5.5);

	it("shows a floor 11 wide at the middle, whatever the screen", () => {
		const right = floorPoint(cam, 1, 0)!;
		const left = floorPoint(cam, -1, 0)!;
		expect(right.x).toBeCloseTo(5.5, 6);
		expect(left.x).toBeCloseTo(-5.5, 6);
	});

	it("sees the floor at every corner and keeps the sky out of view", () => {
		for (const [x, y] of [
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1],
		])
			expect(floorPoint(cam, x, y) === null).toBe(false);
	});

	it("shows a trapezoid: wider at the top of the screen, nearer at the bottom", () => {
		const b = floorBounds(cam, NO_INSETS);
		expect(b.nearZ).toBeGreaterThan(0);
		expect(b.farZ).toBeLessThan(0);
		expect(b.farRight - b.farLeft).toBeGreaterThan(b.nearRight - b.nearLeft);
		expect(b.nearLeft).toBeCloseTo(-b.nearRight, 6);
		expect(b.farLeft).toBeCloseTo(-b.farRight, 6);
		expect(floorArea(b)).toBeGreaterThan(30);
	});

	it("shrinks when screen is kept clear for the header and the buttons", () => {
		const full = floorBounds(cam, NO_INSETS);
		const inset = floorBounds(cam, {
			top: 0.1,
			bottom: 0.05,
			left: 0.03,
			right: 0.03,
		});
		expect(inset.farZ).toBeGreaterThan(full.farZ);
		expect(inset.nearZ).toBeLessThan(full.nearZ);
		expect(inset.nearLeft).toBeGreaterThan(full.nearLeft);
		expect(inset.farRight).toBeLessThan(full.farRight);
		expect(floorArea(inset)).toBeLessThan(floorArea(full));
	});

	it("puts four walls around the floor, all facing in", () => {
		const b = floorBounds(cam, {
			top: 0.08,
			bottom: 0.03,
			left: 0.02,
			right: 0.02,
		});
		const walls = wallsOf(b, 0.4);
		expect(walls).toHaveLength(4);
		const middle = { x: 0, z: (b.nearZ + b.farZ) / 2 };
		for (const w of walls) {
			expect(Math.hypot(w.nx, w.nz)).toBeCloseTo(1, 9);
			expect((middle.x - w.x) * w.nx + (middle.z - w.z) * w.nz).toBeGreaterThan(
				0,
			);
		}
		// with no margin, the four corners of the floor lie on or inside every wall
		for (const w of wallsOf(b, 0))
			for (const [x, z] of [
				[b.nearLeft, b.nearZ],
				[b.nearRight, b.nearZ],
				[b.farLeft, b.farZ],
				[b.farRight, b.farZ],
			])
				expect((x - w.x) * w.nx + (z - w.z) * w.nz).toBeGreaterThan(-1e-9);
		// and a margin moves every wall inward by exactly that much
		walls.forEach((w, i) => {
			const bare = wallsOf(b, 0)[i];
			expect((w.x - bare.x) * w.nx + (w.z - bare.z) * w.nz).toBeCloseTo(0.4, 9);
		});
	});
});

describe("wallsOf", () => {
	it("makes square walls for a square floor", () => {
		const b = {
			nearZ: 5,
			farZ: -5,
			nearLeft: -4,
			nearRight: 4,
			farLeft: -4,
			farRight: 4,
		};
		const [left, right, bottom, top] = wallsOf(b, 0.5);
		expect(left.nx).toBeCloseTo(1, 9);
		expect(left.nz).toBeCloseTo(0, 9);
		expect(left.x).toBeCloseTo(-3.5, 9);
		expect(right.nx).toBeCloseTo(-1, 9);
		expect(right.nz).toBeCloseTo(0, 9);
		expect(right.x).toBeCloseTo(3.5, 9);
		expect(bottom.z).toBeCloseTo(4.5, 9);
		expect(bottom.nz).toBe(-1);
		expect(top.z).toBeCloseTo(-4.5, 9);
		expect(top.nz).toBe(1);
	});

	it("tilts the side walls to follow a trapezoid", () => {
		const b = {
			nearZ: 5,
			farZ: -5,
			nearLeft: -3,
			nearRight: 3,
			farLeft: -5,
			farRight: 5,
		};
		const [left, right] = wallsOf(b, 0);
		expect(left.nx).toBeGreaterThan(0);
		expect(left.nz).toBeLessThan(0); // the wall runs out toward the far corner, so it faces slightly that way
		expect(right.nx).toBeLessThan(0);
		expect(right.nx).toBeCloseTo(-left.nx, 9);
	});
});

describe("sameBounds", () => {
	it("tells whether the floor changed", () => {
		const b = {
			nearZ: 5,
			farZ: -5,
			nearLeft: -4,
			nearRight: 4,
			farLeft: -4,
			farRight: 4,
		};
		expect(sameBounds(b, { ...b })).toBe(true);
		expect(sameBounds(b, { ...b, farZ: -5.1 })).toBe(false);
	});
});
