"use client";

import { useLayoutEffect } from "react";
import { Icon } from "./icon";

const THEME_STORAGE_KEY = "lumix-theme";

function readStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  } catch {
    return null;
  }
}

export function ThemeToggle() {
  useLayoutEffect(() => {
    const storedTheme = readStoredTheme();
    if (storedTheme) document.documentElement.dataset.theme = storedTheme;
  }, []);

  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The selected theme still applies for this session when storage is unavailable.
    }
  }

  return (
    <button className="trade-icon-button header-utility-button theme-toggle" type="button" onClick={toggleTheme}>
      <span className="theme-toggle-icon theme-toggle-icon--light" aria-hidden="true">
        <Icon name="sun" size={17} />
      </span>
      <span className="theme-toggle-icon theme-toggle-icon--dark" aria-hidden="true">
        <Icon name="moon" size={17} />
      </span>
      <span className="trade-sr-only theme-toggle-label theme-toggle-label--light">Switch to light mode</span>
      <span className="trade-sr-only theme-toggle-label theme-toggle-label--dark">Switch to dark mode</span>
    </button>
  );
}
