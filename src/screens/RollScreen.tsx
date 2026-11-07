import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Easing,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DiceBoard, { DiceBoardHandle } from "../components/DiceBoard";
import DiceSelector from "../components/DiceSelector";
import FavoritesModal from "../components/FavoritesModal";
import HistoryModal from "../components/HistoryModal";
import NamePrompt from "../components/NamePrompt";
import ResultOverlay, { Shown } from "../components/ResultOverlay";
import Segmented from "../components/Segmented";
import SettingsModal from "../components/SettingsModal";
import { collectValues, planThrow, Throw } from "../dice/plan";
import {
	CombineMode,
	emptySpec,
	evaluate,
	Favorite,
	kindCount,
	maxPossible,
	RollMode,
	RollSpec,
	ROLL_MODES,
	setMode,
	specLabel,
	totalDice,
} from "../dice/roll";
import { useFavorites } from "../hooks/useFavorites";
import { useHistory } from "../hooks/useHistory";
import { useI18n } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Settings, Theme, UpdateSetting } from "../types";
import { mixColors, readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";
import { playClash, playResult, playRoll } from "../utils/sound";

type Props = {
	settings: Settings;
	updateSetting: UpdateSetting;
	/** Called once the screen has been drawn (App hides the splash screen then). */
	onReady: () => void;
};

type SheetName = "history" | "favorites" | "settings" | null;
/**
 * setup: the menu is up and you choose the dice.
 * rolling: the menu has rolled down and the dice are in the air.
 * result: the dice have stopped and the result is announced.
 */
type Phase = "setup" | "rolling" | "result";

/** Height of the logo / icons row, which the dice stay out of. */
const HEADER_HEIGHT = 56;
/** How long the menu takes to roll away before the dice are thrown. */
const MENU_MS = 240;

export default function RollScreen({
	settings,
	updateSetting,
	onReady,
}: Props) {
	const theme = useTheme();
	const { t } = useI18n();
	const insets = useSafeAreaInsets();
	const { height } = useWindowDimensions();
	const s = useMemo(() => makeStyles(theme), [theme]);

	const favs = useFavorites();
	const hist = useHistory();
	const board = useRef<DiceBoardHandle>(null);
	const pending = useRef<{ spec: RollSpec; plan: Throw[] } | null>(null);
	const resultId = useRef(0);
	const lastBuzz = useRef(0);
	const launch = useRef<ReturnType<typeof setTimeout> | null>(null);
	const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [spec, setSpec] = useState<RollSpec>(settings.lastSpec);
	const [phase, setPhase] = useState<Phase>("setup");
	const [hasRolled, setHasRolled] = useState(false);
	const [shown, setShown] = useState<Shown | null>(null);
	const [saved, setSaved] = useState(false);
	const [sheet, setSheet] = useState<SheetName>(null);
	const [savePrompt, setSavePrompt] = useState<{
		spec: RollSpec;
		fromResult: boolean;
	} | null>(null);
	const [noBoard, setNoBoard] = useState(false);
	const [menuHeight, setMenuHeight] = useState(0);

	// 0: the menu is up, 1: it has rolled down out of sight.
	const slide = useRef(new Animated.Value(0)).current;

	useEffect(onReady, [onReady]);

	useEffect(() => {
		Animated.timing(slide, {
			toValue: phase === "setup" ? 0 : 1,
			duration: phase === "setup" ? 300 : MENU_MS,
			easing:
				phase === "setup" ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
			useNativeDriver: true,
		}).start();
	}, [phase, slide]);

	useEffect(
		() => () => {
			if (launch.current) clearTimeout(launch.current);
			if (watchdog.current) clearTimeout(watchdog.current);
		},
		[],
	);

	const changeSpec = useCallback(
		(next: RollSpec) => {
			setSpec(next);
			updateSetting("lastSpec", next);
		},
		[updateSetting],
	);

	const { add: addHistory } = hist;
	const finish = useCallback(
		(rolled: RollSpec, plan: Throw[], read: number[]) => {
			if (watchdog.current) clearTimeout(watchdog.current);
			const result = evaluate(rolled, collectValues(plan, read));
			const max = maxPossible(rolled);
			const perfect = max > 0 && result.total === max;
			setShown({ spec: rolled, result, perfect, id: ++resultId.current });
			setPhase("result");
			haptic("result");
			playResult(perfect);
			addHistory(rolled, result);
		},
		[addHistory],
	);

	/** No 3D board on this device: roll with plain random numbers instead. */
	const rollWithoutBoard = useCallback(
		(rolled: RollSpec, plan: Throw[]) => {
			pending.current = null;
			setNoBoard(true);
			const read = plan.map(
				(p) => 1 + Math.floor(Math.random() * (p.sides === 100 ? 10 : p.sides)),
			);
			setTimeout(() => finish(rolled, plan, read), 700);
		},
		[finish],
	);

	const roll = useCallback(
		(rolled: RollSpec) => {
			if (phase === "rolling" || totalDice(rolled) === 0) return;
			const plan = planThrow(rolled);
			pending.current = { spec: rolled, plan };
			setShown(null);
			setSaved(false);
			setHasRolled(true);
			// From the menu: let it roll down first, then throw. From the result
			// (rolling again) the menu is already gone, so throw right away.
			const wait = phase === "setup" ? MENU_MS : 0;
			setPhase("rolling");
			if (launch.current) clearTimeout(launch.current);
			launch.current = setTimeout(() => {
				haptic("throw");
				playRoll();
				if (!board.current?.throwDice(plan)) {
					rollWithoutBoard(rolled, plan);
					return;
				}
				// If the board never reports back (something broke), don't wait forever.
				watchdog.current = setTimeout(() => {
					const p = pending.current;
					if (p) rollWithoutBoard(p.spec, p.plan);
				}, 12000);
			}, wait);
		},
		[phase, rollWithoutBoard],
	);

	const onSettled = useCallback(
		(read: number[], plan: Throw[]) => {
			const p = pending.current;
			if (!p) return;
			pending.current = null;
			finish(p.spec, plan, read);
		},
		[finish],
	);

	const onUnavailable = useCallback(
		(waiting: Throw[] | null) => {
			// Nothing to say until someone actually rolls.
			const p = pending.current;
			if (waiting && p) rollWithoutBoard(p.spec, waiting);
		},
		[rollWithoutBoard],
	);

	const onImpact = useCallback((strength: number, dieOnDie: boolean) => {
		playClash(strength, dieOnDie);
		const now = Date.now();
		if (strength > 0.3 && now - lastBuzz.current > 90) {
			lastBuzz.current = now;
			haptic("clash");
		}
	}, []);

	const rollFavorite = (f: Favorite) => {
		setSheet(null);
		changeSpec(f.spec);
		roll(f.spec);
	};

	const open = (name: Exclude<SheetName, null>) => {
		haptic("buttons");
		setSheet(name);
	};

	const dice = totalDice(spec);
	const label = specLabel(spec);
	const iconColor = readableOn(theme.background);

	// The dice stay out of the header, and a little way in from the other edges.
	const keepClear = {
		top: insets.top + HEADER_HEIGHT,
		bottom: insets.bottom + 16,
		left: insets.left + 12,
		right: insets.right + 12,
	};

	const modeOptions = ROLL_MODES.map((m: RollMode) => ({
		key: m,
		label: t(`roll.mode.${m}`),
	}));
	const combineOptions: { key: CombineMode; label: string }[] = [
		{ key: "total", label: t("roll.combine.total") },
		{ key: "separate", label: t("roll.combine.separate") },
	];

	const menuY = slide.interpolate({
		inputRange: [0, 1],
		outputRange: [0, menuHeight + 48],
	});

	return (
		<View style={s.root}>
			{/* The whole screen is the board. */}
			<DiceBoard
				ref={board}
				theme={theme}
				keepClear={keepClear}
				onImpact={onImpact}
				onSettled={onSettled}
				onUnavailable={onUnavailable}
			/>
			{/* Header: no background, just the name and the buttons over the board. */}
			<View
				pointerEvents="box-none"
				style={[
					s.header,
					{
						paddingTop: insets.top,
						paddingLeft: insets.left + 14,
						paddingRight: insets.right + 14,
					},
				]}
			>
				<View style={s.headerRow}>
					<View style={s.headerIcons}>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("history.title")}
							hitSlop={10}
							onPress={() => open("history")}
						>
							<Ionicons name="time-outline" size={26} color={iconColor} />
						</Pressable>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("favorites.title")}
							hitSlop={10}
							onPress={() => open("favorites")}
							style={{ marginLeft: 20 }}
						>
							<Ionicons name="star-outline" size={26} color={iconColor} />
						</Pressable>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("settings.title")}
							hitSlop={10}
							onPress={() => open("settings")}
							style={{ marginLeft: "auto" }}
						>
							<Ionicons name="settings-outline" size={26} color={iconColor} />
						</Pressable>
					</View>
				</View>
			</View>
			{noBoard && (
				<Pressable
					style={[s.banner, { top: insets.top + HEADER_HEIGHT + 4 }]}
					onPress={() => setNoBoard(false)}
				>
					<Text style={s.bannerText}>{t("board.fallback")}</Text>
				</Pressable>
			)}
			{/* Before the first roll, a nudge in the empty space above the menu. */}
			{phase === "setup" && !hasRolled && (
				<View pointerEvents="none" style={[s.hint, { bottom: menuHeight }]}>
					<Text style={s.hintText}>{t("roll.hint")}</Text>
				</View>
			)}
			{/* The result, in the middle of the screen. */}
			{phase === "result" && shown && (
				<ResultOverlay
					shown={shown}
					saved={saved}
					onReconfigure={() => setPhase("setup")}
					onReroll={() => roll(shown.spec)}
					onSave={() => setSavePrompt({ spec: shown.spec, fromResult: true })}
				/>
			)}
			{/* The menu: rolls down out of sight when you roll, and back up to reconfigure. */}
			<Animated.View
				pointerEvents={phase === "setup" ? "auto" : "none"}
				onLayout={(e) => setMenuHeight(e.nativeEvent.layout.height)}
				style={[s.menu, { transform: [{ translateY: menuY }] }]}
			>
				<ScrollView
					style={{ maxHeight: height * 0.62 }}
					contentContainerStyle={[
						s.controls,
						{
							paddingBottom: insets.bottom + 14,
							paddingLeft: 14 + insets.left,
							paddingRight: 14 + insets.right,
						},
					]}
					bounces={false}
					keyboardShouldPersistTaps="handled"
				>
					<View style={s.specRow}>
						<Text style={s.spec} numberOfLines={1}>
							{label || t("roll.pickDice")}
						</Text>
						{dice > 0 && (
							<Pressable
								accessibilityRole="button"
								hitSlop={8}
								onPress={() => {
									haptic("buttons");
									changeSpec({
										...emptySpec(),
										mode: spec.mode,
										combine: spec.combine,
									});
								}}
							>
								<Text style={s.clear}>{t("roll.clear")}</Text>
							</Pressable>
						)}
					</View>
					<DiceSelector spec={spec} onChange={changeSpec} />
					<Segmented
						options={modeOptions}
						value={spec.mode}
						onChange={(mode) => changeSpec(setMode(spec, mode))}
					/>
					<Text style={s.modeHint}>{t(`roll.modeHint.${spec.mode}`)}</Text>
					{kindCount(spec) >= 2 && (
						<Segmented
							options={combineOptions}
							value={spec.combine}
							onChange={(combine) => changeSpec({ ...spec, combine })}
						/>
					)}
					<View style={s.actions}>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("roll.saveFavorite")}
							disabled={dice === 0}
							onPress={() => {
								haptic("buttons");
								setSavePrompt({ spec, fromResult: false });
							}}
							style={[s.starBtn, dice === 0 && s.disabled]}
						>
							<Ionicons name="star-outline" size={24} color={theme.accent} />
						</Pressable>
						<Pressable
							accessibilityRole="button"
							disabled={dice === 0}
							onPress={() => roll(spec)}
							style={({ pressed }) => [
								s.rollBtn,
								dice === 0 && s.disabled,
								pressed && s.pressed,
							]}
						>
							<Ionicons
								name="dice-outline"
								size={26}
								color={readableOn(theme.accent)}
							/>
							<Text style={s.rollText}>{t("roll.button")}</Text>
						</Pressable>
					</View>
				</ScrollView>
			</Animated.View>
			<NamePrompt
				visible={savePrompt !== null}
				title={t("favorites.saveTitle")}
				initial=""
				onCancel={() => setSavePrompt(null)}
				onSubmit={(name) => {
					const target = savePrompt;
					setSavePrompt(null);
					if (!target) return;
					favs
						.add(name, target.spec)
						.then(() => {
							if (target.fromResult) setSaved(true);
						})
						.catch((e) => console.warn("Could not save the favorite", e));
				}}
			/>
			<FavoritesModal
				visible={sheet === "favorites"}
				favorites={favs.favorites}
				onClose={() => setSheet(null)}
				onRoll={rollFavorite}
				onRename={(id, name) => favs.rename(id, name).catch(() => {})}
				onDelete={(id) => favs.remove(id).catch(() => {})}
			/>
			<HistoryModal
				visible={sheet === "history"}
				history={hist.history}
				onClose={() => setSheet(null)}
				onClear={() => hist.clear().catch(() => {})}
			/>
			<SettingsModal
				visible={sheet === "settings"}
				settings={settings}
				update={updateSetting}
				onClose={() => setSheet(null)}
			/>
		</View>
	);
}

const makeStyles = (t: Theme) => {
	const onBg = readableOn(t.background);
	return StyleSheet.create({
		root: { flex: 1, backgroundColor: t.background },
		// No background: the header floats over the board.
		header: { position: "absolute", top: 0, left: 0, right: 0 },
		headerRow: {
			height: HEADER_HEIGHT,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		logo: { width: 32, height: 32 },
		brandText: { color: onBg, fontSize: 20, fontWeight: "800" },
		headerIcons: {
			width: "100%",
			flexDirection: "row",
			alignItems: "center",
		},
		banner: {
			position: "absolute",
			left: 12,
			right: 12,
			backgroundColor: "#FF4D4D",
			padding: 10,
			borderRadius: 8,
		},
		bannerText: { color: "#fff", fontSize: 13 },
		hint: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			alignItems: "center",
			justifyContent: "center",
			paddingHorizontal: 32,
		},
		hintText: { color: onBg, opacity: 0.7, fontSize: 16, textAlign: "center" },
		menu: {
			position: "absolute",
			bottom: 0,
			alignSelf: "center",
			width: "100%",
			maxWidth: 640,
			backgroundColor: t.card,
			borderTopLeftRadius: 18,
			borderTopRightRadius: 18,
			overflow: "hidden",
		},
		controls: { paddingTop: 14, gap: 12 },
		specRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			minHeight: 22,
		},
		spec: { color: t.text, fontWeight: "800", fontSize: 16, flex: 1 },
		clear: {
			color: mixColors(t.text, t.card, 0.25),
			fontWeight: "700",
			fontSize: 14,
		},
		modeHint: {
			color: t.text + "99",
			fontSize: 12,
			marginTop: -6,
			textAlign: "center",
		},
		actions: { flexDirection: "row", gap: 10, alignItems: "stretch" },
		starBtn: {
			width: 54,
			alignItems: "center",
			justifyContent: "center",
			borderRadius: 14,
			borderWidth: 1.5,
			borderColor: t.accent,
		},
		rollBtn: {
			flex: 1,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			gap: 10,
			paddingVertical: 14,
			borderRadius: 14,
			backgroundColor: t.accent,
		},
		rollText: { color: readableOn(t.accent), fontWeight: "900", fontSize: 18 },
		disabled: { opacity: 0.4 },
		pressed: { opacity: 0.85 },
	});
};
