import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ChangePasswordComponent } from '../../components/change-password/change-password.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    user: any = null;
    isEditing = false;
    loading = true;
    formData = {
        name_ar: '',
        name_en: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        gender: '',
        birth_date: '',
        is_foreign_customer: false,
        national_id: '',
        passport_id: '',
        tax_id: '',
        bio: ''
    };

    constructor(
        private authService: AuthService,
        private customerService: CustomerService,
        private notificationService: NotificationService
    ) { }

    @ViewChild(ChangePasswordComponent) changePasswordComponent!: ChangePasswordComponent;

    openChangePassword(): void {
        this.changePasswordComponent.open();
    }

    ngOnInit(): void {
        this.authService.currentUser.subscribe(user => {
            this.user = user;
            if (user) {
                this.loadProfile();
            }
        });
    }

    loadProfile(): void {
        this.loading = true;
        const userId = this.user?.id || 2; // Fallback as in React
        this.customerService.getCustomerInfo(userId).subscribe({
            next: (response) => {
                // Extract customer_info from the response
                const customerInfo = response.data?.customer_info || response.customer_info || response.data?.result?.data || response.data?.result || response.data || {};

                this.formData = {
                    name_ar: customerInfo.customer_name_ar || customerInfo.name_ar || '',
                    name_en: customerInfo.customer_name_en || customerInfo.name_en || customerInfo.name || this.user?.name || '',
                    email: customerInfo.customer_email || customerInfo.email || this.user?.email || '',
                    phone: customerInfo.customer_phone || customerInfo.mobile || customerInfo.phone || this.user?.phone || '',
                    address: customerInfo.customer_address || customerInfo.street || customerInfo.address || this.user?.address || '',
                    city: customerInfo.customer_city || customerInfo.city || this.user?.city || '',
                    state: customerInfo.customer_state || customerInfo.state || '',
                    country: customerInfo.customer_country || customerInfo.country || this.user?.country || '',
                    gender: customerInfo.customer_gender || customerInfo.gender || '',
                    birth_date: customerInfo.customer_birth_date || customerInfo.birth_date || '',
                    is_foreign_customer: customerInfo.is_foreign_customer || false,
                    national_id: customerInfo.customer_national_id || customerInfo.national_id || '',
                    passport_id: customerInfo.customer_passport_id || customerInfo.passport_id || '',
                    tax_id: customerInfo.customer_tax_id || customerInfo.tax_id || '',
                    bio: customerInfo.comment || customerInfo.bio || ''
                };
                this.loading = false;
            },
            error: (err) => {
                console.error("Failed to fetch profile:", err);
                // Fallback to local user data
                this.formData = {
                    name_ar: '',
                    name_en: this.user?.name || '',
                    email: this.user?.email || '',
                    phone: this.user?.phone || '',
                    address: this.user?.address || '',
                    city: this.user?.city || '',
                    state: '',
                    country: this.user?.country || '',
                    gender: '',
                    birth_date: '',
                    is_foreign_customer: false,
                    national_id: '',
                    passport_id: '',
                    tax_id: '',
                    bio: ''
                };
                this.loading = false;
            }
        });
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;
    }

    onSubmit(): void {
        this.loading = true;

        // TODO: Implement actual API update logic
        // For now simulating API delay
        setTimeout(() => {
            console.log('Updating profile:', this.formData);
            this.notificationService.success('Profile updated successfully!');
            this.loading = false;
            this.isEditing = false;
        }, 1000);
    }

    cancel(): void {
        this.isEditing = false;
        // Reload profile data to reset form
        this.loadProfile();
    }
}
