/**
 * Just enough 4x4 matrix maths for the dice board: column-major arrays, the
 * layout WebGL wants. Plain TypeScript.
 */
import type { V3 } from "./geometry";

export type Mat4 = number[];

export const identity = (): Mat4 => [
	1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
];

/** a × b (apply b first, then a). */
export function multiply(a: Mat4, b: Mat4): Mat4 {
	const out = new Array<number>(16).fill(0);
	for (let c = 0; c < 4; c++)
		for (let r = 0; r < 4; r++) {
			let s = 0;
			for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
			out[c * 4 + r] = s;
		}
	return out;
}

export function perspective(
	fovY: number,
	aspect: number,
	near: number,
	far: number,
): Mat4 {
	const f = 1 / Math.tan(fovY / 2);
	const nf = 1 / (near - far);
	return [
		f / aspect,
		0,
		0,
		0,
		0,
		f,
		0,
		0,
		0,
		0,
		(far + near) * nf,
		-1,
		0,
		0,
		2 * far * near * nf,
		0,
	];
}

export function lookAt(eye: V3, target: V3, up: V3): Mat4 {
	const zx = eye[0] - target[0];
	const zy = eye[1] - target[1];
	const zz = eye[2] - target[2];
	const zl = Math.hypot(zx, zy, zz) || 1;
	const z: V3 = [zx / zl, zy / zl, zz / zl];
	let x: V3 = [
		up[1] * z[2] - up[2] * z[1],
		up[2] * z[0] - up[0] * z[2],
		up[0] * z[1] - up[1] * z[0],
	];
	const xl = Math.hypot(...x) || 1;
	x = [x[0] / xl, x[1] / xl, x[2] / xl];
	const y: V3 = [
		z[1] * x[2] - z[2] * x[1],
		z[2] * x[0] - z[0] * x[2],
		z[0] * x[1] - z[1] * x[0],
	];
	const d = (a: V3) => a[0] * eye[0] + a[1] * eye[1] + a[2] * eye[2];
	return [
		x[0],
		y[0],
		z[0],
		0,
		x[1],
		y[1],
		z[1],
		0,
		x[2],
		y[2],
		z[2],
		0,
		-d(x),
		-d(y),
		-d(z),
		1,
	];
}

/** Turn by a quaternion, scale uniformly, then move to `p`. */
export function modelMatrix(
	q: { x: number; y: number; z: number; w: number },
	p: V3,
	scale = 1,
): Mat4 {
	const { x, y, z, w } = q;
	const xx = x * x;
	const yy = y * y;
	const zz = z * z;
	return [
		(1 - 2 * (yy + zz)) * scale,
		2 * (x * y + w * z) * scale,
		2 * (x * z - w * y) * scale,
		0,
		2 * (x * y - w * z) * scale,
		(1 - 2 * (xx + zz)) * scale,
		2 * (y * z + w * x) * scale,
		0,
		2 * (x * z + w * y) * scale,
		2 * (y * z - w * x) * scale,
		(1 - 2 * (xx + yy)) * scale,
		0,
		p[0],
		p[1],
		p[2],
		1,
	];
}

/** Squashes everything flat onto the plane y = `planeY`, along the light's direction. */
export function shadowMatrix(lightDir: V3, planeY: number): Mat4 {
	const kx = lightDir[0] / lightDir[1];
	const kz = lightDir[2] / lightDir[1];
	return [
		1,
		0,
		0,
		0,
		-kx,
		0,
		-kz,
		0,
		0,
		0,
		1,
		0,
		kx * planeY,
		planeY,
		kz * planeY,
		1,
	];
}

/** Where a point lands on screen: x and y in -1..1 once divided by w. */
export function project(m: Mat4, p: V3): { x: number; y: number; w: number } {
	const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
	const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
	const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
	return { x: x / w, y: y / w, w };
}

export type Camera = {
	eye: V3;
	view: Mat4;
	proj: Mat4;
	viewProj: Mat4;
	aspect: number;
};

export const FOV_Y = (40 * Math.PI) / 180;
const PITCH = (64 * Math.PI) / 180; // how high the camera looks down from
// Near is kept far from the lens: some phones only have a 16-bit depth buffer.
const NEAR = 4;
const FAR = 140;

/** A camera `dist` away from the middle of the floor, looking down at it. */
export function buildCamera(aspect: number, dist: number): Camera {
	const eye: V3 = [0, Math.sin(PITCH) * dist, Math.cos(PITCH) * dist];
	const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
	const proj = perspective(FOV_Y, aspect, NEAR, FAR);
	return { eye, view, proj, viewProj: multiply(proj, view), aspect };
}

/**
 * Where the line of sight through a point of the screen (x and y in -1..1)
 * meets the floor, or null when it never does (it points at the sky).
 */
export function floorPoint(
	cam: Camera,
	nx: number,
	ny: number,
): { x: number; z: number } | null {
	const v = cam.view;
	const t = Math.tan(FOV_Y / 2);
	const a = nx * t * cam.aspect;
	const b = ny * t;
	// The ray in view space is (a, b, -1); the rows of the view matrix turn it into world space.
	const dx = a * v[0] + b * v[1] - v[2];
	const dy = a * v[4] + b * v[5] - v[6];
	const dz = a * v[8] + b * v[9] - v[10];
	if (dy > -1e-6) return null;
	const k = -cam.eye[1] / dy;
	return { x: cam.eye[0] + dx * k, z: cam.eye[2] + dz * k };
}

/**
 * The camera for a screen of this shape, as far away as it takes for the
 * floor to be `halfWidth` wide to each side at the middle of the screen. That
 * sets how big the dice look: the same on every phone, whatever its size.
 */
export function cameraFor(aspect: number, halfWidth: number): Camera {
	const unit = floorPoint(buildCamera(aspect, 1), 1, 0);
	return buildCamera(aspect, halfWidth / (unit ? unit.x : 1));
}
