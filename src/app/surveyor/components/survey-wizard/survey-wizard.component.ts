import { Component, Input, OnInit } from '@angular/core';
import { SurveyorService } from '../../../core/services/surveyor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-survey-wizard',
    templateUrl: './survey-wizard.component.html',
    styleUrls: ['./survey-wizard.component.css']
})
export class SurveyWizardComponent implements OnInit {
    @Input() surveyId!: string | number;

    currentStep: number = 1;
    totalSteps: number = 3;
    stepTitles: string[] = ['Review', 'Input Data', 'Submit'];
    stepSubtitles: string[] = ['Survey Details', 'Confirmation', 'Confirmation'];
    loading: boolean = false;
    survey: any = null;

    // Form data for step 2
    formData: any = {
        // Common fields
        conclusion: '',
        recommendation: '',
        photos: [] as File[],

        // Issuance-specific fields
        vehicle_condition: '',
        odometer_reading: '',
        exterior_condition: '',
        interior_condition: '',
        has_spare_tire: false,
        has_tools: false,
        has_fire_extinguisher: false,
        market_value: '',

        // Claim-specific fields
        damage_description: '',
        damage_location: '',
        damage_severity: '',
        estimated_repair_cost: '',
        cause_of_damage: '',
        liability_assessment: '',
        salvage_value: '',

        // Exclusions
        survey_exclusions: [] as any[]
    };

    constructor(
        private surveyorService: SurveyorService,
        private notificationService: NotificationService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadSurveyData();
    }

    loadSurveyData(): void {
        this.loading = true;
        this.surveyorService.getSurveyDetails(this.surveyId).subscribe({
            next: (response) => {
                this.survey = response.data || response;

                // Update total steps for issuance (Review, Input, Exclusions, Submit)
                if ((this.survey.survey_type || '').toLowerCase() === 'issuance') {
                    this.totalSteps = 4;
                    this.stepTitles = ['Review', 'Input Data', 'Exclusions', 'Submit'];
                    this.stepSubtitles = ['Survey Details', 'Confirmation', 'Select Exclusions', 'Confirmation'];
                }

                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading survey:', err);
                this.notificationService.error('Failed to load survey details');
                this.loading = false;
            }
        });
    }

    nextStep(): void {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
        }
    }

    previousStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    goToStep(step: number): void {
        if (step >= 1 && step <= this.totalSteps) {
            this.currentStep = step;
        }
    }

    onFilesSelected(files: File[]): void {
        this.formData.photos = files;
    }

    onExclusionsChanged(exclusions: any[]): void {
        this.formData.survey_exclusions = exclusions;
    }

    async submitSurvey(): Promise<void> {
        this.loading = true;

        try {
            // Prepare survey submission data
            const surveyData = {
                survey_id: this.surveyId,
                conclusion: this.formData.conclusion,
                recommendation: this.formData.recommendation,
                ...(this.survey.survey_type === 'issuance' ? {
                    vehicle_condition: this.formData.vehicle_condition,
                    odometer_reading: this.formData.odometer_reading,
                    exterior_condition: this.formData.exterior_condition,
                    interior_condition: this.formData.interior_condition,
                    has_spare_tire: this.formData.has_spare_tire,
                    has_tools: this.formData.has_tools,
                    has_fire_extinguisher: this.formData.has_fire_extinguisher,
                    market_value: this.formData.market_value,
                    survey_exclusions: this.formData.survey_exclusions
                } : {
                    damage_description: this.formData.damage_description,
                    damage_location: this.formData.damage_location,
                    damage_severity: this.formData.damage_severity,
                    estimated_repair_cost: this.formData.estimated_repair_cost,
                    cause_of_damage: this.formData.cause_of_damage,
                    liability_assessment: this.formData.liability_assessment,
                    salvage_value: this.formData.salvage_value
                })
            };

            // Submit survey
            await this.surveyorService.submitSurvey(surveyData).toPromise();

            // Update documents if photos are provided
            if (this.formData.photos.length > 0) {
                const photoPromises = this.formData.photos.map((file: File) => this.convertFileToBase64(file));
                const base64Photos = await Promise.all(photoPromises);

                const docsData = {
                    survey_id: this.surveyId,
                    photos: base64Photos.map((data, index) => ({
                        name: this.formData.photos[index].name,
                        data: data
                    }))
                };

                await this.surveyorService.updateSurveyDocuments(docsData).toPromise();
            }

            this.notificationService.success('Survey submitted successfully!');
            this.loading = false;
            this.router.navigate(['/dashboard/surveyor/pending']);
        } catch (error) {
            console.error('Error submitting survey:', error);
            this.notificationService.error('Failed to submit survey');
            this.loading = false;
        }
    }

    private convertFileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    get isIssuanceSurvey(): boolean {
        return (this.survey?.survey_type || '').toLowerCase() === 'issuance';
    }

    get isClaimSurvey(): boolean {
        return (this.survey?.survey_type || '').toLowerCase() === 'claim';
    }

    get canProceedToNextStep(): boolean {
        if (this.currentStep === 1) {
            return true; // Review step, always can proceed
        } else if (this.currentStep === 2) {
            // Validate required fields based on survey type
            if (this.isIssuanceSurvey) {
                return !!(this.formData.vehicle_condition && this.formData.market_value);
            } else if (this.isClaimSurvey) {
                return !!(this.formData.damage_description && this.formData.estimated_repair_cost);
            }
        } else if (this.currentStep === 3 && this.isIssuanceSurvey) {
            // Step 3 is Exclusions for Issuance, always proceed
            return true;
        }
        return true;
    }
    get stepsArray(): number[] {
        return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
    }
}
