import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import type { Layout } from "../utils/orientation";

const { Orientation, OrientationLock } = ScreenOrientation;

/** The exact landscape side the screen is on, if it is in landscape. */
function landscapeSide(o: ScreenOrientation.Orientation) {
	if (o === Orientation.LANDSCAPE_LEFT) return OrientationLock.LANDSCAPE_LEFT;
	if (o === Orientation.LANDSCAPE_RIGHT) return OrientationLock.LANDSCAPE_RIGHT;
	return null;
}

/**
 * Keeps the screen in one position and stops it from rotating by itself.
 * Vertical locks it upright. Horizontal locks it on the landscape side it is
 * on now; if it isn't in landscape yet, it turns to landscape and then stays
 * on whichever side it settles on, so nothing can flip it upside down later.
 * Pass null to leave the screen alone (while settings are still loading).
 */
export function useOrientationLock(layout: Layout | null) {
	useEffect(() => {
		if (layout === null) return;
		let cancelled = false;
		let subscription: ReturnType<
			typeof ScreenOrientation.addOrientationChangeListener
		> | null = null;

		const apply = async () => {
			if (layout === "portrait") {
				await ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP);
				return;
			}
			const side = landscapeSide(await ScreenOrientation.getOrientationAsync());
			if (side !== null) {
				await ScreenOrientation.lockAsync(side);
				return;
			}
			// Turn to landscape (either side), then pin the side it ends up on.
			subscription = ScreenOrientation.addOrientationChangeListener((event) => {
				const settled = landscapeSide(event.orientationInfo.orientation);
				if (settled === null || cancelled) return;
				subscription?.remove();
				subscription = null;
				ScreenOrientation.lockAsync(settled).catch(() => {});
			});
			await ScreenOrientation.lockAsync(OrientationLock.LANDSCAPE);
		};

		apply().catch((e) => console.warn("Could not lock the orientation", e));
		return () => {
			cancelled = true;
			subscription?.remove();
		};
	}, [layout]);
}
