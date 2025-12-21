import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { QuoteService } from '../../../core/services/quote.service';
import { CrmService } from '../../../core/services/crm.service';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProgramSelectorComponent } from '../../../components/program-selector/program-selector.component';

declare var lucide: any;

interface WizardStep {
    id: number;
    title: string;
    description: string;
}

@Component({
    selector: 'app-customer-quote-flow',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedModule, RouterModule, ProgramSelectorComponent],
    templateUrl: './customer-quote-flow.component.html',
    styles: [`
        :host { display: block; }
    `]
})
export class CustomerQuoteFlowComponent implements OnInit, AfterViewChecked {
    currentStep = 0;
    loading = false;
    error: string | null = null;

    // Success state
    issuanceSuccess = false;
    issuanceMessage = '';
    createdOpportunityId: number | null = null;
    issuanceResponseData: any = null;

    // Wizard steps
    steps: WizardStep[] = [
        { id: 1, title: 'Vehicle Details', description: 'Enter vehicle information' },
        { id: 2, title: 'Coverage Selection', description: 'Choose coverage plan' },
        { id: 3, title: 'Documents', description: 'Upload required documents' },
        { id: 4, title: 'Review & Issue', description: 'Review and issue policy' }
    ];

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
        this.loadLOVData();
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
            this.notificationService.error('Failed to load options data');
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
                user_type: 'customer', // CHANGED: 'broker' -> 'customer'
                product_code: '40020',
                lead_source: 'Web Portal',
                customer_info: {
                    // CHANGED: Map from currentUser (user) instead of selectedCustomer
                    customer_name: user?.name,
                    phone: user?.phone || user?.mobile,
                    email: user?.email,
                    national_id: (user as any)?.national_id,
                    customer_date_of_birth: (user as any)?.date_of_birth || '',
                    gender: (user as any)?.gender || 'male',
                    is_foreign_customer: (user as any)?.is_foreign || false,
                    passport_id: (user as any)?.passport_id || '',
                    street: user?.address || '',
                    city: user?.city || '',
                    state_name: user?.state || '',
                    country_name: user?.country || 'Egypt',
                    customer_branch_codes: ['100'],
                    customer_activity_code: 'ACTIVITY/0001'
                },
                risk_info: {
                    vehicle_make: formatWithPrefix(this.vehicleForm.make, 'MAKER'),
                    vehicle_model: formatWithPrefix(this.vehicleForm.model, 'CAR MODEL'),
                    vehicle_manufacturing_year: String(yearValue || ''),
                    vehicle_usage: formatWithPrefix(this.vehicleForm.usage, 'USAGE'), // Ensure prefix is added like in QuoteWizard
                    vehicle_sum_insured: Number(this.vehicleForm.sumInsured || 0),
                    vehicle_chassis_number: this.vehicleForm.chassisNo,
                    vehicle_engine_number: this.vehicleForm.engineNo,
                    vehicle_state: this.vehicleForm.vehicle_state || 'new',
                    vehicle_number_of_kilometers: Number(this.vehicleForm.kilometers || 0),
                    vehicle_road_side_program: this.vehicleForm.hasRoadSide ? formatWithPrefix(this.vehicleForm.roadSideProgram, 'ROAD SIDE PROGRAM') : '',
                    vehicle_body_type: formatWithPrefix(this.vehicleForm.bodyType, 'BODY TYPE'),
                    vehicle_fuel_type: formatWithPrefix(this.vehicleForm.fuelType, 'FUEL TYPE'),
                    vehicle_cc: formatWithPrefix(this.vehicleForm.cc, 'CC'),
                    vehicle_number_of_seats: Number(this.vehicleForm.seats || 5),
                    vehicle_color: formatWithPrefix(this.vehicleForm.color, 'CAR COLOR'),
                    vehicle_category: formatWithPrefix(this.vehicleForm.category, 'CAR CATEGORY')
                }
            };

            const quotationResponse = await this.quoteService.requestQuotation(payload).toPromise();

            // Check for errors
            if (quotationResponse?.result?.error) {
                this.notificationService.error(quotationResponse.result.error);
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
            // Move to next step manually to avoid loop in nextStep()
            this.currentStep++;
        } catch (err: any) {
            console.error('Failed to request quotation', err);
            const errorMessage = err?.response?.data?.result?.error ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to request quotation. Please try again.';
            this.notificationService.error(errorMessage);
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
                    payment_method: 'Payment Method/0001', // This should come from a payment step
                    payment_reference: '', // This should come from a payment step
                    payment_reference_file_content: '' // Base64 encoded payment receipt if available
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

            const response = await this.quoteService.requestIssuance(payload).toPromise();

            // Check for errors in the response
            if (response?.result?.error || response?.error) {
                this.notificationService.error(response?.result?.error || response?.error);
                this.loading = false;
                return;
            }

            // Show inline success message instead of redirecting
            this.issuanceSuccess = true;
            this.issuanceMessage = response?.result?.message || response?.message || 'Your policy issuance request has been submitted successfully!';
            this.createdOpportunityId = this.opportunityId;

            // Store full response data for display
            this.issuanceResponseData = {
                opportunity_number: response?.result?.opportunity_number || response?.opportunity_number || '',
                policy_number: response?.result?.policy_number || response?.policy_number || '',
                policy_state: response?.result?.policy_state || response?.policy_state || '',
                policy_id: response?.result?.policy_id || response?.policy_id || null,
                ...response?.result,
                ...response
            };

            this.loading = false;
        } catch (err: any) {
            console.error('Failed to issue policy', err);
            const errorMessage = err?.error?.result?.error ||
                err?.error?.error ||
                err?.result?.error ||
                err?.response?.data?.result?.error ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to issue policy. Please try again.';
            this.notificationService.error(errorMessage);
            this.loading = false;
        }
    }

    nextStep(): void {
        if (this.currentStep === 0 && this.isVehicleFormValid()) {
            this.submitVehicleDetails();
        } else if (this.currentStep === 1 && !this.selectedProposal) {
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
            // Error clearing is not needed as we use toasts
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

    downloadProposalPdf(proposal: any): void {
        if (proposal.proposal_pdf_url) {
            const token = localStorage.getItem('authToken');
            const separator = proposal.proposal_pdf_url.includes('?') ? '&' : '?';
            const urlWithAuth = `${proposal.proposal_pdf_url}${separator}token=${token}`;
            window.open(urlWithAuth, '_blank');
        } else {
            console.log('Downloading proposal PDF for ID:', proposal.id);
        }
    }

    async viewQuotationDetails(): Promise<void> {
        if (!this.createdOpportunityId) return;

        this.loading = true;
        try {
            const quoteRes = await this.crmService.getQuotation(this.createdOpportunityId).toPromise();
            this.router.navigate(['/dashboard/customer/quotations', this.createdOpportunityId]);
        } catch (err) {
            console.error('Failed to fetch quotation details:', err);
            this.router.navigate(['/dashboard/customer/quotations', this.createdOpportunityId]);
        } finally {
            this.loading = false;
        }
    }
}
