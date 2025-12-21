import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
    email: string = '';
    token: string = '';
    password: string = '';
    confirmPassword: string = '';
    loading: boolean = false;
    success: boolean = false;
    errors: any = {};
    passwordStrength: 'weak' | 'medium' | 'strong' | null = null;

    constructor(
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService
    ) {
        const navigation = this.router.getCurrentNavigation();
        this.email = navigation?.extras.state?.['email'];
        this.token = navigation?.extras.state?.['token'];
    }

    ngOnInit(): void {
        if (!this.email || !this.token) {
            this.notificationService.error('Invalid password reset link. Please try again.');
            this.router.navigate(['/forgot-password']);
        }
    }

    calculatePasswordStrength(): void {
        if (!this.password) {
            this.passwordStrength = null;
            return;
        }

        let strength = 0;
        if (this.password.length >= 8) strength++;
        if (this.password.length >= 12) strength++;
        if (/[a-z]/.test(this.password) && /[A-Z]/.test(this.password)) strength++;
        if (/\d/.test(this.password)) strength++;
        if (/[^a-zA-Z\d]/.test(this.password)) strength++;

        if (strength <= 2) this.passwordStrength = 'weak';
        else if (strength <= 3) this.passwordStrength = 'medium';
        else this.passwordStrength = 'strong';
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.password) {
            this.errors.password = 'Password is required';
            isValid = false;
        } else if (this.password.length < 6) {
            this.errors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (!this.confirmPassword) {
            this.errors.confirmPassword = 'Please confirm your password';
            isValid = false;
        } else if (this.password !== this.confirmPassword) {
            this.errors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        return isValid;
    }

    handleSubmit(): void {
        if (!this.validate()) return;

        this.loading = true;
        this.errors = {};

        this.authService.changePassword(this.email, this.token, this.password).subscribe({
            next: (response: any) => {
                this.loading = false;
                const result = response.result || response;
                if (result && result.status && result.status !== 'success') {
                    const errorMessage = result.message || 'Failed to reset password';
                    this.errors.form = errorMessage;
                    this.notificationService.error(errorMessage);
                    return;
                }

                this.success = true;
                this.notificationService.success('Password reset successful!');
                setTimeout(() => {
                    this.router.navigate(['/login'], {
                        state: { message: 'Password reset successful! Please login with your new password.' }
                    });
                }, 2000);
            },
            error: (err) => {
                this.loading = false;
                console.error(err);

                // Handle specific error cases
                const errorResponse = err.error || err;
                let errorMessage = 'Failed to reset password. Please try again.';

                if (errorResponse.result?.status === 'error') {
                    errorMessage = errorResponse.result.message || errorMessage;
                } else if (errorResponse.message) {
                    errorMessage = errorResponse.message;
                }

                // Check for rate limiting
                if (errorMessage.toLowerCase().includes('too many attempts')) {
                    errorMessage = 'Too many password reset attempts. Please try again later.';
                    this.notificationService.warning(errorMessage, 7000);
                } else {
                    this.notificationService.error(errorMessage);
                }

                this.errors.form = errorMessage;
            }
        });
    }
}
