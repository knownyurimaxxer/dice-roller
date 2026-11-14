import type { Messages } from "./en";

export const gl: Messages = {
	// shared
	"common.cancel": "Cancelar",
	"common.delete": "Eliminar",
	"common.done": "Feito",
	"common.save": "Gardar",
	"common.rename": "Renomear",

	// rolling
	"roll.button": "Lanzar",
	"roll.hint": "Elixe uns dados abaixo e lánzaos.",
	"roll.pickDice": "Elixe polo menos un dado",
	"roll.clear": "Borrar",
	"roll.mode.regular": "Normal",
	"roll.mode.advantage": "Vantaxe",
	"roll.mode.disadvantage": "Desvantaxe",
	"roll.modeHint.regular": "Os dados súmanse.",
	"roll.modeHint.advantage":
		"Os teus dados duplícanse e só conta o máis alto. Un só tipo de dado.",
	"roll.modeHint.disadvantage":
		"Os teus dados duplícanse e só conta o máis baixo. Un só tipo de dado.",
	"roll.combine.total": "Sumar todo",
	"roll.combine.separate": "Cada tipo por separado",
	"roll.addDie": "Engadir un {die}",
	"roll.removeDie": "Quitar un {die}",
	"roll.saveFavorite": "Gardar como favorito",
	"result.total": "Total",
	"result.perfect": "Tirada perfecta!",
	"result.reconfigure": "Cambiar dados",
	"result.reroll": "Lanzar outra vez",
	"result.saved": "Gardado",
	"board.fallback":
		"O taboleiro 3D non puido iniciarse aquí, así que os dados lanzáronse sen animación.",

	// favorites
	"favorites.title": "Favoritos",
	"favorites.hint": "Toca un para lanzalo.",
	"favorites.empty":
		"Aínda non hai favoritos.\nElixe uns dados e toca a estrela para gardalos.",
	"favorites.saveTitle": "Gardar como favorito",
	"favorites.namePlaceholder": "Nome (opcional)",
	"favorites.renameTitle": "Renomear favorito",
	"favorites.deleteTitle": "Queres eliminar este favorito?",
	"favorites.deleteBody": "«{name}» eliminarase.",

	// history
	"history.title": "Historial",
	"history.empty": "Aínda non hai tiradas.\nVai lanzar uns dados.",
	"history.clear": "Baleirar",
	"history.clearTitle": "Queres borrar o historial?",
	"history.clearBody": "Eliminaranse todas as tiradas anteriores.",

	// settings
	"settings.title": "Axustes",
	"settings.language": "Idioma",
	"settings.languageHint":
		"“Predeterminado do sistema” segue o idioma do teu teléfono e usa inglés se o teu idioma non está dispoñible.",
	"settings.languageSystem": "Predeterminado do sistema",
	"settings.sound": "Son",
	"settings.soundThrow": "Sons do lanzamento",
	"settings.soundThrowHint": "Dados rodando e chocando.",
	"settings.soundResult": "Son do resultado",
	"settings.soundResultHint":
		"Unha pequena celebración ao mostrar o resultado.",
	"settings.haptics": "Vibración",
	"settings.hapticsToggle": "Resposta táctil",
	"settings.hapticsHint": "Vibracións curtas mentres lanzas.",
	"settings.hapticsTriggers": "Elixe que vibra",
	"settings.hapticsStrength": "Intensidade da vibración",
	"settings.hapticsStrengthHint":
		"Desliza cara á dereita para unha vibración máis intensa.",
	"settings.gestures": "Xestos",
	"settings.swipeToRoll": "Deslizar cara arriba para lanzar",
	"settings.swipeToRollHint":
		"Desliza cara arriba en calquera parte da pantalla para lanzar os dados elixidos.",
	"settings.throwToRoll": "Lanzar cun xesto",
	"settings.throwToRollHint":
		"Fai un xesto de lanzamento co móbil para lanzar os dados.",
	"settings.throwSensitivity": "Sensibilidade",
	"settings.throwSensitivityHint":
		"Máis alta reacciona a lanzamentos suaves. Máis baixa pide un lanzamento máis forte, para que non se active sen querer.",
	"settings.throwLow": "Baixa",
	"settings.throwHigh": "Alta",
	"settings.orientation": "Orientación",
	"settings.orientationHint":
		"A pantalla queda nesta posición e nunca xira soa, así que lanzar o móbil non a pode xirar.",
	"settings.orientationPortrait": "Vertical",
	"settings.orientationLandscape": "Horizontal",
	"haptics.throw": "Lanzar os dados",
	"haptics.clash": "Choque de dados",
	"haptics.result": "Mostrar o resultado",
	"haptics.buttons": "Botóns",
	"settings.theme": "Tema",
	"settings.presets": "Predefinidos",
	"role.background": "Fondo",
	"role.card": "Paneis",
	"role.text": "Texto",
	"role.accent": "Contraste / acento",
	"preset.navy": "Mariño",
	"preset.midnight": "Medianoite",
	"preset.paper": "Papel",
	"preset.forest": "Bosque",
	"preset.grape": "Uva",
	"color.custom": "Cor personalizada",
	"color.hue": "Ton",
	"color.saturation": "Saturación",
	"color.lightness": "Luminosidade",
	"color.hex": "Código hex",
	"color.apply": "Aplicar",
	"settings.themeTransfer": "Compartir temas",
	"settings.exportTheme": "Exportar tema",
	"settings.importTheme": "Importar tema",
	"settings.importHint":
		"Pega un tema exportado desde esta app ou desde calquera app que use os mesmos nomes de cor: background, card, text e accent.",
	"settings.importInvalid":
		"Ese non é un tema válido. Precisa background, card, text e accent, cada un como unha cor #RRGGBB.",
	"settings.importButton": "Importar",
	"settings.dice": "Dados",
	"dice.transparency": "Transparencia",
	"dice.transparencyHint": "Canto de transparentes son os dados. 0% é opaco.",
	"dice.font": "Tipo de letra dos números",
	"dice.fontHint":
		"Cada tipo de letra úsase no seu peso máis groso, para que os números sigan sendo marcados.",
	"dice.numberColor": "Cor dos números",
	"dice.numberColorHint":
		"Auto escolle branco ou negro, o que mellor se lea sobre os dados.",
	"dice.numberAuto": "Auto",
	"dice.numbersFollow": "Os números seguen a transparencia",
	"dice.numbersFollowHint":
		"Se está activado, os números volven transparentes xunto cos dados. Se non, quedan opacos.",
	"dice.image": "Imaxe",
	"dice.imageHint":
		"Pega unha ligazón (https) a unha imaxe. A app descárgaa no teu teléfono e ponta sobre a cor dos dados. Usar unha nova borra a anterior.",
	"dice.imagePlaceholder": "https://…",
	"dice.imageUse": "Usar a imaxe",
	"dice.imageRemove": "Quitar a imaxe",
	"dice.imageTransparency": "Transparencia da imaxe",
	"dice.imageSplit": "Un anaco da imaxe por cara",
	"dice.imageSplitHint":
		"Desactivado: a imaxe enteira colócase en cada cara. Activado: a imaxe córtase en anacos e cada cara mostra o seu, na orde dos números.",
	"dice.downloading": "Descargando…",
	"dice.errorUrl": "Esa non é unha ligazón https válida.",
	"dice.errorDownload":
		"Non se puido descargar esa imaxe. Revisa a ligazón e a conexión.",
	"dice.errorTooBig":
		"Esa imaxe é demasiado grande. Usa unha de ata 8 MB e 4096 píxeles por lado.",
	"dice.errorNotImage": "Esa ligazón non é unha imaxe que a app poida ler.",
	"dice.transfer": "Compartir dados",
	"dice.export": "Exportar dados",
	"dice.import": "Importar dados",
	"dice.importHint":
		"Pega os axustes de dados exportados desde esta app. Se inclúen unha ligazón de imaxe, a imaxe descárgase e substitúe a actual.",
	"dice.importInvalid":
		"Eses non son uns axustes de dados válidos. Revisa o texto e que a ligazón da imaxe, se a hai, comece por https.",

	// about
	"credits.about": "Acerca de",
	"credits.madeBy": "Feito por {developer}.",
	"credits.icons": "{ionicons} de {ionic}.",
	"credits.fonts":
		"{inter}, {poppins}, {orbitron} e {playfair}, usados baixo a {license}.",
	"credits.kofi": "Se algún día che apetece, teño un Ko-fi!",
};
