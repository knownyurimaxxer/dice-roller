import { useEffect, useMemo, useState } from "react";
import {
	GestureResponderEvent,
	KeyboardAvoidingView,
	LayoutChangeEvent,
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
import { hexToHsl, hslToHex, normalizeHex } from "../utils/color";
import { readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";

type Props = {
	visible: boolean;
	/** What is being colored, e.g. "Background". Shown as the title. */
	title: string;
	/** The color it has now, as #RRGGBB. */
	value: string;
	onApply: (hex: string) => void;
	onClose: () => void;
};

const DANGER = "#FF4D4D";
const THUMB = 28;
const SEGMENTS = 36;

type SliderProps = {
	label: string;
	value: number;
	max: number;
	/** The color of the track at 0..1 of its length. */
	colorAt: (fraction: number) => string;
	onChange: (value: number) => void;
};

/** A pill-shaped slider whose track is painted with the colors it controls. */
function Slider({ label, value, max, colorAt, onChange }: SliderProps) {
	const theme = useTheme();
	const [width, setWidth] = useState(0);
	const s = useMemo(() => makeStyles(theme), [theme]);
	const fraction = Math.min(1, Math.max(0, value / max));

	const set = (x: number) => {
		if (width <= THUMB) return;
		const f = (x - THUMB / 2) / (width - THUMB);
		onChange(Math.min(1, Math.max(0, f)) * max);
	};
	const touch = (e: GestureResponderEvent) => set(e.nativeEvent.locationX);

	return (
		<View style={{ marginTop: 14 }}>
			<View style={s.sliderHead}>
				<Text style={s.sliderLabel}>{label}</Text>
				<Text style={s.sliderValue}>{Math.round(value)}</Text>
			</View>
			<View
				style={s.sliderHit}
				onLayout={(e: LayoutChangeEvent) =>
					setWidth(e.nativeEvent.layout.width)
				}
				onStartShouldSetResponder={() => true}
				onMoveShouldSetResponder={() => true}
				onResponderTerminationRequest={() => false}
				onResponderGrant={touch}
				onResponderMove={touch}
				accessible
				accessibilityRole="adjustable"
				accessibilityLabel={label}
				accessibilityValue={{
					min: 0,
					max: Math.round(max),
					now: Math.round(value),
				}}
				accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
				onAccessibilityAction={(e) => {
					const step = max / 20;
					const next =
						e.nativeEvent.actionName === "increment"
							? value + step
							: value - step;
					onChange(Math.min(max, Math.max(0, next)));
				}}
			>
				<View style={s.track} pointerEvents="none">
					{Array.from({ length: SEGMENTS }, (_, i) => (
						<View
							key={i}
							style={{
								flex: 1,
								backgroundColor: colorAt(i / (SEGMENTS - 1)),
							}}
						/>
					))}
				</View>
				<View
					pointerEvents="none"
					style={[
						s.thumb,
						{
							left: fraction * Math.max(0, width - THUMB),
							backgroundColor: colorAt(fraction),
						},
					]}
				/>
			</View>
		</View>
	);
}

/**
 * Pick any color: hue / saturation / lightness sliders, or type the hex code.
 * Nothing changes in the app until "Apply".
 */
export default function ColorPicker({
	visible,
	title,
	value,
	onApply,
	onClose,
}: Props) {
	const theme = useTheme();
	const { t } = useI18n();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const [hsl, setHsl] = useState(() => hexToHsl(value));
	const [draft, setDraft] = useState(value);
	const [typing, setTyping] = useState(false);

	// Start from the current color every time the picker opens.
	useEffect(() => {
		if (!visible) return;
		setHsl(hexToHsl(value));
		setDraft(normalizeHex(value) ?? "#000000");
		setTyping(false);
	}, [visible, value]);

	const hex = hslToHex(hsl.h, hsl.s, hsl.l);
	const invalid = typing && normalizeHex(draft) === null;

	const setSlider = (patch: Partial<typeof hsl>) => {
		const next = { ...hsl, ...patch };
		setHsl(next);
		setDraft(hslToHex(next.h, next.s, next.l));
		setTyping(false);
	};

	const onType = (text: string) => {
		setDraft(text);
		setTyping(true);
		const n = normalizeHex(text);
		// Keep the hue when the typed color is the one we already show
		// (a gray has no hue of its own, and we don't want it to jump to 0).
		if (n && n !== hex) setHsl(hexToHsl(n));
	};

	const onBlur = () => {
		setTyping(false);
		setDraft(hex);
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
					<Text style={s.title}>{title}</Text>

					<View style={[s.preview, { backgroundColor: hex }]}>
						<Text
							style={{
								color: readableOn(hex),
								fontWeight: "800",
								fontSize: 16,
							}}
						>
							{hex}
						</Text>
					</View>

					<Slider
						label={t("color.hue")}
						value={hsl.h}
						max={360}
						colorAt={(f) => hslToHex(f * 360, 100, 50)}
						onChange={(h) => setSlider({ h })}
					/>
					<Slider
						label={t("color.saturation")}
						value={hsl.s}
						max={100}
						colorAt={(f) => hslToHex(hsl.h, f * 100, hsl.l)}
						onChange={(sat) => setSlider({ s: sat })}
					/>
					<Slider
						label={t("color.lightness")}
						value={hsl.l}
						max={100}
						colorAt={(f) => hslToHex(hsl.h, hsl.s, f * 100)}
						onChange={(l) => setSlider({ l })}
					/>

					<Text style={[s.sliderLabel, { marginTop: 16 }]}>
						{t("color.hex")}
					</Text>
					<TextInput
						style={[s.hexInput, invalid && { borderColor: DANGER }]}
						value={draft}
						onChangeText={onType}
						onBlur={onBlur}
						placeholder="#RRGGBB"
						placeholderTextColor={theme.text + "77"}
						maxLength={7}
						autoCapitalize="characters"
						autoCorrect={false}
						autoComplete="off"
						spellCheck={false}
						returnKeyType="done"
					/>

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
							style={s.btn}
							onPress={() => {
								haptic("buttons");
								onApply(hex);
							}}
						>
							<Text style={s.btnText}>{t("color.apply")}</Text>
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
		preview: {
			height: 56,
			borderRadius: 8,
			marginTop: 14,
			alignItems: "center",
			justifyContent: "center",
			borderWidth: 1,
			borderColor: "#88888855",
		},
		sliderHead: {
			flexDirection: "row",
			justifyContent: "space-between",
			marginBottom: 6,
		},
		sliderLabel: { color: t.text, fontWeight: "700", fontSize: 13 },
		sliderValue: { color: t.text + "99", fontSize: 13 },
		sliderHit: { height: THUMB, justifyContent: "center" },
		track: {
			flexDirection: "row",
			height: 18,
			borderRadius: 9,
			overflow: "hidden",
			borderWidth: 1,
			borderColor: "#88888855",
		},
		// The thumb is filled with the color under it and ringed in the
		// accent, so it shows on every track (same idea as the swatches).
		thumb: {
			position: "absolute",
			top: 0,
			width: THUMB,
			height: THUMB,
			borderRadius: THUMB / 2,
			borderWidth: 3,
			borderColor: t.accent,
		},
		hexInput: {
			backgroundColor: t.background,
			color: readableOn(t.background),
			borderRadius: 8,
			borderWidth: 1,
			borderColor: "transparent",
			paddingHorizontal: 14,
			paddingVertical: 10,
			fontSize: 15,
			marginTop: 6,
		},
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
