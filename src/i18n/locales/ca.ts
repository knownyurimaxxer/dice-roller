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
	"settings.hapticsStrength": "Intensitat de la vibració",
	"settings.hapticsStrengthHint":
		"Llisca cap a la dreta per a una vibració més intensa.",
	"settings.gestures": "Gestos",
	"settings.swipeToRoll": "Lliscar cap amunt per llançar",
	"settings.swipeToRollHint":
		"Llisca cap amunt en qualsevol lloc de la pantalla per llançar els daus triats.",
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
	"role.accent": "Contrast / accent",
	"preset.navy": "Marí",
	"preset.midnight": "Mitjanit",
	"preset.paper": "Paper",
	"preset.forest": "Bosc",
	"preset.grape": "Raïm",
	"color.custom": "Color personalitzat",
	"color.hue": "To",
	"color.saturation": "Saturació",
	"color.lightness": "Lluminositat",
	"color.hex": "Codi hex",
	"color.apply": "Aplica",
	"settings.themeTransfer": "Compartir temes",
	"settings.exportTheme": "Exportar tema",
	"settings.importTheme": "Importar tema",
	"settings.importHint":
		"Enganxa un tema exportat des d'aquesta app o des de qualsevol app que faci servir els mateixos noms de color: background, card, text i accent.",
	"settings.importInvalid":
		"Aquest no és un tema vàlid. Necessita background, card, text i accent, cadascun com a color #RRGGBB.",
	"settings.importButton": "Importa",
	"settings.dice": "Daus",
	"dice.transparency": "Transparència",
	"dice.transparencyHint": "Com de transparents són els daus. 0% és opac.",
	"dice.font": "Tipus de lletra dels números",
	"dice.fontHint":
		"Cada tipus de lletra s'usa en el seu pes més gruixut, perquè els números segueixin sent marcats.",
	"dice.numberColor": "Color dels números",
	"dice.numberColorHint":
		"Auto tria blanc o negre, el que es llegeixi millor sobre els daus.",
	"dice.numberAuto": "Auto",
	"dice.numbersFollow": "Els números segueixen la transparència",
	"dice.numbersFollowHint":
		"Si està activat, els números es tornen transparents juntament amb els daus. Si no, es queden opacs.",
	"dice.image": "Imatge",
	"dice.imageHint":
		"Enganxa un enllaç (https) a una imatge. L'app la baixa al teu telèfon i la posa sobre el color dels daus. Fer servir una de nova esborra l'anterior.",
	"dice.imagePlaceholder": "https://…",
	"dice.imageUse": "Usa la imatge",
	"dice.imageRemove": "Treu la imatge",
	"dice.imageTransparency": "Transparència de la imatge",
	"dice.imageSplit": "Un tros de la imatge per cara",
	"dice.imageSplitHint":
		"Desactivat: la imatge sencera es col·loca a cada cara. Activat: la imatge es talla en trossos i cada cara mostra el seu, per ordre dels números.",
	"dice.downloading": "Baixant…",
	"dice.errorUrl": "Aquest no és un enllaç https vàlid.",
	"dice.errorDownload":
		"No s'ha pogut baixar aquesta imatge. Revisa l'enllaç i la connexió.",
	"dice.errorTooBig":
		"Aquesta imatge és massa gran. Fes servir una de fins a 8 MB i 4096 píxels per costat.",
	"dice.errorNotImage":
		"Aquest enllaç no és una imatge que l'app pugui llegir.",
	"dice.transfer": "Compartir daus",
	"dice.export": "Exportar daus",
	"dice.import": "Importar daus",
	"dice.importHint":
		"Enganxa els ajustos de daus exportats des d'aquesta app. Si inclouen un enllaç d'imatge, la imatge es baixa i substitueix l'actual.",
	"dice.importInvalid":
		"Aquests no són uns ajustos de daus vàlids. Revisa el text i que l'enllaç d'imatge, si n'hi ha, comenci per https.",

	// about
	"credits.about": "Quant a",
	"credits.madeBy": "Feta per {developer}.",
	"credits.icons": "{ionicons} de {ionic}.",
	"credits.fonts":
		"{inter}, {poppins}, {orbitron} i {playfair}, usats sota la {license}.",
	"credits.kofi": "Si algun dia et ve de gust, tinc un Ko-fi!",
};
