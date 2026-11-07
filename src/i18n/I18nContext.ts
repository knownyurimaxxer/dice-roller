import { createContext, useContext } from "react";
import { buildI18n, SYSTEM_LANGUAGE } from "./index";

export const I18nContext = createContext(buildI18n(SYSTEM_LANGUAGE, []));

/** The language in use, its locale, and the `t()` that looks texts up. */
export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
