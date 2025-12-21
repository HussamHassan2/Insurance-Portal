import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableConfig } from '../../../shared/components/data-table/data-table.component';
import { SharedModule } from '../../../shared/shared.module';
import { SurveyorService } from '../../../core/services/surveyor.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-issuance-survey',
    standalone: true,
    imports: [CommonModule, SharedModule],
    templateUrl: './issuance-survey.component.html',
    styleUrls: ['./issuance-survey.component.css']
})
export class IssuanceSurveyComponent implements OnInit {
    tableConfig: TableConfig = {
        columns: [],
        data: [],
        loading: true,
        pageSize: 50,
        showSearch: true,
        showExport: true,
        searchPlaceholder: 'Search issuance surveys...'
    };

    allSurveys: any[] = [];
    filterStage: string | null = null;
    user: any = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private surveyorService: SurveyorService,
        private authService: AuthService
    ) {
        this.setupColumns();
    }

    ngOnInit(): void {
        // Subscribe to query params for filterStage
        this.route.queryParams.subscribe(params => {
            if (params['filterStage']) {
                this.filterStage = params['filterStage'];
                // Re-apply filter if data is already loaded
                if (this.allSurveys.length > 0) {
                    this.applyFilter();
                }
            }
        });

        this.authService.currentUser.subscribe(user => {
            this.user = user;
            if (user) {
                this.loadSurveys();
            }
        });
    }

    setupColumns(): void {
        this.tableConfig.columns = [
            { key: 'survey_number', label: 'Survey #', sortable: true },
            { key: 'customer_name', label: 'Customer', sortable: true },
            { key: 'vehicle_info', label: 'Vehicle', sortable: true }, // Mapped from risk_info
            { key: 'assigned_date', label: 'Assign Date', sortable: true },
            {
                key: 'state',
                label: 'Status',
                sortable: true,
                render: (row) => this.getStatusBadge(row.state || row.status)
            },
            // Actions handled via row click
        ];
    }

    loadSurveys(): void {
        this.tableConfig.loading = true;
        const identificationCodes = this.user?.identification_code ?
            JSON.stringify([this.user.identification_code]) : '[]';

        this.surveyorService.listSurveys({
            limit: 100, // React app requests 50 or 100
            identification_codes: identificationCodes
        }).subscribe({
            next: (response) => {
                let surveys: any[] = [];
                if (response.data?.surveys) {
                    surveys = response.data.surveys;
                } else if (response.data?.result?.data) {
                    surveys = response.data.result.data;
                } else if (response.data?.data) {
                    surveys = response.data.data;
                } else if (Array.isArray(response.data)) {
                    surveys = response.data;
                }

                // Map data to match table expected format
                this.allSurveys = surveys.map(s => ({
                    ...s,
                    vehicle_info: s.risk_info ? `${s.risk_info.vehicle_make || ''} ${s.risk_info.vehicle_model || ''}`.trim() : 'N/A',
                    assigned_date: s.assign_date || s.create_date || 'N/A'
                }));

                this.applyFilter();
                this.tableConfig.loading = false;
            },
            error: (err) => {
                console.error('Error loading surveys:', err);
                this.tableConfig.loading = false;
            }
        });
    }

    applyFilter(): void {
        if (!this.filterStage) {
            this.tableConfig.data = this.allSurveys;
            return;
        }

        this.tableConfig.data = this.allSurveys.filter(survey => {
            const status = (survey.state || survey.status || '').toLowerCase();
            if (this.filterStage === 'pending') {
                return status === 'pending' || status === 'surveyor';
            } else if (this.filterStage === 'in_progress') {
                return status.includes('progress');
            } else if (this.filterStage === 'completed') {
                return status === 'completed' || status === 'approved' || status === 'done';
            } else if (this.filterStage === 'rejected') {
                return status === 'rejected' || status === 'cancelled';
            }
            return true;
        });
    }

    getStatusBadge(status: string): string {
        const s = (status || '').toLowerCase();
        let color = 'gray';
        let icon = '';

        if (s === 'completed' || s === 'approved') {
            color = 'green';
            icon = '✅';
        } else if (s === 'pending' || s === 'surveyor') {
            color = 'yellow';
            icon = '⏳';
        } else if (s.includes('progress')) {
            color = 'blue';
            icon = '🔄';
        } else if (s === 'rejected') {
            color = 'red';
            icon = '❌';
        }

        return `${icon} ${status}`;
    }

    onRowClick(row: any): void {
        this.router.navigate(['/dashboard/surveyor/surveys', row.id]);
    }

    onExport(): void {
        console.log('Exporting data...');
    }
}
