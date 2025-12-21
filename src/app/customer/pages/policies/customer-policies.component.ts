import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { PolicyService } from '../../../core/services/policy.service';
import { AuthService } from '../../../core/services/auth.service';
import { TableColumn } from '../../../shared/models/table-column.interface';

declare var lucide: any;

@Component({
    selector: 'app-customer-policies',
    templateUrl: './customer-policies.component.html',
    styleUrls: ['./customer-policies.component.css']
})
export class CustomerPoliciesComponent implements OnInit, AfterViewChecked {
    columns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;

    constructor(
        private policyService: PolicyService,
        private authService: AuthService,
        private router: Router
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadPolicies();
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.columns = [
            { key: 'policyNumber', label: 'Policy No', filterable: true, filterType: 'text' },
            { key: 'type', label: 'Product Type', filterable: true },
            {
                key: 'status',
                label: 'Status',
                filterable: true,
                render: (row: any) => this.renderStatus(row.status)
            },
            {
                key: 'premium',
                label: 'Premium',
                filterable: false,
                render: (row: any) => `<span class="font-medium text-gray-900 dark:text-gray-100">${row.currency || 'EGP'} ${Number(row.premium).toLocaleString()}</span>`
            },
            { key: 'expiry', label: 'Expiry Date', filterable: true, filterType: 'date' },
            {
                key: 'actions',
                label: 'Actions',
                filterable: false,
                render: (row: any) => `
                    <div class="flex items-center gap-2">
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="view" data-id="${row.id}" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="download" data-id="${row.id}" title="Download Policy">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                        </button>
                    </div>
                `
            }
        ];
    }

    renderStatus(status: string): string {
        const s = status?.toLowerCase() || 'pending';
        let classes = '';

        if (['active', 'approved', 'paid'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'processing'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${status}</span>`;
    }

    loadPolicies(): void {
        this.isLoading = true;
        const user = this.authService.currentUserValue;
        if (!user) return;

        this.policyService.listPolicies({
            user_id: user.id,
            user_type: 'customer',
            limit: 100,
            offset: 0
        }).subscribe({
            next: (response) => {
                const policies = response.data || [];
                // Map to match columns
                this.data = policies.map((p: any) => ({
                    id: p.id || p.policy_number,
                    policyNumber: p.policy_number,
                    type: p.product_name || 'Insurance',
                    status: (p.state || 'pending').toLowerCase(),
                    premium: p.gross_premium || 0,
                    currency: p.currency || 'EGP',
                    expiry: p.effective_to_date || p.end_date
                }));
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading policies:', err);
                this.error = 'Failed to load policies';
                this.isLoading = false;
            }
        });
    }

    onFilteredDataChange(filteredData: any[]): void {
        this.filteredData = filteredData;
    }

    handleTableAction(event: { action: string, data: any }): void {
        switch (event.action) {
            case 'view':
                this.router.navigate(['/dashboard/customer/policies', event.data.id]);
                break;
            case 'download':
                console.log('Download', event.data.id);
                break;
        }
    }

    onExport(): void {
        // Implement export logic using this.filteredData
        console.log('Exporting policies...');
    }
}
