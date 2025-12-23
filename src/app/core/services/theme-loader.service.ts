import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ThemeLoaderService {

    loadTheme(): void {
        const themePath = `assets/themes/${environment.clientId}.css`;
        const linkElement = document.createElement('link');

        linkElement.rel = 'stylesheet';
        linkElement.href = themePath;
        linkElement.id = 'client-theme';

        document.head.appendChild(linkElement);

        console.log('Theme loaded:', themePath);
    }

    // Optional: Allow runtime theme switching
    switchTheme(clientId: string): void {
        const existingLink = document.getElementById('client-theme') as HTMLLinkElement;
        if (existingLink) {
            existingLink.href = `assets/themes/${clientId}.css`;
        }
    }
}
