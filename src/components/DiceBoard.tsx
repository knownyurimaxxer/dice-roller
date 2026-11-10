import {
	Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import type { Insets } from "../dice/bounds";
import { DiceEngine, EngineEvents } from "../dice/engine";
import type { Throw } from "../dice/plan";
import { DiceStyle, Theme } from "../types";

export type DiceBoardHandle = {
	/**
	 * Throws the dice. Returns false when the 3D board isn't available. Right
	 * after launch the board may still be starting: the throw then waits for it.
	 */
	throwDice: (plan: Throw[]) => boolean;
	/** Takes the dice off the board. */
	clear: () => void;
};

type Props = {
	ref?: Ref<DiceBoardHandle>;
	theme: Theme;
	/** How the dice look: see-through, number color, picture. */
	dice: DiceStyle;
	/**
	 * The parts of the screen the dice must stay out of (the header, where the
	 * buttons are...), in dp. The dice bounce off these lines.
	 */
	keepClear: { top: number; bottom: number; left: number; right: number };
	onImpact: EngineEvents["onImpact"];
	onSettled: EngineEvents["onSettled"];
	/** The 3D board couldn't start. `waiting` is a throw that was asked for and never happened. */
	onUnavailable: (waiting: Throw[] | null) => void;
};

/**
 * The whole screen, as the floor the dice are thrown on. All the work is done
 * by DiceEngine; this only gives it a GL context, keeps it up to date with the
 * theme and the screen, and passes on what happens (impacts, the final result).
 */
export default function DiceBoard({
	ref,
	theme,
	dice,
	keepClear,
	onImpact,
	onSettled,
	onUnavailable,
}: Props) {
	const engine = useRef<DiceEngine | null>(null);
	const failed = useRef(false);
	const waiting = useRef<Throw[] | null>(null);
	const size = useRef({ width: 0, height: 0 });
	const latest = useRef({
		theme,
		dice,
		keepClear,
		onImpact,
		onSettled,
		onUnavailable,
	});
	useEffect(() => {
		latest.current = {
			theme,
			dice,
			keepClear,
			onImpact,
			onSettled,
			onUnavailable,
		};
	});

	/** The clear areas as fractions of the surface (what the engine works with). */
	const fractions = useCallback((): Insets => {
		const { width, height } = size.current;
		const k = latest.current.keepClear;
		if (width <= 0 || height <= 0)
			return { top: 0, bottom: 0, left: 0, right: 0 };
		const f = (dp: number, of: number) => Math.max(0, Math.min(0.4, dp / of));
		return {
			top: f(k.top, height),
			bottom: f(k.bottom, height),
			left: f(k.left, width),
			right: f(k.right, width),
		};
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			throwDice: (plan) => {
				if (engine.current) {
					engine.current.throwDice(plan);
					return true;
				}
				if (failed.current) return false;
				waiting.current = plan; // the board is still starting
				return true;
			},
			clear: () => {
				waiting.current = null;
				engine.current?.clear();
			},
		}),
		[],
	);

	useEffect(() => {
		engine.current?.setTheme(theme);
	}, [theme]);

	useEffect(() => {
		engine.current?.setDice(dice);
	}, [dice]);

	const { top, bottom, left, right } = keepClear;
	useEffect(() => {
		engine.current?.setLayout(fractions());
	}, [top, bottom, left, right, fractions]);

	useEffect(
		() => () => {
			engine.current?.dispose();
			engine.current = null;
		},
		[],
	);

	const onContextCreate = useCallback(
		(gl: ExpoWebGLRenderingContext) => {
			try {
				engine.current = new DiceEngine(
					gl,
					latest.current.theme,
					latest.current.dice,
					{
						onImpact: (strength, dieOnDie) =>
							latest.current.onImpact(strength, dieOnDie),
						onSettled: (read, plan) => latest.current.onSettled(read, plan),
					},
					fractions(),
				);
				if (waiting.current) {
					engine.current.throwDice(waiting.current);
					waiting.current = null;
				}
			} catch (e) {
				// No 3D here: the screen rolls with plain random numbers instead.
				console.warn("Could not start the 3D board", e);
				engine.current = null;
				failed.current = true;
				const plan = waiting.current;
				waiting.current = null;
				latest.current.onUnavailable(plan);
			}
		},
		[fractions],
	);

	const onLayout = useCallback(
		(e: LayoutChangeEvent) => {
			size.current = {
				width: e.nativeEvent.layout.width,
				height: e.nativeEvent.layout.height,
			};
			engine.current?.setLayout(fractions());
		},
		[fractions],
	);

	return (
		<GLView
			style={StyleSheet.absoluteFill}
			onContextCreate={onContextCreate}
			onLayout={onLayout}
		/>
	);
}
