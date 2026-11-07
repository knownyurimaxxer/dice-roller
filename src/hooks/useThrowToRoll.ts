import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { Accelerometer } from "expo-sensors";
import { THROW_SAMPLE_MS, ThrowDetector, throwThreshold } from "../utils/throw";

/**
 * Calls `onThrow` when the phone is thrown (see utils/throw.ts). Listens to
 * the motion sensor only while `enabled` and the app is in the foreground.
 */
export function useThrowToRoll(
	enabled: boolean,
	sensitivity: number,
	onThrow: () => void,
) {
	const detector = useRef(new ThrowDetector(throwThreshold(sensitivity)));
	const onThrowRef = useRef(onThrow);
	onThrowRef.current = onThrow;
	const [active, setActive] = useState(AppState.currentState === "active");

	useEffect(() => {
		const sub = AppState.addEventListener("change", (state) =>
			setActive(state === "active"),
		);
		return () => sub.remove();
	}, []);

	useEffect(() => {
		detector.current.threshold = throwThreshold(sensitivity);
	}, [sensitivity]);

	useEffect(() => {
		if (!enabled || !active) return;
		let cancelled = false;
		let subscription: { remove: () => void } | null = null;
		detector.current.reset();
		Accelerometer.isAvailableAsync()
			.then((available) => {
				if (!available || cancelled) return;
				Accelerometer.setUpdateInterval(THROW_SAMPLE_MS);
				subscription = Accelerometer.addListener(({ x, y, z }) => {
					if (detector.current.push(x, y, z, Date.now())) onThrowRef.current();
				});
			})
			.catch((e) => console.warn("Motion sensor unavailable", e));
		return () => {
			cancelled = true;
			subscription?.remove();
		};
	}, [enabled, active]);
}
