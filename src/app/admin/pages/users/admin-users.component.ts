import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TableConfig } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-admin-users',
    templateUrl: './admin-users.component.html',
    styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
    tableConfig: TableConfig = {
        columns: [],
        data: [],
        loading: true,
        pageSize: 10,
        showSearch: true,
        showExport: true,
        searchPlaceholder: 'Search users...'
    };

    constructor(private router: Router) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    setupColumns(): void {
        this.tableConfig.columns = [
            { key: 'name', label: 'Name', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
            { key: 'role', label: 'Role', sortable: true },
            { key: 'created_date', label: 'Created', sortable: true },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (row) => row.status === 'active' ? '🟢 Active' : '⚫ Inactive'
            }
        ];
    }

    loadUsers(): void {
        // Mock data for now
        this.tableConfig.data = [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Customer', created_date: '2024-01-15', status: 'active' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Broker', created_date: '2024-02-20', status: 'active' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Surveyor', created_date: '2024-03-10', status: 'inactive' }
        ];
        this.tableConfig.loading = false;
    }

    onRowClick(user: any): void {
        this.router.navigate(['/dashboard/admin/users', user.id]);
    }

    onExport(): void {
        console.log('Exporting users...');
    }
}
