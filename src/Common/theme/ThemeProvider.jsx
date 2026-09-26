import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { darkTheme } from "./darkTheme";
import { lightTheme } from "./lightTheme";
import { getScheduledTheme } from "./themeConfig";

const ThemeContext = createContext(null);
const themes = { dark: darkTheme, light: lightTheme };

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.dataset.theme = theme.name;
  root.style.colorScheme = theme.colorScheme;
  Object.entries(theme.variables).forEach(([key, value]) => root.style.setProperty(key, value));
};

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(null);
  const [scheduledTheme, setScheduledTheme] = useState(getScheduledTheme);
  const activeThemeName = preference || scheduledTheme;
  const activeTheme = themes[activeThemeName] || darkTheme;

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    const refreshScheduledTheme = () => setScheduledTheme(getScheduledTheme());
    refreshScheduledTheme();
    const timer = window.setInterval(refreshScheduledTheme, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const setPreference = (nextPreference) => {
    setPreferenceState(nextPreference);
  };

  const toggleTheme = () => {
    setPreference(activeThemeName === "dark" ? "light" : "dark");
  };

  const value = useMemo(() => ({
    preference,
    activeTheme: activeTheme.name,
    setPreference,
    toggleTheme,
    isScheduledTheme: !preference,
  }), [preference, activeTheme.name]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
};
