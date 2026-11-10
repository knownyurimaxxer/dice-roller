import type { Messages } from "./en";

export const pt: Messages = {
	// shared
	"common.cancel": "Cancelar",
	"common.delete": "Eliminar",
	"common.done": "Concluído",
	"common.save": "Guardar",
	"common.rename": "Mudar o nome",

	// rolling
	"roll.button": "Lançar",
	"roll.hint": "Escolhe uns dados em baixo e lança-os.",
	"roll.pickDice": "Escolhe pelo menos um dado",
	"roll.clear": "Limpar",
	"roll.mode.regular": "Normal",
	"roll.mode.advantage": "Vantagem",
	"roll.mode.disadvantage": "Desvantagem",
	"roll.modeHint.regular": "Os dados somam-se.",
	"roll.modeHint.advantage":
		"Os teus dados são duplicados e só conta o mais alto. Apenas um tipo de dado.",
	"roll.modeHint.disadvantage":
		"Os teus dados são duplicados e só conta o mais baixo. Apenas um tipo de dado.",
	"roll.combine.total": "Somar tudo",
	"roll.combine.separate": "Cada tipo em separado",
	"roll.addDie": "Adicionar um {die}",
	"roll.removeDie": "Remover um {die}",
	"roll.saveFavorite": "Guardar como favorito",
	"result.total": "Total",
	"result.perfect": "Lançamento perfeito!",
	"result.reconfigure": "Mudar dados",
	"result.reroll": "Lançar outra vez",
	"result.saved": "Guardado",
	"board.fallback":
		"O tabuleiro 3D não conseguiu arrancar aqui, por isso os dados foram lançados sem animação.",

	// favorites
	"favorites.title": "Favoritos",
	"favorites.hint": "Toca num para o lançar.",
	"favorites.empty":
		"Ainda não há favoritos.\nEscolhe uns dados e toca na estrela para os guardar.",
	"favorites.saveTitle": "Guardar como favorito",
	"favorites.namePlaceholder": "Nome (opcional)",
	"favorites.renameTitle": "Mudar o nome do favorito",
	"favorites.deleteTitle": "Eliminar este favorito?",
	"favorites.deleteBody": "“{name}” será eliminado.",

	// history
	"history.title": "Histórico",
	"history.empty": "Ainda não há lançamentos.\nVai lançar uns dados.",
	"history.clear": "Limpar histórico",
	"history.clearTitle": "Limpar o histórico?",
	"history.clearBody": "Todos os lançamentos anteriores serão eliminados.",
	"time.now": "agora mesmo",
	"time.minutes": "{n} min",
	"time.hours": "{n} h",
	"time.days": "{n} d",

	// settings
	"settings.title": "Definições",
	"settings.language": "Idioma",
	"settings.languageHint":
		"“Predefinição do sistema” segue o idioma do teu telemóvel e usa inglês se o teu idioma não estiver disponível.",
	"settings.languageSystem": "Predefinição do sistema",
	"settings.sound": "Som",
	"settings.soundThrow": "Sons do lançamento",
	"settings.soundThrowHint": "Dados a rolar e a chocar.",
	"settings.soundResult": "Som do resultado",
	"settings.soundResultHint":
		"Uma pequena celebração quando o resultado aparece.",
	"settings.haptics": "Vibração",
	"settings.hapticsToggle": "Resposta háptica",
	"settings.hapticsHint": "Vibrações curtas enquanto lanças.",
	"settings.hapticsTriggers": "Escolhe o que vibra",
	"settings.hapticsStrength": "Intensidade da vibração",
	"settings.hapticsStrengthHint":
		"Deslize para a direita para uma vibração mais intensa.",
	"settings.gestures": "Gestos",
	"settings.swipeToRoll": "Deslizar para cima para lançar",
	"settings.swipeToRollHint":
		"Desliza para cima em qualquer parte do ecrã para lançar os dados escolhidos.",
	"settings.throwToRoll": "Lançar com um gesto",
	"settings.throwToRollHint":
		"Faz um gesto de lançamento com o telemóvel para lançar os dados.",
	"settings.throwSensitivity": "Sensibilidade",
	"settings.throwSensitivityHint":
		"Mais alta reage a lançamentos suaves. Mais baixa exige um lançamento mais forte, para não ativar sem querer.",
	"settings.throwLow": "Baixa",
	"settings.throwHigh": "Alta",
	"settings.orientation": "Orientação",
	"settings.orientationHint":
		"O ecrã fica nesta posição e nunca roda sozinho, por isso lançar o telemóvel não o pode rodar.",
	"settings.orientationPortrait": "Vertical",
	"settings.orientationLandscape": "Horizontal",
	"haptics.throw": "Lançar os dados",
	"haptics.clash": "Choque de dados",
	"haptics.result": "Mostrar o resultado",
	"haptics.buttons": "Botões",
	"settings.theme": "Tema",
	"settings.presets": "Predefinições",
	"role.background": "Fundo",
	"role.card": "Painéis",
	"role.text": "Texto",
	"role.accent": "Contraste / destaque",
	"preset.navy": "Marinho",
	"preset.midnight": "Meia-noite",
	"preset.paper": "Papel",
	"preset.forest": "Floresta",
	"preset.grape": "Uva",
	"color.custom": "Cor personalizada",
	"color.hue": "Matiz",
	"color.saturation": "Saturação",
	"color.lightness": "Luminosidade",
	"color.hex": "Código hex",
	"color.apply": "Aplicar",
	"settings.themeTransfer": "Compartilhar temas",
	"settings.exportTheme": "Exportar tema",
	"settings.importTheme": "Importar tema",
	"settings.importHint":
		"Cole um tema exportado deste app ou de qualquer app que use os mesmos nomes de cor: background, card, text e accent.",
	"settings.importInvalid":
		"Esse não é um tema válido. Ele precisa de background, card, text e accent, cada um como uma cor #RRGGBB.",
	"settings.importButton": "Importar",
	"settings.dice": "Dados",
	"dice.transparency": "Transparência",
	"dice.transparencyHint": "O quanto os dados são transparentes. 0% é opaco.",
	"dice.font": "Fonte dos números",
	"dice.fontHint":
		"Cada fonte é usada no seu peso mais grosso, para que os números continuem marcantes.",
	"dice.numberColor": "Cor dos números",
	"dice.numberColorHint":
		"Auto escolhe branco ou preto, o que ler melhor sobre os dados.",
	"dice.numberAuto": "Auto",
	"dice.numbersFollow": "Os números seguem a transparência",
	"dice.numbersFollowHint":
		"Quando ativado, os números ficam transparentes junto com os dados. Quando desativado, continuam opacos.",
	"dice.image": "Imagem",
	"dice.imageHint":
		"Cole um link (https) para uma imagem. O app a baixa no seu celular e a coloca sobre a cor dos dados. Usar uma nova apaga a anterior.",
	"dice.imagePlaceholder": "https://…",
	"dice.imageUse": "Usar imagem",
	"dice.imageRemove": "Remover imagem",
	"dice.imageTransparency": "Transparência da imagem",
	"dice.downloading": "Baixando…",
	"dice.errorUrl": "Esse não é um link https válido.",
	"dice.errorDownload":
		"Não foi possível baixar essa imagem. Verifique o link e a conexão.",
	"dice.errorTooBig":
		"Essa imagem é grande demais. Use uma de até 8 MB e 4096 pixels por lado.",
	"dice.errorNotImage": "Esse link não é uma imagem que o app consiga ler.",
	"dice.transfer": "Compartilhar dados",
	"dice.export": "Exportar dados",
	"dice.import": "Importar dados",
	"dice.importHint":
		"Cole as configurações de dados exportadas deste app. Se incluírem um link de imagem, a imagem é baixada e substitui a atual.",
	"dice.importInvalid":
		"Essas não são configurações de dados válidas. Verifique o texto e se o link da imagem, se houver, começa com https.",

	// about
	"credits.about": "Sobre",
	"credits.madeBy": "Feito por {developer}.",
	"credits.icons": "{ionicons} de {ionic}.",
	"credits.kofi": "Se um dia te apetecer, tenho um Ko-fi!",
};
