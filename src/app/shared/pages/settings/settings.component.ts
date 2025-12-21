import { Component, ViewChild } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { AppTranslateService } from '../../../core/services/app-translate.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ChangePasswordComponent } from '../../components/change-password/change-password.component';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
    currentLanguage: string;
    notifications = {
        email: true,
        push: true,
        marketing: false
    };
    loading = false;

    @ViewChild(ChangePasswordComponent) changePasswordComponent!: ChangePasswordComponent;

    constructor(
        public themeService: ThemeService,
        private appTranslate: AppTranslateService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) {
        this.currentLanguage = this.appTranslate.getCurrentLanguage();
    }

    changeLanguage(lang: string): void {
        this.currentLanguage = lang;
        this.appTranslate.setLanguage(lang);
    }

    saveNotifications(): void {
        console.log('Saving notifications:', this.notifications);
        this.notificationService.success('Notification preferences saved!');
    }

    openChangePassword(): void {
        this.changePasswordComponent.open();
    }
}
