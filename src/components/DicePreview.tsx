import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { DICE_FONT_FAMILIES } from "../dice/fonts";
import { useTheme } from "../theme/ThemeContext";
import { DiceStyle, Theme } from "../types";
import { opacityOf } from "../utils/diceStyle";
import { readableOn } from "../utils/format";

type Props = {
	style: Pick<
		DiceStyle,
		| "transparency"
		| "numberFont"
		| "numberColor"
		| "numbersFollowTransparency"
		| "imageTransparency"
	> & { imageUri?: string | null };
};

/**
 * A flat sketch of one die on the board: the dice color (see-through by the
 * chosen amount), the picture over it and the number on top. The real dice are
 * 3D, but this shows every setting at a glance.
 */
export default function DicePreview({ style }: Props) {
	const theme = useTheme();
	const s = useMemo(() => makeStyles(theme), [theme]);
	const body = opacityOf(style.transparency);
	const ink = style.numberColor ?? readableOn(theme.accent);
	const family = DICE_FONT_FAMILIES[style.numberFont];
	return (
		<View style={s.board} accessibilityElementsHidden>
			<View style={s.die}>
				<View style={[StyleSheet.absoluteFill, { opacity: body }]}>
					<View
						style={[StyleSheet.absoluteFill, { backgroundColor: theme.accent }]}
					/>
					{style.imageUri ? (
						<Image
							source={{ uri: style.imageUri }}
							resizeMode="cover"
							style={[
								StyleSheet.absoluteFill,
								{ opacity: opacityOf(style.imageTransparency) },
							]}
						/>
					) : null}
				</View>
				<Text
					style={[
						s.number,
						{
							color: ink,
							fontFamily: family,
							opacity: style.numbersFollowTransparency ? body : 1,
						},
					]}
				>
					20
				</Text>
			</View>
		</View>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		// The dice sit on the background color, like on the real board.
		board: {
			height: 104,
			borderRadius: 8,
			backgroundColor: t.background,
			alignItems: "center",
			justifyContent: "center",
			borderWidth: 1,
			borderColor: t.text + "22",
		},
		die: {
			width: 72,
			height: 72,
			borderRadius: 14,
			overflow: "hidden",
			alignItems: "center",
			justifyContent: "center",
		},
		number: { fontSize: 32 },
	});
