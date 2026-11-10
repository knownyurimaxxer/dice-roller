import type { Messages } from "./en";

export const es: Messages = {
	// shared
	"common.cancel": "Cancelar",
	"common.delete": "Eliminar",
	"common.done": "Listo",
	"common.save": "Guardar",
	"common.rename": "Renombrar",

	// rolling
	"roll.button": "Lanzar",
	"roll.hint": "Elige unos dados abajo y lánzalos.",
	"roll.pickDice": "Elige al menos un dado",
	"roll.clear": "Borrar",
	"roll.mode.regular": "Normal",
	"roll.mode.advantage": "Ventaja",
	"roll.mode.disadvantage": "Desventaja",
	"roll.modeHint.regular": "Los dados se suman.",
	"roll.modeHint.advantage":
		"Tus dados se duplican y solo cuenta el más alto. Un solo tipo de dado.",
	"roll.modeHint.disadvantage":
		"Tus dados se duplican y solo cuenta el más bajo. Un solo tipo de dado.",
	"roll.combine.total": "Sumar todo",
	"roll.combine.separate": "Cada tipo por separado",
	"roll.addDie": "Añadir un {die}",
	"roll.removeDie": "Quitar un {die}",
	"roll.saveFavorite": "Guardar como favorito",
	"result.total": "Total",
	"result.perfect": "¡Tirada perfecta!",
	"result.reconfigure": "Cambiar dados",
	"result.reroll": "Lanzar otra vez",
	"result.saved": "Guardado",
	"board.fallback":
		"El tablero 3D no ha podido iniciarse aquí, así que los dados se han lanzado sin animación.",

	// favorites
	"favorites.title": "Favoritos",
	"favorites.hint": "Toca uno para lanzarlo.",
	"favorites.empty":
		"Aún no hay favoritos.\nElige unos dados y toca la estrella para guardarlos.",
	"favorites.saveTitle": "Guardar como favorito",
	"favorites.namePlaceholder": "Nombre (opcional)",
	"favorites.renameTitle": "Renombrar favorito",
	"favorites.deleteTitle": "¿Eliminar este favorito?",
	"favorites.deleteBody": "«{name}» se eliminará.",

	// history
	"history.title": "Historial",
	"history.empty": "Aún no hay tiradas.\nVe a lanzar unos dados.",
	"history.clear": "Borrar historial",
	"history.clearTitle": "¿Borrar el historial?",
	"history.clearBody": "Se eliminarán todas las tiradas anteriores.",
	"time.now": "ahora mismo",
	"time.minutes": "{n} min",
	"time.hours": "{n} h",
	"time.days": "{n} d",

	// settings
	"settings.title": "Ajustes",
	"settings.language": "Idioma",
	"settings.languageHint":
		"«Predeterminado del sistema» sigue el idioma de tu teléfono, y usa inglés si tu idioma no está disponible.",
	"settings.languageSystem": "Predeterminado del sistema",
	"settings.sound": "Sonido",
	"settings.soundThrow": "Sonidos del lanzamiento",
	"settings.soundThrowHint": "Dados rodando y chocando.",
	"settings.soundResult": "Sonido del resultado",
	"settings.soundResultHint":
		"Una pequeña celebración al mostrar el resultado.",
	"settings.haptics": "Vibración",
	"settings.hapticsToggle": "Respuesta háptica",
	"settings.hapticsHint": "Vibraciones cortas mientras lanzas.",
	"settings.hapticsTriggers": "Elige qué vibra",
	"settings.hapticsStrength": "Intensidad de la vibración",
	"settings.hapticsStrengthHint":
		"Desliza hacia la derecha para una vibración más intensa.",
	"settings.gestures": "Gestos",
	"settings.swipeToRoll": "Deslizar hacia arriba para lanzar",
	"settings.swipeToRollHint":
		"Desliza hacia arriba en cualquier parte de la pantalla para lanzar los dados elegidos.",
	"settings.throwToRoll": "Lanzar con un gesto",
	"settings.throwToRollHint":
		"Haz un gesto de lanzamiento con el móvil para lanzar los dados.",
	"settings.throwSensitivity": "Sensibilidad",
	"settings.throwSensitivityHint":
		"Más alta reacciona a lanzamientos suaves. Más baja exige un lanzamiento más fuerte, para que no se active sin querer.",
	"settings.throwLow": "Baja",
	"settings.throwHigh": "Alta",
	"settings.orientation": "Orientación",
	"settings.orientationHint":
		"La pantalla se queda en esta posición y nunca gira sola, así que lanzar el móvil no puede girarla.",
	"settings.orientationPortrait": "Vertical",
	"settings.orientationLandscape": "Horizontal",
	"haptics.throw": "Lanzar los dados",
	"haptics.clash": "Choque de dados",
	"haptics.result": "Mostrar el resultado",
	"haptics.buttons": "Botones",
	"settings.theme": "Tema",
	"settings.presets": "Preajustes",
	"role.background": "Fondo",
	"role.card": "Paneles",
	"role.text": "Texto",
	"role.accent": "Contraste / acento",
	"preset.navy": "Marino",
	"preset.midnight": "Medianoche",
	"preset.paper": "Papel",
	"preset.forest": "Bosque",
	"preset.grape": "Uva",
	"color.custom": "Color personalizado",
	"color.hue": "Tono",
	"color.saturation": "Saturación",
	"color.lightness": "Luminosidad",
	"color.hex": "Código hex",
	"color.apply": "Aplicar",
	"settings.themeTransfer": "Compartir temas",
	"settings.exportTheme": "Exportar tema",
	"settings.importTheme": "Importar tema",
	"settings.importHint":
		"Pega un tema exportado desde esta app o desde cualquier app que use los mismos nombres de color: background, card, text y accent.",
	"settings.importInvalid":
		"Ese no es un tema válido. Necesita background, card, text y accent, cada uno como un color #RRGGBB.",
	"settings.importButton": "Importar",
	"settings.dice": "Dados",
	"dice.transparency": "Transparencia",
	"dice.transparencyHint": "Lo transparentes que son los dados. 0% es opaco.",
	"dice.font": "Fuente de los números",
	"dice.fontHint":
		"Cada fuente se usa en su peso más grueso, para que los números sigan siendo marcados.",
	"dice.numberColor": "Color de los números",
	"dice.numberColorHint":
		"Auto elige blanco o negro, el que mejor se lea sobre los dados.",
	"dice.numberAuto": "Auto",
	"dice.numbersFollow": "Los números siguen la transparencia",
	"dice.numbersFollowHint":
		"Si está activado, los números se vuelven transparentes junto con los dados. Si no, se quedan opacos.",
	"dice.image": "Imagen",
	"dice.imageHint":
		"Pega un enlace (https) a una imagen. La app la descarga a tu teléfono y la pone sobre el color de los dados. Usar una nueva borra la anterior.",
	"dice.imagePlaceholder": "https://…",
	"dice.imageUse": "Usar imagen",
	"dice.imageRemove": "Quitar imagen",
	"dice.imageTransparency": "Transparencia de la imagen",
	"dice.imageSplit": "Un trozo de la imagen por cara",
	"dice.imageSplitHint":
		"Desactivado: la imagen entera se coloca en cada cara. Activado: la imagen se corta en trozos y cada cara muestra el suyo, en el orden de los números.",
	"dice.downloading": "Descargando…",
	"dice.errorUrl": "Ese no es un enlace https válido.",
	"dice.errorDownload":
		"No se pudo descargar esa imagen. Revisa el enlace y tu conexión.",
	"dice.errorTooBig":
		"Esa imagen es demasiado grande. Usa una de hasta 8 MB y 4096 píxeles por lado.",
	"dice.errorNotImage": "Ese enlace no es una imagen que la app pueda leer.",
	"dice.transfer": "Compartir dados",
	"dice.export": "Exportar dados",
	"dice.import": "Importar dados",
	"dice.importHint":
		"Pega los ajustes de dados exportados desde esta app. Si incluyen un enlace de imagen, la imagen se descarga y sustituye a la actual.",
	"dice.importInvalid":
		"Esos no son unos ajustes de dados válidos. Revisa el texto y que el enlace de imagen, si lo hay, empiece por https.",

	// about
	"credits.about": "Acerca de",
	"credits.madeBy": "Hecho por {developer}.",
	"credits.icons": "{ionicons} de {ionic}.",
	"credits.fonts":
		"{inter}, {poppins}, {orbitron} y {playfair}, usadas bajo la {license}.",
	"credits.kofi": "Si algún día te apetece, ¡tengo Ko-fi!",
};
