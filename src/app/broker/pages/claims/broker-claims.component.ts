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

        if (['active', 'approved', 'settled', 'paid', 'fully paid', 'closed'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'submitted', 'draft', 'processing', 'intimated', 'claim request', 'surveying', 'partially paid', 'reopen'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else if (['rejected', 'cancelled', 'canceled', 'declined'].includes(s)) {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        } else {
            classes = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
        }

        // Just show the status string as is, it's already mapped to readable format.
        // Or if we really want translation keys, we would have done it earlier.
        // Given existing code used translation keys, but now we map 'open' -> 'Intimated' (English).
        // If the user wants Arabic, this hardcoded English might be an issue.
        // Ideally we should return KEYS from mapClaimState and translate here.
        // But user provided English names: "Intimated", "Fully Paid".
        // Let's treat them as the value to display.
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${status}</span>`;
    }

    private extractClaimsData(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (response.data?.result?.data) return response.data.result.data;
        if (response.data?.data) return response.data.data;
        return [];
    }

    // Old methods removed


    private mapClaimState(rawState: string): string {
        const s = (rawState || '').toLowerCase();
        const mapping: { [key: string]: string } = {
            'claim_request': 'Claim Request',
            'draft': 'Draft',
            'open': 'Intimated',
            'surveying': 'Surveying',
            'partial': 'Partially Paid',
            'full': 'Fully Paid',
            'closed': 'Closed',
            'reopen': 'Reopen'
        };
        const pretty = mapping[s] || rawState.charAt(0).toUpperCase() + rawState.slice(1).toLowerCase();
        // Replace spaces with underscores for translation key match if needed, but for display we want readable text
        // If we want translation keys, we should probably return keys. 
        // Based on dashboard, we are displaying the string directly. But here we have translation logic in renderStatus.
        // renderStatus expects 'pending', 'active', etc.
        // Let's normalize it to a key-friendly format or keep it simple.
        // The renderStatus checks for specific keywords like 'intimated', 'active', 'paid'. 
        // Our new mapped values: 'Claim Request', 'Intimated', 'Partially Paid'.
        // These might fail specific checks in renderStatus if not added.
        return pretty;
    }

    mapClaims(claimsData: any[]): any[] {
        return claimsData.map((claim: any) => {
            const rawStatus = (claim.state || 'pending');
            const mappedStatus = this.mapClaimState(rawStatus);

            return {
                id: claim.id || claim.claim_id || (typeof claim.id === 'number' ? claim.id : null) || claim.claim_number || 'N/A',
                claimNumber: claim.claim_number || 'N/A',
                client: claim.customer_name || claim.partner_name || claim.partner_id?.[1] || 'N/A',
                policyNumber: claim.policy_number || claim.policy_id?.[1] || 'N/A',
                vehiclePlate: claim.vehicle_plate_number || 'N/A',
                vehicleMaker: claim.vehicle_maker || 'N/A',
                type: claim.lob || claim.claim_type || 'N/A',
                productName: claim.product_name ? (typeof claim.product_name === 'number' ? `Product ${claim.product_name}` : claim.product_name) : 'N/A',
                status: mappedStatus,
                date: claim.intimation_date || claim.claim_date || claim.create_date || 'N/A',
                dateOfLoss: claim.date_of_loss || claim.create_date,
                amount: claim.claim_amount ? `EGP ${claim.claim_amount.toLocaleString()}` : 'N/A'
            };
        });
    }

    private clearCache(): void {
        this.cachedData = [];
    }

    // Date Filter Logic
    selectedPeriod: string = 'month';
    private lastActivePage: number = 1;

    setSelectedPeriod(period: string): void {
        if (this.selectedPeriod === period) {
            this.selectedPeriod = 'all';

            // Restore previous page if valid
            const validCount = this.cachedData.filter(p => p !== undefined).length;
            const maxPage = Math.ceil(validCount / this.pageSize) || 1;

            if (this.lastActivePage > maxPage) {
                this.currentPage = 1;
            } else {
                this.currentPage = this.lastActivePage;
            }
        } else {
            // Store current page before switching filter
            this.lastActivePage = this.currentPage;
            this.selectedPeriod = period;
            this.currentPage = 1;
        }
        this.displayCurrentPage();
    }

    displayCurrentPage(): void {
        let validItems = this.cachedData.filter(p => p !== undefined);

        // Apply Date Filter Client-Side
        if (this.selectedPeriod !== 'all') {
            const now = new Date();
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);

            if (this.selectedPeriod === 'week') {
                const day = start.getDay();
                const diff = (day + 1) % 7;
                start.setDate(now.getDate() - diff);
            } else if (this.selectedPeriod === 'month') {
                start.setDate(1);
            } else if (this.selectedPeriod === 'year') {
                start.setMonth(0, 1);
            }

            validItems = validItems.filter(c => {
                const dateStr = c.dateOfLoss || c.date; // Use specific field
                if (!dateStr || dateStr === 'N/A') return false;
                const d = new Date(dateStr);
                return d >= start && d <= now;
            });
        }

        this.totalRecords = validItems.length;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.data = validItems.slice(startIndex, endIndex);
        this.isLoading = false;
    }

    getDisplayData(): any[] {
        let validItems = this.cachedData.filter(p => p !== undefined);

        if (this.selectedPeriod !== 'all') {
            const now = new Date();
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);

            if (this.selectedPeriod === 'week') {
                const day = start.getDay();
                const diff = (day + 1) % 7;
                start.setDate(now.getDate() - diff);
            } else if (this.selectedPeriod === 'month') {
                start.setDate(1);
            } else if (this.selectedPeriod === 'year') {
                start.setMonth(0, 1);
            }

            validItems = validItems.filter(c => {
                const dateStr = c.dateOfLoss || c.date;
                if (!dateStr || dateStr === 'N/A') return false;
                const d = new Date(dateStr);
                return d >= start && d <= now;
            });
        }
        return validItems;
    }

    // formatDate removed
    // getDateDomain removed

    loadFirstPage(): void {
        this.isLoading = true;
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        // No date domain - fetch ALL
        this.claimService.listClaims({
            user_id: currentUser.id,
            user_type: 'broker',
            limit: this.pageSize,
            offset: 0,
            domain: []
        }).subscribe({
            next: (response) => {
                const claimsData = this.extractClaimsData(response);

                if (response.data?.total_count || response.data?.count) {
                    this.totalRecords = response.data.total_count || response.data.count;
                } else {
                    this.totalRecords = 0;
                }

                const mappedClaims = this.mapClaims(claimsData);
                this.cachedData = [...mappedClaims];
                // Apply initial filter
                this.displayCurrentPage();

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
                        // Finished
                        this.cachedData = allData;
                        this.totalRecords = allData.length;
                        // Refresh view
                        this.displayCurrentPage();
                    }
                },
                error: (err) => console.error('Background load failed', err)
            });
        };

        fetchNextBatch();
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
