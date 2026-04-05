export type ColorMode = "dark" | "light";

const COLOR_MODE_STORAGE_KEY = "site-color-mode-v1";

function isColorMode(value: string | null): value is ColorMode {
  return value === "dark" || value === "light";
}

export function getSystemColorMode(): ColorMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function loadColorMode(): ColorMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (isColorMode(stored)) {
    return stored;
  }

  return getSystemColorMode();
}

export function applyColorMode(mode: ColorMode): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-color-mode", mode);
}

export function saveColorMode(mode: ColorMode): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }
  applyColorMode(mode);
}

export function toggleColorMode(currentMode: ColorMode): ColorMode {
  const nextMode: ColorMode = currentMode === "dark" ? "light" : "dark";
  saveColorMode(nextMode);
  return nextMode;
}

export function initializeColorMode(): ColorMode {
  const mode = loadColorMode();
  applyColorMode(mode);
  return mode;
}
