"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ColorMode,
  initializeColorMode,
  loadColorMode,
  toggleColorMode,
} from "@/lib/color-mode";

export function ColorModeToggle() {
  const [mode, setMode] = useState<ColorMode>("dark");

  useEffect(() => {
    initializeColorMode();
    setMode(loadColorMode());
  }, []);

  return (
    <button
      type="button"
      className="color-mode-toggle"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setMode((current) => toggleColorMode(current))}
    >
      {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      <span>{mode === "dark" ? "LIGHT" : "DARK"}</span>
    </button>
  );
}
