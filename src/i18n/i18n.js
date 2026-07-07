import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const storedUser = localStorage.getItem("user");
const userLanguage = storedUser ? JSON.parse(storedUser)?.language : null;
const savedLanguage = localStorage.getItem("appLanguage");
const initialLanguage = savedLanguage || userLanguage || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function applyDocumentDirection(lng) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
}

applyDocumentDirection(initialLanguage);

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("appLanguage", lng);
  applyDocumentDirection(lng);
});

export default i18n;
