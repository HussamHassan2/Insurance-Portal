import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { extractBirthDateFromNationalId } from '../../../shared/utils/national-id.utils';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  clientId = environment.clientId;
  formData = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    gender: 'male',
    dateOfBirth: '',
    nationalId: '',
    role: 'customer'
  };

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) { }

  onNationalIdChange(value: string): void {
    if (value) {
      const dob = extractBirthDateFromNationalId(value);
      if (dob) {
        this.formData.dateOfBirth = dob;
      }
    }
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.email || !this.formData.password) {
      this.notificationService.warning('Please fill in all required fields');
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.notificationService.warning('Passwords do not match');
      return;
    }
    console.log('Register:', this.formData);
    this.notificationService.success('Registration successful! Please login.');
    this.router.navigate(['/login']);
  }
}
