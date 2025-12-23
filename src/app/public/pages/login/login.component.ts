import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = false;
    formError = '';
    showPassword = false;
    clientId = environment.clientId;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            rememberMe: [false]
        });
    }

    ngOnInit(): void {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            this.loginForm.patchValue({
                email: rememberedEmail,
                rememberMe: true
            });
        }
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    get email() { return this.loginForm.get('email'); }
    get password() { return this.loginForm.get('password'); }

    getFieldError(fieldName: string): string {
        const field = this.loginForm.get(fieldName);
        if (field?.hasError('required')) {
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        }
        if (field?.hasError('email')) {
            return 'Email is invalid';
        }
        return '';
    }

    fillDemoCredentials(role: string): void {
        const credentials: { [key: string]: any } = {
            customer: { email: 'user@orient.com', password: 'password' },
            broker: { email: 'broker@orient.com', password: 'password' },
            surveyor: { email: 'surveyor@odoo.com', password: 'password' }
        };

        const creds = credentials[role];
        if (creds) {
            this.loginForm.patchValue({
                email: creds.email,
                password: creds.password
            });
        }
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            Object.keys(this.loginForm.controls).forEach(key => {
                this.loginForm.get(key)?.markAsTouched();
            });
            this.notificationService.warning('Please fill in all required fields');
            return;
        }

        this.loading = true;
        this.formError = '';

        const { email, password, rememberMe } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: () => {
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                const user = this.authService.currentUserValue;
                if (user) {
                    switch (user.role) {
                        case 'broker':
                            this.router.navigate(['/dashboard/broker']);
                            break;
                        case 'admin':
                            this.router.navigate(['/dashboard/admin']);
                            break;
                        case 'surveyor':
                            this.router.navigate(['/dashboard/surveyor'], { queryParams: { wizard: 'true' } });
                            break;
                        default:
                            this.router.navigate(['/dashboard/customer']);
                    }
                } else {
                    this.formError = 'Login successful but user data could not be retrieved.';
                    this.loading = false;
                }
            },
            error: (err) => {
                this.formError = err.message || 'Failed to login. Please try again.';
                this.notificationService.error(this.formError);
                this.loading = false;
            }
        });
    }

    onGoogleLogin(): void {
        console.log('Google login initiated...');
        // TODO: Implement actual Google OAuth flow
        this.notificationService.info('Google login integration is coming soon!');
    }


}
