import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import esGt from "./es-gt";
import enUs from "./en-us";

const resources = {
  "es-GT": esGt,
  "en-US": enUs,
};

i18n.use(initReactI18next).init({
  resources,
  lng: "es-GT",
  fallbackLng: "es-GT",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
