import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface PasswordStrength {
    level: 'weak' | 'fair' | 'good' | 'strong';
    label: string;
    color: string;
    segments: number;
}

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
    isOpen = false;
    isLoading = false;
    isSuccess = false;
    errorMessage = '';

    changePasswordForm!: FormGroup;

    // Password visibility toggles
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;

    // Password strength
    passwordStrength: PasswordStrength = {
        level: 'weak',
        label: 'Weak',
        color: 'bg-red-500',
        segments: 0
    };

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private notificationService: NotificationService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
        this.changePasswordForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        });

        // Subscribe to new password changes to calculate strength
        this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(value => {
            this.calculatePasswordStrength(value);
        });
    }

    open(): void {
        this.isOpen = true;
        this.resetForm();
    }

    close(): void {
        if (!this.isLoading) {
            this.isOpen = false;
            this.resetForm();
        }
    }

    resetForm(): void {
        this.changePasswordForm.reset();
        this.isSuccess = false;
        this.errorMessage = '';
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
        this.passwordStrength = {
            level: 'weak',
            label: 'Weak',
            color: 'bg-red-500',
            segments: 0
        };
    }

    togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
        switch (field) {
            case 'current':
                this.showCurrentPassword = !this.showCurrentPassword;
                break;
            case 'new':
                this.showNewPassword = !this.showNewPassword;
                break;
            case 'confirm':
                this.showConfirmPassword = !this.showConfirmPassword;
                break;
        }
    }

    calculatePasswordStrength(password: string): void {
        if (!password) {
            this.passwordStrength = {
                level: 'weak',
                label: 'Weak',
                color: 'bg-red-500',
                segments: 0
            };
            return;
        }

        const length = password.length;

        if (length < 6) {
            this.passwordStrength = {
                level: 'weak',
                label: 'Weak',
                color: 'bg-red-500',
                segments: 1
            };
        } else if (length >= 6 && length < 10) {
            this.passwordStrength = {
                level: 'fair',
                label: 'Fair',
                color: 'bg-orange-500',
                segments: 2
            };
        } else if (length >= 10 && length < 14) {
            this.passwordStrength = {
                level: 'good',
                label: 'Good',
                color: 'bg-yellow-500',
                segments: 3
            };
        } else {
            this.passwordStrength = {
                level: 'strong',
                label: 'Strong',
                color: 'bg-green-500',
                segments: 4
            };
        }
    }

    get passwordsMatch(): boolean {
        const newPassword = this.changePasswordForm.get('newPassword')?.value;
        const confirmPassword = this.changePasswordForm.get('confirmPassword')?.value;
        return newPassword && confirmPassword && newPassword === confirmPassword;
    }

    get passwordsDontMatch(): boolean {
        const confirmPassword = this.changePasswordForm.get('confirmPassword')?.value;
        return confirmPassword && !this.passwordsMatch;
    }

    get isFormValid(): boolean {
        return this.changePasswordForm.valid && this.passwordsMatch;
    }

    onSubmit(): void {
        if (!this.isFormValid || this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const currentPassword = this.changePasswordForm.get('currentPassword')?.value;
        const newPassword = this.changePasswordForm.get('newPassword')?.value;

        this.authService.changePasswordWithCurrent(currentPassword, newPassword).subscribe({
            next: (response) => {
                // Check if response has a direct error property (standard JSON-RPC error)
                if (response.error) {
                    this.isLoading = false;
                    this.errorMessage = response.error.data?.message || response.error.message || 'An error occurred';
                    this.notificationService.error(this.errorMessage);
                    return;
                }

                // Check for logical error inside result
                if (response.result && response.result.status === 'error') {
                    this.isLoading = false;
                    this.errorMessage = response.result.message || 'Failed to update password.';
                    this.notificationService.error(this.errorMessage);
                    return;
                }

                // Check for successful status
                if (response.result && response.result.status === 'success') {
                    this.isLoading = false;
                    this.isSuccess = true;

                    // Wait 2 seconds, then logout and redirect
                    setTimeout(() => {
                        this.authService.logout();
                        this.router.navigate(['/login']);
                        this.close();
                    }, 2000);
                    return;
                }

                // Fallback if status is not 'success' (e.g. unknown response format)
                this.isLoading = false;
                this.errorMessage = response.result?.message || 'Failed to verify password update.';
                this.notificationService.error(this.errorMessage);
            },
            error: (error) => {
                this.isLoading = false;

                // Handle specific error messages
                if (error.message && error.message.includes('incorrect')) {
                    this.errorMessage = 'Current password is incorrect';
                } else if (error.message) {
                    this.errorMessage = error.message;
                } else {
                    this.errorMessage = 'Failed to update password. Please try again.';
                }

                this.notificationService.error(this.errorMessage);
            }
        });
    }

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget && !this.isLoading) {
            this.close();
        }
    }
}
