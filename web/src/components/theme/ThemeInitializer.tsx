"use client";

import { useEffect } from "react";
import { applyTheme, loadTheme, loadThemeFromServer } from "@/lib/theme-config";

export function ThemeInitializer() {
  useEffect(() => {
    let cancelled = false;

    const initTheme = async () => {
      const serverTheme = await loadThemeFromServer();
      if (cancelled) {
        return;
      }
      applyTheme(serverTheme || loadTheme());
    };

    initTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
