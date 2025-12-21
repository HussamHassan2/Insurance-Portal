import { Component, OnInit } from '@angular/core';
import { SurveyorService } from '../../../core/services/surveyor.service';
import { TableConfig } from '../../../shared/components/data-table/data-table.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-surveyor-pending',
    templateUrl: './surveyor-pending.component.html',
    styleUrls: ['./surveyor-pending.component.css']
})
export class SurveyorPendingComponent implements OnInit {
    viewMode: 'table' | 'board' = 'table';
    currentType: 'issuance' | 'claim' | 'all' = 'all';
    statusFilter: string | null = null;

    tableConfig: TableConfig = {
        columns: [],
        data: [],
        loading: true,
        pageSize: 10,
        showSearch: true,
        showExport: true,
        searchPlaceholder: 'Search surveys...'
    };

    // For Board View
    boardColumns = [
        {
            id: 'pending',
            title: 'Pending',
            color: 'yellow',
            items: [] as any[],
            states: ['pending', 'surveyor', 'reassign', 'new']
        },
        {
            id: 'in_progress',
            title: 'In Progress',
            color: 'blue',
            items: [] as any[],
            states: ['in_progress', 'surveying']
        },
        {
            id: 'completed',
            title: 'Completed',
            color: 'green',
            items: [] as any[],
            states: ['completed', 'submitted', 'accepted', 'rejected', 'report_rejected']
        }
    ];

    constructor(
        private surveyorService: SurveyorService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['view']) {
                this.viewMode = params['view'];
            }
            if (params['type']) {
                this.currentType = params['type'];
            }
            if (params['status']) {
                this.statusFilter = params['status'];
            }
            this.loadPendingSurveys();
        });
    }

    setupColumns(): void {
        this.tableConfig.columns = [
            { key: 'survey_number', label: 'Survey #', sortable: true },
            { key: 'claim_number', label: 'Claim #', sortable: true },
            { key: 'customer_name', label: 'Customer', sortable: true },
            { key: 'survey_type', label: 'Type', sortable: true },
            { key: 'assigned_date', label: 'Assigned', sortable: true },
            {
                key: 'priority',
                label: 'Priority',
                sortable: true,
                render: (row) => this.getPriorityBadge(row.priority)
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (row) => this.getStatusBadge(row.status)
            }
        ];
    }

    loadPendingSurveys(): void {
        this.tableConfig.loading = true;

        const params: any = {
            limit: 100,
            offset: 0
        };

        if (this.currentType !== 'all') {
            params.survey_type = this.currentType;
        }

        // Apply status filter if present
        if (this.statusFilter) {
            if (this.statusFilter === 'suspended') {
                params.status = 'suspended';
            } else if (this.statusFilter === 'pending') {
                // Fetch pending items.
                // IF the API doesn't support multiple statuses via 'status' param automatically,
                // we might need to rely on the backend default or client-side filtering.
                // However, we want 'pending' and 'surveyor' to show up.
                // Let's pass 'pending' as the primary filter as requested, assuming backend handles the rest 
                // OR don't filter strictly if we want to show board movement.
                params.status = 'pending';
            }
        } else if (this.viewMode !== 'board') {
            params.status = 'pending';
        }

        this.surveyorService.listSurveys(params).subscribe({
            next: (response) => {
                let data = response.data || [];
                // Handle different response structures
                if (response.data && response.data.surveys) {
                    data = response.data.surveys;
                } else if (response.data && response.data.result && response.data.result.data) {
                    data = response.data.result.data;
                } else if (response.data && response.data.data) {
                    data = response.data.data;
                } else if (Array.isArray(response.data)) {
                    data = response.data;
                }

                this.tableConfig.data = data;

                if (this.viewMode === 'board') {
                    this.organizeBoardData(data);
                }

                this.tableConfig.loading = false;
            },
            error: (err) => {
                console.error('Error loading surveys:', err);
                this.tableConfig.loading = false;
            }
        });
    }

    organizeBoardData(data: any[]): void {
        // Reset columns
        this.boardColumns.forEach(col => col.items = []);

        data.forEach(item => {
            const status = (item.state || item.status || 'pending').toLowerCase();

            // Find column that includes this state
            const column = this.boardColumns.find(c => c.states && c.states.includes(status));

            if (column) {
                column.items.push(item);
            } else {
                // Determine fallback: probably Pending if it looks like a new state, or just log
                // If it's suspended, we might ignoring it or putting it somewhere?
                // Assuming suspended surveys are filtered out unless filter is 'suspended'.
                if (status === 'suspended') {
                    // Do nothing/Do not add to board unless we have a suspended column (which we don't in this view)
                } else {
                    this.boardColumns[0].items.push(item);
                }
            }
        });
    }

    getPriorityBadge(priority: string): string {
        const badges: any = {
            'high': '🔴 High',
            'medium': '🟡 Medium',
            'low': '🟢 Low'
        };
        return badges[priority?.toLowerCase()] || priority;
    }

    getStatusBadge(status: string): string {
        const badges: any = {
            'pending': '🟡 Pending',
            'in_progress': '🔵 In Progress',
            'completed': '🟢 Completed'
        };
        return badges[status?.toLowerCase()] || status;
    }

    onRowClick(survey: any): void {
        this.router.navigate(['/dashboard/surveyor/surveys', survey.id]);
    }

    onExport(): void {
        console.log('Exporting surveys...');
    }

    toggleView(mode: 'table' | 'board'): void {
        this.viewMode = mode;
        this.loadPendingSurveys();
    }
}
