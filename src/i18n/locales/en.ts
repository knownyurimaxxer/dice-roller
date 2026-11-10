/**
 * English: the master list of every text in the app. Other languages are
 * typed against it (see es.ts), so a missing or misspelled key is a compile
 * error. Texts can hold {placeholders}, filled in by the code that uses them.
 * To add a language: copy this file to xx.ts, translate the values, and add one
 * line to LANGUAGES in ../index.ts. Don't translate the keys or the {placeholders}.
 */
export const en = {
	// shared
	"common.cancel": "Cancel",
	"common.delete": "Delete",
	"common.done": "Done",
	"common.save": "Save",
	"common.rename": "Rename",

	// rolling
	"roll.button": "Roll",
	"roll.hint": "Pick some dice below, then roll.",
	"roll.pickDice": "Pick at least one die",
	"roll.clear": "Clear",
	"roll.mode.regular": "Regular",
	"roll.mode.advantage": "Advantage",
	"roll.mode.disadvantage": "Disadvantage",
	"roll.modeHint.regular": "The dice are added together.",
	"roll.modeHint.advantage":
		"Your dice are doubled and only the highest counts. One kind of die.",
	"roll.modeHint.disadvantage":
		"Your dice are doubled and only the lowest counts. One kind of die.",
	"roll.combine.total": "Add all together",
	"roll.combine.separate": "Each kind separately",
	"roll.addDie": "Add a {die}",
	"roll.removeDie": "Remove a {die}",
	"roll.saveFavorite": "Save as favorite",
	"result.total": "Total",
	"result.perfect": "Perfect roll!",
	"result.reconfigure": "Change dice",
	"result.reroll": "Roll again",
	"result.saved": "Saved",
	"board.fallback":
		"The 3D board couldn't start here, so the dice were rolled without animation.",

	// favorites
	"favorites.title": "Favorites",
	"favorites.hint": "Tap one to roll it.",
	"favorites.empty":
		"No favorites yet.\nPick some dice and tap the star to save them.",
	"favorites.saveTitle": "Save as favorite",
	"favorites.namePlaceholder": "Name (optional)",
	"favorites.renameTitle": "Rename favorite",
	"favorites.deleteTitle": "Delete this favorite?",
	"favorites.deleteBody": "“{name}” will be removed.",

	// history
	"history.title": "History",
	"history.empty": "No rolls yet.\nGo roll some dice.",
	"history.clear": "Clear history",
	"history.clearTitle": "Clear the history?",
	"history.clearBody": "All previous rolls will be deleted.",
	"time.now": "just now",
	"time.minutes": "{n}m",
	"time.hours": "{n}h",
	"time.days": "{n}d",

	// settings
	"settings.title": "Settings",
	"settings.language": "Language",
	"settings.languageHint":
		"“System default” follows your phone's language, and uses English if your language isn't available.",
	"settings.languageSystem": "System default",
	"settings.sound": "Sound",
	"settings.soundThrow": "Throw sounds",
	"settings.soundThrowHint": "Dice rolling and clashing.",
	"settings.soundResult": "Result sound",
	"settings.soundResultHint": "A little celebration when the result shows.",
	"settings.haptics": "Haptics",
	"settings.hapticsToggle": "Haptic feedback",
	"settings.hapticsHint": "Short vibrations while you roll.",
	"settings.hapticsTriggers": "Choose what vibrates",
	"settings.hapticsStrength": "Vibration strength",
	"settings.hapticsStrengthHint": "Swipe right for a more intense vibration.",
	"settings.gestures": "Gestures",
	"settings.swipeToRoll": "Swipe up to roll",
	"settings.swipeToRollHint":
		"Swipe up anywhere on the screen to roll the dice you picked.",
	"settings.throwToRoll": "Throw to roll",
	"settings.throwToRollHint":
		"Make a throwing motion with your phone to roll the dice.",
	"settings.throwSensitivity": "Sensitivity",
	"settings.throwSensitivityHint":
		"Higher reacts to gentler throws. Lower needs a harder throw, so it won't trigger by accident.",
	"settings.throwLow": "Low",
	"settings.throwHigh": "High",
	"settings.orientation": "Orientation",
	"settings.orientationHint":
		"The screen stays in this position and never rotates by itself, so throwing the phone can't turn it.",
	"settings.orientationPortrait": "Vertical",
	"settings.orientationLandscape": "Horizontal",
	"haptics.throw": "Throwing the dice",
	"haptics.clash": "Dice clashing",
	"haptics.result": "Showing the result",
	"haptics.buttons": "Buttons",
	"settings.theme": "Theme",
	"settings.presets": "Presets",
	"role.background": "Background",
	"role.card": "Panels",
	"role.text": "Text",
	"role.accent": "Contrast / accent",
	"preset.navy": "Navy",
	"preset.midnight": "Midnight",
	"preset.paper": "Paper",
	"preset.forest": "Forest",
	"preset.grape": "Grape",
	"color.custom": "Custom color",
	"color.hue": "Hue",
	"color.saturation": "Saturation",
	"color.lightness": "Lightness",
	"color.hex": "Hex code",
	"color.apply": "Apply",
	"settings.themeTransfer": "Share themes",
	"settings.exportTheme": "Export theme",
	"settings.importTheme": "Import theme",
	"settings.importHint":
		"Paste a theme exported from this app or from any app that uses the same color names: background, card, text and accent.",
	"settings.importInvalid":
		"That isn't a valid theme. It needs background, card, text and accent, each as a #RRGGBB color.",
	"settings.importButton": "Import",
	"settings.dice": "Dice",
	"dice.transparency": "Transparency",
	"dice.transparencyHint": "How see-through the dice are. 0% is solid.",
	"dice.numberColor": "Number color",
	"dice.numberColorHint":
		"Auto picks black or white, whichever reads best on the dice.",
	"dice.numberAuto": "Auto",
	"dice.numbersFollow": "Numbers follow transparency",
	"dice.numbersFollowHint":
		"When on, the numbers become see-through along with the dice. When off, they stay solid.",
	"dice.image": "Image",
	"dice.imageHint":
		"Paste a link (https) to a picture. The app downloads it to your phone and lays it over the dice color. Using a new one deletes the old one.",
	"dice.imagePlaceholder": "https://…",
	"dice.imageUse": "Use image",
	"dice.imageRemove": "Remove image",
	"dice.imageTransparency": "Image transparency",
	"dice.downloading": "Downloading…",
	"dice.errorUrl": "That isn't a valid https link.",
	"dice.errorDownload":
		"Couldn't download that image. Check the link and your connection.",
	"dice.errorTooBig":
		"That image is too big. Use one up to 8 MB and 4096 pixels on each side.",
	"dice.errorNotImage": "That link isn't a picture the app can read.",
	"dice.transfer": "Share dice",
	"dice.export": "Export dice",
	"dice.import": "Import dice",
	"dice.importHint":
		"Paste dice settings exported from this app. If they include an image link, the image is downloaded and replaces the current one.",
	"dice.importInvalid":
		"That isn't valid dice settings. Check the text and that any image link starts with https.",

	// about
	"credits.about": "About",
	"credits.madeBy": "Made by {developer}.",
	"credits.icons": "{ionicons} by {ionic}.",
	"credits.kofi": "If you ever feel like it, I have a Ko-fi!",
} as const;

export type MessageKey = keyof typeof en;
/** What every language file must provide: all the keys, as plain text. */
export type Messages = Record<MessageKey, string>;
