import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { mixColors, readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";

type Props<K extends string> = {
	options: { key: K; label: string }[];
	value: K;
	onChange: (key: K) => void;
	disabled?: boolean;
};

/** A row of options where exactly one is chosen. */
export default function Segmented<K extends string>({
	options,
	value,
	onChange,
	disabled,
}: Props<K>) {
	const theme = useTheme();
	const s = useMemo(() => makeStyles(theme), [theme]);
	return (
		<View style={s.row} accessibilityRole="radiogroup">
			{options.map((o) => {
				const active = o.key === value;
				return (
					<Pressable
						key={o.key}
						accessibilityRole="radio"
						accessibilityState={{ selected: active, disabled }}
						disabled={disabled}
						onPress={() => {
							if (active) return;
							haptic("buttons");
							onChange(o.key);
						}}
						style={[s.option, active && s.optionActive]}
					>
						<Text
							numberOfLines={1}
							adjustsFontSizeToFit
							style={[s.text, active && s.textActive]}
						>
							{o.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: "row",
			backgroundColor: mixColors(t.card, t.text, 0.08),
			borderRadius: 10,
			padding: 3,
			gap: 3,
		},
		option: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
			paddingVertical: 8,
			paddingHorizontal: 6,
			borderRadius: 8,
		},
		optionActive: { backgroundColor: t.accent },
		text: { color: t.text, fontWeight: "600", fontSize: 13 },
		textActive: { color: readableOn(t.accent), fontWeight: "800" },
	});
