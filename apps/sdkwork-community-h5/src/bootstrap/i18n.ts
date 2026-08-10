import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import {
  COMMUNITY_I18N_RESOURCES,
} from "@sdkwork/community-mobile-react-community/i18n";

/**
 * Community H5 i18n bootstrap.
 *
 * The mobile React community pages use the shared `translation` namespace with
 * `community.` prefixed keys; the resources come from the
 * `community-mobile-react-community` package.
 */

let initialized = false;

export function initCommunityH5I18n(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  void i18next.use(initReactI18next).init({
    resources: COMMUNITY_I18N_RESOURCES as never,
    lng: "zh",
    fallbackLng: "zh",
    interpolation: { escapeValue: false },
  });
}
