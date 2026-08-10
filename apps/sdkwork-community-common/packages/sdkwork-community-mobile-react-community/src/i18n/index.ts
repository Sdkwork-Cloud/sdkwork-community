import i18next from "i18next";
import zhCommunity from "../locales/zh/community.json";
import enCommunity from "../locales/en/community.json";

/**
 * Community (圈子) i18n resources.
 *
 * Pages use the default `translation` namespace with `community.` prefixed
 * keys (e.g. `t("community.auto_fn_afc180c")`), matching the shared i18next
 * layout used by the sdkwork-im h5 host. Importing this module registers the
 * bundles on the global i18next instance so the resources are available both
 * inside a host application and in the standalone sdkwork-community h5 app.
 */

export const communityZhTranslation = { community: zhCommunity };
export const communityEnTranslation = { community: enCommunity };

export const COMMUNITY_I18N_RESOURCES = {
  zh: { translation: communityZhTranslation },
  en: { translation: communityEnTranslation },
} as const;

export function registerCommunityMobileI18n(): void {
  i18next.addResourceBundle("zh", "translation", communityZhTranslation, true, true);
  i18next.addResourceBundle("en", "translation", communityEnTranslation, true, true);
}

registerCommunityMobileI18n();
