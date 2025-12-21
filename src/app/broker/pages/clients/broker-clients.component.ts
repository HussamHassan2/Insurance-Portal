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

    // Pagination
    currentPage: number = 1;
    pageSize: number = 25;
    totalRecords: number = 1000; // Initial estimate, will be updated after fetch

    constructor(
        private customerService: CustomerService,
        private authService: AuthService,
        private router: Router,
        private appTranslate: AppTranslateService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.fetchTotalCount();
        this.loadClients();
    }

    fetchTotalCount(): void {
        // Fetch total count without limit/offset to get accurate total
        this.authService.currentUser.subscribe(user => {
            if (!user) return;

            this.customerService.getCustomers(user.id, 'broker', {}).subscribe({
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

                    // Update with accurate total count
                    this.totalRecords = contactsArray.length;
                    console.log('=== CLIENT PAGINATION DEBUG ===');
                    console.log('Total clients fetched:', contactsArray.length);
                    console.log('totalRecords updated to:', this.totalRecords);
                    console.log('===============================');
                },
                error: (err) => {
                    console.error('Error fetching total count', err);
                    // Keep the estimate if fetch fails
                }
            });
        });
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

    loadClients(): void {
        this.isLoading = true;
        this.authService.currentUser.subscribe(user => {
            if (!user) return;

            const offset = (this.currentPage - 1) * this.pageSize;

            this.customerService.getCustomers(user.id, 'broker', {
                limit: this.pageSize,
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

                    // Total count is fetched separately in fetchTotalCount()
                    // Don't override it here unless API provides total_count

                    this.data = contactsArray.map((c: any) => ({
                        id: c.national_id || c.id,
                        clientId: c.national_id || c.id || 'N/A',
                        name: c.english_name || c.arabic_name || 'Unknown Name',
                        email: c.email || 'N/A',
                        phone: c.phone || c.mobile || 'N/A',
                        status: c.is_customer ? 'active' : 'inactive',
                        totalPolicies: c.policy_count || 0,
                        joinDate: c.create_date || 'N/A'
                    }));

                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Error loading clients', err);
                    this.error = 'BROKER.CLIENTS.ERROR_LOADING';
                    this.isLoading = false;
                }
            });
        });
    }

    onFilteredDataChange(filteredData: any[]): void {
        this.filteredData = filteredData;
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

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadClients();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1; // Reset to first page
        this.loadClients();
    }
}
