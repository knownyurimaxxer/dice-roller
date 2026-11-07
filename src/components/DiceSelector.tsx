import { useMemo, useState } from "react";
import {
	LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { countOf, DIE_SIDES, DieSides, RollSpec, tapDie } from "../dice/roll";
import { useT } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { mixColors, readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";

type Props = {
	spec: RollSpec;
	onChange: (spec: RollSpec) => void;
	disabled?: boolean;
};

const COLUMNS = 6;
const GAP = 8;

/**
 * One button per kind of die. Tap to add a die, tap the little number to take
 * one away (a long press on the die works too).
 */
export default function DiceSelector({ spec, onChange, disabled }: Props) {
	const theme = useTheme();
	const t = useT();
	const [width, setWidth] = useState(0);
	const s = useMemo(() => makeStyles(theme), [theme]);
	const size =
		width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;

	const change = (sides: DieSides, delta: 1 | -1) => {
		const next = tapDie(spec, sides, delta);
		if (JSON.stringify(next.dice) === JSON.stringify(spec.dice)) return;
		haptic("buttons");
		onChange(next);
	};

	return (
		<View
			style={s.grid}
			onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
		>
			{size > 0 &&
				DIE_SIDES.map((sides) => {
					const count = countOf(spec, sides);
					const on = count > 0;
					return (
						<View key={sides} style={{ width: size, height: size }}>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={t("roll.addDie", { die: `d${sides}` })}
								disabled={disabled}
								onPress={() => change(sides, 1)}
								onLongPress={() => change(sides, -1)}
								style={({ pressed }) => [
									s.die,
									on && s.dieOn,
									pressed && s.pressed,
								]}
							>
								<Text style={[s.label, on && s.labelOn]}>d{sides}</Text>
							</Pressable>
							{on && (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={t("roll.removeDie", { die: `d${sides}` })}
									disabled={disabled}
									hitSlop={8}
									onPress={() => change(sides, -1)}
									style={s.badge}
								>
									<Text style={s.badgeText}>{count}</Text>
								</Pressable>
							)}
						</View>
					);
				})}
		</View>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
		die: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
			borderRadius: 10,
			borderWidth: 1,
			borderColor: mixColors(t.card, t.text, 0.18),
			backgroundColor: mixColors(t.card, t.text, 0.06),
		},
		dieOn: { backgroundColor: t.accent, borderColor: t.accent },
		pressed: { opacity: 0.7 },
		label: { color: t.text, fontWeight: "800", fontSize: 14 },
		labelOn: { color: readableOn(t.accent) },
		// The count: sits on the corner, in the opposite colors so it stands out.
		badge: {
			position: "absolute",
			top: -6,
			right: -6,
			minWidth: 20,
			height: 20,
			borderRadius: 10,
			paddingHorizontal: 5,
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: readableOn(t.accent),
			borderWidth: 1.5,
			borderColor: t.accent,
		},
		badgeText: {
			color: readableOn(readableOn(t.accent)),
			fontWeight: "800",
			fontSize: 11,
		},
	});
