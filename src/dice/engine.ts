/**
 * The dice board as one object: physics + drawing + the animation loop.
 * React only creates it (when the GL surface is ready), tells it about the
 * theme and the screen, and throws dice at it. Nothing in here knows about React.
 *
 * There is no drawn board: the floor is the same color as the background and
 * fills the whole screen, and the dice bounce off the edges of what is visible.
 */
import type { ExpoWebGLRenderingContext } from "expo-gl";
import type { DiceStyle, Theme } from "../types";
import { opacityOf } from "../utils/diceStyle";
import { readableOn } from "../utils/format";
import { buildFloorMesh } from "./board";
import {
	floorBounds,
	NO_INSETS,
	sameBounds,
	type FloorBounds,
	type Insets,
} from "./bounds";
import {
	buildGeometry,
	buildLabels,
	buildMesh,
	hexToRgb,
	physicalKind,
} from "./geometry";
import { cameraFor, identity, modelMatrix, type Camera } from "./mat4";
import { DicePhysics } from "./physics";
import type { Throw } from "./plan";
import {
	Renderer,
	type DiceLook,
	type DrawItem,
	type GpuMesh,
} from "./renderer";

export type EngineEvents = {
	/** Something hit something: strength 0..1, and whether it was a die hitting a die. */
	onImpact: (strength: number, dieOnDie: boolean) => void;
	/** Every die has stopped: what each one shows, in the order they were thrown. */
	onSettled: (read: number[], plan: Throw[]) => void;
};

/** Half the width of the floor at the middle of the screen: sets how big the dice look. */
const HALF_WIDTH = 5.5;

export class DiceEngine {
	private renderer: Renderer;
	private physics: DicePhysics;
	private camera: Camera;
	private bounds: FloorBounds;
	private floorMesh: GpuMesh;
	private meshes = new Map<string, GpuMesh>();
	private texture: WebGLTexture | null = null;
	private textureUri: string | null = null;
	private plan: Throw[] = [];
	private waitingForResult = false;
	private raf = 0;
	private last = 0;
	private disposed = false;

	constructor(
		private gl: ExpoWebGLRenderingContext,
		private theme: Theme,
		private style: DiceStyle,
		private events: EngineEvents,
		insets: Insets = NO_INSETS,
	) {
		this.renderer = new Renderer(gl);
		this.camera = cameraFor(this.aspect(), HALF_WIDTH);
		this.bounds = floorBounds(this.camera, insets);
		this.physics = new DicePhysics(this.bounds, {
			onImpact: (strength, dieOnDie) =>
				this.events.onImpact(strength, dieOnDie),
		});
		this.floorMesh = this.makeFloor();
		this.syncTexture();
		this.draw();
	}

	private aspect(): number {
		return (
			Math.max(1, this.gl.drawingBufferWidth) /
			Math.max(1, this.gl.drawingBufferHeight)
		);
	}

	private makeFloor(): GpuMesh {
		// Exactly the background color, so the floor and the screen are one.
		return this.renderer.upload(
			buildFloorMesh(hexToRgb(this.theme.background)),
		);
	}

	private meshFor(t: Throw): GpuMesh {
		const key = `${t.sides}:${t.role}`;
		let gpu = this.meshes.get(key);
		if (!gpu) {
			const geometry = buildGeometry(physicalKind(t.sides));
			const body = this.theme.accent; // every die is exactly the accent color
			// The numbers: the color chosen, or whichever reads best on the dice.
			const ink =
				this.style.numberColor ??
				(readableOn(body) === "#FFFFFF" ? "#FFFFFF" : "#101010");
			gpu = this.renderer.upload(
				buildMesh(
					geometry,
					buildLabels(geometry, t.sides, t.role),
					hexToRgb(body),
					hexToRgb(ink),
				),
			);
			this.meshes.set(key, gpu);
		}
		return gpu;
	}

	setTheme(theme: Theme) {
		if (this.disposed) return;
		this.theme = theme;
		this.rebuild();
	}

	/** The look of the dice changed (see-through, number color, picture). */
	setDice(style: DiceStyle) {
		if (this.disposed) return;
		this.style = style;
		this.syncTexture();
		this.rebuild();
	}

	/** Remakes everything that was built from the theme or the dice style. */
	private rebuild() {
		for (const m of this.meshes.values()) this.renderer.free(m);
		this.meshes.clear();
		this.renderer.free(this.floorMesh);
		this.floorMesh = this.makeFloor();
		this.draw();
	}

	/** Keeps the GPU texture in step with the picture file named in the style. */
	private syncTexture() {
		const uri = this.style.imageUri;
		if (uri === this.textureUri) return;
		if (this.texture) this.renderer.freeTexture(this.texture);
		this.texture = uri ? this.renderer.loadTexture(uri) : null;
		this.textureUri = uri;
	}

	private look(): DiceLook {
		const bodyAlpha = opacityOf(this.style.transparency);
		return {
			bodyAlpha,
			numberAlpha: this.style.numbersFollowTransparency ? bodyAlpha : 1,
			texture: this.texture,
			textureOpacity: opacityOf(this.style.imageTransparency),
		};
	}

	/**
	 * The surface changed size, or the parts of the screen that must stay clear
	 * changed: fit the camera again and move the walls. If the walls moved, the
	 * dice on the floor are taken off.
	 */
	setLayout(insets: Insets) {
		if (this.disposed) return;
		this.camera = cameraFor(this.aspect(), HALF_WIDTH);
		const bounds = floorBounds(this.camera, insets);
		if (!sameBounds(bounds, this.bounds)) {
			this.bounds = bounds;
			this.physics.setBounds(bounds);
			this.waitingForResult = false;
		}
		this.draw();
	}

	/** Takes the dice off the board. */
	clear() {
		this.physics.clear();
		this.waitingForResult = false;
		this.draw();
	}

	throwDice(plan: Throw[]) {
		if (this.disposed || plan.length === 0) return;
		this.plan = plan;
		this.physics.throwDice(plan);
		this.waitingForResult = true;
		this.last = 0;
		this.kick();
	}

	private kick() {
		if (!this.raf && !this.disposed)
			this.raf = requestAnimationFrame(this.frame);
	}

	private frame = (now: number) => {
		this.raf = 0;
		if (this.disposed) return;
		const dt = this.last ? (now - this.last) / 1000 : 1 / 60;
		this.last = now;
		const running = this.physics.advance(dt);
		this.draw();
		if (running) {
			this.kick();
			return;
		}
		this.last = 0;
		if (this.waitingForResult) {
			this.waitingForResult = false;
			this.events.onSettled(this.physics.read(), this.plan);
		}
	};

	private draw() {
		const items: DrawItem[] = [];
		for (const d of this.physics.dice) {
			if (!d.added) continue;
			const p = d.body.position;
			items.push({
				mesh: this.meshFor(d.throwSpec),
				model: modelMatrix(d.body.quaternion, [p.x, p.y, p.z], d.scale),
			});
		}
		this.renderer.frame({
			width: this.gl.drawingBufferWidth,
			height: this.gl.drawingBufferHeight,
			clear: hexToRgb(this.theme.background),
			camera: this.camera,
			board: { mesh: this.floorMesh, model: identity() },
			dice: items,
			look: this.look(),
		});
		this.gl.endFrameEXP();
	}

	dispose() {
		this.disposed = true;
		if (this.texture) this.renderer.freeTexture(this.texture);
		this.texture = null;
		if (this.raf) cancelAnimationFrame(this.raf);
		this.raf = 0;
	}
}
