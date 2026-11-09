import { useMemo, useRef, useState } from "react";
import {
	GestureResponderEvent,
	LayoutChangeEvent,
	StyleSheet,
	View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { stepFromTouch } from "../utils/slider";

type Props = {
	/** Current step, 0..max. */
	value: number;
	max: number;
	label: string;
	/** Called each time the step changes (not on every pixel of movement). */
	onChange: (step: number) => void;
};

const THUMB = 28;

/** A pill-shaped slider that snaps to whole steps, in the same style as the color picker's. */
export default function StepSlider({ value, max, label, onChange }: Props) {
	const theme = useTheme();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const [width, setWidth] = useState(0);
	// Touch events arrive faster than React re-renders: remember the last step sent.
	const last = useRef(value);
	last.current = value;

	const set = (step: number) => {
		if (step === last.current) return;
		last.current = step;
		onChange(step);
	};
	const touch = (e: GestureResponderEvent) =>
		set(stepFromTouch(e.nativeEvent.locationX, width, THUMB, max));

	const fraction = max > 0 ? value / max : 0;

	return (
		<View
			style={s.hit}
			onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
			onStartShouldSetResponder={() => true}
			onMoveShouldSetResponder={() => true}
			onResponderTerminationRequest={() => false}
			onResponderGrant={touch}
			onResponderMove={touch}
			accessible
			accessibilityRole="adjustable"
			accessibilityLabel={label}
			accessibilityValue={{ min: 0, max, now: value }}
			accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
			onAccessibilityAction={(e) =>
				set(
					Math.min(
						max,
						Math.max(
							0,
							value + (e.nativeEvent.actionName === "increment" ? 1 : -1),
						),
					),
				)
			}
		>
			<View style={s.track} pointerEvents="none" />
			{/* the part of the track up to the thumb */}
			<View
				pointerEvents="none"
				style={[
					s.fill,
					{ width: THUMB / 2 + fraction * Math.max(0, width - THUMB) },
				]}
			/>
			{/* one dot per step, under the thumb's path */}
			<View style={s.dots} pointerEvents="none">
				{Array.from({ length: max + 1 }, (_, i) => (
					<View key={i} style={s.dot} />
				))}
			</View>
			<View
				pointerEvents="none"
				style={[s.thumb, { left: fraction * Math.max(0, width - THUMB) }]}
			/>
		</View>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		hit: { height: THUMB, justifyContent: "center" },
		track: {
			height: 18,
			borderRadius: 9,
			backgroundColor: t.text + "22",
			borderWidth: 1,
			borderColor: "#88888855",
		},
		fill: {
			position: "absolute",
			left: 0,
			height: 18,
			borderRadius: 9,
			backgroundColor: t.accent + "88",
		},
		dots: {
			position: "absolute",
			left: THUMB / 2 - 2,
			right: THUMB / 2 - 2,
			flexDirection: "row",
			justifyContent: "space-between",
		},
		dot: {
			width: 4,
			height: 4,
			borderRadius: 2,
			backgroundColor: t.text + "55",
		},
		thumb: {
			position: "absolute",
			top: 0,
			width: THUMB,
			height: THUMB,
			borderRadius: THUMB / 2,
			backgroundColor: t.card,
			borderWidth: 3,
			borderColor: t.accent,
		},
	});
