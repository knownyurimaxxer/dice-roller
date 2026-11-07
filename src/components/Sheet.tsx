import { ReactNode, useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "../i18n/I18nContext";
import { useTheme } from "../theme/ThemeContext";
import { Theme } from "../types";
import { readableOn } from "../utils/format";
import { haptic } from "../utils/haptics";

type Props = {
	visible: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
};

/** A full-screen page that slides up, with a title and a Done button. */
export default function Sheet({ visible, title, onClose, children }: Props) {
	const theme = useTheme();
	const t = useT();
	const insets = useSafeAreaInsets(); // known from the first frame (see App)
	const s = useMemo(() => makeStyles(theme), [theme]);
	return (
		<Modal
			visible={visible}
			animationType="slide"
			onRequestClose={onClose}
			// Draw under both system bars, so the insets below are exactly right.
			statusBarTranslucent
			navigationBarTranslucent
			supportedOrientations={["portrait", "landscape"]}
		>
			<View
				style={[
					s.root,
					{
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
						paddingLeft: insets.left,
						paddingRight: insets.right,
					},
				]}
			>
				<View style={s.header}>
					<Text style={s.title}>{title}</Text>
					<Pressable
						onPress={() => {
							haptic("buttons");
							onClose();
						}}
						style={s.doneBtn}
					>
						<Text style={s.doneText}>{t("common.done")}</Text>
					</Pressable>
				</View>
				{children}
			</View>
		</Modal>
	);
}

const makeStyles = (t: Theme) =>
	StyleSheet.create({
		root: { flex: 1, backgroundColor: t.background },
		header: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			padding: 14,
		},
		title: { color: readableOn(t.background), fontSize: 20, fontWeight: "800" },
		doneBtn: {
			backgroundColor: t.accent,
			paddingHorizontal: 20,
			paddingVertical: 8,
			borderRadius: 18,
		},
		doneText: { color: readableOn(t.accent), fontWeight: "800", fontSize: 15 },
	});
