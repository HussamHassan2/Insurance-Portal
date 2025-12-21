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
    error: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService
    ) { }

    handleSubmit(): void {
        if (!this.email) {
            this.error = 'Email is required';
            return;
        }

        if (!/\S+@\S+\.\S+/.test(this.email)) {
            this.error = 'Please enter a valid email address';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.requestOtp(this.email).subscribe({
            next: () => {
                this.loading = false;
                this.notificationService.success('Verification code sent successfully!');
                this.router.navigate(['/forgot-password/verify-otp'], { state: { email: this.email } });
            },
            error: (err) => {
                this.loading = false;
                console.error(err);

                // Handle specific error cases
                const errorResponse = err.error || err;
                let errorMessage = 'Failed to send verification code. Please try again.';

                if (errorResponse.result?.status === 'error') {
                    errorMessage = errorResponse.result.message || errorMessage;
                } else if (errorResponse.message) {
                    errorMessage = errorResponse.message;
                }

                // Check for rate limiting
                if (errorMessage.toLowerCase().includes('too many attempts')) {
                    errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
                    this.notificationService.warning(errorMessage, 7000);
                } else {
                    this.notificationService.error(errorMessage);
                }

                this.error = errorMessage;
            }
        });
    }
}
