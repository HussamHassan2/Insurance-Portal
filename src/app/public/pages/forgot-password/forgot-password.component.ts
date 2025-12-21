import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
    email: string = '';
    loading: boolean = false;
    // error: string = ''; // Removed as we use toasts

    constructor(
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService
    ) { }

    handleSubmit(): void {
        if (!this.email) {
            this.notificationService.warning('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(this.email)) {
            this.notificationService.warning('Please enter a valid email address');
            return;
        }

        this.loading = true;
        // this.error = '';

        this.authService.requestOtp(this.email).subscribe({
            next: () => {
                this.loading = false;
                this.notificationService.success('Verification code sent successfully!');
                this.router.navigate(['/forgot-password/verify-otp'], { state: { email: this.email } });
            },
            error: (err) => {
                this.loading = false;
                console.error(err);

                // Error handled by global interceptor
            }
        });
    }
}
