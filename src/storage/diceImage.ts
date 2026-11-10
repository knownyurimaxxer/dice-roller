/**
 * The picture laid over the dice. It is never stored inside the settings: the
 * settings only keep its link, and this file keeps one downloaded copy on the
 * phone (in the app's own folder). A new picture is downloaded and checked
 * first; only then is the old copy deleted, so a bad link never costs you the
 * picture you had.
 */
import { Directory, File, Paths } from "expo-file-system";
import { Image } from "react-native";
import type { DiceStyle } from "../types";

/** Biggest file accepted. */
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
/** Biggest width or height accepted, in pixels (what phones' GPUs can hold as a texture). */
export const IMAGE_MAX_SIDE = 4096;

export type DiceImageProblem = "download" | "tooBig" | "notImage";

export class DiceImageError extends Error {
	constructor(public readonly problem: DiceImageProblem) {
		super(`Dice picture: ${problem}`);
	}
}

function folder(): Directory {
	const dir = new Directory(Paths.document, "dice-texture");
	if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
	return dir;
}

function sizeOf(uri: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) =>
		Image.getSize(uri, (width, height) => resolve({ width, height }), reject),
	);
}

function removeFile(uri: string | null) {
	if (!uri) return;
	try {
		const file = new File(uri);
		if (file.exists) file.delete();
	} catch (e) {
		console.warn("Could not delete the dice picture", e);
	}
}

/** Deletes every picture in the folder except the one named (or all of them for null). */
function prune(keepUri: string | null) {
	try {
		for (const entry of folder().list())
			if (entry instanceof File && entry.uri !== keepUri) removeFile(entry.uri);
	} catch (e) {
		console.warn("Could not tidy the dice pictures", e);
	}
}

function exists(uri: string): boolean {
	try {
		return new File(uri).exists;
	} catch {
		return false;
	}
}

/** Downloads the picture at `url` to the phone and checks it. Returns where it is. */
async function download(url: string): Promise<string> {
	const ext = /\.(png|jpe?g|webp|gif)(?:[?#]|$)/i.exec(url)?.[1] ?? "img";
	const target = new File(folder(), `dice-${Date.now()}.${ext.toLowerCase()}`);
	let file: File;
	try {
		file = await File.downloadFileAsync(url, target);
	} catch {
		removeFile(target.uri);
		throw new DiceImageError("download");
	}
	try {
		if (file.size > IMAGE_MAX_BYTES) throw new DiceImageError("tooBig");
		let dims: { width: number; height: number };
		try {
			dims = await sizeOf(file.uri);
		} catch {
			throw new DiceImageError("notImage");
		}
		if (dims.width > IMAGE_MAX_SIDE || dims.height > IMAGE_MAX_SIDE)
			throw new DiceImageError("tooBig");
		return file.uri;
	} catch (e) {
		removeFile(file.uri);
		throw e;
	}
}

/**
 * Makes the phone's copy match the link that is wanted, and returns where the
 * copy is (null when no picture is wanted):
 *   - no link: the copy is deleted;
 *   - the same link as now, and the copy is still there: nothing is downloaded;
 *   - a new link: it is downloaded and checked, and only then the old copy goes.
 * Throws a DiceImageError when the new picture can't be used; nothing changes then.
 */
export async function resolveDiceImage(
	wantedUrl: string | null,
	current: Pick<DiceStyle, "imageUrl" | "imageUri">,
): Promise<string | null> {
	if (!wantedUrl) {
		removeFile(current.imageUri);
		prune(null);
		return null;
	}
	if (
		wantedUrl === current.imageUrl &&
		current.imageUri &&
		exists(current.imageUri)
	)
		return current.imageUri;
	const uri = await download(wantedUrl);
	removeFile(current.imageUri);
	prune(uri);
	return uri;
}
