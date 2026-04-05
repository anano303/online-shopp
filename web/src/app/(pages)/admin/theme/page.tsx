"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api-client";
import {
  applyTheme,
  DEFAULT_THEME,
  loadTheme,
  loadThemeFromServer,
  resetTheme,
  saveTheme,
  saveThemeToServer,
} from "@/lib/theme-config";
import styles from "./page.module.css";

const PRIMARY_PALETTE = [
  "#4b5320",
  "#0f4c5c",
  "#1b4332",
  "#7a3e00",
  "#5a189a",
  "#8d0801",
];

const ACCENT_PALETTE = [
  "#f48c06",
  "#ffb703",
  "#2ec4b6",
  "#4cc9f0",
  "#ef476f",
  "#ffd166",
];

const TEXT_PALETTE = [
  "#f5e9d1",
  "#ffffff",
  "#f8f3e8",
  "#e8e1d3",
  "#d9c9a3",
  "#c8c0b0",
];

const TEXT_SECONDARY_PALETTE = [
  "#d9c9a3",
  "#c8c0b0",
  "#b8a98a",
  "#a99a7a",
  "#e8e1d3",
  "#f2e6cf",
];

const BACKGROUND_PALETTE = [
  "#121212",
  "#101820",
  "#1a1a1a",
  "#1b1f2a",
  "#161a1d",
  "#1f1f1f",
];

const BORDER_PALETTE = [
  "#555555",
  "#3f3f46",
  "#4a4e69",
  "#525252",
  "#6b7280",
  "#334155",
];
const SUCCESS_PALETTE = [
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
  "#064e3b",
  "#f0fdf4",
];
const ERROR_PALETTE = [
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#7f1d1d",
  "#fef2f2",
];
const WARNING_PALETTE = [
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
  "#fffbeb",
];
const INFO_PALETTE = [
  "#06b6d4",
  "#0891b2",
  "#0e7490",
  "#164e63",
  "#0c4a6e",
  "#ecf0f1",
];

const BADGE_PALETTE = [
  "#ec4899",
  "#db2777",
  "#be185d",
  "#9d174d",
  "#831843",
  "#fce7f3",
];

function sanitizeHex(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (
    /^#[0-9a-fA-F]{3}$/.test(withHash) ||
    /^#[0-9a-fA-F]{6}$/.test(withHash)
  ) {
    return withHash;
  }
  return input;
}

export default function AdminThemePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [primary, setPrimary] = useState(DEFAULT_THEME.primary);
  const [accent, setAccent] = useState(DEFAULT_THEME.accent);
  const [text, setText] = useState(DEFAULT_THEME.text);
  const [textSecondary, setTextSecondary] = useState(
    DEFAULT_THEME.textSecondary,
  );
  const [background, setBackground] = useState(DEFAULT_THEME.background);
  const [border, setBorder] = useState(DEFAULT_THEME.border);
  const [success, setSuccess] = useState(DEFAULT_THEME.success);
  const [error, setError] = useState(DEFAULT_THEME.error);
  const [warning, setWarning] = useState(DEFAULT_THEME.warning);
  const [info, setInfo] = useState(DEFAULT_THEME.info);
  const [badge, setBadge] = useState(DEFAULT_THEME.badge);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/admin/theme");
      return;
    }

    const initialize = async () => {
      const serverTheme = await loadThemeFromServer();
      const current = serverTheme || loadTheme();
      setPrimary(current.primary);
      setAccent(current.accent);
      setText(current.text);
      setTextSecondary(current.textSecondary);
      setBackground(current.background);
      setBorder(current.border);
      setSuccess(current.success);
      setError(current.error);
      setWarning(current.warning);
      setInfo(current.info);
      setBadge(current.badge);
      applyTheme(current);
      setIsLoading(false);
    };

    initialize();
  }, [router]);

  const hasChanges = useMemo(
    () =>
      primary.toLowerCase() !== DEFAULT_THEME.primary ||
      accent.toLowerCase() !== DEFAULT_THEME.accent ||
      text.toLowerCase() !== DEFAULT_THEME.text ||
      textSecondary.toLowerCase() !== DEFAULT_THEME.textSecondary ||
      background.toLowerCase() !== DEFAULT_THEME.background ||
      border.toLowerCase() !== DEFAULT_THEME.border ||
      success.toLowerCase() !== DEFAULT_THEME.success ||
      error.toLowerCase() !== DEFAULT_THEME.error ||
      warning.toLowerCase() !== DEFAULT_THEME.warning ||
      info.toLowerCase() !== DEFAULT_THEME.info ||
      badge.toLowerCase() !== DEFAULT_THEME.badge,
    [
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
    ],
  );

  const updatePrimary = (value: string) => {
    const next = sanitizeHex(value);
    setPrimary(next);
    applyTheme({
      primary: next,
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
    });
  };

  const updateAccent = (value: string) => {
    const next = sanitizeHex(value);
    setAccent(next);
    applyTheme({
      primary,
      accent: next,
      text,
      textSecondary,
      background,
      border,
      success,
      error,
      warning,
      info,
      badge,
    });
  };

  const updateText = (value: string) => {
    const next = sanitizeHex(value);
    setText(next);
    applyTheme({
      primary,
      accent,
      text: next,
      textSecondary,
      background,
      border,
      success,
      error,
      warning,
      info,
      badge,
    });
  };

  const updateTextSecondary = (value: string) => {
    const next = sanitizeHex(value);
    setTextSecondary(next);
    applyTheme({
      primary,
      accent,
      text,
      textSecondary: next,
      background,
      border,
      success,
      error,
      warning,
      info,
      badge,
    });
  };

  const updateBackground = (value: string) => {
    const next = sanitizeHex(value);
    setBackground(next);
    applyTheme({
      primary,
      accent,
      text,
      textSecondary,
      background: next,
      border,
      success,
      error,
      warning,
      info,
      badge,
    });
  };

  const updateBorder = (value: string) => {
    const next = sanitizeHex(value);
    setBorder(next);
    applyTheme({
      primary,
      accent,
      text,
      textSecondary,
      background,
      border: next,
      success,
      error,
      warning,
      info,
      badge,
    });
  };

  const updateSuccess = (value: string) => {
    const next = sanitizeHex(value);
    setSuccess(next);
    applyTheme({
      primary,
      accent,
      text,
      textSecondary,
      background,
      border,
      success: next,
      error,
      warning,
      info,
      badge,
    });
  };

  const updateError = (value: string) => {
    const next = sanitizeHex(value);
    setError(next);
    applyTheme({
      primary,
      accent,
      text,
      textSecondary,
      background,
      border,
      success,
      error: next,
      warning,
      info,
      badge,
    });
  };

  const updateWarning = (value: string) => {
    const next = sanitizeHex(value);
    setWarning(next);
    applyTheme({
      primary,
      accent,
      text,
      textSecondary,
      background,
      border,
      success,
      error,
      warning: next,
      info,
      badge,
    });
  };

  const updateInfo = (value: string) => {
    const next = sanitizeHex(value);
    setInfo(next);
    applyTheme({
      primary,
      accent,
      text,
      textSecondary,
      background,
      border,
      success,
      error,
      warning,
      info: next,
      badge,
    });
  };

  const updateBadge = (value: string) => {
    const next = sanitizeHex(value);
    setBadge(next);
    applyTheme({
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
      badge: next,
    });
  };

  const handleSave = async () => {
    try {
      await saveThemeToServer({
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
      });
    } catch {
      // Fallback to local persistence if server save fails
      saveTheme({
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
      });
    }
  };

  const handleReset = () => {
    const defaults = resetTheme();
    setPrimary(defaults.primary);
    setAccent(defaults.accent);
    setText(defaults.text);
    setTextSecondary(defaults.textSecondary);
    setBackground(defaults.background);
    setBorder(defaults.border);
    setSuccess(defaults.success);
    setError(defaults.error);
    setWarning(defaults.warning);
    setInfo(defaults.info);
    setBadge(defaults.badge);
  };

  if (isLoading) {
    return <div className={styles["loading-container"]}>იტვირთება...</div>;
  }

  return (
    <div className={styles["theme-settings-page"]}>
      <h1 className={styles["theme-settings-title"]}>საიტის ფერების მართვა</h1>

      <div className={styles["theme-grid"]}>
        <section className={styles["theme-card"]}>
          <h3>ძირითადი ფერი (Primary)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(primary)
                  ? primary
                  : DEFAULT_THEME.primary
              }
              onChange={(e) => updatePrimary(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={primary}
              onChange={(e) => updatePrimary(e.target.value)}
              placeholder="#4b5320"
            />
          </div>
          <div className={styles["palette"]}>
            {PRIMARY_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${primary.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updatePrimary(color)}
                aria-label={`Primary ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>აქცენტური ფერი (Accent)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : DEFAULT_THEME.accent
              }
              onChange={(e) => updateAccent(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={accent}
              onChange={(e) => updateAccent(e.target.value)}
              placeholder="#f48c06"
            />
          </div>
          <div className={styles["palette"]}>
            {ACCENT_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${accent.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateAccent(color)}
                aria-label={`Accent ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>ტექსტის ფერი (Text)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(text) ? text : DEFAULT_THEME.text}
              onChange={(e) => updateText(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={text}
              onChange={(e) => updateText(e.target.value)}
              placeholder="#f5e9d1"
            />
          </div>
          <div className={styles["palette"]}>
            {TEXT_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${text.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateText(color)}
                aria-label={`Text ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>ტექსტი 2 (Secondary Text)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(textSecondary)
                  ? textSecondary
                  : DEFAULT_THEME.textSecondary
              }
              onChange={(e) => updateTextSecondary(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={textSecondary}
              onChange={(e) => updateTextSecondary(e.target.value)}
              placeholder="#d9c9a3"
            />
          </div>
          <div className={styles["palette"]}>
            {TEXT_SECONDARY_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${textSecondary.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateTextSecondary(color)}
                aria-label={`Secondary text ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>ფონის ფერი (Background)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(background)
                  ? background
                  : DEFAULT_THEME.background
              }
              onChange={(e) => updateBackground(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={background}
              onChange={(e) => updateBackground(e.target.value)}
              placeholder="#121212"
            />
          </div>
          <div className={styles["palette"]}>
            {BACKGROUND_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${background.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateBackground(color)}
                aria-label={`Background ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>საზღვრის ფერი (Border)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(border) ? border : DEFAULT_THEME.border
              }
              onChange={(e) => updateBorder(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={border}
              onChange={(e) => updateBorder(e.target.value)}
              placeholder="#555555"
            />
          </div>
          <div className={styles["palette"]}>
            {BORDER_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${border.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateBorder(color)}
                aria-label={`Border ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>წარმატების ფერი (Success)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(success)
                  ? success
                  : DEFAULT_THEME.success
              }
              onChange={(e) => updateSuccess(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={success}
              onChange={(e) => updateSuccess(e.target.value)}
              placeholder="#10b981"
            />
          </div>
          <div className={styles["palette"]}>
            {SUCCESS_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${success.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateSuccess(color)}
                aria-label={`Success ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>შეცდომის ფერი (Error)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(error) ? error : DEFAULT_THEME.error
              }
              onChange={(e) => updateError(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={error}
              onChange={(e) => updateError(e.target.value)}
              placeholder="#ff6b6b"
            />
          </div>
          <div className={styles["palette"]}>
            {ERROR_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${error.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateError(color)}
                aria-label={`Error ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>გაფრთხილების ფერი (Warning)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(warning)
                  ? warning
                  : DEFAULT_THEME.warning
              }
              onChange={(e) => updateWarning(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={warning}
              onChange={(e) => updateWarning(e.target.value)}
              placeholder="#ffc107"
            />
          </div>
          <div className={styles["palette"]}>
            {WARNING_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${warning.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateWarning(color)}
                aria-label={`Warning ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>ინფორმაციის ფერი (Info)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(info) ? info : DEFAULT_THEME.info}
              onChange={(e) => updateInfo(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={info}
              onChange={(e) => updateInfo(e.target.value)}
              placeholder="#007bff"
            />
          </div>
          <div className={styles["palette"]}>
            {INFO_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${info.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateInfo(color)}
                aria-label={`Info ${color}`}
              />
            ))}
          </div>
        </section>

        <section className={styles["theme-card"]}>
          <h3>ბეჯი ფერი (Badge)</h3>
          <div className={styles["theme-input-row"]}>
            <input
              className={styles["theme-color-input"]}
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(badge) ? badge : DEFAULT_THEME.badge
              }
              onChange={(e) => updateBadge(e.target.value)}
            />
            <input
              className={styles["theme-hex-input"]}
              type="text"
              value={badge}
              onChange={(e) => updateBadge(e.target.value)}
              placeholder="#ff6b6b"
            />
          </div>
          <div className={styles["palette"]}>
            {BADGE_PALETTE.map((color) => (
              <button
                key={color}
                className={`${styles["palette-btn"]} ${badge.toLowerCase() === color ? styles.active : ""}`}
                style={{ background: color }}
                onClick={() => updateBadge(color)}
                aria-label={`Badge ${color}`}
              />
            ))}
          </div>
        </section>
      </div>

      <div className={styles["theme-actions"]}>
        <button
          className={`${styles["theme-btn"]} ${styles.primary}`}
          onClick={handleSave}
        >
          შენახვა
        </button>
        <button className={styles["theme-btn"]} onClick={handleReset}>
          დეფოლტ ფერებზე აღდგენა
        </button>
      </div>

      <p className={styles["theme-hint"]}>
        ფერების შეცვლისას საიტი მაშინვე განახლდება. &quot;შენახვა&quot; ინახავს
        ცვლილებებს, ხოლო &quot;დეფოლტ ფერებზე აღდგენა&quot; ერთ დაჭერაში
        აბრუნებს საწყის სტილს.
      </p>
      {hasChanges && (
        <p className={styles["theme-hint"]}>
          არსებობს ცვლილება დეფოლტთან შედარებით.
        </p>
      )}
    </div>
  );
}
