import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-chassis-validation-modal',
  templateUrl: './chassis-validation-modal.component.html',
  styleUrls: ['./chassis-validation-modal.component.css']
})
export class ChassisValidationModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  chassisNumber: string = '';
  lossDate: string | Date = '';
  maxDate: string = new Date().toISOString().split('T')[0];
  loading: boolean = false;

  constructor(
    private router: Router,
    private claimService: ClaimService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  onClose(): void {
    this.chassisNumber = '';
    this.lossDate = '';
    this.isOpen = false;
    this.close.emit();
  }

  onValidate(): void {
    if (!this.chassisNumber.trim() || !this.lossDate) {
      this.notificationService.error('Please enter all required fields');
      return;
    }

    this.loading = true;

    const userId = this.authService.currentUserValue?.id || 2;
    // Format date if it's a Date object
    const formattedLossDate = this.lossDate instanceof Date
      ? this.lossDate.toISOString().split('T')[0]
      : this.lossDate;

    this.claimService.checkRiskAvailability(this.chassisNumber, userId, formattedLossDate).subscribe({
      next: (response: any) => {
        const result = response.result?.data || response.data || response.result || response;

        if (result && result.status !== 'error' && result.available !== false) {
          // Navigate to file claim page with chassis number
          this.router.navigate(['/dashboard/broker/claims/new'], {
            queryParams: {
              chassis: this.chassisNumber,
              loss_date: formattedLossDate
            }
          });
          this.onClose();
        } else {
          this.notificationService.error(result.message || 'Chassis validation failed. No active policy found.');
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to validate chassis:', err);
        // Fallback for demo/dev if API fails but we want to proceed
        // In real app, we should show the error
        // In real app, we should show the error
        this.notificationService.error(err.error?.message || err.message || 'Failed to validate chassis number. Please check if the policy is active.');
        this.loading = false;
      }
    });
  }
}
