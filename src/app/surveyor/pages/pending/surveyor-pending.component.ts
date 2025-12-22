import { Component, OnInit } from '@angular/core';
import { SurveyorService } from '../../../core/services/surveyor.service';
import { TableConfig } from '../../../shared/components/data-table/data-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';

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
        this.route.queryParams.pipe(debounceTime(50)).subscribe(params => {
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
                // Map 'pending' filter to 'surveyor' status for API
                params.status = 'surveyor';
            }
        } else if (this.viewMode !== 'board') {
            // Default to 'surveyor' (pending) status for table view if no filter
            params.status = 'surveyor';
        }

        this.surveyorService.listSurveys(params).subscribe({
            next: (response) => {
                console.log('SurveyorPendingComponent listSurveys response:', response);
                let rawData: any[] = [];
                // Handle different response structures
                if (response.surveys) {
                    rawData = response.surveys;
                } else if (response.data && response.data.surveys) {
                    rawData = response.data.surveys;
                } else if (response.data && response.data.result && response.data.result.data) {
                    rawData = response.data.result.data;
                } else if (response.data && response.data.data) {
                    rawData = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    rawData = response.data;
                } else if (Array.isArray(response)) {
                    rawData = response;
                }

                console.log('SurveyorPendingComponent Extracted Data:', rawData);

                // Map API fields to Table columns
                const mappedData = rawData.map(item => ({
                    ...item,
                    assigned_date: item.assign_date, // Map assign_date to assigned_date
                    status: item.state || item.status, // Map state to status
                    priority: item.priority || 'Medium', // Default priority if missing
                    claim_number: item.claim_number || (item.claim_id ? item.claim_id : 'N/A')
                }));

                console.log('SurveyorPendingComponent Mapped Data:', mappedData);

                this.tableConfig.data = mappedData;

                if (this.viewMode === 'board') {
                    this.organizeBoardData(mappedData);
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
            'surveyor': '🟡 Pending',
            'suspended': '🔴 Suspended',
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
