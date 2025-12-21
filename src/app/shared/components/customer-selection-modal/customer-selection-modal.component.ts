import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';

type ModalView = 'type-selection' | 'new-customer' | 'select-customer';

interface Customer {
  id?: string;
  national_id?: string;
  english_name?: string;
  arabic_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  date_of_birth?: string;
  gender?: string;
  street?: string;
  city?: string;
  state_name?: string;
  country_name?: string;
  is_foreign_customer?: boolean;
  passport_id?: string;
}

@Component({
  selector: 'app-customer-selection-modal',
  templateUrl: './customer-selection-modal.component.html',
  styleUrls: ['./customer-selection-modal.component.css']
})
export class CustomerSelectionModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() prefilledNationalId: string = ''; // Pre-filled national ID from client details
  @Output() close = new EventEmitter<void>();
  @Output() selectCustomer = new EventEmitter<any>();

  currentView: ModalView = 'select-customer';
  newCustomerForm!: FormGroup;
  searchResults: Customer[] = [];
  selectedCustomer: Customer | null = null;
  loading: boolean = false;
  hasSearched: boolean = false;
  error: string = '';
  searchQuery: string = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.checkForPrefilledData();
  }

  checkForPrefilledData(): void {
    // If national ID is pre-filled, auto-select existing customer view and search
    // Logic remains similar but view is already 'select-customer'
    if (this.prefilledNationalId && this.prefilledNationalId.trim()) {
      this.searchQuery = this.prefilledNationalId;
      // Trigger search automatically
      setTimeout(() => {
        this.onSearch();
      }, 100);
    }
  }

  initializeForm(): void {
    this.newCustomerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      nationalId: ['', Validators.required],
      dateOfBirth: [''],
      gender: ['male'],
      isForeignCustomer: [false],
      passportId: [''],
      street: [''],
      city: [''],
      stateName: [''],
      countryName: ['Egypt']
    });
  }

  onSelectType(type: 'new' | 'existing'): void {
    if (type === 'new') {
      this.currentView = 'new-customer';

      // Auto-fill form based on search query
      if (this.searchQuery) {
        // If query contains only digits, assume it's a National ID or Phone
        if (/^\d+$/.test(this.searchQuery)) {
          this.newCustomerForm.patchValue({
            nationalId: this.searchQuery
          });
        } else {
          // Otherwise assume it's a name
          this.newCustomerForm.patchValue({
            name: this.searchQuery
          });
        }
      }
    } else {
      this.currentView = 'select-customer';
    }
  }

  onBack(): void {
    if (this.currentView === 'new-customer') {
      this.currentView = 'select-customer';
      this.error = '';
    } else {
      // If back is clicked on select-customer, close the modal
      this.onClose();
    }
  }

  async onSubmitNewCustomer(): Promise<void> {
    if (this.newCustomerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formValue = this.newCustomerForm.value;
      const user = this.authService.currentUserValue;

      const payload = {
        user_id: user?.id || 2,
        user_type: 'broker',
        english_name: formValue.name,
        email: formValue.email,
        phone: this.formatPhoneForAPI(formValue.phone),
        mobile: this.formatPhoneForAPI(formValue.phone),
        national_id: formValue.nationalId,
        date_of_birth: formValue.dateOfBirth || '',
        gender: formValue.gender,
        is_foreign_customer: formValue.isForeignCustomer,
        passport_id: formValue.passportId || '',
        street: formValue.street || '',
        city: formValue.city || '',
        state_name: formValue.stateName || '',
        country_name: formValue.countryName || 'Egypt'
      };

      const response = await this.customerService.createPartner(payload).toPromise();
      const createdCustomer = response?.result?.data || response?.data || response;

      // Emit the created customer data
      this.selectCustomer.emit({
        clientId: createdCustomer.id || createdCustomer.national_id,
        clientName: formValue.name,
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        nationalId: formValue.nationalId,
        dateOfBirth: formValue.dateOfBirth,
        gender: formValue.gender,
        isForeignCustomer: formValue.isForeignCustomer,
        passportId: formValue.passportId,
        street: formValue.street,
        city: formValue.city,
        stateName: formValue.stateName,
        countryName: formValue.countryName
      });

      this.onClose();
    } catch (err: any) {
      console.error('Failed to create customer', err);
      this.error = err?.error?.result?.error || err?.error?.message || err?.message || 'Failed to create customer';
    } finally {
      this.loading = false;
    }
  }

  async onSearch(): Promise<void> {
    if (!this.searchQuery.trim()) {
      this.error = 'Please enter a search term';
      return;
    }

    this.loading = true;
    this.error = '';
    this.searchResults = [];
    this.hasSearched = true;

    try {
      const user = this.authService.currentUserValue;
      const response = await this.customerService.searchPartners({
        identification_number: this.searchQuery,
        user_id: user?.id || 2,
        user_type: 'broker'
      }).toPromise();

      const rawData = response?.result?.data || response?.data || response;

      let contactsArray: Customer[] = [];

      if (Array.isArray(rawData)) {
        contactsArray = rawData;
      } else if (rawData?.contacts && Array.isArray(rawData.contacts)) {
        contactsArray = rawData.contacts;
      } else if (rawData && (rawData.national_id || rawData.id || rawData.english_name)) {
        // Handle single object response
        contactsArray = [rawData];
      }

      this.searchResults = contactsArray;

      // Note: error message "No customers found" is removed here as it will be handled in the template
      // to show the "Create New" card instead.
    } catch (err: any) {
      console.error('Failed to search customers', err);
      this.error = err?.error?.error || err?.error?.result?.error || err?.error?.message || err?.message || 'Failed to search customers';
    } finally {
      this.loading = false;
    }
  }

  onSelectExistingCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
  }

  onConfirmSelection(): void {
    if (!this.selectedCustomer) {
      this.error = 'Please select a customer';
      return;
    }

    // Emit the selected customer data
    this.selectCustomer.emit({
      clientId: this.selectedCustomer.national_id || this.selectedCustomer.id,
      clientName: this.selectedCustomer.english_name || this.selectedCustomer.arabic_name,
      name: this.selectedCustomer.english_name || this.selectedCustomer.arabic_name,
      email: this.selectedCustomer.email,
      phone: this.selectedCustomer.phone || this.selectedCustomer.mobile,
      nationalId: this.selectedCustomer.national_id,
      dateOfBirth: this.selectedCustomer.date_of_birth,
      gender: this.selectedCustomer.gender,
      isForeignCustomer: this.selectedCustomer.is_foreign_customer,
      passportId: this.selectedCustomer.passport_id,
      street: this.selectedCustomer.street,
      city: this.selectedCustomer.city,
      stateName: this.selectedCustomer.state_name,
      countryName: this.selectedCustomer.country_name
    });

    this.onClose();
  }

  onClose(): void {
    this.isOpen = false;
    this.currentView = 'select-customer';
    this.error = '';
    this.searchResults = [];
    this.selectedCustomer = null;
    this.searchQuery = '';
    this.hasSearched = false;
    this.newCustomerForm.reset({
      gender: 'male',
      isForeignCustomer: false,
      countryName: 'Egypt'
    });
    this.close.emit();
  }

  private formatPhoneForAPI(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '+20' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('+')) {
      return '+20' + cleaned;
    }
    return cleaned;
  }
}
