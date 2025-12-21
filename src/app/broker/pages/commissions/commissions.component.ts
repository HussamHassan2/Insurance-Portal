import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { TableColumn } from '../../../shared/models/table-column.interface';
import { AppTranslateService } from '../../../core/services/app-translate.service';
import { BrokerService } from '../../../core/services/broker.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

declare var lucide: any;

@Component({
    selector: 'app-commissions',
    templateUrl: './commissions.component.html',
    styleUrls: ['./commissions.component.css']
})
export class CommissionsComponent implements OnInit, AfterViewChecked {
    totalCommissions = 0;
    paidCommissions = 0;
    pendingCommissions = 0;

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

    constructor(
        private appTranslate: AppTranslateService,
        private brokerService: BrokerService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadCommissions();
        this.loadCommissionSummary();
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.columns = [
            { key: 'id', label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.COMMISSION_ID'), filterable: true, filterType: 'text' },
            { key: 'policyNumber', label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.POLICY_NO'), filterable: true, filterType: 'text' },
            { key: 'partnerName', label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.CLIENT_NAME'), filterable: true, filterType: 'text' },
            { key: 'productName', label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.PRODUCT'), filterable: true },
            {
                key: 'commissionRate',
                label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.RATE'),
                filterable: false,
                render: (row: any) => row.commissionRate ? `${row.commissionRate}%` : 'N/A'
            },
            {
                key: 'commissionAmount',
                label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.COMMISSION'),
                filterable: false,
                render: (row: any) => row.commissionAmount ? `$${row.commissionAmount.toLocaleString()}` : '$0'
            },
            {
                key: 'paymentStatus',
                label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.STATUS'),
                filterable: true,
                render: (row: any) => this.renderStatus(row.paymentStatus)
            },
            { key: 'date', label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.DATE'), filterable: true, filterType: 'date' },
            {
                key: 'actions',
                label: this.appTranslate.instant('BROKER.COMMISSIONS.COLUMNS.ACTIONS'),
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

        if (['paid'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['outstanding', 'pending'].includes(s)) {
            classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        const translatedStatus = this.appTranslate.instant(`STATUS.${s.toUpperCase()}`);
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${translatedStatus}</span>`;
    }

    loadCommissions(): void {
        this.isLoading = true;
        this.error = null;

        const currentUser = this.authService.currentUserValue;
        if (!currentUser || !currentUser.id) {
            this.error = 'ERROR.USER_NOT_FOUND';
            this.isLoading = false;
            this.notificationService.error(this.appTranslate.instant('ERROR.USER_NOT_FOUND'));
            return;
        }

        const agentId = currentUser.id;
        const offset = (this.currentPage - 1) * this.pageSize;

        // First, get total count without limit/offset
        this.brokerService.getCommissions(agentId, this.paymentStatus).subscribe({
            next: (response) => {
                if (response.result?.data) {
                    this.totalRecords = response.result.data.length;

                    // Now get paginated data
                    this.brokerService.getCommissions(agentId, this.paymentStatus, this.pageSize, offset).subscribe({
                        next: (paginatedResponse) => {
                            if (paginatedResponse.result?.data) {
                                this.data = this.mapCommissionData(paginatedResponse.result.data);
                            } else {
                                this.data = [];
                            }
                            this.isLoading = false;
                        },
                        error: (error) => {
                            this.handleError(error);
                        }
                    });
                } else {
                    this.data = [];
                    this.totalRecords = 0;
                    this.isLoading = false;
                }
            },
            error: (error) => {
                this.handleError(error);
            }
        });
    }

    loadCommissionSummary(): void {
        const currentUser = this.authService.currentUserValue;
        if (!currentUser || !currentUser.id) return;

        const agentId = currentUser.id;

        // Load paid commissions
        this.brokerService.getCommissions(agentId, 'paid').subscribe({
            next: (response) => {
                if (response.result?.data) {
                    this.paidCommissions = response.result.data.reduce((sum: number, item: any) =>
                        sum + (item.commission_amount || 0), 0);
                }
            }
        });

        // Load outstanding commissions
        this.brokerService.getCommissions(agentId, 'outstanding').subscribe({
            next: (response) => {
                if (response.result?.data) {
                    this.pendingCommissions = response.result.data.reduce((sum: number, item: any) =>
                        sum + (item.commission_amount || 0), 0);
                }
                this.totalCommissions = this.paidCommissions + this.pendingCommissions;
            }
        });
    }

    mapCommissionData(apiData: any[]): any[] {
        return apiData.map((item: any) => ({
            id: item.id || '',
            policyNumber: item.policy_number || 'N/A',
            partnerName: item.partner_name || 'N/A',
            productName: item.product_name || 'N/A',
            commissionRate: item.commission_rate || 0,
            commissionAmount: item.commission_amount || 0,
            paymentStatus: item.payment_status || 'outstanding',
            date: item.date || item.create_date || 'N/A'
        }));
    }

    handleError(error: any): void {
        console.error('Error loading commissions:', error);

        // Check if it's a "no data found" error (which is not really an error)
        const errorMessage = error?.error?.error?.message || error?.message || '';
        if (errorMessage.includes('No commission lines found')) {
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

    handleTableAction(event: { action: string, data: any }): void {
        console.log('Action', event.action, event.data);
        // TODO: Implement view commission details
    }

    onExport(): void {
        console.log('Exporting commissions...');
        // TODO: Implement export functionality
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadCommissions();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadCommissions();
    }
}
