import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import {
  registerCommunityPcLanguageBridgeBinder,
  type CommunityPcLanguageBridge,
} from "../host/adapter";
import zhCN from "./locales/zh-CN/community.json";
import enUS from "./locales/en-US/community.json";

const SUPPORTED_LANGUAGES = ["zh-CN", "en-US"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function normalizeLanguage(value: unknown): SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
    ? (value as SupportedLanguage)
    : "zh-CN";
}

function resolveDefaultLanguage(): SupportedLanguage {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
    return "en-US";
  }
  return "zh-CN";
}

const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources: { "zh-CN": { community: zhCN }, "en-US": { community: enUS } },
  lng: resolveDefaultLanguage(),
  fallbackLng: "zh-CN",
  ns: ["community"],
  defaultNS: "community",
  interpolation: { escapeValue: false },
});

function bindLanguageBridge(bridge: CommunityPcLanguageBridge): void {
  const initial = normalizeLanguage(bridge.resolveInitialLanguage());
  if (i18n.language !== initial) {
    void i18n.changeLanguage(initial);
  }
  bridge.onLanguageChange((language) => {
    const next = normalizeLanguage(language);
    if (i18n.language !== next) {
      void i18n.changeLanguage(next);
    }
  });
}

registerCommunityPcLanguageBridgeBinder(bindLanguageBridge);

export default i18n;
