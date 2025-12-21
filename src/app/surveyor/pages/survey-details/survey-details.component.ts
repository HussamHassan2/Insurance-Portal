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

    submitAssessment(): void {
        console.log('Submitting assessment:', this.assessmentForm);
        this.notificationService.success('Assessment submitted successfully!');
        this.goBack();
    }
}
