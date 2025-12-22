import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { WizardStep } from '../../components/wizard/wizard.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-file-claim',
    templateUrl: './file-claim.component.html'
})
export class FileClaimComponent implements OnInit {
    steps: WizardStep[] = [
        { title: 'Intimation Details', component: null },
        { title: 'Loss & Accident Details', component: null },
        { title: 'Claim Documents', component: null },
        { title: 'Review & Submit', component: null }
    ];

    formData: any = {
        // Availability Check Data (Still needed as inputs in Step 1 or similar)
        loss_date: '',
        chassis_number: '',

        // Intimation
        intimation_date: new Date().toISOString().split('T')[0],

        // Vehicle
        vehicle_maker: '',
        vehcile_model: '',
        vechicle_category: '',
        vechicle_engine_capacity: '',
        vehicle_manufacturing_year: '',
        vehicle_motor_number: '',
        vehicle_plate_number: '',
        vehicle_licence_start_date: null,
        vehicle_licence_expiration_date: null,

        // Incident
        police_report_number: '',
        severity: 'low',
        initial_damage_description: '',
        acc_desc: '',
        accident_address: '',
        requested_survey_date: '',

        // Driver & Workshop & Intimator
        is_driver: true,
        driver_name: '',
        driver_birth_date: null,
        driver_gender: '',
        driver_licence_start_date: null,
        driver_licence_expiration_date: null,

        workshop_type: 'internal',
        internal_workshop_code: '',
        workshop_address: '',
        workshop_number: '',

        intimator_name: '',
        intimator_phone: '',
        intimator_address: '',
        relative: '',

        // Documents
        claim_documents: [],

        // System
        is_insured: true,
        user_id: null,
        claim_source: 'customer'
    };

    severityOptions = [
        { code: 'low', name: 'Low', icon: '🟢', description: 'Minor damage' },
        { code: 'medium', name: 'Medium', icon: '🟡', description: 'Moderate damage' },
        { code: 'high', name: 'High', icon: '🔴', description: 'Severe damage' }
    ];

    genderOptions = [
        { code: 'male', name: 'Male', icon: '👨' },
        { code: 'female', name: 'Female', icon: '👩' }
    ];

    workshopTypeOptions = [
        { code: 'internal', name: 'Internal Workshop', icon: '🏢', description: 'Company-approved workshop' },
        { code: 'external', name: 'External Workshop', icon: '🔧', description: 'Third-party workshop' }
    ];

    internalWorkshopOptions: any[] = [];
    requiredDocuments: any[] = [];

    loading = false;

    // Removed availability check state variables

    claimId: string | null = null;
    isComplete = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private claimService: ClaimService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadWorkshops();
        this.loadClaimDocuments();

        this.route.queryParams.subscribe(params => {
            const user = this.authService.currentUserValue;
            if (user) {
                this.formData.user_id = user.id;
            }

            // Map params
            const fieldsToMap = [
                'loss_date', 'chassis_number', 'intimation_date', 'police_report_number',
                'severity', 'initial_damage_description', 'acc_desc', 'requested_survey_date',
                'workshop_address', 'workshop_number', 'internal_workshop_code',
                'vehicle_maker', 'vehcile_model', 'vechicle_category', 'vechicle_engine_capacity',
                'vehicle_manufacturing_year', 'vehicle_motor_number', 'vehicle_plate_number',
                'workshop_type', 'driver_name', 'driver_birth_date', 'driver_gender',
                'accident_address', 'claim_source', 'relative'
            ];

            fieldsToMap.forEach(key => {
                if (params[key] !== undefined) this.formData[key] = params[key];
            });

            if (params['chassis'] && !this.formData.chassis_number) this.formData.chassis_number = params['chassis'];

            if (params['is_insured'] !== undefined) this.formData.is_insured = String(params['is_insured']) === 'true';
            if (params['is_driver'] !== undefined) this.formData.is_driver = String(params['is_driver']) === 'true';
            if (params['user_id'] !== undefined) this.formData.user_id = Number(params['user_id']);

            if (params['claim_documents']) {
                try {
                    const docs = typeof params['claim_documents'] === 'string'
                        ? JSON.parse(params['claim_documents'])
                        : params['claim_documents'];
                    if (Array.isArray(docs)) this.formData.claim_documents = docs;
                } catch (e) {
                    console.error('Error parsing claim_documents', e);
                }
            }

            // Pre-fill user details if available
            if (this.formData.is_insured && user) {
                if (!this.formData.intimator_name) this.formData.intimator_name = user.name;
                if (!this.formData.intimator_phone) this.formData.intimator_phone = user.mobile || user.phone;
                if (!this.formData.intimator_address) this.formData.intimator_address = user.address;
            }

            if (this.formData.is_driver && user) {
                if (!this.formData.driver_name) this.formData.driver_name = user.name;
            }
        });
    }

    loadWorkshops(query: string = ''): void {
        const domain = query ? [['name', 'ilike', query]] : [];

        this.claimService.getWorkshops(10, 0, domain).subscribe({
            next: (response: any) => {
                // Adjust based on actual API result structure
                // Response has { workshops: [...] }
                const workshops = response.workshops || response.result || response.data || [];
                // Map to modal options
                this.internalWorkshopOptions = workshops.map((w: any) => ({
                    code: w.id || w.code,
                    name: w.name,
                    description: w.address
                }));
            },
            error: (err: any) => {
                console.error('Failed to load workshops', err);
            }
        });
    }

    onWorkshopSearch(query: string): void {
        this.loadWorkshops(query);
    }


    loadClaimDocuments(): void {
        this.claimService.getClaimDocuments().subscribe({
            next: (response: any) => {
                this.requiredDocuments = response.result || response.data || [];
            },
            error: (err: any) => {
                console.error('Failed to load claim documents', err);
            }
        });
    }

    onFilesSelected(files: File[]): void {
        this.formData.claim_documents = files;
    }

    onWizardComplete(event: { data: any; isLastStep: boolean }): void {
        this.formData = { ...this.formData, ...event.data };
        if (event.isLastStep) {
            this.submitClaim();
        }
    }

    submitClaim(): void {
        this.loading = true;
        const user = this.authService.currentUserValue;

        const claimData = {
            ...this.formData,
            is_insured: this.formData.is_insured,
            claim_source: user?.role === 'broker' ? 'broker' : 'customer',
            user_id: this.formData.user_id || user?.id
        };

        this.claimService.createClaimIntimation(claimData).subscribe({
            next: (response: any) => {
                this.claimId = response.result?.claim_id || response.result?.id || 'N/A';
                this.isComplete = true;
                this.loading = false;
            },
            error: (error: any) => {
                console.error('Failed to create claim:', error);
                this.notificationService.error('Failed to submit claim. ' + (error.message || ''));
                this.loading = false;
            }
        });
    }

    viewClaims(): void {
        const user = this.authService.currentUserValue;
        if (user?.role === 'broker') {
            this.router.navigate(['/dashboard/broker/claims']);
        } else {
            this.router.navigate(['/dashboard/customer/claims']);
        }
    }

    goToDashboard(): void {
        const user = this.authService.currentUserValue;
        if (user?.role === 'broker') {
            this.router.navigate(['/dashboard/broker']);
        } else {
            this.router.navigate(['/dashboard/customer']);
        }
    }
}
