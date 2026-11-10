/**
 * A very small WebGL renderer: lit triangle meshes and flat shadows on the
 * board. Written against plain WebGL 1 (what expo-gl provides), with no
 * library on top, so the whole thing is short enough to read.
 */
import type { ExpoWebGLRenderingContext } from "expo-gl";
import type { Mesh, RGB, V3 } from "./geometry";
import { shadowMatrix, type Camera, type Mat4 } from "./mat4";

const LIT_VERT = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec3 aColor;
attribute vec2 aUV;
uniform mat4 uViewProj;
uniform mat4 uModel;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUV;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorld = world.xyz;
  vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
  vColor = aColor;
  vUV = aUV;
  gl_Position = uViewProj * world;
}`;

const LIT_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUV;
uniform vec3 uLight;
uniform vec3 uEye;
uniform float uSpec;
uniform sampler2D uTex;
uniform float uTexOpacity; // 0 = no picture on what is being drawn
uniform float uAlpha;
void main() {
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, uLight), 0.0);
  vec3 toEye = normalize(uEye - vWorld);
  vec3 mid = normalize(uLight + toEye);
  float spec = pow(max(dot(n, mid), 0.0), 48.0) * uSpec;
  float sky = 0.5 + 0.5 * n.y;
  // The picture goes over the color (where the picture itself is see-through, the color shows).
  vec3 base = vColor;
  if (uTexOpacity > 0.0) {
    vec4 tex = texture2D(uTex, vUV);
    base = mix(base, tex.rgb, tex.a * uTexOpacity);
  }
  vec3 color = base * (0.32 + 0.18 * sky + 0.62 * diffuse) + vec3(spec);
  gl_FragColor = vec4(color, uAlpha);
}`;

const SHADOW_VERT = `
attribute vec3 aPos;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform mat4 uShadow;
void main() {
  gl_Position = uViewProj * uShadow * uModel * vec4(aPos, 1.0);
}`;

const SHADOW_FRAG = `
precision mediump float;
uniform float uAlpha;
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
}`;

/** floats per vertex: position, normal, color, picture position */
const FLOATS = 11;
const STRIDE = FLOATS * 4;

export type GpuMesh = {
	vbo: WebGLBuffer;
	ibo: WebGLBuffer;
	bodyCount: number;
	total: number;
};

type Program = {
	program: WebGLProgram;
	attrib: Record<string, number>;
	uniform: Record<string, WebGLUniformLocation | null>;
};

export type DrawItem = { mesh: GpuMesh; model: Mat4 };

/** How the dice are painted (the shape and the colors are in their meshes). */
export type DiceLook = {
	/** 1 = solid, lower = see-through. */
	bodyAlpha: number;
	numberAlpha: number;
	/** The picture laid over the color, and how much of it shows (0..1). */
	texture: WebGLTexture | null;
	textureOpacity: number;
};

export const PLAIN_LOOK: DiceLook = {
	bodyAlpha: 1,
	numberAlpha: 1,
	texture: null,
	textureOpacity: 0,
};

/** Shadows stay a little visible even under a nearly invisible die. */
const SHADOW_ALPHA = 0.38;

/** Where the light comes from (pointing at the light), and so where shadows fall. */
export const LIGHT: V3 = (() => {
	const v: V3 = [-0.45, 1, 0.55];
	const l = Math.hypot(...v);
	return [v[0] / l, v[1] / l, v[2] / l];
})();

export class Renderer {
	private lit: Program;
	private shadow: Program;
	private shadowM: Mat4 = shadowMatrix(LIGHT, 0.03);

	constructor(private gl: ExpoWebGLRenderingContext) {
		this.lit = this.link(
			LIT_VERT,
			LIT_FRAG,
			["aPos", "aNormal", "aColor", "aUV"],
			[
				"uViewProj",
				"uModel",
				"uLight",
				"uEye",
				"uSpec",
				"uTex",
				"uTexOpacity",
				"uAlpha",
			],
		);
		this.shadow = this.link(
			SHADOW_VERT,
			SHADOW_FRAG,
			["aPos"],
			["uViewProj", "uModel", "uShadow", "uAlpha"],
		);
	}

	private compile(type: number, source: string): WebGLShader {
		const gl = this.gl;
		const shader = gl.createShader(type);
		if (!shader) throw new Error("Could not create a shader");
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
			throw new Error(`Shader error: ${gl.getShaderInfoLog(shader)}`);
		return shader;
	}

	private link(
		vert: string,
		frag: string,
		attribs: string[],
		uniforms: string[],
	): Program {
		const gl = this.gl;
		const program = gl.createProgram();
		if (!program) throw new Error("Could not create a GL program");
		gl.attachShader(program, this.compile(gl.VERTEX_SHADER, vert));
		gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, frag));
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS))
			throw new Error(`Link error: ${gl.getProgramInfoLog(program)}`);
		const attrib: Record<string, number> = {};
		for (const a of attribs) attrib[a] = gl.getAttribLocation(program, a);
		const uniform: Record<string, WebGLUniformLocation | null> = {};
		for (const u of uniforms) uniform[u] = gl.getUniformLocation(program, u);
		return { program, attrib, uniform };
	}

	upload(mesh: Mesh): GpuMesh {
		const gl = this.gl;
		const count = mesh.positions.length / 3;
		if (count > 65535) throw new Error("Mesh too big for 16-bit indices");
		const data = new Float32Array(count * FLOATS);
		for (let i = 0; i < count; i++) {
			data.set(mesh.positions.slice(i * 3, i * 3 + 3), i * FLOATS);
			data.set(mesh.normals.slice(i * 3, i * 3 + 3), i * FLOATS + 3);
			data.set(mesh.colors.slice(i * 3, i * 3 + 3), i * FLOATS + 6);
			data.set(mesh.uvs.slice(i * 2, i * 2 + 2), i * FLOATS + 9);
		}
		const vbo = gl.createBuffer();
		const ibo = gl.createBuffer();
		if (!vbo || !ibo) throw new Error("Could not create GL buffers");
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(mesh.indices),
			gl.STATIC_DRAW,
		);
		return {
			vbo,
			ibo,
			bodyCount: mesh.bodyIndexCount,
			total: mesh.indices.length,
		};
	}

	free(m: GpuMesh) {
		this.gl.deleteBuffer(m.vbo);
		this.gl.deleteBuffer(m.ibo);
	}

	/**
	 * Loads a picture from a file on the phone as a texture. Returns null when
	 * it can't be read (the dice are then drawn without it).
	 */
	loadTexture(uri: string): WebGLTexture | null {
		const gl = this.gl;
		const tex = gl.createTexture();
		if (!tex) return null;
		try {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			// No mipmaps and clamped edges: works for pictures of any size in WebGL 1.
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			// expo-gl reads a file given as { localUri }; its typings don't list that form.
			(
				gl as unknown as {
					texImage2D: (...args: unknown[]) => void;
				}
			).texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, {
				localUri: uri,
			});
			if (gl.getError() !== gl.NO_ERROR) throw new Error("texImage2D failed");
			return tex;
		} catch (e) {
			console.warn("Could not load the dice picture", e);
			gl.deleteTexture(tex);
			return null;
		}
	}

	freeTexture(tex: WebGLTexture) {
		this.gl.deleteTexture(tex);
	}

	private bind(p: Program, m: GpuMesh, withNormals: boolean) {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
		gl.enableVertexAttribArray(p.attrib.aPos);
		gl.vertexAttribPointer(p.attrib.aPos, 3, gl.FLOAT, false, STRIDE, 0);
		if (withNormals) {
			gl.enableVertexAttribArray(p.attrib.aNormal);
			gl.vertexAttribPointer(p.attrib.aNormal, 3, gl.FLOAT, false, STRIDE, 12);
			gl.enableVertexAttribArray(p.attrib.aColor);
			gl.vertexAttribPointer(p.attrib.aColor, 3, gl.FLOAT, false, STRIDE, 24);
			gl.enableVertexAttribArray(p.attrib.aUV);
			gl.vertexAttribPointer(p.attrib.aUV, 2, gl.FLOAT, false, STRIDE, 36);
		}
	}

	/** Draws one frame: the board, the shadows, then the dice. */
	frame(opts: {
		width: number;
		height: number;
		clear: RGB;
		camera: Camera;
		board: DrawItem;
		dice: DrawItem[];
		look?: DiceLook;
	}) {
		const gl = this.gl;
		const { camera } = opts;
		const look = opts.look ?? PLAIN_LOOK;
		gl.viewport(0, 0, opts.width, opts.height);
		gl.clearColor(opts.clear[0], opts.clear[1], opts.clear[2], 1);
		gl.clearDepth(1);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.depthMask(true);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Board (lit program stays active for the dice too).
		const lit = this.lit;
		gl.useProgram(lit.program);
		gl.uniformMatrix4fv(lit.uniform.uViewProj, false, camera.viewProj);
		gl.uniform3f(lit.uniform.uLight, LIGHT[0], LIGHT[1], LIGHT[2]);
		gl.uniform3f(lit.uniform.uEye, camera.eye[0], camera.eye[1], camera.eye[2]);
		gl.disable(gl.CULL_FACE);
		gl.uniform1f(lit.uniform.uSpec, 0);
		gl.uniform1f(lit.uniform.uAlpha, 1);
		gl.uniform1f(lit.uniform.uTexOpacity, 0);
		gl.uniform1i(lit.uniform.uTex, 0);
		gl.uniformMatrix4fv(lit.uniform.uModel, false, opts.board.model);
		this.bind(lit, opts.board.mesh, true);
		gl.drawElements(gl.TRIANGLES, opts.board.mesh.total, gl.UNSIGNED_SHORT, 0);

		// Shadows: flattened onto the floor. Depth is written with LESS, so where
		// two flattened triangles overlap only the first one is blended.
		if (opts.dice.length > 0) {
			const sh = this.shadow;
			gl.useProgram(sh.program);
			gl.uniformMatrix4fv(sh.uniform.uViewProj, false, camera.viewProj);
			gl.uniformMatrix4fv(sh.uniform.uShadow, false, this.shadowM);
			// A see-through die casts a fainter shadow, never none.
			gl.uniform1f(
				sh.uniform.uAlpha,
				SHADOW_ALPHA * (0.25 + 0.75 * look.bodyAlpha),
			);
			gl.depthFunc(gl.LESS);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			for (const d of opts.dice) {
				gl.uniformMatrix4fv(sh.uniform.uModel, false, d.model);
				this.bind(sh, d.mesh, false);
				gl.drawElements(gl.TRIANGLES, d.mesh.bodyCount, gl.UNSIGNED_SHORT, 0);
			}
			gl.disable(gl.BLEND);
			gl.depthFunc(gl.LEQUAL);
			gl.disableVertexAttribArray(sh.attrib.aPos);

			// Dice.
			gl.useProgram(lit.program);
			gl.frontFace(gl.CCW);
			gl.uniform1f(lit.uniform.uSpec, 0.3);
			const picture = look.texture !== null && look.textureOpacity > 0;
			if (picture) {
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, look.texture);
			}
			const pictureOpacity = picture ? look.textureOpacity : 0;

			/** One die: the body (with the picture), then its numbers (without). */
			const drawDie = (d: DrawItem) => {
				gl.uniformMatrix4fv(lit.uniform.uModel, false, d.model);
				this.bind(lit, d.mesh, true);
				gl.uniform1f(lit.uniform.uAlpha, look.bodyAlpha);
				gl.uniform1f(lit.uniform.uTexOpacity, pictureOpacity);
				gl.drawElements(gl.TRIANGLES, d.mesh.bodyCount, gl.UNSIGNED_SHORT, 0);
				const rest = d.mesh.total - d.mesh.bodyCount;
				if (rest > 0) {
					gl.uniform1f(lit.uniform.uAlpha, look.numberAlpha);
					gl.uniform1f(lit.uniform.uTexOpacity, 0);
					gl.drawElements(
						gl.TRIANGLES,
						rest,
						gl.UNSIGNED_SHORT,
						d.mesh.bodyCount * 2, // byte offset: 2 bytes per index
					);
				}
			};

			gl.enable(gl.CULL_FACE);
			if (look.bodyAlpha >= 1 && look.numberAlpha >= 1) {
				// Solid dice: just the faces that look at the camera.
				gl.cullFace(gl.BACK);
				for (const d of opts.dice) drawDie(d);
			} else {
				// See-through dice, far to near (so nearer ones blend over farther
				// ones). Each die is drawn twice: first the inside of its far side,
				// numbers included, then the near side over it. The alpha of the
				// screen itself is left alone.
				const dist = (d: DrawItem) =>
					(d.model[12] - camera.eye[0]) ** 2 +
					(d.model[13] - camera.eye[1]) ** 2 +
					(d.model[14] - camera.eye[2]) ** 2;
				const sorted = [...opts.dice].sort((a, b) => dist(b) - dist(a));
				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(
					gl.SRC_ALPHA,
					gl.ONE_MINUS_SRC_ALPHA,
					gl.ZERO,
					gl.ONE,
				);
				for (const d of sorted) {
					gl.cullFace(gl.FRONT); // the far side, seen from inside
					gl.uniformMatrix4fv(lit.uniform.uModel, false, d.model);
					this.bind(lit, d.mesh, true);
					gl.uniform1f(lit.uniform.uAlpha, look.bodyAlpha);
					gl.uniform1f(lit.uniform.uTexOpacity, pictureOpacity);
					gl.drawElements(gl.TRIANGLES, d.mesh.bodyCount, gl.UNSIGNED_SHORT, 0);
					// Numbers on the far side sit just outside it, so they would fail
					// the depth test against it: draw them regardless of depth.
					const rest = d.mesh.total - d.mesh.bodyCount;
					if (rest > 0) {
						gl.depthFunc(gl.ALWAYS);
						gl.depthMask(false);
						gl.uniform1f(lit.uniform.uAlpha, look.numberAlpha);
						gl.uniform1f(lit.uniform.uTexOpacity, 0);
						gl.drawElements(
							gl.TRIANGLES,
							rest,
							gl.UNSIGNED_SHORT,
							d.mesh.bodyCount * 2,
						);
						gl.depthMask(true);
						gl.depthFunc(gl.LEQUAL);
					}
					gl.cullFace(gl.BACK); // the near side, over it
					drawDie(d);
				}
				gl.disable(gl.BLEND);
			}
			gl.disable(gl.CULL_FACE);
		}
	}
}
