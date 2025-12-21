import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'select' | 'date';
    render?: (row: any) => string;
}

export interface TableConfig {
    columns: TableColumn[];
    data: any[];
    loading?: boolean;
    pageSize?: number;
    showSearch?: boolean;
    showExport?: boolean;
    searchPlaceholder?: string;
}

@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
    @Input() config: TableConfig = { columns: [], data: [] };
    @Output() rowClick = new EventEmitter<any>();
    @Output() exportData = new EventEmitter<void>();

    filteredData: any[] = [];
    paginatedData: any[] = [];
    currentPage = 1;
    totalPages = 1;
    searchTerm = '';
    activeFilters: { [key: string]: any } = {};
    filterOptions: { [key: string]: any[] } = {};
    showFilters = false;
    sortColumn = '';
    sortDirection: 'asc' | 'desc' = 'asc';
    pageSize = 10;

    ngOnInit(): void {
        this.pageSize = this.config.pageSize || 10;
        this.updateTable();
    }

    ngOnChanges(): void {
        this.updateTable();
    }

    updateTable(): void {
        // 1. Filter
        this.filteredData = this.config.data.filter(row => {
            // Global search
            const matchesGlobal = Object.values(row).some(val =>
                String(val).toLowerCase().includes(this.searchTerm.toLowerCase())
            );

            if (!matchesGlobal) return false;

            // Column filters
            return Object.keys(this.activeFilters).every(key => {
                const filterValue = this.activeFilters[key];
                if (!filterValue || filterValue === 'all') return true;

                const itemValue = String(row[key]).toLowerCase();
                const filterVal = String(filterValue).toLowerCase();
                return itemValue.includes(filterVal);
            });
        });

        // Generate filter options for select filters
        this.generateFilterOptions();

        // Sort
        if (this.sortColumn) {
            this.filteredData.sort((a, b) => {
                const aVal = a[this.sortColumn];
                const bVal = b[this.sortColumn];
                const comparison = aVal > bVal ? 1 : -1;
                return this.sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        // Paginate
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        const start = (this.currentPage - 1) * this.pageSize;
        this.paginatedData = this.filteredData.slice(start, start + this.pageSize);
    }

    onSearch(term: string): void {
        this.searchTerm = term;
        this.currentPage = 1;
        this.updateTable();
    }

    onFilterChange(key: string, value: any): void {
        if (value === '' || value === 'all') {
            delete this.activeFilters[key];
        } else {
            this.activeFilters[key] = value;
        }
        this.currentPage = 1;
        this.updateTable();
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.activeFilters = {};
        this.currentPage = 1;
        this.updateTable();
    }

    private generateFilterOptions(): void {
        this.config.columns.forEach(col => {
            if (col.filterable && col.filterType === 'select') {
                const uniqueValues = [...new Set(this.config.data.map(item => item[col.key]))].filter(Boolean);
                this.filterOptions[col.key] = uniqueValues.sort();
            }
        });
    }

    hasActiveFilters(): boolean {
        return !!this.searchTerm || Object.keys(this.activeFilters).length > 0;
    }

    onSort(column: TableColumn): void {
        if (!column.sortable) return;

        if (this.sortColumn === column.key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column.key;
            this.sortDirection = 'asc';
        }
        this.updateTable();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.updateTable();
    }

    onRowClick(row: any): void {
        this.rowClick.emit(row);
    }

    onExport(): void {
        this.exportData.emit();
    }

    getCellValue(row: any, column: TableColumn): string {
        if (column.render) {
            return column.render(row);
        }
        return row[column.key];
    }

    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    get showingFrom(): number {
        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get showingTo(): number {
        return Math.min(this.currentPage * this.pageSize, this.filteredData.length);
    }

    get totalRecords(): number {
        return this.filteredData.length;
    }
}
