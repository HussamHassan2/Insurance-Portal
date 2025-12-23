import { TenantConfigService } from '../services/tenant-config.service';
import { ThemeLoaderService } from '../services/theme-loader.service';
import { firstValueFrom } from 'rxjs';

export function initializeApp(
    configService: TenantConfigService,
    themeLoader: ThemeLoaderService
): () => Promise<void> {
    return async () => {
        try {
            // 1. Load theme CSS (synchronous, from assets)
            themeLoader.loadTheme();

            // 2. Load tenant config from API (asynchronous)
            // We use firstValueFrom to convert Observable to Promise for APP_INITIALIZER
            // This blocks app startup until config is loaded
            await firstValueFrom(configService.loadConfig());

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            // Optional: You can choose to not throw error to let app start with defaults
            // throw error; 
        }
    };
}
