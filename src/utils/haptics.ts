import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { HAPTIC_STRENGTH, HapticTrigger } from "../constants";

/** How each trigger feels at full strength: the app's original vibrations. */
const FEEL: Record<HapticTrigger, () => Promise<void>> = {
	// Leaving the hand: a firm tap.
	throw: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
	// Dice hitting something: the lightest tap there is.
	clash: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
	// The number appears: a success buzz.
	result: () =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	// Taps on buttons: the faintest feel available.
	buttons: () => Haptics.selectionAsync(),
};

/**
 * Android: the system's own haptic effects (the ones other apps use, which
 * follow the phone's touch-feedback setting), from the softest step (0) up.
 * Below the top step (HAPTIC_STRENGTH.max) every trigger uses the effect of
 * the chosen step; the top step plays the original FEEL above. The order is a
 * best guess: if two steps feel the wrong way round on your phone, just swap
 * their lines here.
 */
const ANDROID_STEPS = [
	"Clock_Tick",
	"Keyboard_Tap",
	"Context_Click",
	"Virtual_Key",
	"Long_Press",
] as const;

/** Plays one step of the strength scale, for the slider's preview and for the triggers. */
function playStep(step: number): Promise<void> {
	const name = ANDROID_STEPS[step];
	if (Platform.OS === "android" && name !== undefined) {
		try {
			// Older versions of expo-haptics don't have these: fall back to the tick.
			return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics[name]);
		} catch {
			/* fall through */
		}
	}
	return Haptics.selectionAsync();
}

// The current settings, kept here so any component can call haptic() without
// receiving them as props. App.tsx updates them whenever the settings change.
let enabled = false;
let switches: Partial<Record<HapticTrigger, boolean>> = {};
let strength: number = HAPTIC_STRENGTH.default;

export function configureHaptics(
	on: boolean,
	triggers: Partial<Record<HapticTrigger, boolean>>,
	level: number = HAPTIC_STRENGTH.default,
) {
	enabled = on;
	switches = triggers;
	strength = level;
}

/** Plays a trigger no matter the settings (used for the previews in Settings). */
export function playHaptic(trigger: HapticTrigger) {
	try {
		// The strength only exists on Android; elsewhere the original feel plays.
		const play =
			Platform.OS === "android" && strength < HAPTIC_STRENGTH.max
				? playStep(strength)
				: FEEL[trigger]();
		play.catch(() => {});
	} catch {
		/* this device can't vibrate */
	}
}

/** Plays one step of the strength scale, for the slider's preview. */
export function previewStrength(step: number) {
	try {
		// The top step is the original feel; the one used for buttons stands in for it.
		const play = step >= HAPTIC_STRENGTH.max ? FEEL.buttons() : playStep(step);
		play.catch(() => {});
	} catch {
		/* this device can't vibrate */
	}
}

/** Vibrates for this trigger, if haptics are on and this trigger is on. */
export function haptic(trigger: HapticTrigger) {
	if (!enabled || switches[trigger] === false) return;
	playHaptic(trigger);
}
