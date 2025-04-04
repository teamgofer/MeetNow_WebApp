export function initThemeToggle() {
    const themeToggle = document.querySelector('.neu-theme-toggle');
    if (!themeToggle)
        return;
    themeToggle.setAttribute('role', 'switch');
    themeToggle.setAttribute('aria-checked', 'false');
    const preferences = loadThemePreferences();
    applyTheme(preferences.theme);
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        saveThemePreferences({ theme: newTheme, systemTheme: false });
    });
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
function loadThemePreferences() {
    const saved = localStorage.getItem('theme-preferences');
    if (saved) {
        try {
            return JSON.parse(saved);
        }
        catch {
            return { theme: 'light', systemTheme: true };
        }
    }
    return { theme: 'light', systemTheme: true };
}
function saveThemePreferences(preferences) {
    localStorage.setItem('theme-preferences', JSON.stringify(preferences));
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggle = document.querySelector('.neu-theme-toggle');
    if (themeToggle) {
        themeToggle.setAttribute('aria-checked', (theme === 'dark').toString());
    }
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = theme === 'light' ? '#ffffff' : '#1a1a1a';
}
//# sourceMappingURL=theme.js.map