import { Fragment, ReactNode, useMemo, useState } from "react";
import {
	Linking,
	Platform,
	Pressable,
	ScrollView,
	Share,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
	HAPTIC_LABELS,
	HAPTIC_STRENGTH,
	HAPTIC_TRIGGERS,
	LINKS,
	PRESET_LABELS,
	PRESETS,
	ROLE_LABELS,
	SWATCHES,
} from "../constants";
import { LANGUAGES, makeTranslator, SYSTEM_LANGUAGE } from "../i18n";
import { useI18n } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Settings, Theme, UpdateSetting } from "../types";
import { readableOn } from "../utils/format";
import { haptic, playHaptic, previewStrength } from "../utils/haptics";
import type { Layout } from "../utils/orientation";
import { previewSound } from "../utils/sound";
import { exportTheme } from "../utils/themeIO";
import { THROW_SENSITIVITY_MAX, THROW_SENSITIVITY_MIN } from "../utils/throw";
import ColorPicker from "./ColorPicker";
import SensitivitySlider from "./SensitivitySlider";
import Segmented from "./Segmented";
import Sheet from "./Sheet";
import StepSlider from "./StepSlider";
import ThemeImportModal from "./ThemeImportModal";

type Props = {
	visible: boolean;
	settings: Settings;
	update: UpdateSetting;
	onClose: () => void;
};

const open = (url: string) => {
	Linking.openURL(url).catch((e) =>
		console.warn("Could not open link", url, e),
	);
};

/**
 * Fills a translated sentence such as "Made by {developer}." with the links
 * that belong in its {placeholders}, wherever the language puts them.
 */
function fill(template: string, parts: Record<string, ReactNode>): ReactNode[] {
	return template.split(/(\{\w+\})/).map((chunk, i) => {
		const name = chunk.match(/^\{(\w+)\}$/)?.[1];
		return name && name in parts ? (
			<Fragment key={i}>{parts[name]}</Fragment>
		) : (
			chunk
		);
	});
}

export default function SettingsModal({
	visible,
	settings,
	update,
	onClose,
}: Props) {
	const theme = useTheme();
	const { t, systemLanguage } = useI18n();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const roles = Object.keys(SWATCHES) as (keyof Theme)[];
	const [languagesOpen, setLanguagesOpen] = useState(false);
	const [hapticsOpen, setHapticsOpen] = useState(false);
	// Which color role the custom color picker is open for, if any.
	const [pickerRole, setPickerRole] = useState<keyof Theme | null>(null);
	const [importOpen, setImportOpen] = useState(false);

	/** Hands the theme to the share sheet (copy it, send it, save it...). */
	const onExportTheme = async () => {
		haptic("buttons");
		try {
			await Share.share({ message: exportTheme(settings.theme) });
		} catch (e) {
			console.warn("Could not share the theme", e);
		}
	};

	// "System default" is written in the phone's language (the one it would
	// switch to), like every other option is written in its own language.
	const systemLang =
		LANGUAGES.find((l) => l.code === systemLanguage) ?? LANGUAGES[0];
	const languageOptions = [
		{
			code: SYSTEM_LANGUAGE,
			title: makeTranslator(systemLang.messages)("settings.languageSystem"),
			detail: systemLang.name,
		},
		...LANGUAGES.map((l) => ({
			code: l.code,
			title: l.name,
			detail: undefined,
		})),
	];
	// An unknown saved code (a removed language) counts as "system".
	const chosenLanguage = LANGUAGES.some((l) => l.code === settings.language)
		? settings.language
		: SYSTEM_LANGUAGE;
	const currentLanguage =
		languageOptions.find((o) => o.code === chosenLanguage) ??
		languageOptions[0];

	const link = (label: string, url: string) => (
		<Text style={s.link} accessibilityRole="link" onPress={() => open(url)}>
			{label}
		</Text>
	);
	const languageLabel = (option: (typeof languageOptions)[number]) => (
		<View style={{ flex: 1 }}>
			<Text style={s.rowTitle}>{option.title}</Text>
			{option.detail && <Text style={s.rowHint}>{option.detail}</Text>}
		</View>
	);
	const track = { true: theme.accent, false: "#88888888" };
	const orientationOptions: { key: Layout; label: string }[] = [
		{ key: "portrait", label: t("settings.orientationPortrait") },
		{ key: "landscape", label: t("settings.orientationLandscape") },
	];

	return (
		<Sheet visible={visible} title={t("settings.title")} onClose={onClose}>
			<ScrollView
				contentContainerStyle={{ padding: 16 }}
				keyboardShouldPersistTaps="handled"
			>
				{/* language: new languages appear here by themselves (see src/i18n).
				    Closed it is one row, so a long list never takes over the page. */}
				<Text style={s.section}>{t("settings.language")}</Text>
				<View style={s.langCard}>
					<Pressable
						accessibilityRole="button"
						accessibilityState={{ expanded: languagesOpen }}
						onPress={() => setLanguagesOpen((o) => !o)}
						style={({ pressed }) => [s.langRow, pressed && s.langPressed]}
					>
						{languageLabel(currentLanguage)}
						<Ionicons
							name={languagesOpen ? "chevron-up" : "chevron-down"}
							size={22}
							color={theme.text}
						/>
					</Pressable>
					{languagesOpen && (
						<ScrollView
							nestedScrollEnabled
							style={s.langList}
							keyboardShouldPersistTaps="handled"
						>
							{languageOptions.map((option) => {
								const selected = option.code === chosenLanguage;
								return (
									<Pressable
										key={option.code}
										accessibilityRole="radio"
										accessibilityState={{ selected }}
										onPress={() => {
											update("language", option.code);
											setLanguagesOpen(false);
										}}
										style={({ pressed }) => [
											s.langRow,
											s.langRowBorder,
											pressed && s.langPressed,
										]}
									>
										{languageLabel(option)}
										{selected && (
											<Ionicons
												name="checkmark"
												size={22}
												color={theme.accent}
											/>
										)}
									</Pressable>
								);
							})}
						</ScrollView>
					)}
				</View>
				<Text style={[s.rowHint, s.langHint]}>
					{t("settings.languageHint")}
				</Text>

				{/* sound: one switch for the throw (rolling + clashing), one for the result */}
				<Text style={[s.section, { marginTop: 24 }]}>
					{t("settings.sound")}
				</Text>
				<View style={s.row}>
					<View style={{ flex: 1, paddingRight: 12 }}>
						<Text style={s.rowTitle}>{t("settings.soundThrow")}</Text>
						<Text style={s.rowHint}>{t("settings.soundThrowHint")}</Text>
					</View>
					<Switch
						value={settings.soundThrow}
						onValueChange={(v) => {
							update("soundThrow", v);
							if (v) previewSound("roll"); // a taste of it
						}}
						trackColor={track}
					/>
				</View>
				<View style={[s.row, { marginTop: 12 }]}>
					<View style={{ flex: 1, paddingRight: 12 }}>
						<Text style={s.rowTitle}>{t("settings.soundResult")}</Text>
						<Text style={s.rowHint}>{t("settings.soundResultHint")}</Text>
					</View>
					<Switch
						value={settings.soundResult}
						onValueChange={(v) => {
							update("soundResult", v);
							if (v) previewSound("result");
						}}
						trackColor={track}
					/>
				</View>

				{/* haptics: one master switch; once on, a closed list of per-step switches */}
				<Text style={[s.section, { marginTop: 24 }]}>
					{t("settings.haptics")}
				</Text>
				<View style={s.row}>
					<View style={{ flex: 1, paddingRight: 12 }}>
						<Text style={s.rowTitle}>{t("settings.hapticsToggle")}</Text>
						<Text style={s.rowHint}>{t("settings.hapticsHint")}</Text>
					</View>
					<Switch
						value={settings.hapticsEnabled}
						onValueChange={(v) => {
							update("hapticsEnabled", v);
							if (v)
								playHaptic("buttons"); // a taste of it
							else setHapticsOpen(false);
						}}
						trackColor={track}
					/>
				</View>
				{/* strength: Android only (the effects it uses don't exist elsewhere) */}
				{settings.hapticsEnabled && Platform.OS === "android" && (
					<View style={[s.rowBlock, { marginTop: 12 }]}>
						<Text style={s.rowTitle}>{t("settings.hapticsStrength")}</Text>
						<Text style={[s.rowHint, { marginBottom: 10 }]}>
							{t("settings.hapticsStrengthHint")}
						</Text>
						<StepSlider
							label={t("settings.hapticsStrength")}
							value={settings.hapticLevel}
							max={HAPTIC_STRENGTH.max}
							onChange={(step) => {
								update("hapticLevel", step);
								previewStrength(step); // feel it as you drag
							}}
						/>
					</View>
				)}
				{settings.hapticsEnabled && (
					<View style={[s.langCard, { marginTop: 12 }]}>
						<Pressable
							accessibilityRole="button"
							accessibilityState={{ expanded: hapticsOpen }}
							onPress={() => setHapticsOpen((o) => !o)}
							style={({ pressed }) => [s.langRow, pressed && s.langPressed]}
						>
							<View style={{ flex: 1 }}>
								<Text style={s.rowTitle}>{t("settings.hapticsTriggers")}</Text>
							</View>
							<Ionicons
								name={hapticsOpen ? "chevron-up" : "chevron-down"}
								size={22}
								color={theme.text}
							/>
						</Pressable>
						{hapticsOpen &&
							HAPTIC_TRIGGERS.map((id) => (
								<View key={id} style={[s.langRow, s.langRowBorder]}>
									<View style={{ flex: 1, paddingRight: 12 }}>
										<Text style={s.rowTitle}>{t(HAPTIC_LABELS[id])}</Text>
									</View>
									<Switch
										value={settings.haptics[id]}
										onValueChange={(v) => {
											update("haptics", { ...settings.haptics, [id]: v });
											if (v) playHaptic(id); // preview
										}}
										trackColor={track}
									/>
								</View>
							))}
					</View>
				)}

				{/* gestures: swipe up, or throw the phone, to roll the dice */}
				<Text style={[s.section, { marginTop: 24 }]}>
					{t("settings.gestures")}
				</Text>
				<View style={s.row}>
					<View style={{ flex: 1, paddingRight: 12 }}>
						<Text style={s.rowTitle}>{t("settings.swipeToRoll")}</Text>
						<Text style={s.rowHint}>{t("settings.swipeToRollHint")}</Text>
					</View>
					<Switch
						value={settings.swipeToRoll}
						onValueChange={(v) => {
							update("swipeToRoll", v);
							if (v) playHaptic("buttons"); // a taste of it
						}}
						trackColor={track}
					/>
				</View>
				<View style={[s.row, { marginTop: 12 }]}>
					<View style={{ flex: 1, paddingRight: 12 }}>
						<Text style={s.rowTitle}>{t("settings.throwToRoll")}</Text>
						<Text style={s.rowHint}>{t("settings.throwToRollHint")}</Text>
					</View>
					<Switch
						value={settings.throwToRoll}
						onValueChange={(v) => {
							update("throwToRoll", v);
							if (v) playHaptic("buttons"); // a taste of it
						}}
						trackColor={track}
					/>
				</View>
				{settings.throwToRoll && (
					<View style={[s.rowBlock, { marginTop: 12 }]}>
						<Text style={s.rowTitle}>{t("settings.throwSensitivity")}</Text>
						<SensitivitySlider
							value={settings.throwSensitivity}
							min={THROW_SENSITIVITY_MIN}
							max={THROW_SENSITIVITY_MAX}
							onChange={(v) => update("throwSensitivity", v)}
							accessibilityLabel={t("settings.throwSensitivity")}
						/>
						<View style={s.sliderEnds}>
							<Text style={s.sliderEnd}>{t("settings.throwLow")}</Text>
							<Text style={s.sliderEnd}>{t("settings.throwHigh")}</Text>
						</View>
						<Text style={s.rowHint}>{t("settings.throwSensitivityHint")}</Text>
					</View>
				)}

				{/* screen: stays vertical or horizontal, never rotates by itself */}
				<Text style={[s.section, { marginTop: 24 }]}>
					{t("settings.orientation")}
				</Text>
				<View style={s.rowBlock}>
					<Segmented
						options={orientationOptions}
						value={settings.orientation}
						onChange={(layout) => update("orientation", layout)}
					/>
					<Text style={[s.rowHint, { marginTop: 10 }]}>
						{t("settings.orientationHint")}
					</Text>
				</View>

				{/* theme */}
				<Text style={[s.section, { marginTop: 24 }]}>
					{t("settings.theme")}
				</Text>
				<Text style={s.sectionTitle}>{t("settings.presets")}</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 8 }}
				>
					{Object.entries(PRESETS).map(([name, p]) => (
						<Pressable
							key={name}
							onPress={() => {
								haptic("buttons");
								update("theme", p);
							}}
							style={[
								s.preset,
								{ backgroundColor: p.background, borderColor: p.accent },
							]}
						>
							<View style={[s.presetCard, { backgroundColor: p.card }]}>
								<View
									style={{
										height: 6,
										width: 26,
										borderRadius: 3,
										backgroundColor: p.text,
										marginBottom: 4,
									}}
								/>
								<View
									style={{
										height: 6,
										width: 16,
										borderRadius: 3,
										backgroundColor: p.accent,
									}}
								/>
							</View>
							<Text
								style={{
									color: readableOn(p.background),
									fontSize: 12,
									marginTop: 4,
								}}
							>
								{PRESET_LABELS[name] ? t(PRESET_LABELS[name]) : name}
							</Text>
						</Pressable>
					))}
				</ScrollView>

				{roles.map((role) => (
					<View key={role} style={{ marginTop: 8 }}>
						<Text style={s.sectionTitle}>{t(ROLE_LABELS[role])}</Text>
						<View style={s.swatchRow}>
							{SWATCHES[role].map((c) => (
								<Pressable
									key={c}
									accessibilityRole="button"
									accessibilityState={{ selected: settings.theme[role] === c }}
									onPress={() => {
										haptic("buttons");
										update("theme", { ...settings.theme, [role]: c });
									}}
									style={[
										s.swatchRing,
										settings.theme[role] === c && s.swatchRingActive,
									]}
								>
									<View style={[s.swatch, { backgroundColor: c }]} />
								</Pressable>
							))}
							{/* A color picked with the color picker isn't one of the
							    ready-made swatches: show it (selected) in the row. */}
							{!SWATCHES[role].some(
								(c) => c.toUpperCase() === settings.theme[role].toUpperCase(),
							) && (
								<Pressable
									accessibilityRole="button"
									accessibilityState={{ selected: true }}
									onPress={() => setPickerRole(role)}
									style={[s.swatchRing, s.swatchRingActive]}
								>
									<View
										style={[
											s.swatch,
											{ backgroundColor: settings.theme[role] },
										]}
									/>
								</Pressable>
							)}
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={t("color.custom")}
								onPress={() => {
									haptic("buttons");
									setPickerRole(role);
								}}
								style={({ pressed }) => [s.swatchRing, pressed && s.pressed]}
							>
								<View style={[s.swatch, s.pickerSwatch]}>
									<Ionicons
										name="color-palette"
										size={20}
										color={readableOn(theme.background)}
									/>
								</View>
							</Pressable>
						</View>
					</View>
				))}

				{/* share a theme with other apps that name their colors the same */}
				<Text style={[s.sectionTitle, { marginTop: 16 }]}>
					{t("settings.themeTransfer")}
				</Text>
				<View style={s.btnRow}>
					<Pressable style={s.btn} onPress={onExportTheme}>
						<Text style={s.btnText}>{t("settings.exportTheme")}</Text>
					</Pressable>
					<Pressable
						style={[s.btn, s.btnGhost]}
						onPress={() => {
							haptic("buttons");
							setImportOpen(true);
						}}
					>
						<Text style={[s.btnText, { color: theme.accent }]}>
							{t("settings.importTheme")}
						</Text>
					</Pressable>
				</View>

				{/* about / credits */}
				<Text style={[s.section, { marginTop: 24 }]}>{t("credits.about")}</Text>
				<View style={s.rowBlock}>
					<Text style={s.body}>
						{fill(t("credits.icons"), {
							ionicons: link("Ionicons", LINKS.ionicons),
							ionic: link("@ionic", LINKS.ionic),
						})}
					</Text>
					<Text style={[s.body, { marginTop: 8 }]}>
						{fill(t("credits.madeBy"), {
							developer: link("@knownyurimaxxer", LINKS.developer),
						})}
					</Text>
					<Text style={[s.rowHint, { marginTop: 12 }]}>
						{t("credits.kofi")}
					</Text>
				</View>
				<Pressable
					accessibilityRole="link"
					onPress={() => open(LINKS.kofi)}
					style={({ pressed }) => [
						s.outlineBtn,
						{ borderColor: theme.accent },
						pressed && s.pressed,
					]}
				>
					<Text style={[s.outlineBtnText, { color: theme.accent }]}>Ko-fi</Text>
				</Pressable>
			</ScrollView>
			<ColorPicker
				visible={pickerRole !== null}
				title={pickerRole ? t(ROLE_LABELS[pickerRole]) : ""}
				value={pickerRole ? settings.theme[pickerRole] : "#000000"}
				onApply={(hex) => {
					if (pickerRole)
						update("theme", { ...settings.theme, [pickerRole]: hex });
					setPickerRole(null);
				}}
				onClose={() => setPickerRole(null)}
			/>
			<ThemeImportModal
				visible={importOpen}
				onApply={(imported) => {
					update("theme", imported);
					setImportOpen(false);
				}}
				onClose={() => setImportOpen(false)}
			/>
		</Sheet>
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
		langCard: {
			backgroundColor: t.card,
			borderRadius: 8,
			overflow: "hidden",
		},
		langRow: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 14,
			paddingVertical: 12,
		},
		langRowBorder: {
			borderTopWidth: StyleSheet.hairlineWidth,
			borderTopColor: t.text + "33",
		},
		langList: { maxHeight: 280 },
		langPressed: { backgroundColor: t.text + "14" },
		langHint: { color: onBg, opacity: 0.7, marginTop: 8 },
		rowTitle: { color: t.text, fontWeight: "700", fontSize: 15 },
		rowHint: {
			color: t.text + "99",
			fontSize: 13,
			marginTop: 4,
			lineHeight: 18,
		},
		sliderEnds: {
			flexDirection: "row",
			justifyContent: "space-between",
			marginBottom: 4,
		},
		sliderEnd: { color: t.text + "99", fontSize: 12, fontWeight: "700" },
		preset: {
			width: 84,
			padding: 8,
			borderRadius: 8,
			borderWidth: 2,
			alignItems: "center",
		},
		presetCard: { width: "100%", borderRadius: 4, padding: 6 },
		swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
		// The selected swatch gets two rings: a gap in the background color,
		// then the accent color around it, so it shows even when the swatch IS the accent.
		swatchRing: {
			width: 46,
			height: 46,
			borderRadius: 23,
			borderWidth: 2,
			borderColor: "transparent",
			padding: 3,
			backgroundColor: t.background,
		},
		swatchRingActive: { borderColor: t.accent },
		swatch: {
			flex: 1,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: "#88888855",
		},
		// The button that opens the color picker: an empty circle with a palette.
		pickerSwatch: {
			alignItems: "center",
			justifyContent: "center",
			borderStyle: "dashed",
			borderColor: onBg + "88",
		},
		// Buttons wrap to the next line, and a long label wraps inside its button.
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
		// Full-width outlined button (Ko-fi); the caller sets the color.
		outlineBtn: {
			alignSelf: "stretch",
			alignItems: "center",
			marginTop: 12,
			paddingVertical: 12,
			paddingHorizontal: 14,
			borderRadius: 10,
			borderWidth: 1,
		},
		outlineBtnText: { fontWeight: "700", fontSize: 14, textAlign: "center" },
		pressed: { opacity: 0.6 },
		body: { color: t.text, fontSize: 14, lineHeight: 20 },
		link: {
			color: t.accent,
			fontWeight: "600",
			textDecorationLine: "underline",
		},
	});
};
