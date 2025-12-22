import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SurveyorService } from '../../../core/services/surveyor.service';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
    selector: 'app-survey-stages',
    standalone: true,
    imports: [CommonModule, SharedModule],
    templateUrl: './survey-stages.component.html',
    styleUrls: ['./survey-stages.component.css']
})
export class SurveyStagesComponent implements OnInit {
    loading = true;
    surveyType = 'issuance';
    stats: any = {
        issuance: { pending: 0, suspended: 0 },
        claim: { pending: 0, suspended: 0 }
    };
    user: any = null;

    constructor(
        public router: Router,
        private route: ActivatedRoute,
        private surveyorService: SurveyorService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['type']) {
                this.surveyType = params['type'];
                this.fetchStats();
            }
        });

        this.authService.currentUser.subscribe(user => {
            this.user = user;
            if (user && !this.stats[this.surveyType].pending) { // Initial load if not loaded
                // this.fetchStats(); // Removed duplicate call, param subscription handles it or we call it if params exist
            }
            if (user) {
                this.fetchStats();
            }
        });
    }

    fetchStats(): void {
        this.loading = true;
        const isIssuance = this.surveyType === 'issuance';
        const method = isIssuance ?
            this.surveyorService.listSurveys.bind(this.surveyorService) :
            this.surveyorService.listClaims.bind(this.surveyorService);

        const identificationCodes = this.user?.identification_code ?
            JSON.stringify([this.user.identification_code]) : '[]';

        method({
            limit: 100,
            identification_codes: identificationCodes
        }).subscribe({
            next: (response) => {
                let surveys: any[] = [];
                // Handle different response structures
                if (response.surveys) {
                    surveys = response.surveys;
                } else if (response.data && response.data.surveys) {
                    surveys = response.data.surveys;
                } else if (response.data && response.data.result && response.data.result.data) {
                    surveys = response.data.result.data;
                } else if (response.data && response.data.data) {
                    surveys = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    surveys = response.data;
                } else if (Array.isArray(response)) {
                    surveys = response;
                }

                const statusCounts = {
                    pending: 0,
                    suspended: 0
                };

                surveys.forEach(survey => {
                    const status = (survey.state || survey.status || '').toLowerCase();
                    // Map 'Surveyor Assigned' and 'pending' to Pending bucket
                    if (status.includes('pending') || status.includes('surveyor') || status === 'surveyor assigned') {
                        statusCounts.pending++;
                    } else if (status.includes('suspend')) {
                        statusCounts.suspended++;
                    }
                });

                this.stats[this.surveyType] = statusCounts;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching survey stats:', err);
                this.loading = false;
            }
        });
    }

    handleStageClick(stage: string): void {
        let route = '/dashboard/surveyor/pending';
        let queryParams: any = {
            type: this.surveyType
        };

        if (stage === 'suspended') {
            route = '/dashboard/surveyor/suspended';
        } else if (stage === 'pending') {
            route = '/dashboard/surveyor/pending';
        } else {
            // Fallback for other potential stages
            queryParams.status = stage;
        }

        this.router.navigate([route], {
            queryParams: queryParams
        });
    }

    get currentStats() {
        return this.stats[this.surveyType];
    }

    get title() {
        return this.surveyType === 'issuance' ? 'Issuance Survey Stages' : 'Claim Survey Stages';
    }

    get description() {
        return this.surveyType === 'issuance' ?
            'Track pre-risk inspections by stage' :
            'Track claim inspections by stage';
    }
}
