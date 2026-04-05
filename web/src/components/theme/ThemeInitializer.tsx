"use client";

import { useEffect } from "react";
import {
  applyTheme,
  DEFAULT_THEME,
  isDefaultTheme,
  isLegacyTheme,
  saveTheme,
  saveThemeToServer,
  loadThemeFromServer,
} from "@/lib/theme-config";
import { initializeColorMode } from "@/lib/color-mode";

export function ThemeInitializer() {
  useEffect(() => {
    let cancelled = false;

    const initTheme = async () => {
      initializeColorMode();

      // Clear any stale cached theme keys
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("site-theme-config-v1");
      }

      const serverTheme = await loadThemeFromServer();
      if (cancelled) return;

      // If server returned a legacy (old green/orange) theme, reset to defaults
      if (serverTheme && isLegacyTheme(serverTheme)) {
        saveTheme(DEFAULT_THEME);
        saveThemeToServer(DEFAULT_THEME).catch(() => {});
        // globals.css already has correct defaults — no need to call applyTheme
        return;
      }

      // If server returned default colors (or is unreachable), clear localStorage
      // and let globals.css handle everything — no applyTheme() call.
      if (!serverTheme || isDefaultTheme(serverTheme)) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("site-theme-config-v2");
        }
        return;
      }

      // Server has a custom (non-default) theme — apply it
      applyTheme(serverTheme);
    };

    initTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
