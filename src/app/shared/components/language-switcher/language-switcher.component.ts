import { Component } from '@angular/core';
import { AppTranslateService } from '../../../core/services/app-translate.service';

@Component({
    selector: 'app-language-switcher',
    template: `
    <div class="relative inline-block text-left">
      <button 
        type="button" 
        (click)="toggleDropdown()"
        class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-expanded="true" 
        aria-haspopup="true">
        {{ currentLang === 'en' ? 'English' : 'العربية' }}
        <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <div *ngIf="isOpen" 
        class="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
        <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
          <button 
            (click)="switchLanguage('en')" 
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" 
            role="menuitem">
            🇺🇸 English
          </button>
          <button 
            (click)="switchLanguage('ar')" 
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" 
            role="menuitem">
            🇸🇦 العربية
          </button>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class LanguageSwitcherComponent {
    isOpen = false;
    currentLang: string;

    constructor(private appTranslate: AppTranslateService) {
        this.currentLang = this.appTranslate.getCurrentLanguage();
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
    }

    switchLanguage(lang: string) {
        this.appTranslate.setLanguage(lang);
        this.currentLang = lang;
        this.isOpen = false;
    }
}
