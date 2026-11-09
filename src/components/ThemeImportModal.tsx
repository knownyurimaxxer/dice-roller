import { useEffect, useMemo, useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useI18n } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";
import { parseTheme } from "../utils/themeIO";

type Props = {
	visible: boolean;
	onApply: (theme: Theme) => void;
	onClose: () => void;
};

const DANGER = "#FF4D4D";

/** Paste a theme, see what it looks like, import it. */
export default function ThemeImportModal({ visible, onApply, onClose }: Props) {
	const theme = useTheme();
	const { t } = useI18n();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const [text, setText] = useState("");

	useEffect(() => {
		if (visible) setText("");
	}, [visible]);

	const parsed = useMemo(() => parseTheme(text), [text]);
	const invalid = text.trim().length > 0 && !parsed;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
			navigationBarTranslucent
			supportedOrientations={["portrait", "landscape"]}
		>
			<KeyboardAvoidingView
				style={s.backdrop}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<Pressable
					style={StyleSheet.absoluteFill}
					onPress={onClose}
					accessibilityLabel={t("common.cancel")}
				/>
				<View style={s.card}>
					<Text style={s.title}>{t("settings.importTheme")}</Text>
					<Text style={s.hint}>{t("settings.importHint")}</Text>

					<TextInput
						style={[s.input, invalid && { borderColor: DANGER }]}
						value={text}
						onChangeText={setText}
						placeholder={'{ "background": "#001935", … }'}
						placeholderTextColor={theme.text + "77"}
						multiline
						autoCapitalize="none"
						autoCorrect={false}
						autoComplete="off"
						spellCheck={false}
						textAlignVertical="top"
					/>

					{invalid && (
						<Text style={s.error}>{t("settings.importInvalid")}</Text>
					)}

					{parsed && (
						<View
							style={[
								s.preview,
								{
									backgroundColor: parsed.background,
									borderColor: parsed.accent,
								},
							]}
						>
							<View style={[s.previewCard, { backgroundColor: parsed.card }]}>
								<View
									style={[
										s.bar,
										{
											width: 80,
											backgroundColor: parsed.text,
											marginBottom: 6,
										},
									]}
								/>
								<View
									style={[
										s.bar,
										{
											width: 48,
											backgroundColor: parsed.accent,
										},
									]}
								/>
							</View>
						</View>
					)}

					<View style={s.btnRow}>
						<Pressable
							style={[s.btn, s.btnGhost]}
							onPress={() => {
								haptic("buttons");
								onClose();
							}}
						>
							<Text style={[s.btnText, { color: theme.accent }]}>
								{t("common.cancel")}
							</Text>
						</Pressable>
						<Pressable
							disabled={!parsed}
							style={[s.btn, !parsed && { opacity: 0.4 }]}
							onPress={() => {
								if (!parsed) return;
								haptic("buttons");
								onApply(parsed);
							}}
						>
							<Text style={s.btnText}>{t("settings.importButton")}</Text>
						</Pressable>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		backdrop: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			padding: 20,
			backgroundColor: "#000000AA",
		},
		card: {
			width: "100%",
			maxWidth: 380,
			backgroundColor: t.card,
			borderRadius: 12,
			padding: 18,
		},
		title: { color: t.text, fontWeight: "800", fontSize: 17 },
		hint: {
			color: t.text + "99",
			fontSize: 13,
			lineHeight: 18,
			marginTop: 6,
		},
		input: {
			height: 140,
			backgroundColor: t.background,
			color: readableOn(t.background),
			borderRadius: 8,
			borderWidth: 1,
			borderColor: "transparent",
			paddingHorizontal: 14,
			paddingVertical: 10,
			fontSize: 13,
			fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
			marginTop: 12,
		},
		error: { color: DANGER, fontSize: 13, lineHeight: 18, marginTop: 8 },
		// Same look as the presets in Settings.
		preview: {
			alignSelf: "flex-start",
			width: 120,
			padding: 8,
			borderRadius: 8,
			borderWidth: 2,
			marginTop: 12,
		},
		previewCard: { borderRadius: 4, padding: 6 },
		bar: { height: 6, borderRadius: 3 },
		btnRow: {
			flexDirection: "row",
			justifyContent: "flex-end",
			gap: 10,
			marginTop: 18,
		},
		btn: {
			backgroundColor: t.accent,
			paddingHorizontal: 18,
			paddingVertical: 9,
			borderRadius: 18,
			borderWidth: 1,
			borderColor: t.accent,
		},
		btnGhost: { backgroundColor: "transparent" },
		btnText: {
			color: readableOn(t.accent),
			fontWeight: "700",
			fontSize: 14,
			textAlign: "center",
		},
	});
