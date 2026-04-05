export type ThemeConfig = {
  primary: string;
  accent: string;
  text: string;
  textSecondary: string;
  background: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  badge: string;
};

export const THEME_STORAGE_KEY = "site-theme-config-v2";

// Known legacy (old green/orange) primary colors that should be replaced
export const LEGACY_PRIMARY_COLORS = [
  "#0f766e", // old default teal-green
  "#4b5320", // olive
  "#1b4332", // dark green
  "#0f4c5c", // dark teal
  "#7a3e00", // brown-orange
  "#4caf50", // material green
  "#22c55e", // lime green
];

export const LEGACY_ACCENT_COLORS = [
  "#f97316", // old default orange
  "#f48c06", // amber
  "#ffb703", // yellow
];

export function isLegacyTheme(theme: ThemeConfig): boolean {
  return (
    LEGACY_PRIMARY_COLORS.includes(theme.primary.toLowerCase()) ||
    LEGACY_ACCENT_COLORS.includes(theme.accent.toLowerCase())
  );
}

export function isDefaultTheme(theme: ThemeConfig): boolean {
  return (
    theme.primary.toLowerCase() === DEFAULT_THEME.primary &&
    theme.accent.toLowerCase() === DEFAULT_THEME.accent &&
    theme.background.toLowerCase() === DEFAULT_THEME.background
  );
}

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#0891b2",
  accent: "#ec4899",
  text: "#f8fafc",
  textSecondary: "#a0aec0",
  background: "#0f172a",
  border: "#64748b",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#06b6d4",
  badge: "#ec4899",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const shortMatch = /^#[0-9a-fA-F]{3}$/.test(withHash);
  const longMatch = /^#[0-9a-fA-F]{6}$/.test(withHash);

  if (longMatch) {
    return withHash.toLowerCase();
  }

  if (shortMatch) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex) || DEFAULT_THEME.primary;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
}

function adjustHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = clamp(r + amount, 0, 255);
  const ng = clamp(g + amount, 0, 255);
  const nb = clamp(b + amount, 0, 255);
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb
    .toString(16)
    .padStart(2, "0")}`;
}

function sanitizeTheme(input: Partial<ThemeConfig>): ThemeConfig {
  const primary = normalizeHex(input.primary || "") || DEFAULT_THEME.primary;
  const accent = normalizeHex(input.accent || "") || DEFAULT_THEME.accent;
  const text = normalizeHex(input.text || "") || DEFAULT_THEME.text;
  const textSecondary =
    normalizeHex(input.textSecondary || "") || DEFAULT_THEME.textSecondary;
  const background =
    normalizeHex(input.background || "") || DEFAULT_THEME.background;
  const border = normalizeHex(input.border || "") || DEFAULT_THEME.border;
  const success = normalizeHex(input.success || "") || DEFAULT_THEME.success;
  const error = normalizeHex(input.error || "") || DEFAULT_THEME.error;
  const warning = normalizeHex(input.warning || "") || DEFAULT_THEME.warning;
  const info = normalizeHex(input.info || "") || DEFAULT_THEME.info;
  const badge = normalizeHex(input.badge || "") || DEFAULT_THEME.badge;
  return {
    primary,
    accent,
    text,
    textSecondary,
    background,
    border,
    success,
    error,
    warning,
    info,
    badge,
  };
}

export function applyTheme(config: Partial<ThemeConfig>): ThemeConfig {
  if (typeof document === "undefined") {
    return sanitizeTheme(config);
  }

  const theme = sanitizeTheme(config);
  const primaryRgb = hexToRgb(theme.primary);
  const accentRgb = hexToRgb(theme.accent);
  const textRgb = hexToRgb(theme.text);
  const textSecondaryRgb = hexToRgb(theme.textSecondary);

  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty(
    "--color-primary-rgb",
    `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
  );
  root.style.setProperty("--color-primary-hover", adjustHex(theme.primary, 14));
  root.style.setProperty("--color-primary-light", adjustHex(theme.primary, 24));
  root.style.setProperty(
    "--color-primary-gradient",
    `linear-gradient(135deg, ${theme.primary}, ${adjustHex(theme.primary, 14)})`,
  );

  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty(
    "--color-accent-rgb",
    `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
  );
  root.style.setProperty("--color-accent-hover", adjustHex(theme.accent, -12));
  root.style.setProperty("--color-accent-light", adjustHex(theme.accent, 18));
  root.style.setProperty(
    "--color-accent-gradient",
    `linear-gradient(135deg, ${theme.accent}, ${adjustHex(theme.accent, -12)})`,
  );

  root.style.setProperty("--bg-body", theme.background);
  root.style.setProperty("--bg-surface-1", adjustHex(theme.background, 8));
  root.style.setProperty("--bg-surface-2", adjustHex(theme.background, 16));
  root.style.setProperty("--bg-surface-3", adjustHex(theme.background, 24));
  root.style.setProperty("--bg-input", adjustHex(theme.background, 34));
  root.style.setProperty("--bg-hover", adjustHex(theme.background, 42));
  root.style.setProperty("--bg-elevated", adjustHex(theme.background, 52));

  root.style.setProperty("--text-light", theme.text);
  root.style.setProperty(
    "--text-light-rgb",
    `${textRgb.r}, ${textRgb.g}, ${textRgb.b}`,
  );
  root.style.setProperty("--text-white", theme.text);
  root.style.setProperty(
    "--text-white-rgb",
    `${textRgb.r}, ${textRgb.g}, ${textRgb.b}`,
  );
  root.style.setProperty("--text-primary", adjustHex(theme.text, -28));
  root.style.setProperty("--text-secondary", theme.textSecondary);
  root.style.setProperty(
    "--text-secondary-rgb",
    `${textSecondaryRgb.r}, ${textSecondaryRgb.g}, ${textSecondaryRgb.b}`,
  );
  root.style.setProperty("--text-muted", adjustHex(theme.textSecondary, -40));
  root.style.setProperty("--border-secondary", adjustHex(theme.border, -24));
  root.style.setProperty("--border-light", theme.border);
  root.style.setProperty("--border-elevated", adjustHex(theme.border, 16));

  root.style.setProperty("--color-success", theme.success);
  root.style.setProperty("--color-success-dark", adjustHex(theme.success, -22));
  root.style.setProperty("--color-error", theme.error);
  root.style.setProperty("--color-error-dark", adjustHex(theme.error, -22));
  root.style.setProperty("--color-warning", theme.warning);
  root.style.setProperty("--color-warning-dark", adjustHex(theme.warning, -22));
  root.style.setProperty("--color-info", theme.info);
  root.style.setProperty("--color-info-dark", adjustHex(theme.info, -22));
  root.style.setProperty("--color-badge", theme.badge);

  return theme;
}

export function loadTheme(): ThemeConfig {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_THEME;
    }
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>;
    return sanitizeTheme(parsed);
  } catch {
    return DEFAULT_THEME;
  }
}

type FooterSettingsThemeResponse = {
  sitePrimaryColor?: string;
  siteAccentColor?: string;
  siteTextColor?: string;
  siteTextSecondaryColor?: string;
  siteBackgroundColor?: string;
  siteBorderColor?: string;
  siteSuccessColor?: string;
  siteErrorColor?: string;
  siteWarningColor?: string;
  siteInfoColor?: string;
  siteBadgeColor?: string;
};

export async function loadThemeFromServer(): Promise<ThemeConfig | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      return null;
    }

    const res = await fetch(`${baseUrl}/settings/footer`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as FooterSettingsThemeResponse;
    const theme = sanitizeTheme({
      primary: data.sitePrimaryColor,
      accent: data.siteAccentColor,
      text: data.siteTextColor,
      textSecondary: data.siteTextSecondaryColor,
      background: data.siteBackgroundColor,
      border: data.siteBorderColor,
      success: data.siteSuccessColor,
      error: data.siteErrorColor,
      warning: data.siteWarningColor,
      info: data.siteInfoColor,
      badge: data.siteBadgeColor,
    });

    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    return theme;
  } catch {
    return null;
  }
}

export function saveTheme(config: Partial<ThemeConfig>): ThemeConfig {
  const theme = sanitizeTheme(config);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  }
  applyTheme(theme);
  return theme;
}

export function resetTheme(): ThemeConfig {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  }
  applyTheme(DEFAULT_THEME);
  return DEFAULT_THEME;
}

export async function saveThemeToServer(
  config: Partial<ThemeConfig>,
): Promise<ThemeConfig> {
  const theme = sanitizeTheme(config);

  if (typeof window !== "undefined") {
    const { apiClient } = await import("@/lib/api-client");
    await apiClient.put("/settings/footer", {
      sitePrimaryColor: theme.primary,
      siteAccentColor: theme.accent,
      siteTextColor: theme.text,
      siteTextSecondaryColor: theme.textSecondary,
      siteBackgroundColor: theme.background,
      siteBorderColor: theme.border,
      siteSuccessColor: theme.success,
      siteErrorColor: theme.error,
      siteWarningColor: theme.warning,
      siteInfoColor: theme.info,
      siteBadgeColor: theme.badge,
    });
  }

  saveTheme(theme);
  return theme;
}
