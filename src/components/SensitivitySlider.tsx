import { useMemo, useRef, useState } from "react";
import {
	AccessibilityActionEvent,
	LayoutChangeEvent,
	PanResponder,
	StyleSheet,
	View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { haptic } from "../utils/haptics";

type Props = {
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
	accessibilityLabel: string;
};

const THUMB = 28;
const HEIGHT = 44; // the whole touch area

/** A slider with whole-number steps, drawn with plain views (no extra package). */
export default function SensitivitySlider({
	value,
	min,
	max,
	onChange,
	accessibilityLabel,
}: Props) {
	const theme = useTheme();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const [width, setWidth] = useState(0);
	// The gesture handlers are built once, so they read the live values from here.
	const live = useRef({ width, value, min, max, onChange });
	live.current = { width, value, min, max, onChange };
	const startX = useRef(0);

	const emit = (x: number) => {
		const {
			width: w,
			min: lo,
			max: hi,
			value: current,
			onChange: change,
		} = live.current;
		const usable = w - THUMB;
		if (usable <= 0) return;
		const f = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
		const next = Math.round(lo + f * (hi - lo));
		if (next !== current) {
			haptic("buttons");
			change(next);
		}
	};

	const pan = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,
				// Keep the drag even when the settings list wants to scroll.
				onPanResponderTerminationRequest: () => false,
				onPanResponderGrant: (e) => {
					startX.current = e.nativeEvent.locationX;
					emit(startX.current);
				},
				onPanResponderMove: (_e, g) => emit(startX.current + g.dx),
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const fraction = max > min ? (value - min) / (max - min) : 0;
	const left = fraction * Math.max(0, width - THUMB);

	const onAction = (e: AccessibilityActionEvent) => {
		const step = e.nativeEvent.actionName === "increment" ? 1 : -1;
		const next = Math.min(max, Math.max(min, value + step));
		if (next !== value) onChange(next);
	};

	return (
		<View
			style={s.area}
			onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
			accessible
			accessibilityRole="adjustable"
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={{ min, max, now: value }}
			accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
			onAccessibilityAction={onAction}
			{...pan.panHandlers}
		>
			{/* children don't take touches, so the area gets every position */}
			<View pointerEvents="none" style={s.inner}>
				<View style={s.track} />
				<View style={[s.fill, { width: left + THUMB / 2 }]} />
				<View style={[s.thumb, { left }]} />
			</View>
		</View>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		area: { height: HEIGHT, justifyContent: "center", marginTop: 6 },
		inner: { height: HEIGHT, justifyContent: "center" },
		track: {
			position: "absolute",
			left: 0,
			right: 0,
			height: 6,
			borderRadius: 3,
			backgroundColor: t.text + "33",
		},
		fill: {
			position: "absolute",
			left: 0,
			height: 6,
			borderRadius: 3,
			backgroundColor: t.accent,
		},
		thumb: {
			position: "absolute",
			width: THUMB,
			height: THUMB,
			borderRadius: THUMB / 2,
			backgroundColor: t.accent,
			borderWidth: 3,
			borderColor: t.card,
		},
	});
