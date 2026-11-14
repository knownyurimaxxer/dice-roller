import { useMemo } from "react";
import {
	Alert,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import {
	groupDetail,
	HistoryEntry,
	listedGroups,
	resultSummary,
	specLabel,
} from "../dice/roll";
import { useI18n } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";
import Sheet from "./Sheet";

type Props = {
	visible: boolean;
	history: HistoryEntry[];
	onClose: () => void;
	onClear: () => void;
};

export default function HistoryModal({
	visible,
	history,
	onClose,
	onClear,
}: Props) {
	const theme = useTheme();
	const { t } = useI18n();
	const s = useMemo(() => makeStyles(theme), [theme]);

	const confirmClear = () => {
		haptic("buttons");
		Alert.alert(t("history.clearTitle"), t("history.clearBody"), [
			{ text: t("common.cancel"), style: "cancel" },
			{ text: t("common.delete"), style: "destructive", onPress: onClear },
		]);
	};

	return (
		<Sheet
			visible={visible}
			title={t("history.title")}
			onClose={onClose}
			extra={() =>
				history.length > 0 ? (
					<Pressable
						accessibilityRole="button"
						onPress={confirmClear}
						style={({ pressed }) => [s.clearBtn, pressed && s.pressed]}
					>
						<Text style={s.clearText}>{t("history.clear")}</Text>
					</Pressable>
				) : null
			}
		>
			<FlatList
				data={history}
				keyExtractor={(e) => String(e.id)}
				contentContainerStyle={s.list}
				ListEmptyComponent={<Text style={s.empty}>{t("history.empty")}</Text>}
				renderItem={({ item }) => {
					const detail = listedGroups(item.result)
						.map((g) => `d${g.sides}: ${groupDetail(g)}`)
						.join("   ");
					return (
						<View style={s.row}>
							<View style={s.info}>
								<Text style={s.spec} numberOfLines={1}>
									{specLabel(item.spec)}
								</Text>
								{detail !== "" && (
									<Text style={s.detail} numberOfLines={2}>
										{detail}
									</Text>
								)}
							</View>
							<Text style={s.result} numberOfLines={1} adjustsFontSizeToFit>
								{resultSummary(item.spec, item.result)}
							</Text>
						</View>
					);
				}}
			/>
		</Sheet>
	);
}

const DANGER = "#FF4D4D";

const makeStyles = (t: Theme) => {
	const onBg = readableOn(t.background);
	return StyleSheet.create({
		list: { padding: 16, paddingTop: 4, gap: 10, flexGrow: 1 },
		empty: {
			color: onBg,
			opacity: 0.7,
			textAlign: "center",
			marginTop: 80,
			fontSize: 16,
			lineHeight: 24,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: t.card,
			borderRadius: 8,
			padding: 14,
			gap: 12,
		},
		info: { flex: 1 },
		spec: { color: t.text, fontWeight: "700", fontSize: 15 },
		detail: { color: t.text + "99", fontSize: 13, marginTop: 2 },
		result: {
			color: t.text,
			fontSize: 24,
			fontWeight: "800",
			maxWidth: 120,
			textAlign: "right",
		},
		clearBtn: {
			paddingHorizontal: 16,
			paddingVertical: 7,
			borderRadius: 18,
			borderWidth: 1,
			borderColor: DANGER,
		},
		clearText: { color: DANGER, fontWeight: "700", fontSize: 14 },
		pressed: { opacity: 0.6 },
	});
};
