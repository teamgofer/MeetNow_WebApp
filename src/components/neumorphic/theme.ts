/**
 * Theme types
 */
export type Theme = 'light' | 'dark';

/**
 * Theme preferences
 */
interface IThemePreferences {
  theme: Theme;
  systemTheme: boolean;
}

/**
 * Initialize theme toggle
 */
export function initThemeToggle(): void {
  const themeToggle = document.querySelector<HTMLElement>('.neu-theme-toggle');
  if (!themeToggle) return;

  // Add ARIA attributes
  themeToggle.setAttribute('role', 'switch');
  themeToggle.setAttribute('aria-checked', 'false');

  // Load saved preferences
  const preferences = loadThemePreferences();
  applyTheme(preferences.theme);

  // Add event listeners
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    applyTheme(newTheme);
    saveThemePreferences({ theme: newTheme, systemTheme: false });
  });

  // Listen for system theme changes
  if (preferences.systemTheme) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', e => {
      if (preferences.systemTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      }
    });
  }
}

/**
 * Load theme preferences
 */
function loadThemePreferences(): ThemePreferences {
  const saved = localStorage.getItem('theme-preferences');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { theme: 'light', systemTheme: true };
    }
  }
  return { theme: 'light', systemTheme: true };
}

/**
 * Save theme preferences
 */
function saveThemePreferences(preferences: ThemePreferences): void {
  localStorage.setItem('theme-preferences', JSON.stringify(preferences));
}

/**
 * Apply theme
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);

  // Update theme toggle state
  const themeToggle = document.querySelector<HTMLElement>('.neu-theme-toggle');
  if (themeToggle) {
    themeToggle.setAttribute('aria-checked', (theme === 'dark').toString());
  }

  // Update meta theme-color
  let metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.content = theme === 'light' ? '#ffffff' : '#1a1a1a';
}
