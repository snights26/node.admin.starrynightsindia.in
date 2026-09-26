import { useTheme } from "./ThemeProvider";
import "./theme.css";

export default function ThemeToggle() {
  const { activeTheme, toggleTheme, isScheduledTheme } = useTheme();
  const isDark = activeTheme === "dark";

  return (
    <button
      type="button"
      className={isDark ? "theme-toggle is-dark" : "theme-toggle is-light"}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={isScheduledTheme ? "Using the IST automatic theme. Click to override for this session." : "Session-only theme override"}
    >
      <img
        className="theme-toggle__image"
        src={isDark ? "/theme-toggle-night.png" : "/theme-toggle-day.png"}
        alt=""
        aria-hidden="true"
      />
    </button>
  );
}
