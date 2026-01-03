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

    // Caching mechanism
    // Caching mechanism
    private cachedData: any[] = [];
    hasActiveFilters: boolean = false;

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
        this.loadFirstPage();
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

    private extractClaimsData(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (response.data?.result?.data) return response.data.result.data;
        if (response.data?.data) return response.data.data;
        return [];
    }

    loadFirstPage(): void {
        this.isLoading = true;
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        // Load ONLY first page
        this.claimService.listClaims({
            user_id: currentUser.id,
            user_type: 'broker',
            limit: this.pageSize,
            offset: 0,
            domain: []
        }).subscribe({
            next: (response) => {
                const claimsData = this.extractClaimsData(response);

                // Update total count
                if (response.data?.total_count || response.data?.count) {
                    this.totalRecords = response.data.total_count || response.data.count;
                }
                // Map and cache first page
                const mappedClaims = this.mapClaims(claimsData);
                this.cachedData = [...mappedClaims];
                this.data = mappedClaims;
                this.isLoading = false;

                console.log(`✓ Page 1 loaded. Starting background loading...`);
                this.loadAllInBackground();
            },
            error: (err) => {
                console.error('Error loading claims:', err);
                this.error = 'BROKER.CLAIMS.ERROR_LOADING';
                this.isLoading = false;
            }
        });
    }

    loadAllInBackground(): void {
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        const batchSize = 1000;
        let offset = 0;
        let allData: any[] = [];

        const fetchNextBatch = () => {
            this.claimService.listClaims({
                user_id: currentUser.id,
                user_type: 'broker',
                limit: batchSize,
                offset: offset,
                domain: []
            }).subscribe({
                next: (response) => {
                    const claimsData = this.extractClaimsData(response);
                    const mappedClaims = this.mapClaims(claimsData);

                    allData = [...allData, ...mappedClaims];

                    if (response.data?.total_count || response.data?.count) {
                        this.totalRecords = response.data.total_count || response.data.count;
                    }

                    if (claimsData.length === batchSize) {
                        offset += batchSize;
                        fetchNextBatch();
                    } else {
                        this.cachedData = allData;
                        this.totalRecords = allData.length;

                        if (this.currentPage === 1 && this.data.length === 0 && allData.length > 0) {
                            this.displayCurrentPage();
                        }
                        console.log(`✓ Cached all ${allData.length} claims recursively.`);
                    }
                },
                error: (err) => console.error('Background load failed', err)
            });
        };

        fetchNextBatch();
    }

    mapClaims(claimsData: any[]): any[] {
        return claimsData.map((claim: any) => {
            return {
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
        });
    }

    private clearCache(): void {
        this.cachedData = [];
    }

    displayCurrentPage(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.data = this.cachedData.slice(startIndex, endIndex).filter(p => p !== undefined);
        this.isLoading = false;
    }

    getDisplayData(): any[] {
        if (this.hasActiveFilters) {
            return this.cachedData.filter(p => p !== undefined);
        }
        return this.data;
    }

    onFilteredDataChange(filteredData: any[]): void {
        this.filteredData = filteredData;
    }

    onFilterChange(activeFilters: any): void {
        this.hasActiveFilters = Object.keys(activeFilters).length > 0;
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
        this.displayCurrentPage();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.displayCurrentPage();
    }
}
