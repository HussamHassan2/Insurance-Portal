import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

@Component({
    selector: 'app-client-details',
    templateUrl: './client-details.component.html',
    styleUrls: ['./client-details.component.css']
})
export class ClientDetailsComponent implements OnInit, AfterViewChecked {
    clientId: string = '';
    client: any = null;
    loading = true;
    error: string | null = null;
    activeTab = 'overview';
    isCustomerModalOpen = false;
    isChassisModalOpen = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private customerService: CustomerService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.clientId = this.route.snapshot.params['id'];
        this.loadClientDetails();
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    loadClientDetails(): void {
        this.loading = true;
        this.error = null;

        const currentUser = this.authService.currentUserValue;
        if (!currentUser) {
            this.error = 'User not authenticated';
            this.loading = false;
            return;
        }

        // Use searchPartners API with identification_number
        this.customerService.searchPartners({
            identification_number: this.clientId,
            user_id: currentUser.id,
            user_type: 'broker'
        }).subscribe({
            next: (response) => {
                const rawData = response.result?.data || response.data || response;

                // Extract customer data from various response structures
                let customerData;
                if (rawData.contacts && Array.isArray(rawData.contacts)) {
                    customerData = rawData.contacts[0];
                } else if (Array.isArray(rawData)) {
                    customerData = rawData[0];
                } else if (rawData.national_id || rawData.english_name) {
                    customerData = rawData;
                } else {
                    customerData = null;
                }

                if (!customerData) {
                    this.error = 'No customer data found for this ID';
                    this.loading = false;
                    return;
                }

                // Map customer data
                this.client = {
                    id: customerData.national_id || customerData.id || this.clientId,
                    name: customerData.english_name || customerData.name || customerData.partner_name || 'Unknown Name',
                    arabicName: customerData.arabic_name || '',
                    email: customerData.email || customerData.partner_email || 'N/A',
                    phone: customerData.phone || customerData.phone_number || customerData.mobile || 'N/A',
                    mobile: customerData.mobile || '',
                    address: customerData.street || customerData.address || 'N/A',
                    city: customerData.city || '',
                    dateOfBirth: customerData.date_of_birth || '',
                    gender: customerData.gender || '',
                    nationalId: customerData.national_id || '',
                    passportId: customerData.passport_id || '',
                    isForeignCustomer: customerData.is_foreign_customer || false,
                    countryName: customerData.country_name || '',
                    stateName: customerData.state_name || '',
                    joinDate: customerData.created_at || customerData.create_date || new Date().toISOString().split('T')[0],
                    status: customerData.is_customer || customerData.is_active || customerData.active ? 'Active' : 'Inactive',
                    // Policies and claims - will be empty arrays for now
                    // In a real implementation, these would come from separate API calls
                    policies: customerData.policies || [],
                    claims: customerData.claims || []
                };

                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading client details:', err);
                this.error = err?.error?.result?.error || err?.error?.message || err?.message || 'Failed to load client details';
                this.loading = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/dashboard/broker/clients']);
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
        setTimeout(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 100);
    }

    createQuote(): void {
        // Open customer selection modal like in quotations page
        this.isCustomerModalOpen = true;
    }

    createClaim(): void {
        // Open chassis validation modal like in claims page
        this.isChassisModalOpen = true;
    }

    onCustomerSelected(customer: any): void {
        this.isCustomerModalOpen = false;
        this.router.navigate(['/dashboard/broker/quote/new'], {
            state: { customer: customer }
        });
    }

    onChassisValidated(chassisData: any): void {
        this.isChassisModalOpen = false;
        // Navigate to file claim with chassis data
        this.router.navigate(['/dashboard/broker/claims/new'], {
            state: { chassisData: chassisData, clientId: this.clientId }
        });
    }

    getTotalPoliciesValue(): number {
        if (!this.client || !this.client.policies) return 0;
        return this.client.policies.reduce((acc: number, curr: any) => acc + (curr.premium || 0), 0);
    }
}
