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
	"history.clear": "Borrar historial",
	"history.clearTitle": "Queres borrar o historial?",
	"history.clearBody": "Eliminaranse todas as tiradas anteriores.",
	"time.now": "agora mesmo",
	"time.minutes": "{n} min",
	"time.hours": "{n} h",
	"time.days": "{n} d",

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
	"haptics.throw": "Lanzar os dados",
	"haptics.clash": "Choque de dados",
	"haptics.result": "Mostrar o resultado",
	"haptics.buttons": "Botóns",
	"settings.theme": "Tema",
	"settings.presets": "Predefinidos",
	"role.background": "Fondo",
	"role.card": "Paneis",
	"role.text": "Texto",
	"role.accent": "Contraste / acento (dados)",
	"preset.navy": "Mariño",
	"preset.midnight": "Medianoite",
	"preset.paper": "Papel",
	"preset.forest": "Bosque",
	"preset.grape": "Uva",

	// about
	"credits.about": "Acerca de",
	"credits.madeBy": "Feito por {developer}.",
	"credits.icons": "{ionicons} de {ionic}.",
	"credits.kofi": "Se algún día che apetece, teño un Ko-fi!",
};
