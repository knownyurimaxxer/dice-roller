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
import { DiceImageError, type DiceImageProblem } from "../storage/diceImage";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { parseDice, type DiceSettingsFile } from "../utils/diceStyle";
import { readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";
import DicePreview from "./DicePreview";

type Props = {
	visible: boolean;
	/** Applies the settings (downloading the picture first). Throws if the picture can't be used. */
	onApply: (dice: DiceSettingsFile) => Promise<void>;
	onClose: () => void;
};

const DANGER = "#FF4D4D";

/** Paste dice settings, see what they look like, import them. */
export default function DiceImportModal({ visible, onApply, onClose }: Props) {
	const theme = useTheme();
	const { t } = useI18n();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const [text, setText] = useState("");
	const [busy, setBusy] = useState(false);
	const [problem, setProblem] = useState<DiceImageProblem | null>(null);

	useEffect(() => {
		if (visible) {
			setText("");
			setProblem(null);
			setBusy(false);
		}
	}, [visible]);

	const parsed = useMemo(() => parseDice(text), [text]);
	const invalid = text.trim().length > 0 && !parsed;

	const errorText = (p: DiceImageProblem) =>
		p === "tooBig"
			? t("dice.errorTooBig")
			: p === "notImage"
				? t("dice.errorNotImage")
				: t("dice.errorDownload");

	const apply = async () => {
		if (!parsed || busy) return;
		haptic("buttons");
		setBusy(true);
		setProblem(null);
		try {
			await onApply(parsed);
		} catch (e) {
			setProblem(e instanceof DiceImageError ? e.problem : "download");
		} finally {
			setBusy(false);
		}
	};

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
					<Text style={s.title}>{t("dice.import")}</Text>
					<Text style={s.hint}>{t("dice.importHint")}</Text>

					<TextInput
						style={[s.input, invalid && { borderColor: DANGER }]}
						value={text}
						onChangeText={setText}
						placeholder={'{ "transparency": 20, … }'}
						placeholderTextColor={theme.text + "77"}
						multiline
						autoCapitalize="none"
						autoCorrect={false}
						autoComplete="off"
						spellCheck={false}
						textAlignVertical="top"
					/>

					{invalid && <Text style={s.error}>{t("dice.importInvalid")}</Text>}

					{parsed && (
						<View style={{ marginTop: 12 }}>
							<DicePreview style={parsed} />
							{parsed.imageUrl && (
								<Text style={s.url} numberOfLines={2}>
									{parsed.imageUrl}
								</Text>
							)}
						</View>
					)}

					{problem && <Text style={s.error}>{errorText(problem)}</Text>}
					{busy && <Text style={s.hint}>{t("dice.downloading")}</Text>}

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
							disabled={!parsed || busy}
							style={[s.btn, (!parsed || busy) && { opacity: 0.4 }]}
							onPress={apply}
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
		url: { color: t.text + "99", fontSize: 12, marginTop: 6 },
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
