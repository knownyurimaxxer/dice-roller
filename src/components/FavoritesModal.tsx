import { useMemo, useState } from "react";
import {
	Alert,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Favorite, favoriteTitle, specLabel } from "../dice/roll";
import { useT } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";
import NamePrompt from "./NamePrompt";
import Sheet from "./Sheet";

type Props = {
	visible: boolean;
	favorites: Favorite[];
	onClose: () => void;
	/** Tapped: load it and roll it. */
	onRoll: (favorite: Favorite) => void;
	onRename: (id: number, name: string) => void;
	onDelete: (id: number) => void;
};

export default function FavoritesModal({
	visible,
	favorites,
	onClose,
	onRoll,
	onRename,
	onDelete,
}: Props) {
	const theme = useTheme();
	const t = useT();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const [renaming, setRenaming] = useState<Favorite | null>(null);

	const confirmDelete = (f: Favorite) => {
		haptic("buttons");
		Alert.alert(
			t("favorites.deleteTitle"),
			t("favorites.deleteBody", { name: favoriteTitle(f) }),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: () => onDelete(f.id),
				},
			],
		);
	};

	return (
		<Sheet visible={visible} title={t("favorites.title")} onClose={onClose}>
			<FlatList
				data={favorites}
				keyExtractor={(f) => String(f.id)}
				contentContainerStyle={s.list}
				ListHeaderComponent={
					favorites.length > 0 ? (
						<Text style={s.hint}>{t("favorites.hint")}</Text>
					) : undefined
				}
				ListEmptyComponent={<Text style={s.empty}>{t("favorites.empty")}</Text>}
				renderItem={({ item }) => (
					<Pressable
						accessibilityRole="button"
						onPress={() => {
							haptic("buttons");
							onRoll(item);
						}}
						style={({ pressed }) => [s.row, pressed && s.pressed]}
					>
						<View style={s.info}>
							<Text style={s.name} numberOfLines={1}>
								{favoriteTitle(item)}
							</Text>
							{item.name.trim() !== "" && (
								<Text style={s.spec} numberOfLines={1}>
									{specLabel(item.spec)}
								</Text>
							)}
						</View>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("common.rename")}
							hitSlop={8}
							onPress={() => {
								haptic("buttons");
								setRenaming(item);
							}}
							style={s.iconBtn}
						>
							<Ionicons name="create-outline" size={22} color={theme.text} />
						</Pressable>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("common.delete")}
							hitSlop={8}
							onPress={() => confirmDelete(item)}
							style={s.iconBtn}
						>
							<Ionicons name="trash-outline" size={22} color={DANGER} />
						</Pressable>
					</Pressable>
				)}
			/>
			<NamePrompt
				visible={renaming !== null}
				title={t("favorites.renameTitle")}
				initial={renaming?.name ?? ""}
				onCancel={() => setRenaming(null)}
				onSubmit={(name) => {
					if (renaming) onRename(renaming.id, name);
					setRenaming(null);
				}}
			/>
		</Sheet>
	);
}

const DANGER = "#FF4D4D";

const makeStyles = (t: Theme) => {
	const onBg = readableOn(t.background);
	return StyleSheet.create({
		list: { padding: 16, gap: 10, flexGrow: 1 },
		hint: { color: onBg, opacity: 0.7, fontSize: 13, marginBottom: 2 },
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
			gap: 8,
		},
		pressed: { opacity: 0.7 },
		info: { flex: 1 },
		name: { color: t.text, fontWeight: "700", fontSize: 16 },
		spec: { color: t.text + "99", fontSize: 13, marginTop: 2 },
		iconBtn: { padding: 6 },
	});
};
