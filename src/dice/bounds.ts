/**
 * The part of the floor the screen shows, and the walls that keep the dice
 * inside it. There is no drawn board: the screen is the board, so the dice
 * bounce off the edges of what you can see. Plain TypeScript.
 */
import { floorPoint, type Camera } from "./mat4";

/** How much of the screen to keep clear, as fractions of its width / height. */
export type Insets = {
	top: number;
	bottom: number;
	left: number;
	right: number;
};

/**
 * The visible floor is a trapezoid (wider far away): `near` is the bottom of
 * the screen, `far` the top. x is left-right, z is toward the viewer.
 */
export type FloorBounds = {
	nearZ: number;
	farZ: number;
	nearLeft: number;
	nearRight: number;
	farLeft: number;
	farRight: number;
};

export const NO_INSETS: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

/** Used if the camera somehow sees the sky at a corner. */
const FALLBACK: FloorBounds = {
	nearZ: 6,
	farZ: -6,
	nearLeft: -5,
	nearRight: 5,
	farLeft: -5,
	farRight: 5,
};

/** The floor seen through the screen, less the insets. */
export function floorBounds(cam: Camera, insets: Insets): FloorBounds {
	const left = -1 + 2 * insets.left;
	const right = 1 - 2 * insets.right;
	const bottom = -1 + 2 * insets.bottom;
	const top = 1 - 2 * insets.top;
	const bl = floorPoint(cam, left, bottom);
	const br = floorPoint(cam, right, bottom);
	const tl = floorPoint(cam, left, top);
	const tr = floorPoint(cam, right, top);
	if (!bl || !br || !tl || !tr) return FALLBACK;
	return {
		nearZ: (bl.z + br.z) / 2,
		farZ: (tl.z + tr.z) / 2,
		nearLeft: bl.x,
		nearRight: br.x,
		farLeft: tl.x,
		farRight: tr.x,
	};
}

/** A wall: a point on it, and its unit normal (x, z) pointing into the floor. */
export type Wall = { x: number; z: number; nx: number; nz: number };

/** The four walls, moved `margin` inward so dice stay fully on screen. */
export function wallsOf(b: FloorBounds, margin: number): Wall[] {
	const side = (nearX: number, farX: number, sign: 1 | -1): Wall => {
		// Along the edge from the near end to the far end...
		const tx = farX - nearX;
		const tz = b.farZ - b.nearZ;
		const l = Math.hypot(tx, tz) || 1;
		// ...turned a quarter turn toward the inside (left edge: +x, right edge: -x).
		const nx = (-sign * tz) / l;
		const nz = (sign * tx) / l;
		return { x: nearX + nx * margin, z: b.nearZ + nz * margin, nx, nz };
	};
	return [
		side(b.nearLeft, b.farLeft, 1),
		side(b.nearRight, b.farRight, -1),
		{ x: 0, z: b.nearZ - margin, nx: 0, nz: -1 }, // bottom edge
		{ x: 0, z: b.farZ + margin, nx: 0, nz: 1 }, // top edge
	];
}

/** The size of the floor in world units, to size the dice by. */
export function floorArea(b: FloorBounds): number {
	const width = (b.nearRight - b.nearLeft + (b.farRight - b.farLeft)) / 2;
	return width * (b.nearZ - b.farZ);
}

export function sameBounds(a: FloorBounds, b: FloorBounds): boolean {
	return (Object.keys(a) as (keyof FloorBounds)[]).every(
		(k) => Math.abs(a[k] - b[k]) < 1e-6,
	);
}
