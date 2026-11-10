import { useEffect, useMemo, useRef, useState } from "react";
import {
	Pressable,
	Share,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NUMBER_SWATCHES } from "../constants";
import { useI18n } from "../i18n/I18nContext";
import {
	DiceImageError,
	resolveDiceImage,
	type DiceImageProblem,
} from "../storage/diceImage";
import { useTheme } from "../theme/ThemeContext";
import { Settings, Theme, UpdateSetting } from "../types";
import {
	exportDice,
	normalizeImageUrl,
	TRANSPARENCY_MAX,
	TRANSPARENCY_STEP,
	type DiceSettingsFile,
} from "../utils/diceStyle";
import { readableOn } from "../utils/format";
import { haptic, playHaptic } from "../utils/haptics";
import ColorPicker from "./ColorPicker";
import DiceImportModal from "./DiceImportModal";
import DicePreview from "./DicePreview";
import StepSlider from "./StepSlider";

type Props = {
	settings: Settings;
	update: UpdateSetting;
};

const DANGER = "#FF4D4D";
const STEPS = TRANSPARENCY_MAX / TRANSPARENCY_STEP;

/**
 * Settings > Dice: how see-through the dice are, the color of their numbers,
 * a picture laid over their color, and sharing all of it as text.
 */
export default function DiceSection({ settings, update }: Props) {
	const theme = useTheme();
	const { t } = useI18n();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const dice = settings.dice;

	// Downloads take a while: when one ends, build on the dice style as it is
	// then (the person may have moved a slider meanwhile), not as it was before.
	const latest = useRef(dice);
	latest.current = dice;

	const [urlText, setUrlText] = useState(dice.imageUrl ?? "");
	const [busy, setBusy] = useState(false);
	const [problem, setProblem] = useState<DiceImageProblem | "url" | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);

	// An import (or a removal) changes the link: show it in the box.
	useEffect(() => {
		setUrlText(dice.imageUrl ?? "");
	}, [dice.imageUrl]);

	const setDice = (patch: Partial<typeof dice>) =>
		update("dice", { ...latest.current, ...patch });

	const track = { true: theme.accent, false: "#88888888" };
	const customColor =
		dice.numberColor !== null &&
		!NUMBER_SWATCHES.some((c) => c === dice.numberColor);

	const errorText = (p: DiceImageProblem | "url") =>
		p === "url"
			? t("dice.errorUrl")
			: p === "tooBig"
				? t("dice.errorTooBig")
				: p === "notImage"
					? t("dice.errorNotImage")
					: t("dice.errorDownload");

	/** Downloads the picture at the link in the box (or removes it, for null) and keeps it. */
	const applyImage = async (url: string | null) => {
		if (busy) return;
		setProblem(null);
		setBusy(true);
		try {
			const uri = await resolveDiceImage(url, latest.current);
			setDice({ imageUrl: url, imageUri: uri });
			if (url === null) setUrlText("");
		} catch (e) {
			setProblem(e instanceof DiceImageError ? e.problem : "download");
		} finally {
			setBusy(false);
		}
	};

	const onUseImage = () => {
		const url = normalizeImageUrl(urlText);
		if (!url) {
			setProblem("url");
			return;
		}
		haptic("buttons");
		applyImage(url);
	};

	const onExport = async () => {
		haptic("buttons");
		try {
			await Share.share({ message: exportDice(dice) });
		} catch (e) {
			console.warn("Could not share the dice settings", e);
		}
	};

	/** Used by the import window: the picture first, so a bad link changes nothing. */
	const importDice = async (file: DiceSettingsFile) => {
		const uri = await resolveDiceImage(file.imageUrl, latest.current);
		update("dice", { ...file, imageUri: uri });
		setProblem(null);
		setImportOpen(false);
	};

	return (
		<>
			<Text style={[s.section, { marginTop: 24 }]}>{t("settings.dice")}</Text>
			<DicePreview style={dice} />

			{/* transparency of the dice */}
			<View style={[s.rowBlock, { marginTop: 12 }]}>
				<View style={s.titleRow}>
					<Text style={s.rowTitle}>{t("dice.transparency")}</Text>
					<Text style={s.value}>{dice.transparency}%</Text>
				</View>
				<Text style={[s.rowHint, { marginBottom: 10 }]}>
					{t("dice.transparencyHint")}
				</Text>
				<StepSlider
					label={t("dice.transparency")}
					value={dice.transparency / TRANSPARENCY_STEP}
					max={STEPS}
					onChange={(step) =>
						setDice({ transparency: step * TRANSPARENCY_STEP })
					}
				/>
			</View>

			{/* the numbers */}
			<View style={[s.rowBlock, { marginTop: 12 }]}>
				<Text style={s.rowTitle}>{t("dice.numberColor")}</Text>
				<Text style={[s.rowHint, { marginBottom: 10 }]}>
					{t("dice.numberColorHint")}
				</Text>
				<View style={s.swatchRow}>
					<Pressable
						accessibilityRole="button"
						accessibilityState={{ selected: dice.numberColor === null }}
						onPress={() => {
							haptic("buttons");
							setDice({ numberColor: null });
						}}
						style={[s.autoRing, dice.numberColor === null && s.ringActive]}
					>
						<Text style={s.autoText}>{t("dice.numberAuto")}</Text>
					</Pressable>
					{NUMBER_SWATCHES.map((c) => (
						<Pressable
							key={c}
							accessibilityRole="button"
							accessibilityState={{ selected: dice.numberColor === c }}
							onPress={() => {
								haptic("buttons");
								setDice({ numberColor: c });
							}}
							style={[s.swatchRing, dice.numberColor === c && s.ringActive]}
						>
							<View style={[s.swatch, { backgroundColor: c }]} />
						</Pressable>
					))}
					{customColor && (
						<Pressable
							accessibilityRole="button"
							accessibilityState={{ selected: true }}
							onPress={() => setPickerOpen(true)}
							style={[s.swatchRing, s.ringActive]}
						>
							<View
								style={[
									s.swatch,
									{ backgroundColor: dice.numberColor ?? "#000" },
								]}
							/>
						</Pressable>
					)}
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("color.custom")}
						onPress={() => {
							haptic("buttons");
							setPickerOpen(true);
						}}
						style={({ pressed }) => [s.swatchRing, pressed && s.pressed]}
					>
						<View style={[s.swatch, s.pickerSwatch]}>
							<Ionicons
								name="color-palette"
								size={20}
								color={readableOn(theme.card)}
							/>
						</View>
					</Pressable>
				</View>
			</View>
			<View style={[s.row, { marginTop: 12 }]}>
				<View style={{ flex: 1, paddingRight: 12 }}>
					<Text style={s.rowTitle}>{t("dice.numbersFollow")}</Text>
					<Text style={s.rowHint}>{t("dice.numbersFollowHint")}</Text>
				</View>
				<Switch
					value={dice.numbersFollowTransparency}
					onValueChange={(v) => {
						setDice({ numbersFollowTransparency: v });
						if (v) playHaptic("buttons");
					}}
					trackColor={track}
				/>
			</View>

			{/* the picture: a link; the app keeps its own downloaded copy */}
			<View style={[s.rowBlock, { marginTop: 12 }]}>
				<Text style={s.rowTitle}>{t("dice.image")}</Text>
				<Text style={s.rowHint}>{t("dice.imageHint")}</Text>
				<TextInput
					style={[s.input, problem === "url" && { borderColor: DANGER }]}
					value={urlText}
					onChangeText={(v) => {
						setUrlText(v);
						if (problem) setProblem(null);
					}}
					placeholder={t("dice.imagePlaceholder")}
					placeholderTextColor={theme.text + "77"}
					autoCapitalize="none"
					autoCorrect={false}
					autoComplete="off"
					spellCheck={false}
					keyboardType="url"
					editable={!busy}
				/>
				{problem && <Text style={s.error}>{errorText(problem)}</Text>}
				{busy && <Text style={s.rowHint}>{t("dice.downloading")}</Text>}
				<View style={[s.btnRow, { marginTop: 12 }]}>
					<Pressable
						disabled={busy || urlText.trim().length === 0}
						style={[
							s.btn,
							(busy || urlText.trim().length === 0) && { opacity: 0.4 },
						]}
						onPress={onUseImage}
					>
						<Text style={s.btnText}>{t("dice.imageUse")}</Text>
					</Pressable>
					{dice.imageUrl !== null && (
						<Pressable
							disabled={busy}
							style={[s.btn, s.btnGhost, busy && { opacity: 0.4 }]}
							onPress={() => {
								haptic("buttons");
								applyImage(null);
							}}
						>
							<Text style={[s.btnText, { color: theme.accent }]}>
								{t("dice.imageRemove")}
							</Text>
						</Pressable>
					)}
				</View>
				{dice.imageUrl !== null && (
					<View style={{ marginTop: 16 }}>
						<View style={s.titleRow}>
							<Text style={s.rowTitle}>{t("dice.imageTransparency")}</Text>
							<Text style={s.value}>{dice.imageTransparency}%</Text>
						</View>
						<View style={{ height: 8 }} />
						<StepSlider
							label={t("dice.imageTransparency")}
							value={dice.imageTransparency / TRANSPARENCY_STEP}
							max={STEPS}
							onChange={(step) =>
								setDice({ imageTransparency: step * TRANSPARENCY_STEP })
							}
						/>
					</View>
				)}
			</View>

			{/* share the dice settings as text, on their own */}
			<Text style={[s.sectionTitle, { marginTop: 16 }]}>
				{t("dice.transfer")}
			</Text>
			<View style={s.btnRow}>
				<Pressable style={s.btn} onPress={onExport}>
					<Text style={s.btnText}>{t("dice.export")}</Text>
				</Pressable>
				<Pressable
					style={[s.btn, s.btnGhost]}
					onPress={() => {
						haptic("buttons");
						setImportOpen(true);
					}}
				>
					<Text style={[s.btnText, { color: theme.accent }]}>
						{t("dice.import")}
					</Text>
				</Pressable>
			</View>

			<ColorPicker
				visible={pickerOpen}
				title={t("dice.numberColor")}
				value={dice.numberColor ?? readableOn(theme.accent)}
				onApply={(hex) => {
					setDice({ numberColor: hex });
					setPickerOpen(false);
				}}
				onClose={() => setPickerOpen(false)}
			/>
			<DiceImportModal
				visible={importOpen}
				onApply={importDice}
				onClose={() => setImportOpen(false)}
			/>
		</>
	);
}

const makeStyles = (t: Theme) => {
	const onBg = readableOn(t.background);
	return StyleSheet.create({
		section: {
			color: onBg,
			fontWeight: "700",
			marginBottom: 8,
			fontSize: 14,
			opacity: 0.85,
		},
		sectionTitle: {
			color: onBg,
			fontWeight: "700",
			marginBottom: 8,
			fontSize: 12,
			opacity: 0.85,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: t.card,
			borderRadius: 8,
			padding: 14,
		},
		rowBlock: { backgroundColor: t.card, borderRadius: 8, padding: 14 },
		titleRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		rowTitle: { color: t.text, fontWeight: "700", fontSize: 15 },
		value: { color: t.text + "99", fontSize: 13, fontWeight: "700" },
		rowHint: {
			color: t.text + "99",
			fontSize: 13,
			marginTop: 4,
			lineHeight: 18,
		},
		swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
		swatchRing: {
			width: 46,
			height: 46,
			borderRadius: 23,
			borderWidth: 2,
			borderColor: "transparent",
			padding: 3,
			backgroundColor: t.card,
		},
		autoRing: {
			height: 46,
			minWidth: 58,
			borderRadius: 23,
			borderWidth: 2,
			borderColor: "transparent",
			paddingHorizontal: 12,
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: t.card,
		},
		autoText: { color: t.text, fontWeight: "700", fontSize: 14 },
		ringActive: { borderColor: t.accent },
		swatch: {
			flex: 1,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: "#88888855",
		},
		pickerSwatch: {
			alignItems: "center",
			justifyContent: "center",
			borderStyle: "dashed",
			borderColor: t.text + "88",
		},
		pressed: { opacity: 0.6 },
		input: {
			backgroundColor: t.background,
			color: readableOn(t.background),
			borderRadius: 8,
			borderWidth: 1,
			borderColor: "transparent",
			paddingHorizontal: 14,
			paddingVertical: 10,
			fontSize: 14,
			marginTop: 12,
		},
		error: { color: DANGER, fontSize: 13, lineHeight: 18, marginTop: 8 },
		btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
		btn: {
			maxWidth: "100%",
			backgroundColor: t.accent,
			paddingHorizontal: 16,
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
};
