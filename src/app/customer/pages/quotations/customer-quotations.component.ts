import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { CrmService } from '../../../core/services/crm.service';
import { AuthService } from '../../../core/services/auth.service';
import { TableColumn } from '../../../shared/models/table-column.interface';

declare var lucide: any;

@Component({
    selector: 'app-customer-quotations',
    templateUrl: './customer-quotations.component.html',
    styleUrls: ['./customer-quotations.component.css']
})
export class CustomerQuotationsComponent implements OnInit, AfterViewChecked {
    columns: TableColumn[] = [];
    data: any[] = [];
    filteredData: any[] = [];
    isLoading: boolean = true;
    error: string | null = null;

    constructor(
        private crmService: CrmService,
        private authService: AuthService,
        private router: Router
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadQuotations();
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupColumns(): void {
        this.columns = [
            { key: 'quoteNumber', label: 'Quote No', filterable: true, filterType: 'text' },
            { key: 'product', label: 'Product', filterable: true },
            {
                key: 'status',
                label: 'Status',
                filterable: true,
                render: (row: any) => this.renderStatus(row.status)
            },
            {
                key: 'premium',
                label: 'Premium',
                filterable: false,
                render: (row: any) => `<span class="font-medium text-gray-900 dark:text-gray-100">${row.currency || 'EGP'} ${Number(row.premium).toLocaleString()}</span>`
            },
            { key: 'validUntil', label: 'Valid Until', filterable: true, filterType: 'date' },
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
        const s = status?.toLowerCase() || 'draft';
        let classes = '';

        if (['accepted', 'approved', 'won'].includes(s)) {
            classes = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        } else if (['sent', 'pending', 'negotiation'].includes(s)) {
            classes = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
        } else if (['draft'].includes(s)) {
            classes = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
        } else {
            classes = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }

        return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}">${status}</span>`;
    }

    loadQuotations(): void {
        this.isLoading = true;
        const user = this.authService.currentUserValue;
        if (!user) return;

        this.crmService.listOpportunities({
            user_id: user.id,
            user_type: 'customer',
            limit: 100,
            offset: 0
        }).subscribe({
            next: (response) => {
                const quotes = response.data || [];
                // Map to match columns
                this.data = quotes.map((q: any) => ({
                    id: q.id || q.quotation_number,
                    quoteNumber: q.quotation_number || q.name || 'N/A',
                    product: q.product_name || 'General',
                    status: (q.stage_id || q.status || 'draft').toLowerCase(),
                    premium: q.expected_revenue || 0,
                    currency: q.currency || 'EGP',
                    validUntil: q.date_deadline || 'N/A'
                }));
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading quotations:', err);
                this.error = 'Failed to load quotations';
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
                this.router.navigate(['/dashboard/customer/quotations', event.data.id]);
                break;
        }
    }

    onExport(): void {
        console.log('Exporting quotations...');
    }
}
