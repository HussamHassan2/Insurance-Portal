import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { CrmService } from '../../../core/services/crm.service';
import { AuthService } from '../../../core/services/auth.service';
import { TableColumn } from '../../../shared/models/table-column.interface';
import { AppTranslateService } from '../../../core/services/app-translate.service';

declare var lucide: any;

@Component({
    selector: 'app-broker-quotations',
    templateUrl: './broker-quotations.component.html',
    styleUrls: ['./broker-quotations.component.css']
})
export class BrokerQuotationsComponent implements OnInit, AfterViewChecked {
    allColumns: TableColumn[] = [];
    visibleColumns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;
    isCustomerModalOpen = false;
    currentFilters: any = {};

    // Pagination
    currentPage: number = 1;
    pageSize: number = 25;
    totalRecords: number = 1000; // Initial estimate, will be updated after fetch

    constructor(
        private crmService: CrmService,
        private authService: AuthService,
        private router: Router,
        private appTranslate: AppTranslateService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.fetchTotalCount();
        this.loadQuotations();
    }

    fetchTotalCount(): void {
        const user = this.authService.currentUserValue;
        if (!user) return;

        this.crmService.listOpportunities({
            user_id: user.id,
            user_type: 'broker',
            limit: 10000,  // High limit to get all records
            offset: 0
        }).subscribe({
            next: (response) => {
                const quotes = Array.isArray(response) ? response : (response.data || []);
                this.totalRecords = quotes.length;
            },
            error: (err) => {
                console.error('Error fetching total quotations count', err);
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
            { key: 'quoteNumber', label: this.appTranslate.instant('BROKER.QUOTATIONS.COLUMNS.QUOTE_NUMBER'), filterable: true, filterType: 'text', sortable: true },
            { key: 'title', label: this.appTranslate.instant('BROKER.QUOTATIONS.COLUMNS.TITLE'), filterable: true, filterType: 'text', sortable: true },
            { key: 'date', label: this.appTranslate.instant('BROKER.QUOTATIONS.COLUMNS.DATE'), filterable: true, filterType: 'date', sortable: true },
            { key: 'customerName', label: this.appTranslate.instant('BROKER.QUOTATIONS.COLUMNS.CUSTOMER_NAME'), filterable: true, filterType: 'text', sortable: true },
            {
                key: 'stage',
                label: this.appTranslate.instant('BROKER.QUOTATIONS.COLUMNS.STAGE'),
                filterable: true,
                render: (row) => this.renderStatus(row)
            },
            {
                key: 'type',
                label: this.appTranslate.instant('BROKER.QUOTATIONS.COLUMNS.TYPE'),
                filterable: true,
                filterType: 'select',
                render: (row) => this.renderType(row)
            },
            {
                key: 'actions',
                label: this.appTranslate.instant('BROKER.QUOTATIONS.COLUMNS.ACTIONS'),
                filterable: false,
                mandatory: true,
                render: (row) => `
                    <div class="flex items-center gap-2">
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="view" data-id="${row.id}" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="download" data-id="${row.id}" title="Download Quote">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                        </button>
                    </div>
                `
            }
        ];
        // Initialize visibleColumns with allColumns by default, 
        // the toggle component will emit the correct list on init based on prefs
        this.visibleColumns = [...this.allColumns];
    }

    onVisibleColumnsChange(columns: TableColumn[]): void {
        this.visibleColumns = columns;
    }

    renderStatus(row: any): string {
        // Use rawStage for styling logic, fallback to 'draft'
        const s = row.rawStage || 'draft';
        let classes = '';

        // Assign unique color to each stage value
        switch (s) {
            case 'new':
                classes = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
                break;
            case 'draft':
                classes = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
                break;
            case 'sent':
                classes = 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
                break;
            case 'pending':
            case 'review':
                classes = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
                break;
            case 'negotiation':
                classes = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
                break;
            case 'accepted':
            case 'approved':
                classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
                break;
            case 'won':
                classes = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
                break;
            case 'rejected':
            case 'lost':
                classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
                break;
            case 'expired':
                classes = 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300';
                break;
            default:
                classes = 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
        }

        // Use pre-translated stage for display
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${row.stage}</span>`;
    }

    renderType(row: any): string {
        // Use rawType for styling logic, fallback to 'new'
        const t = row.rawType || 'new';
        let classes = '';

        // Assign unique color to each type value
        switch (t) {
            case 'new':
                classes = 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300';
                break;
            case 'renewal':
                classes = 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300';
                break;
            case 'endorsement':
            case 'end':
                classes = 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300';
                break;
            case 'cancellation':
            case 'cancel':
                classes = 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300';
                break;
            case 'modification':
            case 'non_technical':
            case 'technical_refund':
            case 'technical_add':
            case 'technical_borndead':
                classes = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
                break;
            default:
                classes = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
        }

        // Use pre-translated type for display
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${row.type}</span>`;
    }

    loadQuotations(): void {
        this.isLoading = true;
        const user = this.authService.currentUserValue;
        if (!user) return;

        const offset = (this.currentPage - 1) * this.pageSize;

        this.crmService.listOpportunities({
            user_id: user.id,
            user_type: 'broker',
            limit: this.pageSize,
            offset: offset
        }).subscribe({
            next: (response) => {
                // Response is directly an array, not wrapped in data property
                const quotes = Array.isArray(response) ? response : (response.data || []);

                // Total count is fetched separately in fetchTotalCount()
                // Don't override it here unless API provides total_count
                if (response.total_count || response.count) {
                    this.totalRecords = response.total_count || response.count;
                }

                // Map to match columns using actual API response fields
                this.data = quotes.map((q: any) => {
                    // Pre-process Stage/Status
                    const rawStage = q.stage_name ? q.stage_name.replace(/^STATUS\./i, '').toLowerCase() : 'draft';
                    const stageDisplay = this.appTranslate.instant(`STATUS.${rawStage.toUpperCase()}`);

                    // Pre-process Type
                    const rawType = q.opportunity_type ? q.opportunity_type.replace(/^TYPES\./i, '').toLowerCase() : 'new';
                    const typeDisplay = this.appTranslate.instant(`TYPES.${rawType.toUpperCase()}`);

                    return {
                        id: q.opportunity_id,
                        quoteNumber: q.opportunity_number || 'N/A',
                        title: q.name ? q.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'N/A',
                        date: q.opportunity_date || 'N/A',
                        customerName: q.contact_name ? q.contact_name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'N/A',
                        stage: stageDisplay,
                        rawStage: rawStage,
                        type: typeDisplay,
                        rawType: rawType
                    };
                });
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading quotations:', err);
                this.error = 'BROKER.QUOTATIONS.ERROR_LOADING';
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
                this.router.navigate(['/dashboard/broker/quotations', event.data.id]);
                break;
            case 'download':
                console.log('Download', event.data.id);
                break;
        }
    }

    onExport(): void {
        console.log('Exporting quotations...');
    }

    openCustomerModal(): void {
        this.isCustomerModalOpen = true;
    }

    onCustomerSelected(customer: any): void {
        this.isCustomerModalOpen = false;
        this.router.navigate(['/dashboard/broker/quote/new'], {
            state: { customer: customer }
        });
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadQuotations();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadQuotations();
    }
}
