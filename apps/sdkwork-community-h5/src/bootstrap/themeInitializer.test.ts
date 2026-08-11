import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyInitialTheme,
  installSystemThemeListener,
  readExplicitDarkPreference,
} from "./themeInitializer";

const SETTINGS_STORAGE_KEY = "clawchat_app_settings";

interface MockMediaQueryList {
  matches: boolean;
  listeners: Array<(event: { matches: boolean }) => void>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
}

function installMatchMediaMock(initialMatches: boolean): MockMediaQueryList {
  const mql: MockMediaQueryList = {
    matches: initialMatches,
    listeners: [],
    addEventListener: vi.fn((_type: string, listener: (event: { matches: boolean }) => void) => {
      mql.listeners.push(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: (event: { matches: boolean }) => void) => {
      mql.listeners = mql.listeners.filter((entry) => entry !== listener);
    }),
    addListener: vi.fn((listener: (event: { matches: boolean }) => void) => {
      mql.listeners.push(listener);
    }),
    removeListener: vi.fn((listener: (event: { matches: boolean }) => void) => {
      mql.listeners = mql.listeners.filter((entry) => entry !== listener);
    }),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return mql;
}

function emitMediaChange(mql: MockMediaQueryList, matches: boolean): void {
  mql.matches = matches;
  for (const listener of [...mql.listeners]) {
    listener({ matches });
  }
}

function writeSettings(darkMode: boolean): void {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ darkMode }));
}

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("readExplicitDarkPreference", () => {
  it("returns null when the user never made an explicit choice", () => {
    expect(readExplicitDarkPreference()).toBeNull();
  });

  it("returns the persisted boolean preference", () => {
    writeSettings(true);
    expect(readExplicitDarkPreference()).toBe(true);
    window.localStorage.clear();
    writeSettings(false);
    expect(readExplicitDarkPreference()).toBe(false);
  });

  it("treats malformed storage as no explicit preference", () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, "{not-json");
    expect(readExplicitDarkPreference()).toBeNull();
  });
});

describe("applyInitialTheme", () => {
  it("applies the persisted dark preference over the system scheme", () => {
    installMatchMediaMock(false);
    writeSettings(true);
    const root = document.createElement("div");
    applyInitialTheme(root);
    expect(root.classList.contains("dark")).toBe(true);
  });

  it("removes the dark class when the persisted preference is light", () => {
    installMatchMediaMock(true);
    writeSettings(false);
    const root = document.createElement("div");
    root.classList.add("dark");
    applyInitialTheme(root);
    expect(root.classList.contains("dark")).toBe(false);
  });

  it("falls back to the system color scheme without an explicit choice", () => {
    installMatchMediaMock(true);
    const root = document.createElement("div");
    applyInitialTheme(root);
    expect(root.classList.contains("dark")).toBe(true);
  });

  it("stays light when the system scheme is light", () => {
    installMatchMediaMock(false);
    const root = document.createElement("div");
    root.classList.add("dark");
    applyInitialTheme(root);
    expect(root.classList.contains("dark")).toBe(false);
  });
});

describe("installSystemThemeListener", () => {
  it("follows system theme changes when no explicit preference exists", () => {
    const mql = installMatchMediaMock(false);
    const root = document.createElement("div");
    const cleanup = installSystemThemeListener(root);

    emitMediaChange(mql, true);
    expect(root.classList.contains("dark")).toBe(true);
    emitMediaChange(mql, false);
    expect(root.classList.contains("dark")).toBe(false);

    cleanup();
  });

  it("never overrides an explicit persisted preference", () => {
    const mql = installMatchMediaMock(false);
    writeSettings(true);
    const root = document.createElement("div");
    installSystemThemeListener(root);

    emitMediaChange(mql, false);
    expect(root.classList.contains("dark")).toBe(false);
  });

  it("removes the listener on cleanup", () => {
    const mql = installMatchMediaMock(false);
    const cleanup = installSystemThemeListener(document.createElement("div"));
    cleanup();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });

  it("falls back to the legacy addListener API on older X5 engines", () => {
    const mql = installMatchMediaMock(false);
    // Simulate an older engine without addEventListener on MediaQueryList.
    mql.addEventListener = undefined as unknown as MockMediaQueryList["addEventListener"];
    const root = document.createElement("div");
    const cleanup = installSystemThemeListener(root);

    expect(mql.addListener).toHaveBeenCalled();
    emitMediaChange(mql, true);
    expect(root.classList.contains("dark")).toBe(true);

    cleanup();
    expect(mql.removeListener).toHaveBeenCalled();
  });
});
