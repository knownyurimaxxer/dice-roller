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
uniform mat4 uViewProj;
uniform mat4 uModel;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorld = world.xyz;
  vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
  vColor = aColor;
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
uniform vec3 uLight;
uniform vec3 uEye;
uniform float uSpec;
void main() {
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, uLight), 0.0);
  vec3 toEye = normalize(uEye - vWorld);
  vec3 mid = normalize(uLight + toEye);
  float spec = pow(max(dot(n, mid), 0.0), 48.0) * uSpec;
  float sky = 0.5 + 0.5 * n.y;
  vec3 color = vColor * (0.32 + 0.18 * sky + 0.62 * diffuse) + vec3(spec);
  gl_FragColor = vec4(color, 1.0);
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
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.38);
}`;

/** floats per vertex: position, normal, color */
const STRIDE = 9 * 4;

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
			["aPos", "aNormal", "aColor"],
			["uViewProj", "uModel", "uLight", "uEye", "uSpec"],
		);
		this.shadow = this.link(
			SHADOW_VERT,
			SHADOW_FRAG,
			["aPos"],
			["uViewProj", "uModel", "uShadow"],
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
		const data = new Float32Array(count * 9);
		for (let i = 0; i < count; i++) {
			data.set(mesh.positions.slice(i * 3, i * 3 + 3), i * 9);
			data.set(mesh.normals.slice(i * 3, i * 3 + 3), i * 9 + 3);
			data.set(mesh.colors.slice(i * 3, i * 3 + 3), i * 9 + 6);
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
	}) {
		const gl = this.gl;
		const { camera } = opts;
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
			gl.enable(gl.CULL_FACE);
			gl.cullFace(gl.BACK);
			gl.frontFace(gl.CCW);
			gl.uniform1f(lit.uniform.uSpec, 0.3);
			for (const d of opts.dice) {
				gl.uniformMatrix4fv(lit.uniform.uModel, false, d.model);
				this.bind(lit, d.mesh, true);
				gl.drawElements(gl.TRIANGLES, d.mesh.total, gl.UNSIGNED_SHORT, 0);
			}
			gl.disable(gl.CULL_FACE);
		}
	}
}
