import { Component } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html'
})
export class ContactComponent {
    clientId = environment.clientId;
    loading = false;
    formData = {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    };

    constructor(private notificationService: NotificationService) { }

    contactInfo = [
        {
            icon: 'phone',
            title: 'CONTACT.INFO.PHONE',
            details: ['+971 4 123 4567', '+971 50 123 4567'],
            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        },
        {
            icon: 'mail',
            title: 'CONTACT.INFO.EMAIL',
            details: ['info@orientinsurance.com', 'support@orientinsurance.com'],
            color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
        },
        {
            icon: 'map-pin',
            title: 'CONTACT.INFO.ADDRESS',
            details: ['CONTACT.INFO.ADDRESS_DETAILS.CITY', 'CONTACT.INFO.ADDRESS_DETAILS.BUILDING'],
            color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
        },
        {
            icon: 'clock',
            title: 'CONTACT.INFO.BUSINESS_HOURS',
            details: ['CONTACT.INFO.HOURS_DETAILS.WEEKDAYS', 'CONTACT.INFO.HOURS_DETAILS.WEEKEND'],
            color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
        }
    ];

    onSubmit(): void {
        this.loading = true;

        // Simulate API call
        setTimeout(() => {
            console.log('Contact form submitted:', this.formData);
            this.notificationService.success('Thank you for contacting us! We will get back to you soon.');
            this.loading = false;
            this.resetForm();
        }, 1500);
    }

    resetForm(): void {
        this.formData = {
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: ''
        };
    }
}
