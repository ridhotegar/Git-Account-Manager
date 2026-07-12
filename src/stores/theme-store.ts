import { create } from "zustand";
import type { Theme } from "@/types/settings";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolvedTheme: "light",

  setTheme: (theme: Theme) => {
    localStorage.setItem("git-account-manager-theme", theme);
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },

  initTheme: () => {
    const saved = localStorage.getItem(
      "git-account-manager-theme"
    ) as Theme | null;
    const theme = saved || "system";
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        const current = get();
        if (current.theme === "system") {
          const newResolved = getSystemTheme();
          applyTheme(newResolved);
          set({ resolvedTheme: newResolved });
        }
      });
  },
}));
