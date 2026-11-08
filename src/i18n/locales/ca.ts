import type { Messages } from "./en";

export const ca: Messages = {
	// shared
	"common.cancel": "Cancel·la",
	"common.delete": "Elimina",
	"common.done": "Fet",
	"common.save": "Desa",
	"common.rename": "Canvia el nom",

	// rolling
	"roll.button": "Llança",
	"roll.hint": "Tria uns daus a sota i llança'ls.",
	"roll.pickDice": "Tria almenys un dau",
	"roll.clear": "Esborra",
	"roll.mode.regular": "Normal",
	"roll.mode.advantage": "Avantatge",
	"roll.mode.disadvantage": "Desavantatge",
	"roll.modeHint.regular": "Els daus se sumen.",
	"roll.modeHint.advantage":
		"Els teus daus es dupliquen i només compta el més alt. Un sol tipus de dau.",
	"roll.modeHint.disadvantage":
		"Els teus daus es dupliquen i només compta el més baix. Un sol tipus de dau.",
	"roll.combine.total": "Suma-ho tot",
	"roll.combine.separate": "Cada tipus per separat",
	"roll.addDie": "Afegeix un {die}",
	"roll.removeDie": "Treu un {die}",
	"roll.saveFavorite": "Desa com a preferit",
	"result.total": "Total",
	"result.perfect": "Tirada perfecta!",
	"result.reconfigure": "Canvia els daus",
	"result.reroll": "Torna a llançar",
	"result.saved": "Desat",
	"board.fallback":
		"El tauler 3D no s'ha pogut iniciar aquí, així que els daus s'han llançat sense animació.",

	// favorites
	"favorites.title": "Preferits",
	"favorites.hint": "Toca'n un per llançar-lo.",
	"favorites.empty":
		"Encara no hi ha preferits.\nTria uns daus i toca l'estrella per desar-los.",
	"favorites.saveTitle": "Desa com a preferit",
	"favorites.namePlaceholder": "Nom (opcional)",
	"favorites.renameTitle": "Canvia el nom del preferit",
	"favorites.deleteTitle": "Vols eliminar aquest preferit?",
	"favorites.deleteBody": "«{name}» s'eliminarà.",

	// history
	"history.title": "Historial",
	"history.empty": "Encara no hi ha tirades.\nVés a llançar uns daus.",
	"history.clear": "Esborra l'historial",
	"history.clearTitle": "Vols esborrar l'historial?",
	"history.clearBody": "S'eliminaran totes les tirades anteriors.",
	"time.now": "ara mateix",
	"time.minutes": "{n} min",
	"time.hours": "{n} h",
	"time.days": "{n} d",

	// settings
	"settings.title": "Ajustos",
	"settings.language": "Idioma",
	"settings.languageHint":
		"«Predeterminat del sistema» segueix l'idioma del teu telèfon, i fa servir l'anglès si el teu idioma no està disponible.",
	"settings.languageSystem": "Predeterminat del sistema",
	"settings.sound": "So",
	"settings.soundThrow": "Sons del llançament",
	"settings.soundThrowHint": "Daus rodant i xocant.",
	"settings.soundResult": "So del resultat",
	"settings.soundResultHint": "Una petita celebració en mostrar el resultat.",
	"settings.haptics": "Vibració",
	"settings.hapticsToggle": "Resposta tàctil",
	"settings.hapticsHint": "Vibracions curtes mentre llances.",
	"settings.hapticsTriggers": "Tria què vibra",
	"settings.motion": "Moviment",
	"settings.throwToRoll": "Llançar amb un gest",
	"settings.throwToRollHint":
		"Fes un gest de llançament amb el mòbil per llançar els daus.",
	"settings.throwSensitivity": "Sensibilitat",
	"settings.throwSensitivityHint":
		"Més alta reacciona a llançaments suaus. Més baixa demana un llançament més fort, perquè no s'activi sense voler.",
	"settings.throwLow": "Baixa",
	"settings.throwHigh": "Alta",
	"settings.orientation": "Orientació",
	"settings.orientationHint":
		"La pantalla es queda en aquesta posició i mai gira sola, així que llançar el mòbil no la pot girar.",
	"settings.orientationPortrait": "Vertical",
	"settings.orientationLandscape": "Horitzontal",
	"haptics.throw": "Llançar els daus",
	"haptics.clash": "Xoc de daus",
	"haptics.result": "Mostrar el resultat",
	"haptics.buttons": "Botons",
	"settings.theme": "Tema",
	"settings.presets": "Predefinits",
	"role.background": "Fons",
	"role.card": "Panells",
	"role.text": "Text",
	"role.accent": "Contrast / accent (daus)",
	"preset.navy": "Marí",
	"preset.midnight": "Mitjanit",
	"preset.paper": "Paper",
	"preset.forest": "Bosc",
	"preset.grape": "Raïm",

	// about
	"credits.about": "Quant a",
	"credits.madeBy": "Feta per {developer}.",
	"credits.icons": "{ionicons} de {ionic}.",
	"credits.kofi": "Si algun dia et ve de gust, tinc un Ko-fi!",
};
