import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { TableColumn } from '../../../shared/models/table-column.interface';

declare var lucide: any;

@Component({
    selector: 'app-customer-claims',
    templateUrl: './customer-claims.component.html',
    styleUrls: ['./customer-claims.component.css']
})
export class CustomerClaimsComponent implements OnInit, AfterViewChecked {
    columns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;

    constructor(
        private claimService: ClaimService,
        private authService: AuthService,
        private router: Router
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadClaims();
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.columns = [
            { key: 'claimNumber', label: 'Claim No', filterable: true, filterType: 'text' },
            { key: 'policyNumber', label: 'Policy No', filterable: true, filterType: 'text' },
            { key: 'vehiclePlate', label: 'Vehicle Plate', filterable: true, filterType: 'text' },
            { key: 'vehicleMaker', label: 'Vehicle Maker', filterable: true, filterType: 'text' },
            { key: 'type', label: 'LOB', filterable: true },
            { key: 'productName', label: 'Product', filterable: true },
            {
                key: 'status',
                label: 'Status',
                filterable: true,
                render: (row: any) => this.renderStatus(row.status)
            },
            { key: 'amount', label: 'Amount', filterable: false },
            { key: 'date', label: 'Intimation Date', filterable: true, filterType: 'date' },
            {
                key: 'actions',
                label: 'Actions',
                filterable: false,
                render: (row: any) => `
                    <div class="flex items-center gap-2">
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="view" data-id="${row.id}" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                `
            }
        ];
    }

    renderStatus(status: string): string {
        const s = status?.toLowerCase() || 'pending';
        let classes = '';

        if (['active', 'approved', 'settled', 'paid'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'submitted', 'in_progress', 'processing', 'intimated', 'draft'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${status.replace(/_/g, ' ')}</span>`;
    }

    loadClaims(): void {
        this.isLoading = true;
        const user = this.authService.currentUserValue;
        if (!user) return;

        this.claimService.listClaims({
            user_id: user.id,
            user_type: 'customer',
            limit: 100,
            offset: 0
        }).subscribe({
            next: (response) => {
                // Handle different response structures
                let claimsData: any[] = [];

                if (Array.isArray(response)) {
                    claimsData = response;
                } else if (Array.isArray(response.data)) {
                    claimsData = response.data;
                } else if (response.data?.result?.data) {
                    claimsData = response.data.result.data;
                } else if (response.data?.data) {
                    claimsData = response.data.data;
                } else {
                    claimsData = [];
                }

                // Map to match columns
                this.data = claimsData.map((claim: any) => ({
                    id: claim.id || claim.claim_number,
                    claimNumber: claim.claim_number || 'N/A',
                    policyNumber: claim.policy_number || 'N/A',
                    vehiclePlate: claim.vehicle_plate_number || 'N/A',
                    vehicleMaker: claim.vehicle_maker || 'N/A',
                    type: claim.lob || claim.claim_type || 'N/A',
                    productName: claim.product_name ? (typeof claim.product_name === 'number' ? `Product ${claim.product_name}` : claim.product_name) : 'N/A',
                    date: claim.intimation_date || claim.claim_date || 'N/A',
                    amount: claim.claim_amount ? `EGP ${claim.claim_amount.toLocaleString()}` : 'N/A',
                    status: (claim.status || claim.state || 'pending').toLowerCase().replace(/\s+/g, '_')
                }));
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading claims:', err);
                this.error = 'Failed to load claims';
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
                this.router.navigate(['/dashboard/customer/claims', event.data.id]);
                break;
        }
    }

    onExport(): void {
        console.log('Exporting claims...');
    }
}
