import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-verify-otp',
    templateUrl: './verify-otp.component.html'
})
export class VerifyOtpComponent implements OnInit {
    email: string = '';
    otp: string[] = ['', '', '', '', '', ''];
    loading: boolean = false;
    countdown: number = 60;
    canResend: boolean = false;
    private timer: any;

    constructor(
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService
    ) {
        const navigation = this.router.getCurrentNavigation();
        this.email = navigation?.extras.state?.['email'];
    }

    ngOnInit(): void {
        if (!this.email) {
            this.router.navigate(['/forgot-password']);
            return;
        }
        this.startCountdown();
    }

    startCountdown(): void {
        this.countdown = 60;
        this.canResend = false;
        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            if (this.countdown > 0) {
                this.countdown--;
            } else {
                this.canResend = true;
                clearInterval(this.timer);
            }
        }, 1000);
    }

    handleChange(index: number, value: string): void {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return;

        this.otp[index] = value;


        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    }

    handleKeyDown(index: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    }

    handlePaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text').slice(0, 6);
        if (!pastedData || !/^\d+$/.test(pastedData)) return;

        const digits = pastedData.split('');
        for (let i = 0; i < digits.length; i++) {
            this.otp[i] = digits[i];
        }
    }

    handleResend(): void {
        if (!this.canResend) return;

        this.otp = ['', '', '', '', '', ''];

        this.authService.requestOtp(this.email).subscribe({
            next: () => {
                this.notificationService.success('Verification code resent successfully!');
                this.startCountdown();
            },
            error: (err) => {
                console.error(err);

                // Handle specific error cases
                const errorResponse = err.error || err;
                let errorMessage = 'Failed to resend code. Please try again.';

                if (errorResponse.result?.status === 'error') {
                    errorMessage = errorResponse.result.message || errorMessage;
                } else if (errorResponse.message) {
                    errorMessage = errorResponse.message;
                }

                // Check for rate limiting
                if (errorMessage.toLowerCase().includes('too many attempts')) {
                    errorMessage = 'Too many attempts. Please wait before requesting another code.';
                    this.notificationService.warning(errorMessage, 7000);
                } else {
                    // Handled by global interceptor
                }

                this.canResend = true;
            }
        });
    }

    handleSubmit(): void {
        const otpValue = this.otp.join('');
        if (otpValue.length !== 6) {
            this.notificationService.warning('Please enter the complete 6-digit code');
            return;
        }

        this.loading = true;


        this.authService.verifyOtp(this.email, otpValue).subscribe({
            next: (response: any) => {
                this.loading = false;
                const result = response.result || response;
                const token = result.token || result.data?.token || otpValue;
                this.notificationService.success('Code verified successfully!');
                this.router.navigate(['/forgot-password/reset'], { state: { email: this.email, token } });
            },
            error: (err) => {
                this.loading = false;
                console.error(err);

                // Handle specific error cases
                const errorResponse = err.error || err;
                let errorMessage = 'Invalid verification code. Please try again.';

                if (errorResponse.result?.status === 'error') {
                    errorMessage = errorResponse.result.message || errorMessage;
                } else if (errorResponse.message) {
                    errorMessage = errorResponse.message;
                }

                // Check for rate limiting
                if (errorMessage.toLowerCase().includes('too many attempts')) {
                    errorMessage = 'Too many verification attempts. Please request a new code.';
                    this.notificationService.warning(errorMessage, 7000);
                } else {
                    // Handled by global interceptor
                }

                // this.error = errorMessage;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }
}
