import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { TableColumn } from '../../../shared/models/table-column.interface';
import { AppTranslateService } from '../../../core/services/app-translate.service';
import { BrokerService } from '../../../core/services/broker.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

declare var lucide: any;

@Component({
    selector: 'app-broker-premiums',
    templateUrl: './broker-premiums.component.html',
    styles: []
})
export class BrokerPremiumsComponent implements OnInit, AfterViewChecked {
    columns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;

    // Pagination (server-side)
    currentPage: number = 1;
    pageSize: number = 25;
    totalRecords: number = 0;
    paymentStatus: 'paid' | 'outstanding' = 'paid';

    // Caching mechanism
    private cachedData: any[] = [];
    private loadedPages: Set<number> = new Set();
    hasActiveFilters: boolean = false;

    constructor(
        private appTranslate: AppTranslateService,
        private brokerService: BrokerService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadFirstPage();
        this.loadAllInBackground();
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.columns = [
            { key: 'id', label: this.appTranslate.instant('BROKER.PAYMENTS.COLUMNS.PAYMENT_ID'), filterable: true, filterType: 'text' },
            { key: 'policyNumber', label: this.appTranslate.instant('BROKER.PAYMENTS.COLUMNS.POLICY_NO'), filterable: true, filterType: 'text' },
            { key: 'partnerName', label: this.appTranslate.instant('BROKER.PAYMENTS.COLUMNS.CLIENT_NAME'), filterable: true, filterType: 'text' },
            { key: 'productName', label: 'Product', filterable: true },
            {
                key: 'premiumAmount',
                label: this.appTranslate.instant('BROKER.PAYMENTS.COLUMNS.AMOUNT'),
                filterable: false,
                render: (row: any) => `<span class="font-medium text-gray-900 dark:text-gray-100">$${row.premiumAmount ? row.premiumAmount.toLocaleString() : '0'}</span>`
            },
            { key: 'paymentStatus', label: this.appTranslate.instant('BROKER.PAYMENTS.COLUMNS.STATUS'), filterable: true, render: (row: any) => this.renderStatus(row.paymentStatus) },
            { key: 'date', label: this.appTranslate.instant('BROKER.PAYMENTS.COLUMNS.DATE'), filterable: true, filterType: 'date' },
            {
                key: 'actions',
                label: this.appTranslate.instant('BROKER.PAYMENTS.COLUMNS.ACTIONS'),
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
        const s = status?.toLowerCase() || 'outstanding';
        let classes = '';

        if (['completed', 'paid'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'outstanding'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        const translatedStatus = this.appTranslate.instant(`STATUS.${s.toUpperCase()}`);
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${translatedStatus}</span>`;
    }

    loadFirstPage(): void {
        this.isLoading = true;
        this.error = null;

        const currentUser = this.authService.currentUserValue;
        if (!currentUser || !currentUser.id) {
            this.handleUserError();
            return;
        }

        const agentId = currentUser.id;

        // Load page 1 immediately
        this.brokerService.getPremiums(agentId, this.paymentStatus, this.pageSize, 0).subscribe({
            next: (response) => {
                if (response.result?.data) {
                    const mappedData = this.mapPremiumData(response.result.data);

                    // Populate first page cache
                    mappedData.forEach((item, index) => {
                        this.cachedData[index] = item;
                    });

                    this.data = mappedData;

                    // Initial total estimate (will be corrected by background load)
                    if (this.totalRecords === 0) {
                        this.totalRecords = response.result.total_count || 100; // Fallback
                    }
                } else {
                    this.data = [];
                }
                this.isLoading = false;
            },
            error: (error) => {
                this.handleError(error);
            }
        });
    }

    loadAllInBackground(): void {
        const currentUser = this.authService.currentUserValue;
        if (!currentUser || !currentUser.id) return;

        const agentId = currentUser.id;
        const batchSize = 1000;
        let offset = 0;
        let allData: any[] = [];

        const fetchNextBatch = () => {
            this.brokerService.getPremiums(agentId, this.paymentStatus, batchSize, offset).subscribe({
                next: (response) => {
                    const batchData = response.result?.data || [];
                    const mappedBatch = this.mapPremiumData(batchData);

                    allData = [...allData, ...mappedBatch];

                    // Update cache progressively (optional, or wait until end)
                    // Here waiting until end for simplicity, or could update this.cachedData

                    // If we received a full batch, assume there's more and fetch next
                    if (batchData.length === batchSize) {
                        offset += batchSize;
                        fetchNextBatch();
                    } else {
                        // Finished loading all data
                        this.cachedData = allData;
                        this.totalRecords = allData.length;

                        // Refresh current view if needed
                        if (this.currentPage === 1 && this.data.length === 0 && allData.length > 0) {
                            this.displayCurrentPage();
                        }

                        console.log(`✓ Cached all ${allData.length} premiums recursively.`);
                    }
                },
                error: (err) => console.error('Background load failed', err)
            });
        };

        fetchNextBatch();
    }

    handleUserError(): void {
        this.error = 'ERROR.USER_NOT_FOUND';
        this.isLoading = false;
        this.notificationService.error(this.appTranslate.instant('ERROR.USER_NOT_FOUND'));
    }

    mapPremiumData(apiData: any[]): any[] {
        return apiData.map((item: any) => ({
            id: item.id || '',
            policyNumber: item.policy_number || 'N/A',
            partnerName: item.partner_name || 'N/A',
            productName: item.product_name || 'N/A',
            premiumAmount: item.premium_amount || 0,
            paymentStatus: item.payment_status || 'outstanding',
            date: item.date || item.create_date || 'N/A'
        }));
    }

    handleError(error: any): void {
        console.error('Error loading premiums:', error);

        // Check if it's a "no data found" error (which is not really an error)
        const errorMessage = error?.error?.error?.message || error?.message || '';
        if (errorMessage.includes('No premiums found') || errorMessage.includes('No payment')) {
            // This is not an error, just no data
            this.data = [];
            this.totalRecords = 0;
            this.isLoading = false;
            return;
        }

        // Real error - show notification
        this.error = 'ERROR.LOADING_DATA';
        this.isLoading = false;
        this.notificationService.error(
            this.appTranslate.instant('ERROR.LOADING_DATA'),
            errorMessage || this.appTranslate.instant('ERROR.GENERIC')
        );
    }

    onFilteredDataChange(filteredData: any[]): void {
        this.filteredData = filteredData;
    }

    onFilterChange(activeFilters: any): void {
        this.hasActiveFilters = Object.keys(activeFilters).length > 0;
    }

    handleTableAction(event: { action: string, data: any }): void {
        console.log('Action', event.action, event.data);
        // TODO: Implement view payment details
    }

    onExport(): void {
        console.log('Exporting premiums...');
        // TODO: Implement export functionality
    }

    displayCurrentPage(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.data = this.cachedData.slice(startIndex, endIndex).filter(p => p !== undefined);
    }

    getDisplayData(): any[] {
        if (this.hasActiveFilters) {
            return this.cachedData.filter(p => p !== undefined);
        }
        return this.data;
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
