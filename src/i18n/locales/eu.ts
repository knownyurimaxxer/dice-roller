import type { Messages } from "./en";

export const eu: Messages = {
	// shared
	"common.cancel": "Utzi",
	"common.delete": "Ezabatu",
	"common.done": "Eginda",
	"common.save": "Gorde",
	"common.rename": "Aldatu izena",

	// rolling
	"roll.button": "Bota",
	"roll.hint": "Aukeratu dado batzuk behean eta bota itzazu.",
	"roll.pickDice": "Aukeratu gutxienez dado bat",
	"roll.clear": "Garbitu",
	"roll.mode.regular": "Arrunta",
	"roll.mode.advantage": "Abantaila",
	"roll.mode.disadvantage": "Desabantaila",
	"roll.modeHint.regular": "Dadoak batu egiten dira.",
	"roll.modeHint.advantage":
		"Zure dadoak bikoiztu egiten dira eta altuena soilik zenbatzen da. Dado mota bakarra.",
	"roll.modeHint.disadvantage":
		"Zure dadoak bikoiztu egiten dira eta baxuena soilik zenbatzen da. Dado mota bakarra.",
	"roll.combine.total": "Dena batu",
	"roll.combine.separate": "Mota bakoitza bereizita",
	"roll.addDie": "Gehitu {die} bat",
	"roll.removeDie": "Kendu {die} bat",
	"roll.saveFavorite": "Gorde gogoko gisa",
	"result.total": "Guztira",
	"result.perfect": "Bota perfektua!",
	"result.reconfigure": "Aldatu dadoak",
	"result.reroll": "Bota berriro",
	"result.saved": "Gordeta",
	"board.fallback":
		"3D mahaia ezin izan da hasi hemen, beraz dadoak animaziorik gabe bota dira.",

	// favorites
	"favorites.title": "Gogokoak",
	"favorites.hint": "Ukitu bat botatzeko.",
	"favorites.empty":
		"Oraindik ez dago gogokorik.\nAukeratu dado batzuk eta ukitu izarra gordetzeko.",
	"favorites.saveTitle": "Gorde gogoko gisa",
	"favorites.namePlaceholder": "Izena (aukerakoa)",
	"favorites.renameTitle": "Aldatu gogokoaren izena",
	"favorites.deleteTitle": "Gogoko hau ezabatu nahi duzu?",
	"favorites.deleteBody": "«{name}» ezabatu egingo da.",

	// history
	"history.title": "Historia",
	"history.empty": "Oraindik ez dago botarik.\nBota itzazu dadoak.",
	"history.clear": "Garbitu historia",
	"history.clearTitle": "Historia garbitu nahi duzu?",
	"history.clearBody": "Aurreko bota guztiak ezabatuko dira.",
	"time.now": "oraintxe bertan",
	"time.minutes": "{n} min",
	"time.hours": "{n} h",
	"time.days": "{n} egun",

	// settings
	"settings.title": "Ezarpenak",
	"settings.language": "Hizkuntza",
	"settings.languageHint":
		"“Sistemaren lehenetsia” zure telefonoaren hizkuntza jarraitzen du, eta ingelesa erabiltzen du zure hizkuntza erabilgarri ez badago.",
	"settings.languageSystem": "Sistemaren lehenetsia",
	"settings.sound": "Soinua",
	"settings.soundThrow": "Jaurtiketaren soinuak",
	"settings.soundThrowHint": "Dadoak biraka eta talka egiten.",
	"settings.soundResult": "Emaitzaren soinua",
	"settings.soundResultHint": "Ospakizun txiki bat emaitza agertzean.",
	"settings.haptics": "Bibrazioa",
	"settings.hapticsToggle": "Ukipen-erantzuna",
	"settings.hapticsHint": "Bibrazio laburrak botatzen duzun bitartean.",
	"settings.hapticsTriggers": "Aukeratu zerk egiten duen bibrazioa",
	"settings.hapticsStrength": "Bibrazioaren indarra",
	"settings.hapticsStrengthHint":
		"Irristatu eskuinera bibrazio biziagoa lortzeko.",
	"settings.gestures": "Keinuak",
	"settings.swipeToRoll": "Irristatu gora botatzeko",
	"settings.swipeToRollHint":
		"Irristatu gorantz pantailako edozein lekutan, aukeratutako dadoak botatzeko.",
	"settings.throwToRoll": "Jaurti keinu batekin",
	"settings.throwToRollHint":
		"Egin jaurtiketa-keinu bat telefonoarekin dadoak jaurtitzeko.",
	"settings.throwSensitivity": "Sentikortasuna",
	"settings.throwSensitivityHint":
		"Altuagoak jaurtiketa leunekin erreakzionatzen du. Baxuagoak jaurtiketa indartsuagoa behar du, nahi gabe aktibatu ez dadin.",
	"settings.throwLow": "Baxua",
	"settings.throwHigh": "Altua",
	"settings.orientation": "Orientazioa",
	"settings.orientationHint":
		"Pantaila posizio honetan geratzen da eta ez da inoiz bere kabuz biratzen, beraz telefonoa jaurtitzeak ezin du biratu.",
	"settings.orientationPortrait": "Bertikala",
	"settings.orientationLandscape": "Horizontala",
	"haptics.throw": "Dadoak botatzea",
	"haptics.clash": "Dadoen talka",
	"haptics.result": "Emaitza erakustea",
	"haptics.buttons": "Botoiak",
	"settings.theme": "Gaia",
	"settings.presets": "Aurrezarpenak",
	"role.background": "Atzeko planoa",
	"role.card": "Panelak",
	"role.text": "Testua",
	"role.accent": "Kontrastea / azentua",
	"preset.navy": "Itsas urdina",
	"preset.midnight": "Gauerdia",
	"preset.paper": "Papera",
	"preset.forest": "Basoa",
	"preset.grape": "Mahatsa",
	"color.custom": "Kolore pertsonalizatua",
	"color.hue": "Tonua",
	"color.saturation": "Saturazioa",
	"color.lightness": "Argitasuna",
	"color.hex": "Hex kodea",
	"color.apply": "Aplikatu",
	"settings.themeTransfer": "Gaiak partekatu",
	"settings.exportTheme": "Esportatu gaia",
	"settings.importTheme": "Inportatu gaia",
	"settings.importHint":
		"Itsatsi aplikazio honetatik edo kolore-izen berdinak erabiltzen dituen edozein aplikaziotatik esportatutako gai bat: background, card, text eta accent.",
	"settings.importInvalid":
		"Hori ez da baliozko gai bat. background, card, text eta accent behar ditu, bakoitza #RRGGBB kolore gisa.",
	"settings.importButton": "Inportatu",
	"settings.dice": "Dadoak",
	"dice.transparency": "Gardentasuna",
	"dice.transparencyHint": "Dadoak zein gardenak diren. %0 opakua da.",
	"dice.numberColor": "Zenbakien kolorea",
	"dice.numberColorHint":
		"Automatikoak zuria edo beltza aukeratzen du, dadoen gainean hobeto irakurtzen dena.",
	"dice.numberAuto": "Auto",
	"dice.numbersFollow": "Zenbakiek gardentasuna jarraitzen dute",
	"dice.numbersFollowHint":
		"Aktibatuta badago, zenbakiak dadoekin batera gardentzen dira. Bestela, opako geratzen dira.",
	"dice.image": "Irudia",
	"dice.imageHint":
		"Itsatsi irudi baten esteka (https). Aplikazioak zure telefonora deskargatzen du eta dadoen kolorearen gainean jartzen du. Berri bat erabiltzean, zaharra ezabatzen da.",
	"dice.imagePlaceholder": "https://…",
	"dice.imageUse": "Erabili irudia",
	"dice.imageRemove": "Kendu irudia",
	"dice.imageTransparency": "Irudiaren gardentasuna",
	"dice.downloading": "Deskargatzen…",
	"dice.errorUrl": "Hori ez da baliozko https esteka bat.",
	"dice.errorDownload":
		"Ezin izan da irudi hori deskargatu. Egiaztatu esteka eta konexioa.",
	"dice.errorTooBig":
		"Irudi hori handiegia da. Erabili gehienez 8 MB eta alde bakoitzean 4096 pixel dituen bat.",
	"dice.errorNotImage":
		"Esteka hori ez da aplikazioak irakur dezakeen irudi bat.",
	"dice.transfer": "Dadoak partekatu",
	"dice.export": "Esportatu dadoak",
	"dice.import": "Inportatu dadoak",
	"dice.importHint":
		"Itsatsi aplikazio honetatik esportatutako dadoen ezarpenak. Irudi-esteka badute, irudia deskargatu eta dagoena ordezkatzen du.",
	"dice.importInvalid":
		"Hori ez dira baliozko dadoen ezarpenak. Egiaztatu testua eta irudi-esteka, baldin badago, https-rekin hasten dela.",

	// about
	"credits.about": "Honi buruz",
	"credits.madeBy": "{developer}(e)k egina.",
	"credits.icons": "{ionicons} ({ionic}).",
	"credits.kofi": "Noizbait gogoa baduzu, Ko-fi bat daukat!",
};
