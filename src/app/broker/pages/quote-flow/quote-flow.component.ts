import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { CrmService } from '../../../core/services/crm.service';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

declare var lucide: any;

interface WizardStep {
    id: number;
    title: string;
    description: string;
}

@Component({
    selector: 'app-quote-flow',
    templateUrl: './quote-flow.component.html',
    styleUrls: ['./quote-flow.component.css']
})
export class QuoteFlowComponent implements OnInit, AfterViewChecked {
    currentStep = 0;
    loading = false;
    error: string | null = null;

    // Wizard steps
    // Wizard steps
    steps: WizardStep[] = [
        { id: 1, title: 'Vehicle Details', description: 'Enter vehicle information' },
        { id: 2, title: 'Coverage Selection', description: 'Choose coverage plan' },
        { id: 3, title: 'Documents', description: 'Upload required documents' },
        { id: 4, title: 'Review & Issue', description: 'Review and issue policy' }
    ];

    // Customer Selection Modal (Removed from flow, handled by parent/overlay)
    isCustomerModalOpen = false;
    selectedCustomer: any = null;

    // Vehicle Details Form
    vehicleForm = {
        make: '',
        model: '',
        year: '',
        category: '',
        chassisNo: '',
        engineNo: '',
        plateNo: '',
        color: '',
        bodyType: '',
        fuelType: 'Petrol',
        cc: '',
        seats: '5',
        usage: 'Private',
        sumInsured: '',
        vehicle_state: 'new',
        kilometers: '0',
        hasRoadSide: true,
        roadSideProgram: ''
    };

    // Collapsible Sections State
    openSections: { [key: string]: boolean } = {
        selection: true,
        identification: false,
        specifications: false,
        financial: false,
        coverage: false
    };

    // LOV Data
    makers: any[] = [];
    models: any[] = [];
    categories: any[] = [];
    years: any[] = [];
    bodyTypes: any[] = [];
    usages: any[] = [];
    ccs: any[] = [];
    fuelTypes: any[] = [];
    colors: any[] = [];
    roadSidePrograms: any[] = [];

    // Quotation Data
    opportunityId: number | null = null;
    proposals: any[] = [];
    selectedProposal: any = null;
    quotationData: any = null;

    // Documents
    requiredDocuments: any[] = [];
    uploadedDocuments: Map<string, any> = new Map();

    // Mark as Lost state
    isLostModalOpen = false;
    lostReasons: any[] = [];
    selectedLostReason: any = null;
    lostFeedback = '';
    lostLoading = false;
    downloadingProposalId: number | null = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private quoteService: QuoteService,
        private crmService: CrmService,
        private customerService: CustomerService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        // Check for edit mode from query parameters
        this.route.queryParams.subscribe(async params => {
            const quotationId = params['quotationId'];
            const isEdit = params['edit'] === 'true';

            // Always load LOV data first
            await this.loadLOVData();

            if (quotationId && isEdit) {
                // Edit mode - load existing quotation after LOV data is loaded
                await this.loadExistingQuotation(quotationId);
            } else {
                // New quotation mode - check for customer data
                const navigation = this.router.getCurrentNavigation();
                const state = navigation?.extras?.state || (history.state as any);

                if (state && state.customer) {
                    this.selectedCustomer = state.customer;
                } else {
                    // Redirect back if no customer selected
                    console.warn('No customer data found in state, redirecting to quotations');
                    this.router.navigate(['/dashboard/broker/quotations']);
                    return;
                }
            }
        });
    }

    async loadExistingQuotation(quotationId: string): Promise<void> {
        this.loading = true;
        try {
            // Fetch quotation details
            const quoteRes = await this.crmService.getQuotation(Number(quotationId)).toPromise();
            const quotation = quoteRes?.result?.data || quoteRes?.data || quoteRes;

            console.log('Loaded quotation for editing:', quotation);

            if (!quotation) {
                console.error('No quotation data found');
                this.router.navigate(['/dashboard/broker/quotations']);
                return;
            }

            // Set customer data from quotation (national_id not available in API response)
            this.selectedCustomer = {
                name: quotation.name,
                email: quotation.email,
                phone: quotation.phone,
                nationalId: '', // Not provided by quotation API
                dateOfBirth: '',
                gender: 'male'
            };

            console.log('Customer data set (national_id not available):', this.selectedCustomer);

            // Set opportunity ID
            this.opportunityId = quotation.opportunity_id || Number(quotationId);

            // Pre-fill vehicle form from quotation data
            const risk = quotation.opportunity_risks?.[0];
            console.log('Risk data:', risk);
            console.log('Available LOV data:', {
                usages: this.usages,
                colors: this.colors,
                bodyTypes: this.bodyTypes,
                fuelTypes: this.fuelTypes,
                ccs: this.ccs,
                roadSidePrograms: this.roadSidePrograms
            });

            if (risk) {
                // Don't extract - use the full sequence_number values as they are
                // The dropdowns expect the full format like "BODY TYPE/0001"

                const formData = {
                    make: risk.vehicle_make_sequence_number || risk.vehicle_make || '',
                    model: risk.vehicle_model_sequence_number || risk.vehicle_model || '',
                    year: String(risk.vehicle_manufacturing_year || ''),
                    category: risk.vehicle_category_sequence_number || risk.vehicle_category || '',
                    chassisNo: risk.vehicle_chassis_number || '',
                    engineNo: risk.vehicle_engine_number || '',
                    plateNo: risk.vehicle_plate_number || risk.plate_number || '',
                    color: risk.vehicle_color_sequence_number || risk.vehicle_color || '',
                    bodyType: risk.vehicle_body_type_sequence_number || risk.vehicle_body_type || '',
                    fuelType: risk.vehicle_fuel_type_sequence_number || risk.vehicle_fuel_type || '',
                    cc: risk.vehicle_cc_sequence_number || risk.vehicle_cc || '',
                    seats: String(risk.vehicle_number_of_seats || risk.vehicle_seats || '5'),
                    usage: risk.vehicle_usage_sequence_number || risk.vehicle_usage || '',
                    sumInsured: String(risk.vehicle_sum_insured || ''),
                    vehicle_state: risk.vehicle_state || 'new',
                    kilometers: String(risk.vehicle_number_of_kilometers || '0'),
                    hasRoadSide: risk.vehicle_has_road_side || false,
                    roadSideProgram: risk.vehicle_road_side_program_sequence_number || risk.vehicle_road_side_program || ''
                };

                console.log('Form data to set:', formData);

                // Set independent fields immediately
                this.vehicleForm.chassisNo = formData.chassisNo;
                this.vehicleForm.engineNo = formData.engineNo;
                this.vehicleForm.plateNo = formData.plateNo;
                this.vehicleForm.color = formData.color;
                this.vehicleForm.bodyType = formData.bodyType;
                this.vehicleForm.fuelType = formData.fuelType;
                this.vehicleForm.cc = formData.cc;
                this.vehicleForm.seats = formData.seats;
                this.vehicleForm.usage = formData.usage;
                this.vehicleForm.sumInsured = formData.sumInsured;
                this.vehicleForm.vehicle_state = formData.vehicle_state;
                this.vehicleForm.kilometers = formData.kilometers;
                this.vehicleForm.hasRoadSide = formData.hasRoadSide;
                this.vehicleForm.roadSideProgram = formData.roadSideProgram;

                // Handle dependent fields with proper sequencing
                // 1. Set make and load models
                this.vehicleForm.make = formData.make;
                if (formData.make) {
                    await this.onMakeChange();

                    // 2. Set model after models are loaded
                    setTimeout(() => {
                        this.vehicleForm.model = formData.model;

                        // 3. Load years/categories after model is set
                        if (formData.model) {
                            setTimeout(async () => {
                                await this.onModelChange();

                                // 4. Set year and category after they're loaded
                                setTimeout(() => {
                                    console.log('Setting year:', formData.year, 'Available years:', this.years);
                                    console.log('Setting category:', formData.category);

                                    // Find the matching year from the years array
                                    const yearValue = String(risk.vehicle_manufacturing_year || formData.year);
                                    const matchedYear = this.years.find(y =>
                                        String(y.name) === yearValue ||
                                        String(y.code) === yearValue ||
                                        y.name?.toString().includes(yearValue)
                                    );

                                    this.vehicleForm.year = matchedYear?.code || yearValue;
                                    this.vehicleForm.category = formData.category;

                                    console.log('Year matched:', matchedYear, 'Year set to:', this.vehicleForm.year);
                                    console.log('All dependent fields set');
                                }, 200);
                            }, 200);
                        }
                    }, 200);
                }
            }

            // Load proposals if available
            if (quotation.opportunity_proposal && quotation.opportunity_proposal.length > 0) {
                this.proposals = quotation.opportunity_proposal;
            }

            this.loading = false;
        } catch (err) {
            console.error('Failed to load quotation for editing', err);
            this.notificationService.error('Failed to load quotation data. Redirecting to quotations list.');
            this.router.navigate(['/dashboard/broker/quotations']);
        }
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    async loadLOVData(): Promise<void> {
        try {
            // Load makers
            const makersRes = await this.quoteService.getVehicleMakers().toPromise();
            this.makers = this.mapList(makersRes);

            // Load other LOVs in parallel
            const [bodyRes, usageRes, ccRes, fuelRes, colorRes, roadRes] = await Promise.all([
                this.quoteService.getVehicleBodyTypes().toPromise(),
                this.quoteService.getVehicleUsages().toPromise(),
                this.quoteService.getVehicleCcs().toPromise(),
                this.quoteService.getVehicleFuelTypes().toPromise(),
                this.quoteService.getVehicleColors().toPromise(),
                this.quoteService.getRoadSidePrograms().toPromise()
            ]);

            this.bodyTypes = this.mapList(bodyRes);
            this.usages = this.mapList(usageRes);
            this.ccs = this.mapList(ccRes);
            this.fuelTypes = this.mapList(fuelRes);
            this.colors = this.mapList(colorRes);
            this.roadSidePrograms = this.mapList(roadRes);
        } catch (err) {
            console.error('Failed to load LOV data', err);
            this.notificationService.error('Failed to load form data. Please refresh the page.');
        }
    }

    private mapList(response: any): any[] {
        const raw = response?.result?.data || response?.data || response;
        let list: any[] = [];

        if (Array.isArray(raw)) {
            list = raw;
        } else if (raw && typeof raw === 'object') {
            if (raw.items && Array.isArray(raw.items)) list = raw.items;
            else if (raw.data && Array.isArray(raw.data)) list = raw.data;
            else {
                const key = Object.keys(raw).find(k => Array.isArray(raw[k]));
                if (key) list = raw[key];
            }
        }

        return list.map(item => ({
            code: item.sequence_number || item.code || item.id || item.value || item.year,
            name: item.item || item.name || item.value || item.display || item.label || item.year || item,
            id: item.id
        }));
    }

    async onMakeChange(): Promise<void> {
        if (!this.vehicleForm.make) {
            this.models = [];
            return;
        }

        try {
            const res = await this.quoteService.getVehicleModels(this.vehicleForm.make).toPromise();
            this.models = this.mapList(res);
            this.vehicleForm.model = '';
            this.vehicleForm.year = '';
            this.vehicleForm.category = '';
        } catch (err) {
            console.error('Failed to load models', err);
            this.notificationService.error('Failed to load vehicle models');
        }
    }

    async onModelChange(): Promise<void> {
        if (!this.vehicleForm.model) {
            this.categories = [];
            this.years = [];
            return;
        }

        try {
            // Load categories
            const catRes = await this.quoteService.getVehicleModelCategories(this.vehicleForm.model).toPromise();
            this.categories = this.mapList(catRes);

            // Load years - need to find model ID
            const selectedModel = this.models.find(m => m.code === this.vehicleForm.model);
            const param = selectedModel?.id || this.vehicleForm.model;

            const yearRes = await this.quoteService.getVehicleModelYears(param).toPromise();
            this.years = this.mapList(yearRes);

            this.vehicleForm.year = '';
            this.vehicleForm.category = '';
        } catch (err) {
            console.error('Failed to load categories/years', err);
            this.notificationService.error('Failed to load vehicle options');
        }
    }

    async loadLostReasons(): Promise<void> {
        try {
            const res = await this.crmService.getLostReasons().toPromise();
            this.lostReasons = this.mapList(res);
        } catch (err) {
            console.error('Failed to load lost reasons', err);
            this.notificationService.error('Failed to load lost reasons');
        }
    }

    openLostModal(): void {
        this.isLostModalOpen = true;
        if (this.lostReasons.length === 0) {
            this.loadLostReasons();
        }
    }

    closeLostModal(): void {
        this.isLostModalOpen = false;
        this.selectedLostReason = null;
        this.lostFeedback = '';
    }

    async submitMarkAsLost(): Promise<void> {
        if (!this.opportunityId || !this.selectedLostReason) return;

        this.lostLoading = true;
        try {
            await this.crmService.markLost(
                this.opportunityId,
                this.selectedLostReason,
                this.lostFeedback
            ).toPromise();

            this.closeLostModal();
            this.notificationService.success('Quotation marked as lost successfully');
            this.router.navigate(['/dashboard/broker/quotations']);
        } catch (err) {
            console.error('Failed to mark as lost', err);
            this.notificationService.error('Failed to mark as lost. Please try again.');
        } finally {
            this.lostLoading = false;
        }
    }

    toggleSection(section: string, isOpen?: boolean): void {
        this.openSections[section] = isOpen !== undefined ? isOpen : !this.openSections[section];
    }

    isSectionOpen(section: string): boolean {
        return !!this.openSections[section];
    }

    get isSelectionComplete(): boolean {
        return !!(this.vehicleForm.make && this.vehicleForm.model && this.vehicleForm.year && this.vehicleForm.category);
    }

    get isIdentificationComplete(): boolean {
        return !!(this.vehicleForm.chassisNo && this.vehicleForm.engineNo && this.vehicleForm.plateNo);
    }

    get isSpecificationsComplete(): boolean {
        return !!(this.vehicleForm.bodyType && this.vehicleForm.color && this.vehicleForm.cc && this.vehicleForm.seats);
    }

    get isFinancialComplete(): boolean {
        return !!(this.vehicleForm.sumInsured && this.vehicleForm.vehicle_state);
    }

    onCustomerSelected(customer: any): void {
        this.selectedCustomer = customer;
        this.isCustomerModalOpen = false;
        this.nextStep();
    }

    onProgramSelected(programId: string): void {
        this.vehicleForm.roadSideProgram = programId;
        console.log('Program selected:', programId);
    }

    onRoadsideToggled(included: boolean): void {
        this.vehicleForm.hasRoadSide = included;
        if (!included) {
            this.vehicleForm.roadSideProgram = '';
        }
        console.log('Roadside toggled:', included);
    }

    async submitVehicleDetails(): Promise<void> {
        this.loading = true;
        this.error = null;

        try {
            const user = this.authService.currentUserValue;

            // Format codes with prefixes
            const formatWithPrefix = (value: string, prefix: string) => {
                if (!value) return '';
                if (String(value).includes('/')) return value;
                return `${prefix}/${value}`;
            };

            // Get resolved year value
            const selectedYear = this.years.find(y => y.code === this.vehicleForm.year);
            const yearValue = selectedYear ? selectedYear.name : this.vehicleForm.year;

            const payload = {
                user_id: user?.id || 2,
                user_type: 'broker',
                product_code: '40020',
                lead_source: 'Web Portal',
                customer_info: {
                    customer_name: this.selectedCustomer.name || this.selectedCustomer.clientName,
                    phone: this.selectedCustomer.phone,
                    email: this.selectedCustomer.email,
                    national_id: this.selectedCustomer.nationalId || this.selectedCustomer.national_id || this.selectedCustomer.identification_number,
                    customer_date_of_birth: this.selectedCustomer.dateOfBirth || this.selectedCustomer.date_of_birth || '',
                    gender: this.selectedCustomer.gender || 'male',
                    is_foreign_customer: this.selectedCustomer.isForeignCustomer || this.selectedCustomer.is_foreign || false,
                    passport_id: this.selectedCustomer.passportId || this.selectedCustomer.passport_id || '',
                    street: this.selectedCustomer.street || '',
                    city: this.selectedCustomer.city || '',
                    state_name: this.selectedCustomer.stateName || this.selectedCustomer.state || '',
                    country_name: this.selectedCustomer.countryName || this.selectedCustomer.country || 'Egypt',
                    customer_branch_codes: ['100'],
                    customer_activity_code: 'ACTIVITY/0001'
                },
                risk_info: {
                    vehicle_make: formatWithPrefix(this.vehicleForm.make, 'MAKER'),
                    vehicle_model: formatWithPrefix(this.vehicleForm.model, 'CAR MODEL'),
                    vehicle_manufacturing_year: String(yearValue || ''),
                    vehicle_usage: this.vehicleForm.usage || '',
                    vehicle_sum_insured: Number(this.vehicleForm.sumInsured || 0),
                    vehicle_chassis_number: this.vehicleForm.chassisNo,
                    vehicle_engine_number: this.vehicleForm.engineNo,
                    vehicle_state: this.vehicleForm.vehicle_state || 'new',
                    vehicle_number_of_kilometers: Number(this.vehicleForm.kilometers || 0),
                    vehicle_road_side_program: formatWithPrefix(this.vehicleForm.roadSideProgram, 'ROAD SIDE PROGRAM'),
                    // Added missing fields from React
                    vehicle_plate_number: this.vehicleForm.plateNo || '',
                    vehicle_color: this.vehicleForm.color || '',
                    vehicle_body_type: this.vehicleForm.bodyType || '',
                    vehicle_fuel_type: this.vehicleForm.fuelType || '',
                    vehicle_cc: this.vehicleForm.cc || '',
                    vehicle_seats: this.vehicleForm.seats || '5',
                    vehicle_category: this.vehicleForm.category || ''
                }
            };

            const quotationResponse = await this.quoteService.requestQuotation(payload).toPromise();

            // Check for errors
            if (quotationResponse?.result?.error) {
                this.error = quotationResponse.result.error;
                this.loading = false;
                return;
            }

            // Extract opportunity ID
            this.opportunityId = quotationResponse?.result?.opportunity_id ||
                quotationResponse?.result?.data?.opportunity_id ||
                quotationResponse?.data?.opportunity_id ||
                quotationResponse?.opportunity_id;

            this.quotationData = quotationResponse?.result?.data || quotationResponse?.result || quotationResponse?.data || quotationResponse;

            // Get proposals
            if (quotationResponse?.result?.proposals && Array.isArray(quotationResponse.result.proposals)) {
                this.proposals = quotationResponse.result.proposals;
            } else if (this.opportunityId) {
                try {
                    await this.quoteService.generateProposals(this.opportunityId).toPromise();
                    const proposalsRes = await this.quoteService.getProposals(this.opportunityId).toPromise();
                    this.proposals = proposalsRes?.result?.proposals || proposalsRes?.data?.proposals || proposalsRes?.proposals || [];
                } catch (propErr) {
                    console.error('Failed to fetch proposals', propErr);
                }
            }

            this.loading = false;
            this.loading = false;
            // Move to next step manually to avoid loop in nextStep()
            this.currentStep++;
        } catch (err: any) {
            console.error('Failed to request quotation', err);
            this.error = err?.response?.data?.result?.error ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to request quotation. Please try again.';
            this.notificationService.error(this.error || 'Request failed');
            this.loading = false;
        }
    }

    selectProposal(proposal: any): void {
        this.selectedProposal = proposal;
    }

    async loadRequiredDocuments(): Promise<void> {
        if (!this.opportunityId) return;

        try {
            // Use getCRMDocuments from QuoteService instead
            const res = await this.quoteService.getCRMDocuments().toPromise();
            this.requiredDocuments = res?.crm_documents || res?.result?.data || res?.data || [];
            console.log('Loaded required documents:', this.requiredDocuments);
        } catch (err) {
            console.error('Failed to load required documents', err);
            this.notificationService.error('Failed to load document requirements');
        }
    }

    onFileSelected(event: any, documentId: string): void {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                this.uploadedDocuments.set(documentId, {
                    file_name: file.name,
                    file_data: base64,
                    document_id: documentId
                });
            };
            reader.readAsDataURL(file);
        }
    }

    async issuePolicy(): Promise<void> {
        if (!this.selectedProposal || !this.opportunityId) return;

        this.loading = true;
        this.error = null;

        try {
            const user = this.authService.currentUserValue;

            // Helper function to format codes with prefix
            const formatWithPrefix = (code: string, prefix: string): string => {
                if (!code) return '';
                if (code.includes('/')) return code;
                return `${prefix}/${code.padStart(4, '0')}`;
            };

            // Get resolved year value
            const selectedYear = this.years.find(y => y.code === this.vehicleForm.year);
            const yearValue = selectedYear ? selectedYear.name : this.vehicleForm.year;

            // Format CRM documents array according to backend requirements
            const crmDocuments = Array.from(this.uploadedDocuments.entries()).map(([docId, docData]) => {
                // Find the document from requiredDocuments to get the LOV name
                const doc = this.requiredDocuments.find(d => String(d.id) === String(docId));
                // Use the CRM Document LOV name (e.g., "CRM Document/0001")
                // Priority: sequence_number (correct format) > code > name
                const documentName = doc?.sequence_number || doc?.code || doc?.name || doc?.item || '';

                console.log('Document mapping:', { docId, doc, documentName });

                return {
                    document_name: documentName,
                    files: [docData.file_data]
                };
            });

            const payload = {
                opportunity_id: this.opportunityId,
                selected_proposal_id: this.selectedProposal.id || this.selectedProposal.proposal_id,
                payment_info: {
                    payment_method: 'Payment Method/0001',
                    payment_reference: '',
                    payment_reference_file_content: ''
                },
                crm_documents: crmDocuments,
                risk_info: {
                    vehicle_state: this.vehicleForm.vehicle_state || 'new',
                    vehicle_manufacturing_year: String(yearValue || ''),
                    vehicle_make: formatWithPrefix(this.vehicleForm.make, 'MAKER'),
                    vehicle_model: formatWithPrefix(this.vehicleForm.model, 'CAR MODEL'),
                    vehicle_category: formatWithPrefix(this.vehicleForm.category, 'CAR CATEGORY'),
                    vehicle_color: formatWithPrefix(this.vehicleForm.color, 'CAR COLOR'),
                    vehicle_body_type: formatWithPrefix(this.vehicleForm.bodyType, 'BODY TYPE'),
                    vehicle_fuel_type: formatWithPrefix(this.vehicleForm.fuelType, 'FUEL TYPE'),
                    vehicle_usage: formatWithPrefix(this.vehicleForm.usage, 'USAGE'),
                    vehicle_cc: formatWithPrefix(this.vehicleForm.cc, 'CC'),
                    vehicle_number_of_seats: Number(this.vehicleForm.seats || 5),
                    vehicle_sum_insured: Number(this.vehicleForm.sumInsured || 0),
                    vehicle_chassis_number: this.vehicleForm.chassisNo,
                    vehicle_plate_number: this.vehicleForm.plateNo || '',
                    vehicle_engine_number: this.vehicleForm.engineNo,
                    vehicle_has_road_side: this.vehicleForm.hasRoadSide || false,
                    vehicle_road_side_program: this.vehicleForm.hasRoadSide
                        ? formatWithPrefix(this.vehicleForm.roadSideProgram, 'ROAD SIDE PROGRAM')
                        : ''
                }
            };

            console.log('Issuance payload:', payload);

            const response = await this.quoteService.requestIssuance(payload).toPromise();

            if (response?.result?.error) {
                this.error = response.result.error;
                this.notificationService.error(this.error || 'Issuance failed');
                this.loading = false;
                return;
            }

            const policyId = response?.result?.policy_id || response?.data?.policy_id;

            this.notificationService.success('Policy issued successfully! Redirecting...');

            if (policyId) {
                this.router.navigate(['/dashboard/broker/policies', policyId]);
            } else {
                // Fallback if no policy ID returned but success
                this.router.navigate(['/dashboard/broker/policies']);
            }
        } catch (err: any) {
            console.error('Failed to issue policy', err);
            this.error = err?.response?.data?.result?.error ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to issue policy. Please try again.';
            this.notificationService.error(this.error || 'Issuance failed');
            this.loading = false;
        }
    }

    nextStep(): void {
        if (this.currentStep === 0 && this.isVehicleFormValid()) {
            this.submitVehicleDetails();
        } else if (this.currentStep === 1 && !this.selectedProposal) {
            this.error = 'Please select a coverage plan';
            this.notificationService.warning('Please select a coverage plan');
        } else if (this.currentStep === 1) {
            // Moving from Coverage to Documents
            this.loadRequiredDocuments();
            this.currentStep++;
        } else if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
        }
    }

    previousStep(): void {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.error = null;
        }
    }

    isVehicleFormValid(): boolean {
        return this.isSelectionComplete &&
            this.isIdentificationComplete &&
            this.isSpecificationsComplete &&
            this.isFinancialComplete;
    }

    canProceed(): boolean {
        switch (this.currentStep) {
            case 0:
                // Vehicle Step
                return this.isVehicleFormValid();
            case 1:
                // Coverage Step
                return !!this.selectedProposal;
            case 2:
                // Documents Step
                return this.requiredDocuments.every(doc =>
                    !doc.required_document || this.uploadedDocuments.has(doc.id)
                );
            case 3:
                // Review Step
                return true;
            default:
                return true;
        }
    }

    async downloadProposalPdf(proposal: any): Promise<void> {
        const proposalId = proposal.id || proposal.proposal_id;

        if (!proposalId) {
            console.error('Analysis failed: Proposal ID is missing.');
            return;
        }

        try {
            this.downloadingProposalId = proposalId;
            // Use the same service method as in BrokerQuotationDetailsComponent
            const blob = await this.quoteService.downloadProposalPdf(Number(proposalId)).toPromise();

            // Create blob and download
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Proposal_${proposal.proposal_reference || proposalId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error: any) {
            console.error('Error downloading proposal PDF:', error);
            this.notificationService.error('Failed to download proposal PDF. Please try again.');
        } finally {
            this.downloadingProposalId = null;
        }
    }
}
