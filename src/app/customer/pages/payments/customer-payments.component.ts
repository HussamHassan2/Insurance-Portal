import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { TableColumn } from '../../../shared/models/table-column.interface';
import { BrokerService } from '../../../core/services/broker.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppTranslateService } from '../../../core/services/app-translate.service';

declare var lucide: any;

@Component({
    selector: 'app-customer-payments',
    templateUrl: './customer-payments.component.html',
    styleUrls: ['./customer-payments.component.css']
})
export class CustomerPaymentsComponent implements OnInit, AfterViewChecked {
    columns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;

    // Pagination
    currentPage: number = 1;
    pageSize: number = 25;
    totalRecords: number = 0;
    paymentStatus: 'paid' | 'outstanding' = 'paid';

    // Caching mechanism
    // Caching mechanism
    private cachedData: any[] = [];
    hasActiveFilters: boolean = false;

    constructor(
        private router: Router,
        private brokerService: BrokerService,
        private authService: AuthService,
        private notificationService: NotificationService,
        private appTranslate: AppTranslateService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadFirstPage();
    }

    changePaymentStatus(status: 'paid' | 'outstanding'): void {
        if (this.paymentStatus !== status) {
            this.paymentStatus = status;
            this.currentPage = 1;
            this.clearCache();
            this.loadFirstPage();
        }
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.columns = [
            { key: 'id', label: 'Payment ID', filterable: true, filterType: 'text' },
            { key: 'policyNumber', label: 'Policy No', filterable: true, filterType: 'text' },
            { key: 'partnerName', label: 'Customer Name', filterable: true, filterType: 'text' },
            { key: 'productName', label: 'Product', filterable: true },
            {
                key: 'premiumAmount',
                label: 'Amount',
                filterable: false,
                render: (row: any) => `<span class="font-medium text-gray-900 dark:text-gray-100">$${row.premiumAmount ? row.premiumAmount.toLocaleString() : '0'}</span>`
            },
            { key: 'paymentStatus', label: 'Status', filterable: true, render: (row: any) => this.renderStatus(row.paymentStatus) },
            { key: 'date', label: 'Date', filterable: true, filterType: 'date' },
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
        const s = status?.toLowerCase() || 'outstanding';
        let classes = '';

        if (['completed', 'paid'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'outstanding'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${status}</span>`;
    }

    loadFirstPage(): void {
        this.isLoading = true;
        this.error = null;

        const currentUser = this.authService.currentUserValue;
        if (!currentUser || !currentUser.id) {
            this.error = 'ERROR.USER_NOT_FOUND';
            this.isLoading = false;
            this.notificationService.error(this.appTranslate.instant('ERROR.USER_NOT_FOUND'));
            return;
        }

        const userId = currentUser.id;

        // Load ONLY first page for fast display
        this.brokerService.getPremiums(userId, this.paymentStatus, this.pageSize, 0).subscribe({
            next: (response) => {
                if (response.result?.data) {
                    const payments = response.result.data;
                    const mappedPayments = this.mapPaymentData(payments);

                    this.cachedData = [...mappedPayments];
                    this.data = mappedPayments;

                    console.log(`✓ Page 1 loaded. Starting background loading...`);
                    this.loadAllInBackground();
                } else {
                    this.data = [];
                    this.totalRecords = 0;
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

        const userId = currentUser.id;
        const batchSize = 1000;
        let offset = 0;
        let allData: any[] = [];

        const fetchNextBatch = () => {
            this.brokerService.getPremiums(userId, this.paymentStatus, batchSize, offset).subscribe({
                next: (response) => {
                    const payments = response.result?.data || [];
                    const mappedPayments = this.mapPaymentData(payments);

                    allData = [...allData, ...mappedPayments];

                    // total records might be available in response result, or just infer from accumulation
                    if (response.result?.total_count || response.result?.count) {
                        this.totalRecords = response.result.total_count || response.result.count;
                    }

                    if (payments.length === batchSize) {
                        offset += batchSize;
                        fetchNextBatch();
                    } else {
                        this.cachedData = allData;
                        this.totalRecords = allData.length;

                        if (this.currentPage === 1 && this.data.length === 0 && allData.length > 0) {
                            this.displayCurrentPage();
                        }
                        console.log(`✓ Cached all ${allData.length} payments recursively.`);
                    }
                },
                error: (err) => console.error('Background load failed', err)
            });
        };

        fetchNextBatch();
    }

    clearCache(): void {
        this.cachedData = [];
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

    mapPaymentData(apiData: any[]): any[] {
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
        console.error('Error loading payments:', error);

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
        console.log('Exporting payments...');
        // TODO: Implement export functionality
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
