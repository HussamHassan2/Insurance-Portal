import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, AfterViewChecked } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TableColumn } from '../../models/table-column.interface';

declare var lucide: any;

@Component({
    selector: 'app-dynamic-table-with-filters',
    templateUrl: './dynamic-table-with-filters.component.html',
    styleUrls: ['./dynamic-table-with-filters.component.scss']
})
export class DynamicTableWithFiltersComponent implements OnInit, OnChanges, AfterViewChecked {
    @Input() data: any[] = [];
    @Input() columns: TableColumn[] = [];
    @Input() showExport: boolean = false;
    @Input() maxSelectOptions: number = 10;

    @Output() filteredDataChange = new EventEmitter<any[]>();
    constructor(private sanitizer: DomSanitizer) { }
    @Output() exportData = new EventEmitter<void>();
    @Output() action = new EventEmitter<{ action: string, data: any }>();
    @Output() filterChange = new EventEmitter<any>();

    columnFilters: { [key: string]: string } = {};
    dateRangeFilters: { [key: string]: { from: string, to: string } } = {};
    columnFilterConfig: { [key: string]: { type: 'text' | 'select' | 'date', options?: any[] } } = {};
    filteredData: any[] = [];

    // Date picker state
    showDatePicker: { [key: string]: boolean } = {};
    tempDateRange: { [key: string]: { from: Date | null, to: Date | null } } = {};

    ngOnInit(): void {
        this.initializeFilters();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data'] || changes['columns']) {
            this.initializeFilters();
            // Don't emit filter change event when data updates to avoid infinite loop
            this.applyFilters(false);
        }
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    onTableClick(event: MouseEvent): void {
        console.log('Table clicked', event.target);
        const target = event.target as HTMLElement;
        const actionBtn = target.closest('[data-action]');

        if (actionBtn) {
            console.log('Action button clicked', actionBtn);
            const action = actionBtn.getAttribute('data-action');
            const id = actionBtn.getAttribute('data-id');
            console.log('Action:', action, 'ID:', id);

            if (action && id) {
                this.action.emit({ action, data: { id } });
            }
        }
    }

    initializeFilters(): void {
        // Don't reset filters here, just ensure config exists
        // this.columnFilters = {};  <-- Removed reset
        // this.dateRangeFilters = {}; <-- Removed reset
        this.columnFilterConfig = {};

        this.columns.forEach(col => {
            if (col.filterable) {
                // Only initialize if not already set
                if (this.columnFilters[col.key] === undefined) {
                    this.columnFilters[col.key] = '';
                }

                // Get unique values
                const uniqueValues = [...new Set(
                    this.data
                        .map(item => item[col.key])
                        .filter(val => val !== null && val !== undefined && val !== '')
                )];

                // Determine filter type
                let filterType: 'text' | 'select' | 'date' = col.filterType ||
                    (uniqueValues.length <= this.maxSelectOptions && uniqueValues.length > 1 ? 'select' : 'text');

                this.columnFilterConfig[col.key] = {
                    type: filterType,
                    options: filterType === 'select' ? uniqueValues.sort() : undefined
                };

                // Initialize date range filters if not exists
                if (filterType === 'date' && !this.dateRangeFilters[col.key]) {
                    this.dateRangeFilters[col.key] = { from: '', to: '' };
                }
            }
        });
    }

    applyFilters(emitEvent: boolean = true): void {
        let result = [...this.data];

        Object.keys(this.columnFilters).forEach(key => {
            const filterValue = this.columnFilters[key];
            const config = this.columnFilterConfig[key];

            if (config?.type === 'date') {
                // Date range filtering
                const dateRange = this.dateRangeFilters[key];
                if (dateRange && (dateRange.from || dateRange.to)) {
                    result = result.filter(item => {
                        const itemValue = item[key];
                        if (!itemValue) return false;

                        const itemDate = new Date(itemValue);
                        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
                        const toDate = dateRange.to ? new Date(dateRange.to) : null;

                        if (fromDate && toDate) {
                            return itemDate >= fromDate && itemDate <= toDate;
                        } else if (fromDate) {
                            return itemDate >= fromDate;
                        } else if (toDate) {
                            return itemDate <= toDate;
                        }
                        return true;
                    });
                }
            } else if (filterValue && filterValue !== 'all' && filterValue !== '') {
                if (config?.type === 'select') {
                    // Exact match for select
                    result = result.filter(item => {
                        const itemValue = item[key];
                        return String(itemValue).toLowerCase() === String(filterValue).toLowerCase();
                    });
                } else {
                    // Partial match for text search
                    const searchLower = filterValue.toLowerCase();
                    result = result.filter(item => {
                        const itemValue = item[key];
                        return itemValue && String(itemValue).toLowerCase().includes(searchLower);
                    });
                }
            }
        });

        this.filteredData = result;
        this.filteredDataChange.emit(result);

        // Emit current filters for server-side processing
        const activeFilters: any = { ...this.columnFilters };
        // Clean up empty filters
        Object.keys(activeFilters).forEach(key => {
            if (!activeFilters[key] || activeFilters[key] === 'all') {
                delete activeFilters[key];
            }
        });

        // Add date filters if any
        Object.keys(this.dateRangeFilters).forEach(key => {
            const range = this.dateRangeFilters[key];
            if (range && (range.from || range.to)) {
                activeFilters[key] = range;
            }
        });

        if (emitEvent) {
            this.filterChange.emit(activeFilters);
        }
    }

    onFilterChange(columnKey: string, value: string): void {
        this.columnFilters[columnKey] = value;
        this.applyFilters();
    }

    clearAllFilters(): void {
        Object.keys(this.columnFilters).forEach(key => {
            this.columnFilters[key] = '';
        });
        Object.keys(this.dateRangeFilters).forEach(key => {
            this.dateRangeFilters[key] = { from: '', to: '' };
        });
        this.applyFilters();
    }

    get hasActiveFilters(): boolean {
        const hasTextFilters = Object.values(this.columnFilters).some(val => val !== '' && val !== 'all');
        const hasDateFilters = Object.values(this.dateRangeFilters).some(range => range.from !== '' || range.to !== '');
        return hasTextFilters || hasDateFilters;
    }

    get activeFilterCount(): number {
        const textFilterCount = Object.values(this.columnFilters).filter(val => val !== '' && val !== 'all').length;
        const dateFilterCount = Object.values(this.dateRangeFilters).filter(range => range.from !== '' || range.to !== '').length;
        return textFilterCount + dateFilterCount;
    }

    onExport(): void {
        this.exportData.emit();
    }

    getFilterType(columnKey: string): 'text' | 'select' | 'date' {
        return this.columnFilterConfig[columnKey]?.type || 'text';
    }

    getFilterOptions(columnKey: string): any[] {
        return this.columnFilterConfig[columnKey]?.options || [];
    }

    trackByKey(index: number, column: TableColumn): string {
        return column.key;
    }

    trackByIndex(index: number): number {
        return index;
    }

    toggleDatePicker(columnKey: string): void {
        this.showDatePicker[columnKey] = !this.showDatePicker[columnKey];

        // Initialize temp range from current filter
        if (this.showDatePicker[columnKey]) {
            const current = this.dateRangeFilters[columnKey];
            this.tempDateRange[columnKey] = {
                from: current?.from ? new Date(current.from) : null,
                to: current?.to ? new Date(current.to) : null
            };
        }
    }

    onDateRangeApply(columnKey: string, range: { from: Date | null, to: Date | null }): void {
        if (range.from && range.to) {
            this.dateRangeFilters[columnKey] = {
                from: range.from.toISOString().split('T')[0],
                to: range.to.toISOString().split('T')[0]
            };
            this.applyFilters();
        }
        this.showDatePicker[columnKey] = false;
    }

    closeDatePicker(columnKey: string): void {
        this.showDatePicker[columnKey] = false;
    }

    getDateRangeLabel(columnKey: string): string {
        const range = this.dateRangeFilters[columnKey];
        if (!range || (!range.from && !range.to)) {
            return 'Select date range';
        }

        if (range.from && range.to) {
            const fromDate = new Date(range.from);
            const toDate = new Date(range.to);
            return `${this.formatDateShort(fromDate)} - ${this.formatDateShort(toDate)}`;
        } else if (range.from) {
            return `From ${this.formatDateShort(new Date(range.from))}`;
        } else {
            return `Until ${this.formatDateShort(new Date(range.to))}`;
        }
    }

    formatDateShort(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }

    clearDateFilter(columnKey: string): void {
        this.dateRangeFilters[columnKey] = { from: '', to: '' };
        this.applyFilters();
    }

    getSafeHtml(html: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
