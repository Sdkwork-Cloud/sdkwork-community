import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import {
  registerCommunityPcLanguageBridgeBinder,
  type CommunityPcLanguageBridge,
} from "../host/adapter";
import enCommon from "./en-US/community/community/common.json";
import enDetail from "./en-US/community/community/detail.json";
import enDocs from "./en-US/community/community/docs.json";
import enFeed from "./en-US/community/community/feed.json";
import enGroup from "./en-US/community/community/group.json";
import enHome from "./en-US/community/community/home.json";
import enNews from "./en-US/community/community/news.json";
import enRepos from "./en-US/community/community/repos.json";
import enResource from "./en-US/community/community/resource.json";
import enSoftware from "./en-US/community/community/software.json";
import enToast from "./en-US/community/community/toast.json";
import enUpload from "./en-US/community/community/upload.json";
import zhCommon from "./zh-CN/community/community/common.json";
import zhDetail from "./zh-CN/community/community/detail.json";
import zhDocs from "./zh-CN/community/community/docs.json";
import zhFeed from "./zh-CN/community/community/feed.json";
import zhGroup from "./zh-CN/community/community/group.json";
import zhHome from "./zh-CN/community/community/home.json";
import zhNews from "./zh-CN/community/community/news.json";
import zhRepos from "./zh-CN/community/community/repos.json";
import zhResource from "./zh-CN/community/community/resource.json";
import zhSoftware from "./zh-CN/community/community/software.json";
import zhToast from "./zh-CN/community/community/toast.json";
import zhUpload from "./zh-CN/community/community/upload.json";

const enUS = {
  common: enCommon,
  detail: enDetail,
  docs: enDocs,
  feed: enFeed,
  group: enGroup,
  home: enHome,
  news: enNews,
  repos: enRepos,
  resource: enResource,
  software: enSoftware,
  toast: enToast,
  upload: enUpload,
};
const zhCN = {
  common: zhCommon,
  detail: zhDetail,
  docs: zhDocs,
  feed: zhFeed,
  group: zhGroup,
  home: zhHome,
  news: zhNews,
  repos: zhRepos,
  resource: zhResource,
  software: zhSoftware,
  toast: zhToast,
  upload: zhUpload,
};

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
