import * as Haptics from "expo-haptics";
import { HapticTrigger } from "../constants";

/** How each trigger feels. */
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

// The current settings, kept here so any component can call haptic() without
// receiving them as props. App.tsx updates them whenever the settings change.
let enabled = false;
let switches: Partial<Record<HapticTrigger, boolean>> = {};

export function configureHaptics(
	on: boolean,
	triggers: Partial<Record<HapticTrigger, boolean>>,
) {
	enabled = on;
	switches = triggers;
}

/** Plays a trigger no matter the settings (used for the previews in Settings). */
export function playHaptic(trigger: HapticTrigger) {
	try {
		FEEL[trigger]().catch(() => {});
	} catch {
		/* this device can't vibrate */
	}
}

/** Vibrates for this trigger, if haptics are on and this trigger is on. */
export function haptic(trigger: HapticTrigger) {
	if (!enabled || switches[trigger] === false) return;
	playHaptic(trigger);
}
