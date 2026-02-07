"use client";

import React, { useState, useCallback } from "react";
import { Theme, ThemeContext } from "./ThemeContext";
import { noirTokens, standardTokens, ThemeTokens } from "./tokens";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const STORAGE_KEY = "a2ui-theme";

function generateCssVars(tokens: ThemeTokens): string {
  const colorVars = Object.entries(tokens.colors)
    .map(([key, value]) => `--a2ui-${key}: ${value};`)
    .join("\n");

  const fontVars = Object.entries(tokens.fonts)
    .map(([key, value]) => `--a2ui-font-${key}: ${value};`)
    .join("\n");

  return `${colorVars}\n${fontVars}`;
}

export function ThemeProvider({ children, defaultTheme = "noir" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return storedTheme && (storedTheme === "noir" || storedTheme === "standard")
      ? storedTheme
      : defaultTheme;
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const newTheme = prev === "noir" ? "standard" : "noir";
      localStorage.setItem(STORAGE_KEY, newTheme);
      return newTheme;
    });
  }, []);

  const currentTokens = theme === "noir" ? noirTokens : standardTokens;
  const cssVars = generateCssVars(currentTokens);

  return (
    <>
      {/* Safe: cssVars is generated from hard-coded token maps in tokens.ts, no user input */}
      <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} }` }} />
      <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
        {children}
      </ThemeContext.Provider>
    </>
  );
}
