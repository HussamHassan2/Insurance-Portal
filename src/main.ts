import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Polyfill Buffer for Tesseract.js
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
