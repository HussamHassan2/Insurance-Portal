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
    viewMode: 'table' | 'board' = 'board';
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
    readonly ALL_BOARD_COLUMNS = [
        {
            id: 'pending',
            title: 'Pending',
            color: 'yellow',
            items: [] as any[],
            states: ['pending', 'surveyor', 'reassign', 'new', 'surveyor assigned']
        },
        {
            id: 'in_progress',
            title: 'In Progress',
            color: 'blue',
            items: [] as any[],
            states: ['in_progress', 'surveying']
        },
        {
            id: 'suspended',
            title: 'Suspended',
            color: 'red',
            items: [] as any[],
            states: ['suspended']
        },
        {
            id: 'completed',
            title: 'Completed',
            color: 'green',
            items: [] as any[],
            states: ['completed', 'submitted', 'accepted', 'rejected', 'report_rejected']
        }
    ];

    boardColumns = [...this.ALL_BOARD_COLUMNS];

    constructor(
        private surveyorService: SurveyorService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        const path = this.route.snapshot.url[0]?.path;
        const subPath = this.route.snapshot.url[1]?.path;


        this.route.queryParams.pipe(debounceTime(50)).subscribe(params => {

            if (params['view']) {
                this.viewMode = params['view'];
            }
            if (params['type']) {
                this.currentType = params['type'];
            }

            // Reset filter first
            this.statusFilter = null;

            // Route path overrides query params for status
            if (path === 'suspended') {
                this.statusFilter = 'suspended';
                this.boardColumns = [this.ALL_BOARD_COLUMNS.find(c => c.id === 'suspended')!];
            } else if (path === 'pending') {
                this.statusFilter = 'pending';
                this.boardColumns = [this.ALL_BOARD_COLUMNS.find(c => c.id === 'pending')!];
            } else if (path === 'in-progress') {
                this.statusFilter = 'in_progress';
                this.boardColumns = [this.ALL_BOARD_COLUMNS.find(c => c.id === 'in_progress')!];

                // Check for submenu paths
                if (subPath === 'issuance') {
                    this.currentType = 'issuance';
                } else if (subPath === 'claims') {
                    this.currentType = 'claim';
                }
            } else if (params['status']) {
                this.statusFilter = params['status'];
                // Try to find matching column for status, otherwise show all or default
                // This handles complex cases if needed later
            } else {
                // Default to Pending column if no specific route
                this.boardColumns = [this.ALL_BOARD_COLUMNS.find(c => c.id === 'pending')!];
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
                params.domain = JSON.stringify([['state', '=', 'suspended']]);
            } else if (this.statusFilter === 'pending') {
                // Map 'pending' filter to 'surveyor' state in domain
                params.domain = JSON.stringify([['state', '=', 'surveyor']]);
            } else if (this.statusFilter === 'in_progress') {
                // Map 'in_progress' filter to 'surveying' or 'in_progress' states
                params.domain = JSON.stringify([['state', 'in', ['surveying', 'in_progress']]]);
            }
        } else if (this.viewMode !== 'board') {
            // Default to 'surveyor' (pending) state for table view if no filter
            params.domain = JSON.stringify([['state', '=', 'surveyor']]);
        }

        this.surveyorService.listSurveys(params).subscribe({
            next: (response) => {

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



                // Map API fields to Table columns
                const mappedData = rawData.map(item => ({
                    ...item,
                    assigned_date: item.assign_date, // Map assign_date to assigned_date
                    status: item.state || item.status, // Map state to status
                    priority: item.priority || 'Medium', // Default priority if missing
                    claim_number: item.claim_number || (item.claim_id ? item.claim_id : 'N/A')
                }));



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

            // Check if status belongs to current visible columns
            const column = this.boardColumns.find(c => c.states && c.states.includes(status));

            if (column) {
                column.items.push(item);
            } else {
                // If status doesn't match visible columns, check ALL columns to be safe or ignore
                // In single column view, we only show items for that column.
                // However, we might have mixed data if API filter isn't perfect. 
                // We will just ignore items that don't fit the visible column.
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

    onAccept(event: Event, survey: any): void {
        event.stopPropagation();
        this.surveyorService.acceptSurvey(survey.id).subscribe({
            next: () => {
                this.loadPendingSurveys();
            },
            error: (err: any) => console.error('Error accepting survey:', err)
        });
    }

    onSuspend(event: Event, survey: any): void {
        event.stopPropagation();
        this.surveyorService.suspendSurvey(survey.id).subscribe({
            next: () => {
                this.loadPendingSurveys();
            },
            error: (err: any) => console.error('Error suspending survey:', err)
        });
    }

    onReject(event: Event, survey: any): void {
        event.stopPropagation();
        this.surveyorService.rejectSurvey(survey.id).subscribe({
            next: () => {
                this.loadPendingSurveys();
            },
            error: (err: any) => console.error('Error rejecting survey:', err)
        });
    }

    get title(): string {
        let statusText = '';

        if (this.statusFilter === 'pending') {
            statusText = 'Pending';
        } else if (this.statusFilter === 'suspended') {
            statusText = 'Suspended';
        } else if (this.statusFilter === 'in_progress') {
            statusText = 'In Progress';
        } else {
            statusText = 'Pending'; // Default
        }

        // Add survey type to title if filtered
        let typeText = '';
        if (this.currentType === 'issuance') {
            typeText = ' Issuance';
        } else if (this.currentType === 'claim') {
            typeText = ' Claim';
        }

        return `${statusText}${typeText} Surveys`;
    }

    get description(): string {
        if (this.statusFilter === 'pending') {
            return 'Review and complete assigned surveys';
        } else if (this.statusFilter === 'suspended') {
            return 'Surveys suspended for another time';
        } else if (this.statusFilter === 'in_progress') {
            return 'Surveys currently being processed';
        }
        return 'Review and complete assigned surveys'; // Default
    }
}
