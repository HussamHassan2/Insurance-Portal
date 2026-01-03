import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { TableColumn } from '../../../shared/models/table-column.interface';
import { AppTranslateService } from '../../../core/services/app-translate.service';

declare var lucide: any;

@Component({
    selector: 'app-broker-clients',
    templateUrl: './broker-clients.component.html',
    styleUrls: [
        /* Custom styles if needed, mostly Tailwind */
    ]
})
export class BrokerClientsComponent implements OnInit, AfterViewChecked {
    columns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;
    isCustomerModalOpen = false;
    hasActiveFilters: boolean = false; // Track if user is filtering

    // Pagination
    currentPage: number = 1;
    pageSize: number = 25;
    totalRecords: number = 1000; // Initial estimate, will be updated after fetch

    // Caching mechanism
    // Caching mechanism
    private cachedData: any[] = []; // All loaded clients in memory
    private isBackgroundLoading: boolean = false;

    constructor(
        private customerService: CustomerService,
        private authService: AuthService,
        private router: Router,
        private appTranslate: AppTranslateService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadFirstPage();
    }

    loadFirstPage(): void {
        this.isLoading = true;
        const user = this.authService.currentUserValue;
        if (!user) return;

        // Load ONLY first page for fast display
        this.customerService.getCustomers(user.id, 'broker', {
            limit: this.pageSize,
            offset: 0
        }).subscribe({
            next: (res) => {
                const rawData = res.result?.data || res.data || res;
                let contactsArray = [];

                if (rawData.contacts && Array.isArray(rawData.contacts)) {
                    contactsArray = rawData.contacts;
                    if (rawData.total_count) this.totalRecords = rawData.total_count;
                } else if (Array.isArray(rawData)) {
                    contactsArray = rawData;
                } else if (rawData.data && Array.isArray(rawData.data)) {
                    contactsArray = rawData.data;
                }

                if (this.totalRecords === 1000 && contactsArray.length < this.pageSize) {
                    this.totalRecords = contactsArray.length;
                }

                // Map and cache first page
                const mappedClients = contactsArray.map((c: any) => this.mapClient(c));
                this.cachedData = [...mappedClients];
                this.data = mappedClients;
                this.isLoading = false;

                console.log(`✓ Page 1 loaded. Starting background loading...`);

                // Start background loading
                this.loadAllInBackground();
            },
            error: (err) => {
                console.error('Error loading clients', err);
                this.error = 'BROKER.CLIENTS.ERROR_LOADING';
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

        const fetchNextBatch = () => {
            this.customerService.getCustomers(user.id, 'broker', {
                limit: batchSize,
                offset: offset
            }).subscribe({
                next: (res) => {
                    const rawData = res.result?.data || res.data || res;
                    let contactsArray = [];

                    if (rawData.contacts && Array.isArray(rawData.contacts)) {
                        contactsArray = rawData.contacts;
                    } else if (Array.isArray(rawData)) {
                        contactsArray = rawData;
                    } else if (rawData.data && Array.isArray(rawData.data)) {
                        contactsArray = rawData.data;
                    }

                    const mappedClients = contactsArray.map((c: any) => this.mapClient(c));
                    allData = [...allData, ...mappedClients];

                    if (rawData.total_count) this.totalRecords = rawData.total_count;

                    if (contactsArray.length === batchSize) {
                        offset += batchSize;
                        fetchNextBatch();
                    } else {
                        this.cachedData = allData;
                        this.totalRecords = allData.length;

                        if (this.currentPage === 1 && this.data.length === 0 && allData.length > 0) {
                            this.displayCurrentPage();
                        }
                        console.log(`✓ Cached all ${allData.length} clients recursively.`);
                    }
                },
                error: (err) => console.error('Background load failed', err)
            });
        };

        fetchNextBatch();
    }

    displayCurrentPage(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.data = this.cachedData.slice(startIndex, endIndex).filter(c => c !== undefined);
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.columns = [
            { key: 'clientId', label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.CLIENT_ID'), filterable: true, filterType: 'text' },
            { key: 'name', label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.FULL_NAME'), filterable: true, filterType: 'text' },
            { key: 'email', label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.EMAIL'), filterable: true, filterType: 'text' },
            { key: 'phone', label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.PHONE'), filterable: true, filterType: 'text' },
            {
                key: 'status',
                label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.STATUS'),
                filterable: true,
                render: (row: any) => this.renderStatus(row.status)
            },
            { key: 'totalPolicies', label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.POLICIES'), filterable: false },
            { key: 'joinDate', label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.JOIN_DATE'), filterable: true, filterType: 'date' },
            {
                key: 'actions',
                label: this.appTranslate.instant('BROKER.CLIENTS.COLUMNS.ACTIONS'),
                filterable: false,
                render: (row: any) => `
                    <div class="flex items-center gap-2">
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="view" data-id="${row.id}" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors" data-action="edit" data-id="${row.id}" title="Edit Client">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                    </div>
                `
            }
        ];
    }

    renderStatus(status: string): string {
        const s = status?.toLowerCase() || 'inactive';
        let classes = '';

        if (['active'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else {
            classes = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
        }

        const translatedStatus = this.appTranslate.instant(`STATUS.${s.toUpperCase()}`);
        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${translatedStatus}</span>`;
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

    private mapClient(c: any): any {
        return {
            id: c.national_id || c.id,
            clientId: c.national_id || c.id || 'N/A',
            name: c.english_name || c.arabic_name || 'Unknown Name',
            email: c.email || 'N/A',
            phone: c.phone || c.mobile || 'N/A',
            status: c.is_customer ? 'active' : 'inactive',
            totalPolicies: c.policy_count || 0,
            joinDate: c.create_date || 'N/A'
        };
    }

    onFilteredDataChange(filteredData: any[]): void {
        this.filteredData = filteredData;
    }

    onFilterChange(activeFilters: any): void {
        // Properly detect if filters are active based on the filter object from table
        this.hasActiveFilters = Object.keys(activeFilters).length > 0;
    }

    /**
     * Get the data to display in the table
     * If filtering is active, return ALL cached data (we have everything!)
     * Otherwise, return only the current page
     */
    getDisplayData(): any[] {
        if (this.hasActiveFilters) {
            // Return all cached data for filtering (instant search!)
            return this.cachedData;
        }
        // Return current page data
        return this.data;
    }

    handleTableAction(event: { action: string, data: any }): void {
        switch (event.action) {
            case 'view':
                this.router.navigate(['/dashboard/broker/clients', event.data.id]);
                break;
            case 'edit':
                console.log('Edit client', event.data.id);
                // Navigate to edit page if implemented
                break;
        }
    }

    onExport(): void {
        console.log('Exporting clients...');
    }

    onCustomerSelected(customerData: any): void {
        this.router.navigate(['/dashboard/broker/quote/new'], {
            state: { customer: customerData }
        });
        this.isCustomerModalOpen = false;
    }
}
