import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppTranslateService } from '../../../core/services/app-translate.service';
import { TableColumn } from '../../../shared/models/table-column.interface';

declare var lucide: any;

@Component({
    selector: 'app-broker-claims',
    templateUrl: './broker-claims.component.html',
    styles: []
})
export class BrokerClaimsComponent implements OnInit, AfterViewChecked {
    allColumns: TableColumn[] = [];
    visibleColumns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;
    isChassisModalOpen = false;

    // Pagination
    currentPage: number = 1;
    pageSize: number = 25;
    totalRecords: number = 1000; // Initial estimate, will be updated after fetch

    constructor(
        private claimService: ClaimService,
        private authService: AuthService,
        private router: Router,
        private appTranslate: AppTranslateService
    ) {
        this.setupColumns();
        // Re-setup columns on language change to translate headers
        this.appTranslate.get('BROKER.CLAIMS.COLUMNS').subscribe(() => {
            this.setupColumns();
        });
    }

    ngOnInit(): void {
        this.fetchTotalCount();
        this.loadClaims();
    }

    fetchTotalCount(): void {
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        this.claimService.listClaims({
            user_id: currentUser.id,
            user_type: 'broker',
            limit: 10000,  // High limit to get all records
            offset: 0,
            domain: []
        }).subscribe({
            next: (response) => {
                let claimsData: any[] = [];
                if (Array.isArray(response)) {
                    claimsData = response;
                } else if (Array.isArray(response.data)) {
                    claimsData = response.data;
                } else if (response.data?.result?.data) {
                    claimsData = response.data.result.data;
                } else if (response.data?.data) {
                    claimsData = response.data.data;
                }
                this.totalRecords = claimsData.length;
            },
            error: (err) => {
                console.error('Error fetching total claims count', err);
            }
        });
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.allColumns = [
            { key: 'claimNumber', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.CLAIM_NO'), filterable: true, filterType: 'text', sortable: true },
            { key: 'policyNumber', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.POLICY_NO'), filterable: true, filterType: 'text', sortable: true },
            { key: 'client', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.CLIENT_NAME'), filterable: true, filterType: 'text', sortable: true },
            { key: 'vehiclePlate', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.VEHICLE_PLATE'), filterable: true, filterType: 'text', sortable: true },
            { key: 'vehicleMaker', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.VEHICLE_MAKER'), filterable: true, filterType: 'text', sortable: true },
            { key: 'type', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.LOB'), filterable: true, sortable: true },
            { key: 'productName', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.PRODUCT'), filterable: true, sortable: true },
            {
                key: 'status',
                label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.STATUS'),
                filterable: true,
                render: (row) => this.renderStatus(row.status)
            },
            { key: 'amount', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.AMOUNT'), filterable: false, sortable: true },
            { key: 'date', label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.INTIMATION_DATE'), filterable: true, filterType: 'date', sortable: true },
            {
                key: 'actions',
                label: this.appTranslate.instant('BROKER.CLAIMS.COLUMNS.ACTIONS'),
                filterable: false,
                mandatory: true,
                render: (row) => `
                    <div class="flex items-center gap-2">
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="view" data-id="${row.id}" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="download" data-id="${row.id}" title="Download Documents">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                        </button>
                    </div>
                `
            }
        ];
        this.visibleColumns = [...this.allColumns];
        console.log('=== CLAIMS COLUMNS SETUP ===');
        console.log('Configured columns:', this.allColumns.map(c => ({ key: c.key, label: c.label })));
        console.log('=== END COLUMNS ===');
    }

    onVisibleColumnsChange(columns: TableColumn[]): void {
        this.visibleColumns = columns;
    }

    renderStatus(status: string): string {
        const s = status?.toLowerCase() || 'pending';
        let classes = '';

        if (['active', 'approved', 'settled', 'paid'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'submitted', 'draft', 'processing', 'intimated'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        const translatedStatus = this.appTranslate.instant(`STATUS.${s.toUpperCase()}`);
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${translatedStatus}</span>`;
    }

    loadClaims(): void {
        this.isLoading = true;
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        const offset = (this.currentPage - 1) * this.pageSize;

        this.claimService.listClaims({
            user_id: currentUser.id,
            user_type: 'broker',
            limit: this.pageSize,
            offset: offset,
            domain: []
        }).subscribe({
            next: (response) => {
                console.log('=== CLAIMS API RESPONSE ===');
                console.log('Full response:', response);
                console.log('Is response an array?', Array.isArray(response));
                console.log('response.data:', response.data);

                // Handle different response structures
                let claimsData: any[] = [];

                if (Array.isArray(response)) {
                    // Response is directly an array
                    claimsData = response;
                    console.log('Response is a direct array');
                } else if (Array.isArray(response.data)) {
                    // Response has data property that is an array
                    claimsData = response.data;
                    console.log('Response.data is an array');
                } else if (response.data?.result?.data) {
                    // Nested structure
                    claimsData = response.data.result.data;
                    console.log('Using nested response.data.result.data');
                } else if (response.data?.data) {
                    // Another nested structure
                    claimsData = response.data.data;
                    console.log('Using nested response.data.data');
                } else {
                    claimsData = [];
                    console.warn('Could not extract claims data from response');
                }

                console.log('Extracted claimsData:', claimsData);
                console.log('Number of claims:', claimsData.length);

                if (claimsData.length > 0) {
                    console.log('First claim raw data:', claimsData[0]);
                }

                // Total count is fetched separately in fetchTotalCount()
                // Don't override it here unless API provides total_count
                if (response.data?.total_count || response.data?.count) {
                    this.totalRecords = response.data.total_count || response.data.count;
                }

                this.data = claimsData.map((claim: any) => {
                    const mappedClaim = {
                        id: claim.id || claim.claim_id || (typeof claim.id === 'number' ? claim.id : null) || claim.claim_number || 'N/A',
                        claimNumber: claim.claim_number || 'N/A',
                        client: claim.customer_name || claim.partner_name || claim.partner_id?.[1] || 'N/A',
                        policyNumber: claim.policy_number || claim.policy_id?.[1] || 'N/A',
                        vehiclePlate: claim.vehicle_plate_number || 'N/A',
                        vehicleMaker: claim.vehicle_maker || 'N/A',
                        type: claim.lob || claim.claim_type || 'N/A',
                        productName: claim.product_name ? (typeof claim.product_name === 'number' ? `Product ${claim.product_name}` : claim.product_name) : 'N/A',
                        status: (claim.state || 'pending').toLowerCase().replace(/\s+/g, '_'),
                        date: claim.intimation_date || claim.claim_date || claim.create_date || 'N/A',
                        amount: claim.claim_amount ? `EGP ${claim.claim_amount.toLocaleString()}` : 'N/A'
                    };
                    return mappedClaim;
                });

                console.log('Mapped data:', this.data);
                console.log('Number of mapped claims:', this.data.length);
                if (this.data.length > 0) {
                    console.log('First mapped claim:', this.data[0]);
                }
                console.log('=== END CLAIMS DATA ===');

                this.isLoading = false;
            },
            error: (err) => {
                console.error('=== CLAIMS API ERROR ===');
                console.error('Error loading claims:', err);
                console.error('Error details:', JSON.stringify(err, null, 2));
                console.error('=== END ERROR ===');
                this.error = 'BROKER.CLAIMS.ERROR_LOADING';
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
                this.router.navigate(['/dashboard/broker/claims', event.data.id]);
                break;
            case 'download':
                console.log('Download for', event.data.id);
                break;
        }
    }

    onExport(): void {
        console.log('Exporting claims...');
    }

    openChassisModal(): void {
        this.isChassisModalOpen = true;
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadClaims();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadClaims();
    }
}
