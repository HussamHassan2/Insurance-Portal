import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CrmService } from '../../../core/services/crm.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

declare var lucide: any;

@Component({
    selector: 'app-quotation-details',
    templateUrl: './quotation-details.component.html',
    styleUrls: ['./quotation-details.component.css']
})
export class QuotationDetailsComponent implements OnInit, AfterViewChecked {
    quoteId: string = '';
    quote: any = null;
    loading = true;
    error: string | null = null;
    showComparison = false;
    showMarkLostModal = false;
    lostReasons: any[] = [];
    selectedReason: any = '';
    lostFeedback = '';
    submittingLost = false;
    successMessage: string | null = null;
    refreshTrigger = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private crmService: CrmService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.quoteId = this.route.snapshot.params['id'];
        this.loadQuotation();
        this.loadLostReasons();
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async loadQuotation(): Promise<void> {
        if (!this.quoteId) return;

        try {
            this.loading = true;
            this.error = null;

            const response = await this.crmService.getOpportunity(Number(this.quoteId)).toPromise();
            const apiData = response?.result?.data || response?.data || response;

            if (apiData && apiData.id) {
                // Map API fields to component structure
                this.quote = {
                    id: apiData.id || this.quoteId,
                    quotationNumber: apiData.opportunity_number || apiData.id || this.quoteId,
                    date: apiData.creation_date || apiData.created_at || 'N/A',
                    validUntil: apiData.valid_until || apiData.expiry_date || 'N/A',
                    status: (apiData.state || 'draft').toLowerCase(),
                    stage: apiData.stage_id ? (apiData.stage_id[1] || 'New') : (apiData.stage || 'New'),
                    createdBy: apiData.created_by || apiData.agent_name || 'N/A',
                    customer: {
                        name: apiData.contact_name || apiData.partner_name || 'N/A',
                        phone: apiData.customer_phone || apiData.phone || 'N/A',
                        email: apiData.customer_email || apiData.email || 'N/A',
                        type: apiData.issuing_type_name || apiData.partner_company || 'N/A',
                        taxId: apiData.tax_id || apiData.vat_number || 'N/A',
                        address: apiData.customer_address || apiData.address || 'N/A',
                    },
                    insurance: {
                        type: apiData.insurance_type || 'Motor Insurance',
                        coveragePlan: apiData.coverage_plan || apiData.product_name || 'Comprehensive',
                        coveragePeriod: apiData.coverage_period || '12 Months',
                        sumInsured: apiData.sum_insured || 0,
                        deductible: apiData.deductible || 0,
                        addons: apiData.add_ons || []
                    },
                    vehicle: {
                        make: apiData.vehicle_make || apiData.make || 'N/A',
                        model: apiData.vehicle_model || apiData.model || 'N/A',
                        year: apiData.vehicle_year || apiData.year || 'N/A',
                        value: apiData.vehicle_sum_insured || 0,
                        plateNumber: apiData.plate_number || apiData.plate || 'N/A',
                        chassisNumber: apiData.chassis_number || apiData.chassis || 'N/A',
                        color: apiData.vehicle_color || 'N/A',
                        usage: apiData.vehicle_usage || 'Private'
                    },
                    premium: {
                        base: apiData.base_premium || apiData.net_premium || 0,
                        riskLoading: apiData.risk_loading || 0,
                        discounts: apiData.discounts || [],
                        addonCharges: apiData.addon_charges || [],
                        subtotal: apiData.subtotal || 0,
                        taxes: apiData.taxes || [],
                        fees: apiData.fees || 0,
                        total: apiData.total_premium || apiData.gross_premium || 0,
                        paymentOptions: apiData.payment_options || []
                    },
                    plans: (apiData.opportunity_proposal || apiData.plans || []).map((p: any) => ({
                        id: p.id,
                        name: p.proposal_reference || p.product_name || `Option ${p.id}`,
                        price: p.proposal_gross_premium || p.price || 0,
                        recommended: p.recommended || false,
                        details: {
                            reference: p.proposal_reference || 'N/A',
                            sumInsured: p.proposal_sum_insured || 0,
                            netRate: p.proposal_net_rate || 0,
                            netPremium: p.proposal_net_premium || 0,
                            taxes: p.proposal_tax_amount || 0,
                            fees: p.proposal_issue_fees || 0,
                            stampDuty: p.proposal_stamp_duty || 0,
                            grossPremium: p.proposal_gross_premium || 0,
                        },
                        features: p.features || []
                    })),
                    conditions: apiData.opportunity_conditions || [],
                    documents: apiData.opportunity_documents || [],
                    activity: apiData.activity_log || []
                };
            } else {
                this.error = 'Quotation data not found';
            }
        } catch (err: any) {
            console.error('Error fetching quotation:', err);
            this.error = err?.message || 'Failed to load quotation';
            this.notificationService.error(this.error || 'Failed to load quotation');
        } finally {
            this.loading = false;
        }
    }

    async loadLostReasons(): Promise<void> {
        try {
            const response = await this.crmService.getLostReasons().toPromise();

            // Handle different response structures
            let reasons = [];
            if (response && response.data) {
                if (Array.isArray(response.data.lost_reasons)) {
                    reasons = response.data.lost_reasons;
                } else if (Array.isArray(response.data)) {
                    reasons = response.data;
                } else if (response.data.result) {
                    if (Array.isArray(response.data.result)) {
                        reasons = response.data.result;
                    } else if (response.data.result.data && Array.isArray(response.data.result.data)) {
                        reasons = response.data.result.data;
                    }
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    reasons = response.data.data;
                }
            }

            this.lostReasons = reasons;
        } catch (err) {
            console.error('Error fetching lost reasons:', err);
            this.notificationService.error('Failed to load lost reasons');
        }
    }

    async handleMarkAsLost(): Promise<void> {
        if (!this.selectedReason) {
            this.notificationService.warning('Please select a reason');
            return;
        }

        try {
            this.submittingLost = true;
            const reasonId = this.selectedReason.id || this.selectedReason;
            await this.crmService.markLost(Number(this.quoteId), reasonId, this.lostFeedback).toPromise();

            this.showMarkLostModal = false;
            this.successMessage = 'Quotation marked as lost successfully';
            this.notificationService.success('Quotation marked as lost successfully');

            // Auto-hide success message after 5 seconds
            setTimeout(() => this.successMessage = null, 5000);

            // Update quote status
            if (this.quote) {
                this.quote.status = 'lost';
            }
        } catch (err: any) {
            console.error('Error marking quotation as lost:', err);
            this.notificationService.error('Failed to mark quotation as lost: ' + (err?.message || 'Unknown error'));
        } finally {
            this.submittingLost = false;
        }
    }

    calculateSubtotal(): number {
        if (!this.quote) return 0;
        let subtotal = this.quote.premium.base + this.quote.premium.riskLoading;
        (this.quote.premium.discounts || []).forEach((d: any) => subtotal += d.amount);
        (this.quote.premium.addonCharges || []).forEach((a: any) => subtotal += a.amount);
        return subtotal;
    }

    getStatusConfig(status: string): any {
        const configs: any = {
            draft: { color: 'gray', label: 'Draft' },
            sent: { color: 'blue', label: 'Sent' },
            viewed: { color: 'purple', label: 'Viewed' },
            accepted: { color: 'green', label: 'Accepted' },
            rejected: { color: 'red', label: 'Rejected' },
            expired: { color: 'orange', label: 'Expired' },
            lost: { color: 'red', label: 'Lost' }
        };

        const config = configs[status] || configs.draft;
        return {
            ...config,
            label: this.quote?.stage || config.label
        };
    }

    goBack(): void {
        const user = this.authService.currentUserValue;
        const basePath = user?.role === 'broker' ? '/dashboard/broker' : '/dashboard/customer';
        this.router.navigate([`${basePath}/quotations`]);
    }

    get isBroker(): boolean {
        return this.authService.currentUserValue?.role === 'broker';
    }

    get statusConfig(): any {
        return this.getStatusConfig(this.quote?.status || 'draft');
    }

    onMessageSent(): void {
        this.refreshTrigger++;
    }
}
