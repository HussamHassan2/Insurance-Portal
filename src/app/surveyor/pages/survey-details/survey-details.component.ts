import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyorService } from '../../../core/services/surveyor.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-survey-details',
    templateUrl: './survey-details.component.html',
    styleUrls: ['./survey-details.component.css']
})
export class SurveyDetailsComponent implements OnInit {
    surveyId: string = '';
    survey: any = null;
    loading = true;

    assessmentForm = {
        condition: '',
        estimatedValue: '',
        recommendations: '',
        photos: [] as File[]
    };

    activeTab: 'overview' | 'risk' | 'documents' | 'actions' = 'overview';
    showWizard: boolean = false;

    setActiveTab(tab: 'overview' | 'risk' | 'documents' | 'actions'): void {
        this.activeTab = tab;
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private surveyorService: SurveyorService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.surveyId = this.route.snapshot.params['id'];
        this.loadSurvey();
    }

    loadSurvey(): void {
        this.loading = true;
        this.surveyorService.getSurveyDetails(this.surveyId).subscribe({
            next: (response) => {
                // Assuming response might be wrapped or direct
                this.survey = response.data || response;

                // Show wizard if survey is in progress or surveying state
                const state = (this.survey.state || '').toLowerCase();
                this.showWizard = state === 'in_progress' || state === 'surveying';

                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading survey details:', err);
                this.notificationService.error('Failed to load survey details');
                this.loading = false;
            }
        });
    }

    onFilesSelected(files: File[]): void {
        this.assessmentForm.photos = files;
    }

    goBack(): void {
        this.router.navigate(['/dashboard/surveyor/pending']);
    }

    onAccept(): void {
        this.loading = true;
        this.surveyorService.acceptSurvey(this.surveyId).subscribe({
            next: () => {
                this.notificationService.success('Survey accepted successfully');
                this.loadSurvey();
            },
            error: (err) => {
                console.error('Error accepting survey:', err);
                this.notificationService.error('Failed to accept survey');
                this.loading = false;
            }
        });
    }

    onSuspend(): void {
        this.loading = true;
        this.surveyorService.suspendSurvey(this.surveyId).subscribe({
            next: () => {
                this.notificationService.success('Survey suspended successfully');
                this.loadSurvey();
            },
            error: (err) => {
                console.error('Error suspending survey:', err);
                this.notificationService.error('Failed to suspend survey');
                this.loading = false;
            }
        });
    }

    onReject(): void {
        if (confirm('Are you sure you want to reject this survey?')) {
            this.loading = true;
            this.surveyorService.rejectSurvey(this.surveyId).subscribe({
                next: () => {
                    this.notificationService.success('Survey rejected successfully');
                    this.router.navigate(['/dashboard/surveyor/pending']);
                },
                error: (err) => {
                    console.error('Error rejecting survey:', err);
                    this.notificationService.error('Failed to reject survey');
                    this.loading = false;
                }
            });
        }
    }

    submitAssessment(): void {
        console.log('Submitting assessment:', this.assessmentForm);
        this.notificationService.success('Assessment submitted successfully!');
        this.goBack();
    }
}
