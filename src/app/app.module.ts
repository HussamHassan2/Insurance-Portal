import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OdooLivechatComponent } from './components/odoo-livechat/odoo-livechat.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SharedModule } from './shared/shared.module';

// Core Services
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

// Translation
import { TranslateModule, TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { MyMissingTranslationHandler } from './core/handlers/missing-translation.handler';
import { APP_INITIALIZER } from '@angular/core';
import { TenantConfigService } from './core/services/tenant-config.service';
import { ThemeLoaderService } from './core/services/theme-loader.service';
import { initializeApp } from './core/initializers/app.initializer';
import { TenantInterceptor } from './core/interceptors/tenant.interceptor';

// Factory function for translation loader
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        AppComponent,
        OdooLivechatComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        ToastComponent,
        TranslateModule.forRoot({
            defaultLanguage: 'en',
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            },
            missingTranslationHandler: {
                provide: MissingTranslationHandler,
                useClass: MyMissingTranslationHandler
            }
        })
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TenantInterceptor,
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeApp,
            deps: [TenantConfigService, ThemeLoaderService],
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
