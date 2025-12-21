import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TableConfig } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-surveyor-claims',
    templateUrl: './surveyor-claims.component.html',
    styleUrls: ['./surveyor-claims.component.css']
})
export class SurveyorClaimsComponent implements OnInit {
    tableConfig: TableConfig = {
        columns: [],
        data: [],
        loading: true,
        pageSize: 10,
        showSearch: true,
        showExport: true,
        searchPlaceholder: 'Search claims...'
    };

    constructor(private router: Router) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadClaims();
    }

    setupColumns(): void {
        this.tableConfig.columns = [
            { key: 'claim_number', label: 'Claim #', sortable: true },
            { key: 'customer_name', label: 'Customer', sortable: true },
            { key: 'policy_number', label: 'Policy', sortable: true },
            { key: 'claim_type', label: 'Type', sortable: true },
            { key: 'assigned_date', label: 'Assigned', sortable: true },
            { key: 'priority', label: 'Priority', sortable: true },
            { key: 'status', label: 'Status', sortable: true }
        ];
    }

    loadClaims(): void {
        // Mock data
        this.tableConfig.data = [
            { id: 1, claim_number: 'CLM-2024-001', customer_name: 'John Doe', policy_number: 'POL-2024-001', claim_type: 'Accident', assigned_date: '2024-01-15', priority: 'High', status: 'Pending' },
            { id: 2, claim_number: 'CLM-2024-002', customer_name: 'Jane Smith', policy_number: 'POL-2024-002', claim_type: 'Theft', assigned_date: '2024-01-16', priority: 'Medium', status: 'In Progress' }
        ];
        this.tableConfig.loading = false;
    }

    onRowClick(claim: any): void {
        this.router.navigate(['/dashboard/surveyor/surveys', claim.id]);
    }

    onExport(): void {
        console.log('Exporting claims...');
    }
}
