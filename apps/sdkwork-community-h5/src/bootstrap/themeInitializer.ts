import { useEffect } from "react";

/**
 * Standalone community H5 theme initializer.
 *
 * The consuming IM h5 shell owns an equivalent initializer; the standalone
 * `sdkwork-community-h5` application needs the same logic so circle pages
 * follow the persisted dark-mode preference and the system color scheme.
 * Reuses the same `clawchat_app_settings.darkMode` key as the IM h5 shell so
 * a user choice made inside IM H5 also applies to the standalone circle app
 * (and vice versa).
 *
 * Browser / WeChat X5 notes:
 * - `prefers-color-scheme` is only consulted when the user never made an
 *   explicit choice; browsers without the query (older X5) report `false`
 *   and stay in light mode instead of flashing wrong colors.
 * - Older X5 kernels (Chromium < 83) only expose the legacy
 *   `MediaQueryList.addListener` API. We attach the modern
 *   `addEventListener("change")` when available and fall back to
 *   `addListener` so the theme keeps following the WeChat DevTools simulator
 *   and X5 webviews after load.
 */

const SETTINGS_STORAGE_KEY = "clawchat_app_settings";

interface PersistedAppSettings {
  darkMode?: boolean;
}

function readPersistedSettings(storage: Storage): PersistedAppSettings | null {
  const stored = storage.getItem(SETTINGS_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    const parsed = JSON.parse(stored) as PersistedAppSettings;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    // malformed storage: treated as no explicit preference
    return null;
  }
}

/**
 * Reads the persisted dark-mode preference; `null` when the user never made
 * an explicit choice (then the system color scheme applies).
 */
export function readExplicitDarkPreference(
  storage: Storage = window.localStorage,
): boolean | null {
  const settings = readPersistedSettings(storage);
  if (settings && typeof settings.darkMode === "boolean") {
    return settings.darkMode;
  }
  return null;
}

/**
 * Applies the persisted dark-mode preference on startup; falls back to the
 * system color scheme when the user never chose. Keeps the `.dark` class in
 * sync so both the theme variables and the `dark:` variants switch together.
 */
export function applyInitialTheme(
  root: HTMLElement = document.documentElement,
): void {
  const explicit = readExplicitDarkPreference();
  if (explicit !== null) {
    root.classList.toggle("dark", explicit);
    return;
  }
  root.classList.toggle(
    "dark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

type SystemThemeChangeHandler = (matches: boolean) => void;

function mediaChangeHandler(
  root: HTMLElement,
  onChange: SystemThemeChangeHandler,
): (event: MediaQueryListEvent | MediaQueryList) => void {
  return (event) => {
    if (readExplicitDarkPreference() !== null) {
      return;
    }
    onChange(event.matches);
  };
}

/**
 * Follows system theme changes (WeChat DevTools simulator included) unless
 * the user has an explicit persisted preference. Returns a cleanup function.
 */
export function installSystemThemeListener(
  root: HTMLElement = document.documentElement,
): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const toggle = (matches: boolean): void => {
    root.classList.toggle("dark", matches);
  };
  const handler = mediaChangeHandler(root, toggle);
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }
  // Legacy X5 / older WebKit engines: MediaQueryList only exposes addListener.
  media.addListener(handler);
  return () => media.removeListener(handler);
}

/**
 * Mount anywhere inside the app root: applies the initial theme before the
 * first paint settles and keeps following system changes afterwards.
 */
export function ThemeInitializer(): null {
  useEffect(() => {
    applyInitialTheme();
    return installSystemThemeListener();
  }, []);
  return null;
}
