import { Component } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-admin-settings',
    templateUrl: './admin-settings.component.html',
    styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent {
    settings = {
        siteName: 'Insurance Portal',
        supportEmail: 'support@insurance.com',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        smsNotifications: false
    };

    constructor(private notificationService: NotificationService) { }

    saveSettings(): void {
        console.log('Saving settings:', this.settings);
        this.notificationService.success('Settings saved successfully!');
    }
}
