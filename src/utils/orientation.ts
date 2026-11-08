/**
 * Which way up the screen is kept. The app never rotates by itself (turning
 * the phone, or throwing it, must not turn the screen): you choose vertical or
 * horizontal in Settings and it stays there. Plain TypeScript (no React, no
 * Expo), so it can be tested on its own.
 */
export const LAYOUTS = ["portrait", "landscape"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const DEFAULT_LAYOUT: Layout = "portrait";

/** A saved layout that makes sense: "landscape", or anything else as "portrait". */
export function normalizeLayout(value: unknown): Layout {
	return value === "landscape" ? "landscape" : DEFAULT_LAYOUT;
}
