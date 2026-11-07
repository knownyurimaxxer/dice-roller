/**
 * Sound effects. Each sound has a few players ready, so a quick series of
 * clashes can overlap instead of cutting each other off. Like haptics, the
 * current switches live here so any code can call a play function.
 */
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

const SOURCES = {
	clack: [
		require("../../assets/sounds/clack_a.wav"),
		require("../../assets/sounds/clack_b.wav"),
		require("../../assets/sounds/clack_c.wav"),
	],
	roll: [require("../../assets/sounds/roll.wav")],
	win: [require("../../assets/sounds/win.wav")],
	winBig: [require("../../assets/sounds/win_big.wav")],
} as const;

type Kind = keyof typeof SOURCES;

/** How many copies of each file are loaded, so they can play over each other. */
const COPIES: Record<Kind, number> = { clack: 2, roll: 1, win: 1, winBig: 1 };

let throwOn = true;
let resultOn = true;
let pools: Partial<Record<Kind, AudioPlayer[]>> = {};
let next: Partial<Record<Kind, number>> = {};

export function configureSound(throwSounds: boolean, resultSound: boolean) {
	throwOn = throwSounds;
	resultOn = resultSound;
}

function pool(kind: Kind): AudioPlayer[] {
	let p = pools[kind];
	if (!p) {
		p = [];
		for (const source of SOURCES[kind])
			for (let i = 0; i < COPIES[kind]; i++) {
				try {
					p.push(createAudioPlayer(source));
				} catch {
					/* this sound can't be loaded: it just stays silent */
				}
			}
		pools[kind] = p;
	}
	return p;
}

/** Loads every sound now, so the first roll doesn't wait for them. */
export function warmSounds() {
	(Object.keys(SOURCES) as Kind[]).forEach((k) => pool(k));
}

function play(kind: Kind, volume: number) {
	try {
		const p = pool(kind);
		if (p.length === 0) return;
		const i = (next[kind] ?? 0) % p.length;
		next[kind] = i + 1;
		const player = p[i];
		player.volume = Math.max(0, Math.min(1, volume));
		player.seekTo(0).catch(() => {});
		player.play();
	} catch {
		/* no sound on this device */
	}
}

/** The rattle of dice leaving the hand. */
export function playRoll() {
	if (throwOn) play("roll", 0.8);
}

/** Dice hitting each other or the board. `strength` is 0..1. */
export function playClash(strength: number, dieOnDie: boolean) {
	if (throwOn) play("clack", 0.2 + 0.8 * strength * (dieOnDie ? 1 : 0.85));
}

/** The celebration when the result shows. `big` is for a perfect roll. */
export function playResult(big: boolean) {
	if (resultOn) play(big ? "winBig" : "win", 0.9);
}

/** Plays a sound whatever the switches say (used for the previews in Settings). */
export function previewSound(kind: "roll" | "result") {
	play(kind === "roll" ? "roll" : "win", 0.8);
}
