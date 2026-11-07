import { useMemo, useState } from "react";
import {
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useT } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";

type Props = {
	visible: boolean;
	title: string;
	initial: string;
	onCancel: () => void;
	onSubmit: (name: string) => void;
};

/** A small box that asks for a name (saving or renaming a favorite). */
export default function NamePrompt({
	visible,
	title,
	initial,
	onCancel,
	onSubmit,
}: Props) {
	const theme = useTheme();
	const t = useT();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const [name, setName] = useState(initial);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
			statusBarTranslucent
			navigationBarTranslucent
			supportedOrientations={["portrait", "landscape"]}
			// Start each time with the value it was opened with.
			onShow={() => setName(initial)}
		>
			<View style={s.backdrop}>
				<View style={s.card}>
					<Text style={s.title}>{title}</Text>
					<TextInput
						style={s.input}
						value={name}
						onChangeText={setName}
						placeholder={t("favorites.namePlaceholder")}
						placeholderTextColor={theme.text + "77"}
						maxLength={40}
						autoFocus
						returnKeyType="done"
						onSubmitEditing={() => onSubmit(name)}
					/>
					<View style={s.buttons}>
						<Pressable
							onPress={() => {
								haptic("buttons");
								onCancel();
							}}
							style={s.ghost}
						>
							<Text style={[s.btnText, { color: theme.accent }]}>
								{t("common.cancel")}
							</Text>
						</Pressable>
						<Pressable
							onPress={() => {
								haptic("buttons");
								onSubmit(name);
							}}
							style={s.solid}
						>
							<Text style={[s.btnText, { color: readableOn(theme.accent) }]}>
								{t("common.save")}
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: "#000000AA",
			alignItems: "center",
			justifyContent: "center",
			padding: 24,
		},
		card: {
			width: "100%",
			maxWidth: 420,
			backgroundColor: t.card,
			borderRadius: 12,
			padding: 16,
		},
		title: { color: t.text, fontSize: 17, fontWeight: "800", marginBottom: 12 },
		input: {
			backgroundColor: t.text + "14",
			color: t.text,
			borderRadius: 8,
			paddingHorizontal: 14,
			paddingVertical: 10,
			fontSize: 15,
		},
		buttons: {
			flexDirection: "row",
			justifyContent: "flex-end",
			gap: 10,
			marginTop: 16,
		},
		ghost: {
			paddingHorizontal: 16,
			paddingVertical: 9,
			borderRadius: 18,
			borderWidth: 1,
			borderColor: t.accent,
		},
		solid: {
			paddingHorizontal: 20,
			paddingVertical: 9,
			borderRadius: 18,
			backgroundColor: t.accent,
			borderWidth: 1,
			borderColor: t.accent,
		},
		btnText: { fontWeight: "700", fontSize: 14 },
	});
