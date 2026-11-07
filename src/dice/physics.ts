/**
 * The dice physics: a board with walls, gravity, and the dice thrown onto it.
 * Built on cannon-es (plain JavaScript, no native code). It knows nothing
 * about drawing: the engine asks it for each die's position and turn.
 *
 * The result is never "decided": it is whichever face is on top once every
 * die has stopped moving (a die leaning on a wall or another die is given a
 * small nudge, a few times at most, so no roll counts a tilted face).
 */
import * as CANNON from "cannon-es";
import {
	buildGeometry,
	faceValues,
	physicalKind,
	readFace,
	type Geometry,
} from "./geometry";
import { floorArea, wallsOf, type FloorBounds } from "./bounds";
import type { Throw } from "./plan";

const STEP = 1 / 60;
/** Seconds after the last die left the hand before the roll is called off. */
const MAX_ROLL_SECONDS = 7;
const GRAVITY = 42;
const MAX_NUDGES = 3;
/** A die this flat (1 = perfectly level) counts as lying on a face. */
const FLAT_ENOUGH = 0.965;

/** Walls stand this far inside the visible edge, so dice never sit half off screen. */
const WALL_MARGIN = 0.5;

export type LiveDie = {
	throwSpec: Throw;
	geometry: Geometry;
	values: (number | null)[];
	body: CANNON.Body;
	/** Size of this die compared with the drawn mesh (smaller with many dice). */
	scale: number;
	spawnAt: number;
	added: boolean;
	calm: number;
};

export type PhysicsEvents = {
	/** Something hit something: strength 0..1, and whether it was another die. */
	onImpact: (strength: number, dieOnDie: boolean) => void;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class DicePhysics {
	readonly world: CANNON.World;
	dice: LiveDie[] = [];
	private time = 0;
	private acc = 0;
	private lastSpawn = 0;
	private nudges = 0;
	private lastImpact = -1;
	private finished = true;
	private bodies = new Set<CANNON.Body>();
	private diceMat = new CANNON.Material("dice");
	private boardMat = new CANNON.Material("board");
	private wallMat = new CANNON.Material("wall");
	private walls: CANNON.Body[] = [];

	constructor(
		private bounds: FloorBounds,
		private events: PhysicsEvents,
	) {
		this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAVITY, 0) });
		this.world.allowSleep = true;
		this.world.addContactMaterial(
			new CANNON.ContactMaterial(this.diceMat, this.boardMat, {
				friction: 0.32,
				restitution: 0.28,
			}),
		);
		this.world.addContactMaterial(
			new CANNON.ContactMaterial(this.diceMat, this.wallMat, {
				friction: 0.1,
				restitution: 0.55,
			}),
		);
		this.world.addContactMaterial(
			new CANNON.ContactMaterial(this.diceMat, this.diceMat, {
				friction: 0.2,
				restitution: 0.35,
			}),
		);
		const X = new CANNON.Vec3(1, 0, 0);
		const half = Math.PI / 2;
		// A plane's normal starts along +z; each one is turned to face the inside.
		this.addPlane([0, 0, 0], X, -half, this.boardMat); // floor, normal up
		this.addPlane([0, 16, 0], X, half, this.wallMat); // ceiling, normal down
		this.buildWalls();
	}

	/** Four upright walls along the edges of the visible floor. */
	private buildWalls() {
		const Y = new CANNON.Vec3(0, 1, 0);
		for (const w of wallsOf(this.bounds, WALL_MARGIN)) {
			// Turning around y by atan2(nx, nz) takes the plane's +z normal to (nx, nz).
			this.walls.push(
				this.addPlane([w.x, 0, w.z], Y, Math.atan2(w.nx, w.nz), this.wallMat),
			);
		}
	}

	/** The screen changed shape: move the walls. Dice on the board are taken off. */
	setBounds(bounds: FloorBounds) {
		this.clear();
		for (const w of this.walls) this.world.removeBody(w);
		this.walls = [];
		this.bounds = bounds;
		this.buildWalls();
	}

	private addPlane(
		pos: [number, number, number],
		axis: CANNON.Vec3,
		angle: number,
		material: CANNON.Material,
	): CANNON.Body {
		const body = new CANNON.Body({
			mass: 0,
			shape: new CANNON.Plane(),
			material,
		});
		body.quaternion.setFromAxisAngle(axis, angle);
		body.position.set(pos[0], pos[1], pos[2]);
		this.world.addBody(body);
		return body;
	}

	/** Takes every die off the board. */
	clear() {
		for (const d of this.dice) if (d.added) this.world.removeBody(d.body);
		this.dice = [];
		this.bodies.clear();
		this.finished = true;
	}

	get running(): boolean {
		return !this.finished;
	}

	/** Throws these dice, one after the other, from the near edge of the board. */
	throwDice(plan: Throw[]) {
		this.clear();
		this.time = 0;
		this.acc = 0;
		this.nudges = 0;
		this.finished = false;
		const b = this.bounds;
		const n = plan.length;
		const scale = Math.max(
			0.62,
			Math.min(1, Math.sqrt(floorArea(b) / (n * 9))),
		);
		// A long screen needs a harder throw to cover it.
		const depth = b.nearZ - b.farZ;
		const power = Math.max(0.9, Math.min(1.5, Math.sqrt(depth / 10)));
		const hand = b.nearZ - WALL_MARGIN - 1.7; // where the dice leave the hand
		plan.forEach((t, i) => {
			const geometry = buildGeometry(physicalKind(t.sides));
			const shape = new CANNON.ConvexPolyhedron({
				vertices: geometry.vertices.map(
					(v) => new CANNON.Vec3(v[0] * scale, v[1] * scale, v[2] * scale),
				),
				faces: geometry.faces.map((f) => [...f.indices]),
			});
			const body = new CANNON.Body({
				mass: scale * scale * scale,
				material: this.diceMat,
				shape,
				allowSleep: true,
				sleepSpeedLimit: 0.5,
				sleepTimeLimit: 0.4,
				linearDamping: 0.04,
				angularDamping: 0.1,
			});
			// Lanes follow the golden ratio, so dice that leave the hand one
			// after the other are far apart and never start inside each other.
			const lane = n === 1 ? 0.5 : (0.5 + i * 0.6180339887) % 1;
			const left = b.nearLeft + WALL_MARGIN + 1.7;
			const right = b.nearRight - WALL_MARGIN - 1.7;
			const x = left + lane * Math.max(0, right - left);
			body.position.set(x, 2.4 + (i % 3) * 0.7, hand);
			body.velocity.set(
				rand(-2.5, 2.5) - x * 0.35,
				rand(2, 7),
				-rand(11, 18) * power,
			);
			body.angularVelocity.set(rand(-22, 22), rand(-22, 22), rand(-22, 22));
			body.quaternion.setFromEuler(
				rand(0, Math.PI * 2),
				rand(0, Math.PI * 2),
				rand(0, Math.PI * 2),
			);
			body.addEventListener("collide", (e: unknown) => this.hit(e));
			this.bodies.add(body);
			this.dice.push({
				throwSpec: t,
				geometry,
				values: faceValues(geometry, t.sides),
				body,
				scale,
				spawnAt: i * 0.075,
				added: false,
				calm: 0,
			});
			this.lastSpawn = i * 0.075;
		});
	}

	private hit(e: unknown) {
		const ev = e as { body?: CANNON.Body; contact?: CANNON.ContactEquation };
		if (!ev.contact) return;
		const v = Math.abs(ev.contact.getImpactVelocityAlongNormal());
		if (v < 1.2 || this.time - this.lastImpact < 0.04) return;
		this.lastImpact = this.time;
		this.events.onImpact(
			Math.min(1, v / 20),
			!!ev.body && this.bodies.has(ev.body),
		);
	}

	/** Moves time forward. Returns false once the dice have all come to rest. */
	advance(dt: number): boolean {
		if (this.finished) return false;
		this.acc += Math.min(dt, 0.05);
		let steps = 0;
		while (this.acc >= STEP && steps < 4 && !this.finished) {
			this.tick();
			this.acc -= STEP;
			steps++;
		}
		if (steps === 4) this.acc = 0;
		return !this.finished;
	}

	private tick() {
		this.time += STEP;
		for (const d of this.dice)
			if (!d.added && this.time >= d.spawnAt) {
				this.world.addBody(d.body);
				d.added = true;
			}
		this.world.step(STEP);
		if (!this.dice.every((d) => d.added)) return;

		let allCalm = true;
		for (const d of this.dice) {
			const b = d.body;
			const still =
				b.sleepState === CANNON.Body.SLEEPING ||
				(b.velocity.lengthSquared() < 0.02 &&
					b.angularVelocity.lengthSquared() < 0.05);
			d.calm = still ? d.calm + STEP : 0;
			if (d.calm < 0.45) allCalm = false;
		}
		const late = this.time - this.lastSpawn > MAX_ROLL_SECONDS;
		if (!allCalm && !late) return;

		// Everything has stopped (or time is up). A die that is not lying flat
		// gets thrown up a little, so it can fall on a face.
		if (!late && this.nudges < MAX_NUDGES) {
			const tilted = this.dice.filter((d) => this.flatness(d) < FLAT_ENOUGH);
			if (tilted.length > 0) {
				this.nudges++;
				for (const d of tilted) {
					d.body.wakeUp();
					d.body.velocity.set(rand(-2, 2), rand(6, 9), rand(-2, 2));
					d.body.angularVelocity.set(
						rand(-12, 12),
						rand(-12, 12),
						rand(-12, 12),
					);
				}
				for (const d of this.dice) d.calm = 0;
				return;
			}
		}
		this.finished = true;
	}

	private flatness(d: LiveDie): number {
		return readFace(d.geometry, d.values, d.body.quaternion).flat;
	}

	/** What every die shows now, in the order they were thrown. */
	read(): number[] {
		return this.dice.map(
			(d) => readFace(d.geometry, d.values, d.body.quaternion).value,
		);
	}
}
