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
    totalRecords: number = 1000; // Initial estimate, will be updated after fetch

    constructor(
        private policyService: PolicyService,
        private authService: AuthService,
        private router: Router,
        private appTranslate: AppTranslateService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.fetchTotalCount();
        this.loadPolicies();
    }

    fetchTotalCount(): void {
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        console.log('=== POLICIES PAGINATION DEBUG ===');
        console.log('Fetching total count...');

        this.policyService.listPolicies({
            user_id: currentUser.id,
            user_type: 'broker',
            limit: 10000,  // High limit to get all records
            offset: 0
        }).subscribe({
            next: (response) => {
                console.log('Full API response:', response);
                console.log('response.data:', response.data);
                console.log('response.data?.data:', response.data?.data);
                console.log('response.data?.result?.data:', response.data?.result?.data);

                const policiesData = response.data?.data || response.data?.result?.data || response.data || [];
                console.log('Extracted policiesData:', policiesData);
                console.log('Is array?', Array.isArray(policiesData));

                this.totalRecords = Array.isArray(policiesData) ? policiesData.length : 0;
                console.log('Total policies fetched:', this.totalRecords);
                console.log('totalRecords set to:', this.totalRecords);
                console.log('isLoading:', this.isLoading);
                console.log('error:', this.error);
                console.log('Pagination should show:', !this.isLoading && !this.error && this.totalRecords > 0);
                console.log('===============================');
            },
            error: (err) => {
                console.error('Error fetching total policies count:', err);
                console.error('Error details:', JSON.stringify(err, null, 2));
            }
        });
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
                render: (row) => this.renderTransactionType(row.transactionType)
            },
            { key: 'productName', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.PRODUCT'), filterable: true, filterType: 'text', sortable: true },
            { key: 'customerName', label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.CUSTOMER'), filterable: true, filterType: 'text', sortable: true },
            {
                key: 'status',
                label: this.appTranslate.instant('BROKER.POLICIES.COLUMNS.STATUS'),
                filterable: true,
                render: (row) => this.renderStatus(row.status)
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

        const translatedStatus = this.appTranslate.instant(`STATUS.${s.toUpperCase()}`);
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${translatedStatus}</span>`;
    }

    renderTransactionType(type: string): string {
        const t = type?.toLowerCase() || 'new';
        let classes = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';

        if (t === 'endorsement') {
            classes = 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
        } else if (t === 'renewal') {
            classes = 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300';
        } else if (t === 'cancellation') {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        const translatedType = this.appTranslate.instant(`TYPES.${t.toUpperCase()}`);
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${translatedType}</span>`;
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

    loadPolicies(): void {
        this.isLoading = true;
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        const offset = (this.currentPage - 1) * this.pageSize;

        this.policyService.listPolicies({
            user_id: currentUser.id,
            user_type: 'broker',
            limit: this.pageSize,
            offset: offset
        }).subscribe({
            next: (response) => {
                const policiesData = response.data?.data || response.data?.result?.data || response.data || [];

                // Total count is fetched separately in fetchTotalCount()
                // Don't override it here unless API provides total_count
                if (response.data?.total_count || response.data?.count) {
                    this.totalRecords = response.data.total_count || response.data.count;
                }

                this.data = policiesData.map((p: any) => ({
                    id: p.id || p.policy_number,
                    policyNumber: p.policy_number || 'Draft',
                    riskImage: p.risk_image,
                    transactionType: p.transaction_type || 'New',
                    productName: p.product_name || 'Motor Private Section',
                    customerName: p.customer_name || 'Customer',
                    status: (p.state || 'Draft').toLowerCase(),
                    approveDate: p.approve_date || '-',
                    issueDate: p.issue_date || '-',
                    effectiveFrom: p.effective_from_date || '-',
                    effectiveTo: p.effective_to_date || '-',
                    grossPremium: p.gross_premium || 0,
                    netPremium: p.net_premium || 0,
                    currency: p.currency || 'EGP',
                    paymentStatus: p.payment_status || 'outstanding',
                    issuingBranch: p.issuing_branch || 'Head office'
                }));

                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading policies:', err);
                this.error = 'BROKER.POLICIES.ERROR_LOADING';
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
        this.loadPolicies();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadPolicies();
    }
}
