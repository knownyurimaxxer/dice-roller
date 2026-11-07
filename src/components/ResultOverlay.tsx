import { useEffect, useMemo, useRef } from "react";
import {
	Animated,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { GroupResult, RollResult, RollSpec } from "../dice/roll";
import { specLabel } from "../dice/roll";
import { useT } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { legibleAccent, mixColors, readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";

export type Shown = {
	spec: RollSpec;
	result: RollResult;
	perfect: boolean;
	/** Changes with every roll, so the number pops in again. */
	id: number;
};

type Props = {
	shown: Shown;
	/** The roll was just saved as a favorite. */
	saved: boolean;
	onReconfigure: () => void;
	onReroll: () => void;
	onSave: () => void;
};

/** The dice that were thrown and what they showed; the ones that didn't count are dimmed. */
function Values({
	group,
	style,
	dim,
}: {
	group: GroupResult;
	style: StyleProp<TextStyle>;
	dim: StyleProp<TextStyle>;
}) {
	return (
		<Text style={style} numberOfLines={2}>
			{group.values.map((v, i) => (
				<Text key={i} style={group.kept.includes(i) ? undefined : dim}>
					{i > 0 ? "  " : ""}
					{v}
				</Text>
			))}
		</Text>
	);
}

function Action({
	icon,
	label,
	onPress,
	primary,
	disabled,
	s,
	color,
	onColor,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	onPress: () => void;
	primary?: boolean;
	disabled?: boolean;
	s: ReturnType<typeof makeStyles>;
	color: string;
	onColor: string;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={() => {
				haptic("buttons");
				onPress();
			}}
			style={({ pressed }) => [
				s.action,
				primary && s.actionPrimary,
				pressed && s.pressed,
			]}
		>
			<Ionicons name={icon} size={22} color={primary ? onColor : color} />
			<Text
				style={[s.actionText, { color: primary ? onColor : color }]}
				numberOfLines={1}
				adjustsFontSizeToFit
			>
				{label}
			</Text>
		</Pressable>
	);
}

/**
 * The result of the roll, announced in the middle of the screen over the dice,
 * with what you can do next: change the dice, roll again, or save the roll.
 */
export default function ResultOverlay({
	shown,
	saved,
	onReconfigure,
	onReroll,
	onSave,
}: Props) {
	const theme = useTheme();
	const t = useT();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const pop = useRef(new Animated.Value(0)).current;
	const { id } = shown;

	// The card and the number pop in whenever a new result arrives.
	useEffect(() => {
		pop.setValue(0);
		Animated.spring(pop, {
			toValue: 1,
			friction: 6,
			tension: 120,
			useNativeDriver: true,
		}).start();
	}, [id, pop]);

	const { spec, result, perfect } = shown;
	const separate = spec.combine === "separate" && result.groups.length > 1;
	const detail = result.groups.filter((g) => g.values.length > 1);
	const onBg = readableOn(theme.background);

	return (
		<View style={s.layer} pointerEvents="box-none">
			<Animated.View
				accessibilityLiveRegion="polite"
				style={[
					s.card,
					{
						opacity: pop,
						transform: [
							{
								scale: pop.interpolate({
									inputRange: [0, 1],
									outputRange: [0.8, 1],
								}),
							},
						],
					},
				]}
			>
				{perfect && <Text style={s.perfect}>{t("result.perfect")}</Text>}
				{separate ? (
					<View style={s.tiles}>
						{result.groups.map((g) => (
							<View key={g.sides} style={s.tile}>
								<Text
									style={s.tileNumber}
									numberOfLines={1}
									adjustsFontSizeToFit
								>
									{g.result}
								</Text>
								<Text style={s.caption}>
									{g.values.length > 1
										? `${g.values.length}d${g.sides}`
										: `d${g.sides}`}
								</Text>
								{g.values.length > 1 && (
									<Values group={g} style={s.values} dim={s.dropped} />
								)}
							</View>
						))}
					</View>
				) : (
					<>
						<Text style={s.total} numberOfLines={1} adjustsFontSizeToFit>
							{result.total}
						</Text>
						<Text style={s.caption}>
							{result.groups.length > 1 ? `${t("result.total")} · ` : ""}
							{specLabel(spec)}
						</Text>
						{detail.map((g) => (
							<View key={g.sides} style={s.detailRow}>
								<Text style={s.detailLabel}>d{g.sides}</Text>
								<Values group={g} style={s.values} dim={s.dropped} />
							</View>
						))}
					</>
				)}
				<View style={s.actions}>
					<Action
						s={s}
						icon="options-outline"
						label={t("result.reconfigure")}
						onPress={onReconfigure}
						color={onBg}
						onColor={readableOn(theme.accent)}
					/>
					<Action
						s={s}
						icon="refresh"
						label={t("result.reroll")}
						onPress={onReroll}
						primary
						color={onBg}
						onColor={readableOn(theme.accent)}
					/>
					<Action
						s={s}
						icon={saved ? "star" : "star-outline"}
						label={saved ? t("result.saved") : t("common.save")}
						onPress={onSave}
						disabled={saved}
						color={onBg}
						onColor={readableOn(theme.accent)}
					/>
				</View>
			</Animated.View>
		</View>
	);
}

const makeStyles = (t: Theme) => {
	const onBg = readableOn(t.background);
	const number = legibleAccent(t.accent, t.background, onBg);
	return StyleSheet.create({
		layer: {
			...StyleSheet.absoluteFill,
			alignItems: "center",
			justifyContent: "center",
			padding: 20,
		},
		// A soft backing so the number reads over the dice behind it.
		card: {
			width: "100%",
			maxWidth: 420,
			alignItems: "center",
			backgroundColor: t.background + "E6",
			borderRadius: 22,
			borderWidth: 1,
			borderColor: mixColors(t.background, onBg, 0.18),
			paddingHorizontal: 18,
			paddingTop: 16,
			paddingBottom: 14,
		},
		perfect: {
			color: number,
			fontWeight: "800",
			fontSize: 15,
			marginBottom: 2,
		},
		total: {
			color: number,
			fontSize: 96,
			fontWeight: "900",
			lineHeight: 104,
			maxWidth: "100%",
		},
		caption: { color: onBg, opacity: 0.75, fontSize: 14, fontWeight: "600" },
		detailRow: {
			flexDirection: "row",
			gap: 8,
			alignItems: "baseline",
			marginTop: 4,
		},
		detailLabel: { color: onBg, opacity: 0.6, fontSize: 13, fontWeight: "700" },
		values: {
			color: onBg,
			fontSize: 16,
			fontWeight: "700",
			textAlign: "center",
		},
		dropped: {
			opacity: 0.35,
			textDecorationLine: "line-through",
			fontWeight: "400",
		},
		tiles: {
			flexDirection: "row",
			flexWrap: "wrap",
			justifyContent: "center",
			gap: 20,
		},
		tile: { alignItems: "center", minWidth: 64, maxWidth: 130 },
		tileNumber: {
			color: number,
			fontSize: 56,
			fontWeight: "900",
			lineHeight: 64,
		},
		actions: {
			flexDirection: "row",
			gap: 8,
			marginTop: 16,
			alignSelf: "stretch",
		},
		action: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
			gap: 4,
			paddingVertical: 10,
			paddingHorizontal: 6,
			borderRadius: 14,
			borderWidth: 1.5,
			borderColor: mixColors(t.background, onBg, 0.3),
		},
		actionPrimary: { backgroundColor: t.accent, borderColor: t.accent },
		actionText: { fontSize: 13, fontWeight: "700" },
		pressed: { opacity: 0.7 },
	});
};
