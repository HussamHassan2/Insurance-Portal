import { Component, Input, OnInit } from '@angular/core';
import { SurveyorService } from '../../../core/services/surveyor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CrmService } from '../../../core/services/crm.service';
import { ClaimService } from '../../../core/services/claim.service';

@Component({
    selector: 'app-survey-wizard',
    templateUrl: './survey-wizard.component.html',
    styleUrls: ['./survey-wizard.component.css']
})
export class SurveyWizardComponent implements OnInit {
    @Input() surveyId!: string | number;
    @Input() surveyData?: any; // Optional: for passing survey data directly

    currentStep: number = 1;
    totalSteps: number = 3;
    stepTitles: string[] = ['Review', 'Input Data', 'Submit'];
    stepSubtitles: string[] = ['Survey Details', 'Confirmation', 'Confirmation'];
    loading: boolean = false;
    survey: any = null;

    // Additional Details for Step 1
    additionalDetails: any = null;
    loadingDetails: boolean = false;
    detailsExpanded: { [key: string]: boolean } = {
        'survey': true,
        'additional': false,
        'conditions': false,
        'deductibles': false,
        'documents': false,
        'estimation': true
    };

    // Estimation Data
    estimationDetails: any = null;
    estimationItems: any[] = [];
    estimationItemTypes: any[] = []; // Added
    loadingEstimation: boolean = false;

    // Collapsible Sections for Estimation Header
    estimationSections: { [key: string]: boolean } = { // Added
        'general': true,
        'financials': false,
        'adjustments': false
    };

    // Keys to exclude from the Additional Details view
    private excludedKeys = [
        'id', 'image', 'write_date', 'create_date', 'write_uid', 'create_uid', '__last_update', 'display_name',
        'partner_id', 'contact_name', 'email_from', 'phone', 'mobile', 'street', 'street2', 'city', 'state_id', 'country_id', 'zip', 'website', 'function', 'title',
        'type', 'active', 'probability', 'team_id', 'user_id', 'company_id', 'lead_id', 'claim_id',
        'opportunity_risks', 'risk_ids', 'risks',
        'opportunity_exclusions', 'exclusion_ids', 'exclusions',
        'opportunity_benefits', 'benefit_ids', 'benefits',
        'opportunity_share_commission', 'share_commission',
        'opportunity_application_form', 'application_form',
        'opportunity_proposal', 'proposal_ids', 'proposals', 'proposal',
        'opportunity_surveys', 'survey_ids', 'surveys',
        'opportunity_conditions', 'opportunity_deductibles', 'opportunity_documents',
        // Additional user-requested exclusions
        'opportunity_number', 'name', 'email_from', 'team_id', 'product_name', 'product_id',
        'issuing_type_sequence_number', 'broker_branches', 'customer_branches', 'lead_source_name',
        'activity_sequence_number'
    ];

    get formattedDetails(): { key: string, value: string }[] {
        if (!this.additionalDetails) return [];

        return Object.keys(this.additionalDetails)
            .filter(key => !this.excludedKeys.includes(key))
            .map(key => ({
                key: key.replace(/_/g, ' '),
                value: this.formatValue(this.additionalDetails[key])
            }))
            .filter(item => item.value && item.value !== 'N/A' && item.value !== '[]' && item.value !== '{}');
    }

    private formatValue(value: any): string {
        if (value === null || value === undefined || value === '') return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    if (parsed.length === 0) return 'N/A';
                    return parsed.map(item => {
                        if (typeof item === 'object') {
                            return item.condition_name || item.name || item.display_name || JSON.stringify(item);
                        }
                        return item;
                    }).join(', ');
                }
                if (typeof parsed === 'object') {
                    return JSON.stringify(parsed);
                }
            } catch (e) {
                return value;
            }
            return value;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return 'N/A';
            return value.map(item => {
                if (typeof item === 'object') {
                    return item.condition_name || item.name || item.display_name || JSON.stringify(item);
                }
                return item;
            }).join(', ');
        }
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return 'N/A';
            return JSON.stringify(value);
        }
        return String(value);
    }

    private parseListField(key: string): any[] {
        const value = this.additionalDetails?.[key];
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    get conditionsList(): any[] {
        return this.parseListField('opportunity_conditions');
    }

    get deductiblesList(): any[] {
        return this.parseListField('opportunity_deductibles');
    }

    get documentsList(): any[] {
        return this.parseListField('opportunity_documents');
    }

    get isIssuanceSurvey(): boolean {
        return this.survey && (this.survey.survey_type === 'issuance' || this.survey.survey_type === 'Underwriting');
    }

    get isClaimSurvey(): boolean {
        // Include 'Before Repair' as a claim survey type
        return this.survey && (
            this.survey.survey_type === 'claim' ||
            this.survey.survey_type === 'Before Repair' ||
            this.survey.survey_type === 'after_repair'
        );
    }

    // Form data for step 2
    formData: any = {
        // Common fields
        conclusion: '',
        recommendation: '',
        photos: [] as File[],
        survey_documents: [] as any[],

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
        private router: Router,
        private route: ActivatedRoute,
        private crmService: CrmService,
        private claimService: ClaimService
    ) { }

    // Modal State
    showAddItemModal: boolean = false;

    ngOnInit(): void {
        this.fetchEstimationItemTypes();

        if (!this.surveyId) {
            this.route.params.subscribe((params: any) => {
                if (params['id']) {
                    this.surveyId = params['id'];
                    this.loadSurveyData();
                }
            });
        } else {
            this.loadSurveyData();
        }
    }

    fetchEstimationItemTypes(): void {
        this.claimService.getEstimationItemTypes().subscribe({
            next: (response) => {
                // Ensure we get an array
                if (Array.isArray(response)) {
                    this.estimationItemTypes = response;
                } else if (response && Array.isArray(response.data)) {
                    this.estimationItemTypes = response.data;
                } else {
                    console.warn('Unexpected estimation item types format:', response);
                    this.estimationItemTypes = [];
                }
            },
            error: (err) => console.error('Error fetching estimation item types:', err)
        });
    }

    toggleEstimationSection(section: string): void {
        this.estimationSections[section] = !this.estimationSections[section];
    }

    // Modal Handlers
    openAddItemModal(): void {
        console.log('openAddItemModal called. Current showAddItemModal:', this.showAddItemModal);
        this.showAddItemModal = true;
        console.log('New showAddItemModal:', this.showAddItemModal);
    }

    closeAddItemModal(): void {
        this.showAddItemModal = false;
    }

    onItemAdded(event: { item: any, action: 'new' | 'close' }): void {
        // Here we would typically save to API. 
        // Since we are mocking or the user didn't provide a create API (only list),
        // we'll push to the local array for display.
        // In real app, we'd call create API then refresh or push.

        // Mock ID and default fields for display
        const newItem = {
            ...event.item,
            id: Math.floor(Math.random() * 1000), // temp ID
            estimation_amount: (event.item.quantity * event.item.estimation_unit_amount) - (event.item.depreciation || 0),
            estimation_item_type: this.getEstimationTypeName(event.item.estimation_item_type_id),
            isNew: true // Mark as new for API distinction
        };

        if (!this.estimationItems) {
            this.estimationItems = [];
        }
        this.estimationItems.push(newItem);

        // Recalculate total and update formData for validation
        const total = this.estimationItems.reduce((sum, item) => sum + (item.estimation_amount || 0), 0);
        this.formData.estimated_repair_cost = total;

        // Update details for display
        if (this.estimationDetails) {
            this.estimationDetails.total_estimation = total;
            this.estimationDetails.total_amount = total;
        }

        if (event.action === 'close') {
            this.closeAddItemModal();
        }
    }

    getEstimationTypeName(id: any): string {
        if (!id || !this.estimationItemTypes || !Array.isArray(this.estimationItemTypes)) return '';
        const type = this.estimationItemTypes.find(t => t.id == id);
        return type ? type.name : '';
    }

    loadSurveyData(): void {
        this.loading = true;
        this.surveyorService.getSurveyDetails(this.surveyId).subscribe({
            next: (response) => {
                this.survey = response.data || response;

                // Initialize survey_documents if available
                if (this.survey.survey_documents) {
                    this.formData.survey_documents = this.survey.survey_documents.map((doc: any) => ({
                        ...doc,
                        files: []
                    }));
                }

                // Update total steps based on survey type
                if (this.isIssuanceSurvey) {
                    this.totalSteps = 5;
                    this.stepTitles = ['Review', 'Exclusions', 'Documents', 'Technical View', 'Submit'];
                    this.stepSubtitles = ['Survey Details', 'Vehicle Exclusions', 'Upload Documents', 'Technical View', 'Review & Submit'];
                } else if (this.isClaimSurvey) {
                    this.totalSteps = 5;
                    this.stepTitles = ['Review', 'Estimation Details', 'Documents', 'Technical View', 'Submit'];
                    this.stepSubtitles = ['Survey Details', 'Estimation & Items', 'Upload Documents', 'Technical View', 'Review & Submit'];
                }

                // Fetch additional details if opportunity or claim
                if (this.survey.lead_id || this.survey.claim_id) {
                    this.fetchAdditionalDetails();
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

    fetchAdditionalDetails(): void {
        this.loadingDetails = true;

        if (this.survey.lead_id) {
            // Fetch opportunity details
            this.crmService.getOpportunity(this.survey.lead_id).subscribe({
                next: (response) => {
                    this.additionalDetails = response.data || response;
                    this.loadingDetails = false;
                },
                error: (err) => {
                    console.error('Error fetching opportunity details:', err);
                    this.loadingDetails = false;
                }
            });
        } else if (this.survey.claim_id) {
            // Fetch claim details
            this.claimService.getClaim(this.survey.claim_id).subscribe({
                next: (response) => {
                    this.additionalDetails = response.data || response;
                    this.loadingDetails = false;

                    console.log('Claim details loaded:', this.additionalDetails);

                    // Check for estimation in claim_estimations array
                    if (this.additionalDetails?.claim_estimations && Array.isArray(this.additionalDetails.claim_estimations) && this.additionalDetails.claim_estimations.length > 0) {
                        const estimation = this.additionalDetails.claim_estimations[0];
                        console.log('Found estimation in claim_estimations:', estimation);

                        if (estimation.id) {
                            console.log('Fetching estimation data for ID:', estimation.id);
                            this.fetchEstimationData(estimation.id);
                        }
                    } else if (this.additionalDetails?.estimation_id) {
                        // Fallback to estimation_id field if it exists
                        console.log('Fetching estimation data for ID:', this.additionalDetails.estimation_id);
                        this.fetchEstimationData(this.additionalDetails.estimation_id);
                    } else {
                        console.warn('No estimation found in claim details');
                    }
                },
                error: (err) => {
                    console.error('Error fetching claim details:', err);
                    this.loadingDetails = false;
                }
            });
        }
    }

    fetchEstimationData(estimationId: number): void {
        // Prevent duplicate calls if already loading or data exists
        if (this.loadingEstimation || (this.estimationDetails && this.estimationItems.length > 0)) {
            console.log('Skipping duplicate fetch. Loading:', this.loadingEstimation, 'Data exists:', !!this.estimationDetails);
            return;
        }

        this.loadingEstimation = true;
        console.log('Starting fetchEstimationData for ID:', estimationId);

        // Fetch estimation details (auth handled by AuthInterceptor)
        this.claimService.getEstimationDetails(estimationId).subscribe({
            next: (response) => {
                console.log('Raw estimation details response:', response);
                this.estimationDetails = response.data || response;

                // If response is the object itself (not wrapped in data)
                if (!response.data && response.id) {
                    this.estimationDetails = response;
                }

                // Populate estimation items from the details response directly
                if (this.estimationDetails.estimation_lines) {
                    this.estimationItems = this.estimationDetails.estimation_lines;
                    console.log('Set estimationItems from details:', this.estimationItems);
                }

                // Sync estimated_repair_cost with the total
                if (this.estimationDetails.total_estimation || this.estimationDetails.total_amount) {
                    this.formData.estimated_repair_cost = this.estimationDetails.total_estimation || this.estimationDetails.total_amount;
                    console.log('Synced estimated_repair_cost:', this.formData.estimated_repair_cost);
                }

                console.log('Set estimationDetails to:', this.estimationDetails);
                this.loadingEstimation = false; // Set loading to false here to ensure UI updates even if items fail
            },
            error: (err) => {
                console.error('Error fetching estimation details:', err);
                this.loadingEstimation = false;
            }
        });
    }

    toggleSection(section: string): void {
        this.detailsExpanded[section] = !this.detailsExpanded[section];

        // Auto-fetch additional details when expanding
        if (section === 'additional' && this.detailsExpanded[section] && !this.additionalDetails && !this.loadingDetails) {
            this.fetchAdditionalDetails();
        }
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

    onDataChanged(data: any): void {
        this.formData = { ...this.formData, ...data };
    }

    onDocumentFileSelected(event: any, index: number): void {
        const files = Array.from(event.target.files || []) as File[];
        if (this.formData.survey_documents[index]) {
            this.formData.survey_documents[index].files = files;
        }
    }

    async submitSurvey(): Promise<void> {
        this.loading = true;

        try {
            // Prepare survey submission data with correct field names
            const surveyData: any = {
                survey_id: Number(this.surveyId),
                conclusion: this.formData.conclusion,
                recommendation: this.formData.recommendation,
                car_condition: this.formData.vehicle_condition || '',
                market_value: Number(this.formData.market_value) || 0,
                number_of_kilometers: Number(this.formData.odometer_reading) || 0,
                zero_price: 0,
                survey_exclusions: this.formData.survey_exclusions || [],
                survey_documents: this.formData.survey_documents || [],
                estimation_lines: this.estimationItems || []
            };

            // Submit survey
            await this.surveyorService.submitSurvey(surveyData).toPromise();

            // Handle Estimation Lines (Create New vs Update Existing)
            if (this.estimationItems && this.estimationItems.length > 0) {
                const newLines = this.estimationItems.filter((i: any) => i.isNew);
                const existingLines = this.estimationItems.filter((i: any) => !i.isNew);
                const linePromises = [];

                if (newLines.length > 0) {
                    console.log('Creating new estimation lines:', newLines);
                    linePromises.push(this.surveyorService.createSurveyEstimationLines({
                        survey_id: Number(this.surveyId),
                        estimation_lines: newLines
                    }).toPromise());
                }

                if (existingLines.length > 0) {
                    console.log('Updating existing estimation lines:', existingLines);
                    linePromises.push(this.surveyorService.updateSurveyEstimationLines({
                        survey_id: Number(this.surveyId),
                        estimation_lines: existingLines
                    }).toPromise());
                }

                if (linePromises.length > 0) {
                    await Promise.all(linePromises);
                }
            }

            // Update documents if photos are provided
            if (this.formData.photos.length > 0) {
                const photoPromises = this.formData.photos.map((file: File) => this.convertFileToBase64(file));
                const base64Photos = await Promise.all(photoPromises);

                const docsData: any = {
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



    get canProceedToNextStep(): boolean {
        if (this.currentStep === 1) {
            return true; // Review step, always can proceed
        } else if (this.currentStep === 2) {
            // Step 2: Exclusions / Damaged Parts
            if (this.formData.survey_exclusions && this.formData.survey_exclusions.length > 0) {
                // If exclusions are selected, validate that each has at least one type selected
                return this.formData.survey_exclusions.every((exclusion: any) =>
                    exclusion.exclusion_type_codes && exclusion.exclusion_type_codes.length > 0
                );
            }
            // If no exclusions selected, can proceed
            return true;
        } else if (this.currentStep === 3) {
            // Step 3: Documents - optional, always can proceed
            return true;
        } else if (this.currentStep === 4) {
            // Step 4: Technical Assessment
            if (this.isIssuanceSurvey) {
                return !!(this.formData.vehicle_condition && this.formData.market_value);
            } else if (this.isClaimSurvey) {
                return !!(this.formData.damage_description && this.formData.estimated_repair_cost);
            }
        }
        return true;
    }
    get stepsArray(): number[] {
        return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
    }
}
