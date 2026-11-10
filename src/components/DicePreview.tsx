import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { DICE_FONT_FAMILIES } from "../dice/fonts";
import { segmentOf } from "../dice/geometry";
import { useTheme } from "../theme/ThemeContext";
import { DiceStyle, Theme } from "../types";
import { opacityOf } from "../utils/diceStyle";
import { readableOn } from "../utils/format";

/** The sketch shows the die with the highest number of a d20. */
const SKETCH_SIDES = 20;
const DIE_SIZE = 72;

type Props = {
	style: Pick<
		DiceStyle,
		| "transparency"
		| "numberFont"
		| "numberColor"
		| "numbersFollowTransparency"
		| "imageTransparency"
		| "imageSplit"
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
	// Cut-up picture: show the piece that belongs to this die's number.
	const piece = style.imageSplit
		? segmentOf(SKETCH_SIDES - 1, SKETCH_SIDES)
		: null;
	return (
		<View style={s.board} accessibilityElementsHidden>
			<View style={s.die}>
				<View style={[StyleSheet.absoluteFill, { opacity: body }]}>
					<View
						style={[StyleSheet.absoluteFill, { backgroundColor: theme.accent }]}
					/>
					{style.imageUri && piece ? (
						<Image
							source={{ uri: style.imageUri }}
							resizeMode="stretch"
							style={{
								position: "absolute",
								width: DIE_SIZE / piece.size,
								height: DIE_SIZE / piece.size,
								left: DIE_SIZE / 2 - (piece.u * DIE_SIZE) / piece.size,
								top: DIE_SIZE / 2 - (piece.v * DIE_SIZE) / piece.size,
								opacity: opacityOf(style.imageTransparency),
							}}
						/>
					) : style.imageUri ? (
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
							position: "relative",
							top: family === DICE_FONT_FAMILIES.playfair ? -5 : 0,
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
			width: DIE_SIZE,
			height: DIE_SIZE,
			borderRadius: 14,
			overflow: "hidden",
			alignItems: "center",
			justifyContent: "center",
		},
		number: { fontSize: 32 },
	});
