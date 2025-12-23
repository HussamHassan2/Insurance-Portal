
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { WizardStep, WizardComponent } from '../../components/wizard/wizard.component';
import { NotificationService } from '../../../core/services/notification.service';
import { CAR_PARTS } from '../../../components/car-damage-selector/models/car-parts.model';

@Component({
    selector: 'app-file-claim',
    templateUrl: './file-claim.component.html'
})
export class FileClaimComponent implements OnInit {
    @ViewChild('wizard') wizard!: WizardComponent;

    minSurveyDate: string = new Date().toISOString().split('T')[0];

    steps: WizardStep[] = [
        { title: 'Customer & Policy Info', component: null },
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
        damagedParts: [] as any[], // Store full damage selection objects
        acc_desc: '',
        accident_address: '',
        requested_survey_date: this.minSurveyDate,

        // Driver & Workshop & Intimator
        is_driver: false,
        driver_name: '',
        driver_birth_date: null,
        driver_gender: '',
        driver_license_type: 'private',
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
        is_insured: false,
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

    licenseTypeOptions = [
        { code: 'private', name: 'Private', icon: '🚗' },
        { code: 'professional', name: 'Professional', icon: '🚚' }
    ];

    internalWorkshopOptions: any[] = [];
    requiredDocuments: any[] = [];
    uploadedFiles: { [key: string]: File[] } = {};

    loading = false;

    // Removed availability check state variables
    checkingAvailability = false;
    availabilityError = '';
    riskInfo: any = null;
    customerInfo: any = null;
    isCustomerInfoExpanded: boolean = true;
    isIntimatorInfoExpanded: boolean = true;
    isDriverInfoExpanded: boolean = true;
    isCarLicenseInfoExpanded: boolean = true;
    isAccidentInfoExpanded: boolean = true;
    isWorkshopInfoExpanded: boolean = true;


    claimId: string | null = null;
    isComplete = false;

    submittedPolicyInfo: any = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private claimService: ClaimService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) {
        // Read state from navigation
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras?.state?.['riskData']) {
            this.handleAvailabilityData(navigation.extras.state['riskData']);
        }
    }

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
                'workshop_type', 'driver_name', 'driver_birth_date', 'driver_gender',
                'accident_address', 'claim_source', 'relative', 'damagedParts'
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

            // Auto-fetch if not already populated from state
            if (!this.riskInfo && this.formData.chassis_number && this.formData.loss_date) {
                this.checkAvailability();
            }
        });
    }

    handleAvailabilityData(data: any): void {
        this.riskInfo = data.risk_info;
        this.customerInfo = data.customer_info;

        // Map Customer Info
        if (this.customerInfo) {
            this.formData.intimator_name = this.customerInfo.customer_name;
            this.formData.intimator_phone = this.customerInfo.customer_phone_number;
            this.formData.intimator_address = this.customerInfo.customer_address;
            this.formData.relative = 'Self';

            // Also populate driver info by default
            this.formData.driver_name = this.customerInfo.customer_name;
            this.formData.driver_birth_date = this.customerInfo.customer_birth_date;
            this.formData.driver_gender = this.customerInfo.customer_gender?.toLowerCase();
            this.formData.driver_licence_start_date = this.customerInfo.customer_licence_start_date || null;
            this.formData.driver_licence_expiration_date = this.customerInfo.customer_licence_expiration_date || null;
        }

        // Map Risk Info (Vehicle)
        if (this.riskInfo) {
            this.formData.vehicle_maker = this.riskInfo.vehicle_maker;
            this.formData.vehcile_model = this.riskInfo.vehcile_model;
            this.formData.vechicle_category = this.riskInfo.vechicle_category;
            this.formData.vechicle_engine_capacity = this.riskInfo.vechicle_engine_capacity;
            this.formData.vehicle_manufacturing_year = this.riskInfo.vehicle_manufacturing_year;
            this.formData.vehicle_motor_number = this.riskInfo.vehicle_motor_number;
            this.formData.vehicle_plate_number = this.riskInfo.vehicle_plate_number;
            this.formData.vehicle_licence_start_date = this.riskInfo.vehicle_licence_start_date || null;
            this.formData.vehicle_licence_expiration_date = this.riskInfo.vehicle_licence_expiration_date || null;
        }
    }

    checkAvailability(): void {
        this.availabilityError = '';
        if (!this.formData.loss_date || !this.formData.chassis_number) {
            this.availabilityError = 'Please enter Loss Date and Chassis Number.';
            return;
        }

        this.checkingAvailability = true;
        // Mocking Request for now as I need user_id? 
        // Logic says: checkRiskAvailability(chassis, userId, lossDate)
        // User ID might be null if new user? 
        // Assuming user_id from formData or auth service.
        const userId = this.formData.user_id || 0; // Or handle if missing

        this.claimService.checkRiskAvailability(
            this.formData.chassis_number,
            userId,
            this.formData.loss_date
        ).subscribe({
            next: (response: any) => {
                this.checkingAvailability = false;
                if (response.result?.available) {
                    const data = response.result.data;
                    this.riskInfo = data.risk_info;
                    this.customerInfo = data.customer_info;

                    // Map Customer Info
                    if (this.customerInfo) {
                        this.formData.intimator_name = this.customerInfo.customer_name;
                        this.formData.intimator_phone = this.customerInfo.customer_phone_number;
                        this.formData.intimator_address = this.customerInfo.customer_address;
                        this.formData.relative = 'Self';

                        // Also populate driver info by default
                        this.formData.driver_name = this.customerInfo.customer_name;
                        this.formData.driver_birth_date = this.customerInfo.customer_birth_date;
                        this.formData.driver_gender = this.customerInfo.customer_gender?.toLowerCase();
                        this.formData.driver_licence_start_date = this.customerInfo.customer_licence_start_date || null;
                        this.formData.driver_licence_expiration_date = this.customerInfo.customer_licence_expiration_date || null;
                        // Gender etc?
                    }

                    // Map Risk Info (Vehicle)
                    if (this.riskInfo) {
                        this.formData.vehicle_maker = this.riskInfo.vehicle_maker;
                        this.formData.vehcile_model = this.riskInfo.vehcile_model; // Note typo in API/Code
                        this.formData.vechicle_category = this.riskInfo.vechicle_category;
                        this.formData.vechicle_engine_capacity = this.riskInfo.vechicle_engine_capacity;
                        this.formData.vehicle_manufacturing_year = this.riskInfo.vehicle_manufacturing_year;
                        this.formData.vehicle_motor_number = this.riskInfo.vehicle_motor_number;
                        this.formData.vehicle_plate_number = this.riskInfo.vehicle_plate_number;
                        this.formData.vehicle_licence_start_date = this.riskInfo.vehicle_licence_start_date || null;
                        this.formData.vehicle_licence_expiration_date = this.riskInfo.vehicle_licence_expiration_date || null;
                        // Chassis already set
                    }
                } else {
                    this.availabilityError = response.result?.message || 'Risk not available.';
                }
            },
            error: (err: any) => {
                this.checkingAvailability = false;
                console.error('Availability check failed', err);
                this.availabilityError = 'Failed to check availability. Please try again.';
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
                console.log('Full API Response:', response);
                // Check multiple possible response locations
                this.requiredDocuments = response.claim_documents || response.crm_documents || response.result || response.data || [];
                console.log('Parsed Required Documents:', this.requiredDocuments);
                console.log('Document Items:', this.requiredDocuments.map(d => `id: ${d.id}, item: "${d.item}", name: "${d.name}"`));
            },
            error: (err: any) => {
                console.error('Failed to load claim documents', err);
            }
        });
    }

    onFilesSelected(files: File[]): void {
        // Legacy handler: if we have a generic "other" bucket or similar
        // For now, we are moving to specific handlers.
        // We might need to handle the case where "generalDocuments" upload calls this?
        // Let's assume the template will call onFileSelectForDoc for loop items.
    }

    onFileSelectForDoc(files: File[], doc: any): void {
        const key = doc.id || doc.code || doc.name;
        if (key) {
            this.uploadedFiles[key] = files;
        }
    }

    get driverLicenseDoc(): any {
        const doc = this.requiredDocuments.find(d => {
            const val = (d.name || d.item || '').toLowerCase().trim();
            return val.includes('driver') && val.includes('license');
            // Matches "Driver License", "Driver Licence", "رخصة القيادة" logic is different but let's stick to English/Arabic keyword checks if needed
            // For now, let's verify English first.
        }) || this.requiredDocuments.find(d => (d.name || d.item || '') === 'رخصة القيادة');

        // Console log only if not found to reduce noise, or once per change
        // console.log('Driver License Doc Found:', doc); 
        return doc;
    }

    get carLicenseDoc(): any {
        const doc = this.requiredDocuments.find(d => {
            const val = (d.name || d.item || '').toLowerCase().trim();
            return (val.includes('car') || val.includes('vehicle')) && val.includes('license');
        }) || this.requiredDocuments.find(d => (d.name || d.item || '') === 'رخصة السيارة');

        // console.log('Car License Doc Found:', doc);
        return doc;
    }

    get generalDocuments(): any[] {
        return this.requiredDocuments.filter(d => {
            const val = (d.name || d.item || '').toLowerCase().trim();
            const isDriver = (val.includes('driver') && val.includes('license')) || (d.name || d.item) === 'رخصة القيادة';
            const isCar = ((val.includes('car') || val.includes('vehicle')) && val.includes('license')) || (d.name || d.item) === 'رخصة السيارة';
            return !isDriver && !isCar;
        });
    }

    onPartsSelected(parts: string[]): void {
        this.formData.damagedParts = parts;

        // Auto-populate description
        const partNames = parts.map(id => {
            const part = CAR_PARTS.find(p => p.id === id);
            return part ? part.name : id;
        });

        if (partNames.length > 0) {
            this.formData.initial_damage_description = partNames.join(', ');
        }
    }

    onInsuredToggle(): void {
        if (this.formData.is_insured && this.customerInfo) {
            this.formData.intimator_name = this.customerInfo.customer_name || '';
            this.formData.intimator_phone = this.customerInfo.customer_phone_number || '';
            this.formData.intimator_address = this.customerInfo.customer_address || '';
            this.formData.relative = 'Self';
        }
    }

    onDriverToggle(): void {
        if (this.formData.is_driver && this.customerInfo) {
            this.formData.driver_name = this.formData.driver_name || this.customerInfo.customer_name || '';
            this.formData.driver_birth_date = this.formData.driver_birth_date || this.customerInfo.customer_birth_date || null;
            this.formData.driver_gender = this.formData.driver_gender || this.customerInfo.customer_gender?.toLowerCase() || '';

            // For license dates, also check if not set
            if (!this.formData.driver_licence_start_date) {
                this.formData.driver_licence_start_date = this.customerInfo.customer_licence_start_date || null;
            }

            if (!this.formData.driver_licence_expiration_date) {
                this.formData.driver_licence_expiration_date = this.customerInfo.customer_licence_expiration_date || null;
            }

            // License info might not be in customerInfo, check API response structure if needed
            this.calculateDriverLicenseExpiration();
        }
    }

    onDriverLicenseTypeChange(type: string): void {
        this.formData.driver_license_type = type;
        this.calculateDriverLicenseExpiration();
    }

    calculateDriverLicenseExpiration(): void {
        if (!this.formData.driver_licence_start_date) return;

        // Default to private if not set
        const type = this.formData.driver_license_type || 'private';
        const startDate = new Date(this.formData.driver_licence_start_date);

        if (isNaN(startDate.getTime())) return;

        let yearsToAdd = 0;
        if (type === 'private') {
            yearsToAdd = 10;
        } else if (type === 'professional') {
            yearsToAdd = 1;
        }

        if (yearsToAdd > 0) {
            const expiryDate = new Date(startDate);
            expiryDate.setFullYear(startDate.getFullYear() + yearsToAdd);
            // Subtract one day? Usually license expires on same day or day before? 
            // Requirements said "10 year from start date". Usually means exactly 10 years later.
            // e.g. 2023-01-01 -> 2033-01-01.
            this.formData.driver_licence_expiration_date = expiryDate.toISOString().split('T')[0];
        }
    }

    calculateVehicleLicenseExpiration(): void {
        if (!this.formData.vehicle_licence_start_date) return;

        const startDate = new Date(this.formData.vehicle_licence_start_date);
        if (isNaN(startDate.getTime())) return;

        const yearsToAdd = 3;
        const expiryDate = new Date(startDate);
        expiryDate.setFullYear(startDate.getFullYear() + yearsToAdd);
        this.formData.vehicle_licence_expiration_date = expiryDate.toISOString().split('T')[0];
    }

    onWizardComplete(event: { data: any; isLastStep: boolean }): void {
        this.formData = { ...this.formData, ...event.data };
        if (event.isLastStep) {
            this.submitClaim();
        }
    }

    onLossDetailsNext(): void {
        this.loading = true; // Optional visual feedback
        this.loadClaimDocuments();
        // Small delay to ensure API call is fired? Or just proceed.
        // The user says "call this api... while click".
        // We trigger it, then move next.
        // Ideally we wait for response but user didn't strict-block.
        // Let's just trigger it.
        this.wizard.handleNext(this.formData);
        this.loading = false;
    }


    async submitClaim(): Promise<void> {
        this.loading = true;

        try {
            const user = this.authService.currentUserValue;
            const userId = this.formData.user_id || user?.id;

            // Construct JSON payload
            const payload: any = { ...this.formData };

            // Explicitly set some fields
            payload.is_insured = this.formData.is_insured; // JSON supports boolean

            // Fix claim_source mapping based on user rule
            // Use type assertion for user_type as it might not be in the strict User interface
            if ((user as any)?.user_type === 'broker' || user?.role === 'broker') {
                payload.claim_source = 'broker';
            } else {
                payload.claim_source = 'customer';
            }

            if (userId) payload.user_id = userId;

            // Remove internal/UI-only fields if necessary, or let backend ignore them.
            // For safety, let's keep most.
            // 'damagedParts' is already an array in formData, perfect for JSON.

            // Process Files
            // Iterate over uploadedFiles map and convert to Base64
            for (const docKey of Object.keys(this.uploadedFiles)) {
                const files = this.uploadedFiles[docKey];
                if (files && files.length > 0) {
                    // Convert all files for this key
                    const filePromises = files.map(file => this.fileToBase64(file));
                    const base64Files = await Promise.all(filePromises);

                    // Logic: If list has 1 item, send simple string if that's what backend typically wants for singleton fields,
                    // but if it's a generic "documents" container it might need list.
                    // Given 'onFileSelectForDoc' uses specific IDs/codes, these are likely specific fields.
                    // We'll send single string if 1 file, array if multiple.
                    if (base64Files.length === 1) {
                        payload[docKey] = base64Files[0];
                        // Optionally send filename if backend looks for it (convention: key_filename)
                        // payload[docKey + '_filename'] = files[0].name;
                    } else {
                        payload[docKey] = base64Files;
                    }
                }
            }

            this.claimService.createClaimIntimation(payload).subscribe({
                next: (response: any) => {
                    this.claimId = response.result?.claim_id || response.result?.id || 'N/A';
                    this.submittedPolicyInfo = response.result?.policy_info || null; // Capture policy info
                    this.isComplete = true;
                    this.loading = false;
                },
                error: (error: any) => {
                    console.error('Failed to create claim:', error);
                    let msg = error.message || 'Unknown error';
                    if (error.error && error.error.message) msg = error.error.message;
                    this.notificationService.error('Failed to submit claim. ' + msg);
                    this.loading = false;
                }
            });

        } catch (e: any) {
            console.error('Error preparing claim submission', e);
            this.notificationService.error('Error preparing request: ' + e.message);
            this.loading = false;
        }
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g. "data:image/png;base64,")
                const base64 = result.split(',')[1] || result;
                resolve(base64);
            };
            reader.onerror = error => reject(error);
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
