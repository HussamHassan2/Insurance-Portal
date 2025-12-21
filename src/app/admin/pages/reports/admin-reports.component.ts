import { Component, OnInit } from '@angular/core';
import { TableConfig } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-admin-reports',
    templateUrl: './admin-reports.component.html',
    styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent implements OnInit {
    totalPolicies = 1250;
    totalClaims = 340;
    totalRevenue = 2500000;
    activeUsers = 890;

    tableConfig: TableConfig = {
        columns: [],
        data: [],
        loading: true,
        pageSize: 10,
        showSearch: true,
        showExport: true,
        searchPlaceholder: 'Search reports...'
    };

    constructor() {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadReports();
    }

    setupColumns(): void {
        this.tableConfig.columns = [
            { key: 'report_name', label: 'Report', sortable: true },
            { key: 'generated_date', label: 'Generated', sortable: true },
            { key: 'type', label: 'Type', sortable: true },
            { key: 'records', label: 'Records', sortable: true },
            { key: 'status', label: 'Status', sortable: true }
        ];
    }

    loadReports(): void {
        // Mock data
        this.tableConfig.data = [
            { id: 1, report_name: 'Monthly Policies Report', generated_date: '2024-01-31', type: 'Policies', records: 125, status: 'Completed' },
            { id: 2, report_name: 'Claims Analysis', generated_date: '2024-01-31', type: 'Claims', records: 45, status: 'Completed' },
            { id: 3, report_name: 'Revenue Summary', generated_date: '2024-01-31', type: 'Financial', records: 1, status: 'Completed' }
        ];
        this.tableConfig.loading = false;
    }

    onRowClick(report: any): void {
        console.log('Report clicked:', report);
    }

    onExport(): void {
        console.log('Exporting reports...');
    }
}
