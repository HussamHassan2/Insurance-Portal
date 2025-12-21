import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'theme';
    private isDarkMode = false;

    constructor() { }

    /**
     * Initialize theme from localStorage
     */
    initializeTheme(): void {
        const savedTheme = localStorage.getItem(this.THEME_KEY);

        if (savedTheme === 'dark') {
            this.enableDarkMode();
        } else if (savedTheme === 'light') {
            this.disableDarkMode();
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                this.enableDarkMode();
            }
        }
    }

    /**
     * Toggle between light and dark mode
     */
    toggleTheme(): void {
        if (this.isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    /**
     * Enable dark mode
     */
    enableDarkMode(): void {
        document.documentElement.classList.add('dark');
        localStorage.setItem(this.THEME_KEY, 'dark');
        this.isDarkMode = true;
    }

    /**
     * Disable dark mode
     */
    disableDarkMode(): void {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(this.THEME_KEY, 'light');
        this.isDarkMode = false;
    }

    /**
     * Get current theme mode
     */
    isDark(): boolean {
        return this.isDarkMode;
    }
}
