import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AppTranslateService {

    constructor(private translate: TranslateService) { }

    // Get current language
    getCurrentLanguage(): string {
        return this.translate.currentLang || this.translate.defaultLang;
    }

    // Set language
    setLanguage(lang: string): void {
        this.translate.use(lang);
        localStorage.setItem('selectedLanguage', lang);
        this.updateDirection(lang);
    }

    // Get translated text instantly
    instant(key: string, params?: any): string {
        return this.translate.instant(key, params);
    }

    // Get translated text as Observable
    get(key: string | string[], params?: any): Observable<string | any> {
        return this.translate.get(key, params);
    }

    // Stream of translations
    stream(key: string | string[], params?: any): Observable<string | any> {
        return this.translate.stream(key, params);
    }

    // Update document direction for RTL
    private updateDirection(lang: string): void {
        const rtlLanguages = ['ar', 'he', 'ur'];
        const isRTL = rtlLanguages.includes(lang);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }

    // Initialize translation on app start
    init(): void {
        const savedLang = localStorage.getItem('selectedLanguage');
        const browserLang = this.translate.getBrowserLang();
        const defaultLang = savedLang || (browserLang && browserLang.match(/en|ar/) ? browserLang : 'en');

        this.translate.setDefaultLang('en');
        this.setLanguage(defaultLang);
    }
}
