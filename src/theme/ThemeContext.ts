import { createContext, useContext } from "react";
import { DEFAULT_SETTINGS } from "../constants";
import { Theme } from "../types";

export const ThemeContext = createContext<Theme>(DEFAULT_SETTINGS.theme);
export const useTheme = () => useContext(ThemeContext);
