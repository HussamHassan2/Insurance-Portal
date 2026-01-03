import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { PolicyService } from '../../../core/services/policy.service';
import { AuthService } from '../../../core/services/auth.service';
import { TableColumn } from '../../../shared/models/table-column.interface';
import { AppTranslateService } from '../../../core/services/app-translate.service';

declare var lucide: any;

@Component({
    selector: 'app-broker-policies',
    templateUrl: './broker-policies.component.html',
    styles: []
})
export class BrokerPoliciesComponent implements OnInit, AfterViewChecked {
    allColumns: TableColumn[] = [];
    visibleColumns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;

    // Pagination
    currentPage: number = 1;
    pageSize: number = 25;
    totalRecords: number = 0;

    // Caching mechanism
    // Caching mechanism
    private cachedData: any[] = [];
    hasActiveFilters: boolean = false;

    constructor(
        private policyService: PolicyService,
        private authService: AuthService,
        private router: Router,
        private appTranslate: AppTranslateService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadFirstPage();
    }

    // loadFirstPage removed


    // loadTotalCount removed


    mapPolicies(policiesData: any[]): any[] {
        return policiesData.map((p: any) => {
            // Pre-process Status
            const rawStatus = (p.state || 'Draft').replace(/^STATUS\./i, '').toLowerCase();
            const statusDisplay = this.appTranslate.instant(`STATUS.${rawStatus.toUpperCase()}`);

            // Pre-process Transaction Type
            const rawTransactionType = (p.transaction_type || 'New').replace(/^TYPES\./i, '').toLowerCase();
            const typeDisplay = this.appTranslate.instant(`TYPES.${rawTransactionType.toUpperCase()}`);

            return {
                id: p.id || p.policy_number,
                policyNumber: p.policy_number || 'Draft',
                riskImage: p.risk_image,
                transactionType: typeDisplay,
                rawTransactionType: rawTransactionType,
                productName: p.product_name || 'Motor Private Section',
                customerName: p.customer_name || 'Customer',
                status: statusDisplay,
                rawStatus: rawStatus,
                approveDate: p.approve_date || '-',
                issueDate: p.issue_date || '-',
                effectiveFrom: p.effective_from_date || '-',
                effectiveTo: p.effective_to_date || '-',
                grossPremium: p.gross_premium || 0,
                netPremium: p.net_premium || 0,
                currency: p.currency || 'EGP',
                paymentStatus: p.payment_status || 'outstanding',
                issuingBranch: p.issuing_branch || 'Head office'
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

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // getDateDomain helper removed as it was for server-side

    displayCurrentPage(): void {
        let validItems = this.cachedData.filter(p => p !== undefined);

        // Apply Date Filter Client-Side
        if (this.selectedPeriod !== 'all') {
            const now = new Date();
            let daysToFilter = 36500;
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);

            if (this.selectedPeriod === 'week') {
                const day = start.getDay();
                const diff = (day + 1) % 7;
                start.setDate(now.getDate() - diff);
                // "Week" logic: Start of current week to now
                daysToFilter = 7; // Approximation or use precise date comparison
            } else if (this.selectedPeriod === 'month') {
                start.setDate(1);
            } else if (this.selectedPeriod === 'year') {
                start.setMonth(0, 1);
            }

            // Precise comparison using the calculated 'start' date
            validItems = validItems.filter(p => {
                if (!p.approveDate || p.approveDate === '-') return false;
                const d = new Date(p.approveDate);
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
        // Return full filtered list for table-level search if needed
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

            validItems = validItems.filter(p => {
                if (!p.approveDate || p.approveDate === '-') return false;
                const d = new Date(p.approveDate);
                return d >= start && d <= now;
            });
        }
        return validItems;
    }

    loadFirstPage(): void {
        this.isLoading = true;
        const user = this.authService.currentUserValue;
        if (!user) return;

        // No date domain - fetch ALL
        this.policyService.listPolicies({
            user_id: user.id,
            user_type: 'broker',
            limit: this.pageSize,
            offset: 0,
            domain: []
        }).subscribe({
            next: (response) => {
                const policiesData = response.data?.data || response.data?.result?.data || response.data || [];

                if (response.data?.total_count || response.data?.count) {
                    this.totalRecords = response.data.total_count || response.data.count;
                } else {
                    this.totalRecords = 0;
                }

                const mappedPolicies = this.mapPolicies(policiesData);
                this.cachedData = [...mappedPolicies];
                // Apply initial filter (if default is month)
                this.displayCurrentPage();

                console.log(`✓ Page 1 loaded. Starting background loading...`);
                this.loadAllInBackground();
            },
            error: (err) => {
                console.error('Error loading policies:', err);
                this.error = 'BROKER.POLICIES.ERROR_LOADING';
                this.isLoading = false;
            }
        });
    }

    loadAllInBackground(): void {
        const user = this.authService.currentUserValue;
        if (!user) return;

        const batchSize = 1000;
        let offset = 0;
        let allData: any[] = [];
        // No date domain

        const fetchNextBatch = () => {
            // No duplicate check needed for date filter changes since we don't abort

            this.policyService.listPolicies({
                user_id: user.id,
                user_type: 'broker',
                limit: batchSize,
                offset: offset,
                domain: []
            }).subscribe({
                next: (response) => {
                    const policiesData = response.data?.data || response.data?.result?.data || response.data || [];
                    const mappedPolicies = this.mapPolicies(policiesData);

                    allData = [...allData, ...mappedPolicies];

                    if (response.data?.total_count || response.data?.count) {
                        this.totalRecords = response.data.total_count || response.data.count;
                    }

                    if (policiesData.length === batchSize) {
                        offset += batchSize;
                        fetchNextBatch();
                    } else {
                        // Finished loading
                        this.cachedData = allData;
                        this.totalRecords = allData.length;
                        // Refresh view to apply filters to full dataset
                        this.displayCurrentPage();
                    }
                },
                error: (err) => console.error('Background load failed', err)
            });
        };

        fetchNextBatch();
    }

    setupColumns(): void {
        this.allColumns = [
            {
                key: 'riskImage',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.CAR_IMAGE'),
                filterable: false,
                render: (row) => this.renderBoolean(row.riskImage)
            },
            { key: 'policyNumber', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.POLICY_NO'), filterable: true, filterType: 'text', sortable: true },
            {
                key: 'transactionType',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.TRANSACTION_TYPE'),
                filterable: true,
                render: (row) => this.renderTransactionType(row)
            },
            { key: 'productName', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.PRODUCT'), filterable: true, filterType: 'text', sortable: true },
            { key: 'customerName', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.CUSTOMER'), filterable: true, filterType: 'text', sortable: true },
            {
                key: 'status',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.STATUS'),
                filterable: true,
                render: (row) => this.renderStatus(row)
            },
            { key: 'approveDate', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.APPROVE_DATE'), filterable: true, filterType: 'date', sortable: true },
            { key: 'issueDate', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.ISSUE_DATE'), filterable: true, filterType: 'date', sortable: true },
            { key: 'effectiveFrom', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.EFFECTIVE_FROM'), filterable: true, filterType: 'date', sortable: true },
            { key: 'effectiveTo', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.EFFECTIVE_TO'), filterable: true, filterType: 'date', sortable: true },
            {
                key: 'grossPremium',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.GROSS_PREMIUM'),
                filterable: false,
                render: (row) => this.renderCurrency(row.grossPremium, row.currency)
            },
            {
                key: 'netPremium',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.NET_PREMIUM'),
                filterable: false,
                render: (row) => this.renderCurrency(row.netPremium, row.currency)
            },
            { key: 'currency', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.CURRENCY'), filterable: true, filterType: 'text', sortable: true },
            {
                key: 'paymentStatus',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.PAYMENT_STATUS'),
                filterable: true,
                render: (row) => this.renderPaymentStatus(row.paymentStatus)
            },
            { key: 'issuingBranch', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.ISSUING_BRANCH'), filterable: true, filterType: 'text', sortable: true },
            {
                key: 'actions',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.ACTIONS'),
                filterable: false,
                mandatory: true,
                render: (row) => `
                    <div class="flex items-center gap-2">
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="view" data-id="${row.id}" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="download" data-id="${row.id}" title="Download Policy">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="more" data-id="${row.id}" title="More Actions">
                            <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                        </button>
                    </div>
                `
            }
        ];
        this.visibleColumns = [...this.allColumns];
    }

    onVisibleColumnsChange(columns: TableColumn[]): void {
        this.visibleColumns = columns;
    }

    renderStatus(row: any): string {
        const s = row.rawStatus || 'pending';
        let classes = '';

        if (['active', 'approved', 'paid'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'processing', 'review'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${row.status}</span>`;
    }

    renderTransactionType(row: any): string {
        const t = row.rawTransactionType || 'new';
        let classes = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';

        if (t === 'endorsement' || t === 'end') {
            classes = 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
        } else if (t === 'renewal') {
            classes = 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300';
        } else if (t === 'cancellation' || t === 'cancel') {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        } else if (['non_technical', 'technical_refund', 'technical_add', 'technical_borndead'].includes(t)) {
            classes = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
        }

        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${row.transactionType}</span>`;
    }

    renderPaymentStatus(status: string): string {
        const s = status?.toLowerCase() || 'outstanding';
        let classes = '';

        if (['paid', 'completed'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['pending', 'outstanding'].includes(s)) {
            classes = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        const translatedStatus = this.appTranslate.instant(`STATUS.${s.toUpperCase()}`);
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${translatedStatus}</span>`;
    }

    renderBoolean(value: boolean): string {
        return value
            ? '<i data-lucide="check-circle-2" class="w-5 h-5 text-green-500 mx-auto"></i>'
            : '<i data-lucide="x-circle" class="w-5 h-5 text-gray-300 mx-auto"></i>';
    }

    renderCurrency(amount: number, currency: string): string {
        return `<span class="font-medium text-gray-900 dark:text-gray-100">${currency || 'EGP'} ${Number(amount).toLocaleString()}</span>`;
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
                this.router.navigate(['/dashboard/broker/policies', event.data.id]);
                break;
            case 'download':
                console.log('Download policy', event.data.id);
                // Implement download logic here
                break;
            case 'more':
                console.log('More actions for', event.data.id);
                break;
        }
    }

    onExport(): void {
        console.log('Exporting policies...');
        // Implement export logic here using this.filteredData
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
