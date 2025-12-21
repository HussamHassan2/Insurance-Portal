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
        { title: 'Incident Details', component: null },
        { title: 'Vehicle Details', component: null },
        { title: 'Driver & Workshop', component: null }
    ];

    formData: any = {
        loss_date: '',
        intimation_date: new Date().toISOString().split('T')[0],
        chassis_number: '',
        police_report_number: '',
        severity: 'low',
        initial_damage_description: '',
        acc_desc: '',
        accident_address: '',
        requested_survey_date: '',

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

        // Driver & Workshop
        is_driver: true,
        driver_name: '',
        driver_birth_date: null,
        driver_gender: '',
        driver_licence_start_date: null,
        driver_licence_expiration_date: null,
        workshop_type: 'internal',
        internal_workshop_code: '',
        workshop_address: '',
        workshop_number: ''
    };

    // Options for selection modals
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

    loading = false;
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
        this.route.queryParams.subscribe(params => {
            if (params['chassis']) {
                this.formData.chassis_number = params['chassis'];
            }
            if (params['loss_date']) {
                this.formData.loss_date = params['loss_date'];
            }
        });
    }

    onWizardComplete(event: { data: any; isLastStep: boolean }): void {
        // Merge data
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
            is_insured: true,
            claim_source: user?.role === 'broker' ? 'broker' : 'customer',
            user_id: user?.id,
            claim_documents: []
        };

        this.claimService.createClaimIntimation(claimData).subscribe({
            next: (response: any) => {
                console.log('Claim created successfully:', response);
                this.claimId = response.result?.id || response.data?.id || response.id || 'N/A';
                this.isComplete = true;
                this.loading = false;
            },
            error: (error: any) => {
                console.error('Failed to create claim:', error);
                this.notificationService.error('Failed to submit claim. Please try again.');
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
