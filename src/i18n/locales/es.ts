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
	"haptics.throw": "Lanzar los dados",
	"haptics.clash": "Choque de dados",
	"haptics.result": "Mostrar el resultado",
	"haptics.buttons": "Botones",
	"settings.theme": "Tema",
	"settings.presets": "Preajustes",
	"role.background": "Fondo",
	"role.card": "Paneles",
	"role.text": "Texto",
	"role.accent": "Contraste / acento (dados)",
	"preset.navy": "Marino",
	"preset.midnight": "Medianoche",
	"preset.paper": "Papel",
	"preset.forest": "Bosque",
	"preset.grape": "Uva",

	// about
	"credits.about": "Acerca de",
	"credits.madeBy": "Hecho por {developer}.",
	"credits.icons": "{ionicons} de {ionic}.",
	"credits.kofi": "Si algún día te apetece, ¡tengo Ko-fi!",
};
