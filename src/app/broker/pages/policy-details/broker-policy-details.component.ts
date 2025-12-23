import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService } from '../../../core/services/policy.service';
import { QuoteService } from '../../../core/services/quote.service';
import { CrmService } from '../../../core/services/crm.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-broker-policy-details',
    templateUrl: './broker-policy-details.component.html',
    styleUrls: ['./broker-policy-details.component.css']
})
export class BrokerPolicyDetailsComponent implements OnInit {
    policyId: string = '';
    policy: any = null;
    loading = true;
    error: string | null = null;
    activeTab = 'overview';
    downloading = false;
    renewalRequest: any = null;
    renewalLoading = false;
    renewalError: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private policyService: PolicyService,
        private quoteService: QuoteService,
        private crmService: CrmService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.policyId = this.route.snapshot.params['id'];
        this.loadPolicyDetails();
    }

    async loadPolicyDetails(): Promise<void> {
        if (!this.policyId) return;

        try {
            this.loading = true;
            this.error = null;

            const res = await this.policyService.getPolicy(Number(this.policyId)).toPromise();
            const apiData = res?.result?.data || res?.data || res;

            if (!apiData) {
                this.error = 'No policy data found';
                this.loading = false;
                return;
            }

            const riskData = apiData.policy_risks?.[0] || {};
            const premiumSummary = apiData.policy_premium_summary?.[0] || {};
            const riskPremiumSummary = apiData.policy_risk_premium_summary?.[0] || {};

            // Map policy data
            // Map policy data
            this.policy = {
                id: apiData.policy_number || apiData.parent_policy_number || apiData.id || this.policyId,
                policyNumber: apiData.policy_number || apiData.parent_policy_number || 'Draft',
                status: (apiData.policy_state || 'draft').toLowerCase(),
                transactionType: apiData.transaction_type || 'N/A',
                issueDate: apiData.issue_date || 'N/A',
                approveDate: apiData.approve_date || 'N/A',
                effectiveDate: apiData.effective_from_date || 'N/A',
                expiryDate: apiData.effective_to_date || 'N/A',
                lob: 'Motor Insurance',
                productName: apiData.product_name || 'N/A',
                branchName: apiData.issuing_branch || 'N/A',
                salesPerson: apiData.sales_person || 'N/A',
                salesTeam: apiData.sales_team || 'N/A',
                currency: apiData.currency || 'EGP',

                policyHolder: {
                    name: apiData.customer_name || apiData.insured_name || 'N/A',
                    nationalId: apiData.customer_national_id || 'N/A',
                    dateOfBirth: riskData.date_of_birth || 'N/A',
                    phone: riskData.phone || 'N/A',
                    email: riskData.email || 'N/A',
                    address: apiData.customer_address || 'N/A',
                    group: apiData.customer_group || 'N/A',
                    activity: apiData.customer_activity || 'N/A'
                },

                vehicle: {
                    make: riskData.vehicle_make_name || riskData.vehicle_make || 'N/A',
                    model: riskData.vehicle_model_name || riskData.vehicle_model || 'N/A',
                    year: riskData.vehicle_manufacturing_year || 'N/A',
                    category: riskData.vehicle_category_name || riskData.vehicle_category || 'N/A',
                    plateNumber: riskData.plate_number || riskData.vehicle_plate_number || 'N/A',
                    chassisNumber: riskData.vehicle_chassis_number || 'N/A',
                    engineNumber: riskData.vehicle_engine_number || 'N/A',
                    color: riskData.vehicle_color || 'N/A',
                    bodyType: riskData.vehicle_body_type_name || riskData.vehicle_body_type || 'N/A',
                    fuelType: riskData.vehicle_fuel_type_name || riskData.vehicle_fuel_type || 'N/A',
                    cc: riskData.vehicle_cc_name || riskData.vehicle_cc || 'N/A',
                    seats: riskData.vehicle_number_of_seats || 5,
                    usage: riskData.vehicle_usage_name || riskData.vehicle_usage || 'N/A',
                    estimatedValue: riskData.vehicle_sum_insured || 0,
                    kilometres: riskData.vehicle_kilometres || 0,
                    roadSide: riskData.vehicle_has_road_side_program ? 'Included' : 'Not Included',
                    roadSideProgram: riskData.vehicle_road_side_program_name || 'N/A'
                },

                coverage: {
                    type: apiData.product_name || 'Comprehensive',
                    sumInsured: riskData.vehicle_sum_insured || 0,
                    deductible: riskData.deductible || 0, // Fallback if not in risks
                    startDate: apiData.effective_from_date || 'N/A',
                    endDate: apiData.effective_to_date || 'N/A',
                    duration: apiData.policy_period_in_days ? `${apiData.policy_period_in_days} Days` : '12 Months',
                    extensions: apiData.policy_conditions?.map((c: any) => c.condition_name || c.name).filter(Boolean) || [],
                    risks: apiData.policy_risks || [],
                    conditions: apiData.policy_conditions || []
                },

                premium: {
                    base: premiumSummary.net_premium || riskPremiumSummary.net_premium || 0,
                    discounts: [],
                    loadings: [],
                    taxes: [],
                    fees: apiData.issue_fees || 0,
                    total: (() => {
                        let t = apiData.gross_premium || premiumSummary.gross_premium || 0;
                        // Fallback: Try to find Gross Premium in charges
                        if (!t && apiData.policy_charges) {
                            const gross = apiData.policy_charges.find((c: any) =>
                                c.charge_name?.toLowerCase() === 'gross premium'
                            );
                            if (gross) t = gross.charge_value;
                        }
                        return t;
                    })(),
                    breakdown: (() => {
                        // Deduplicate charges based on charge_code
                        const charges = apiData.policy_charges || [];
                        const unique = new Map();
                        charges.forEach((c: any) => {
                            // Use code if available, else name
                            const key = c.charge_code || c.charge_name;
                            if (key && !unique.has(key)) {
                                unique.set(key, c);
                            }
                        });
                        return Array.from(unique.values());
                    })()
                },

                payments: [],
                history: [],

                invoicePaid: apiData.payment_status === 'paid',
                current: apiData.is_current || false,
                isRenewal: apiData.policy_renewal_version > 0,
                parentPolicyNumber: apiData.parent_policy_number || null,
                policyVersion: apiData.policy_version || 1,
                daysToRenew: this.calculateDaysToRenew(apiData.effective_to_date),
                broker: apiData.broker_name || 'N/A',
                paymentStatus: apiData.payment_status || 'outstanding'
            };

            // Fetch renewal requests
            // await this.loadRenewalRequests();

            this.loading = false;
        } catch (err: any) {
            console.error('Error fetching policy details:', err);
            this.error = err?.message || 'Failed to load policy details';
            this.loading = false;
        }
    }

    async loadRenewalRequests(): Promise<void> {
        const user = this.authService.currentUserValue;
        if (!user?.id) return;

        try {
            this.renewalLoading = true;
            this.renewalError = null;

            const response = await this.crmService.getRenewalRequests({
                user_id: user.id,
                user_type: 'broker',
                limit: 10,
                offset: 0,
                domain: JSON.stringify([['policy_id', '=', this.policyId]])
            }).toPromise();

            const renewalData = response?.result?.data || response?.data || response;

            if (Array.isArray(renewalData)) {
                const policyRenewal = renewalData.find((r: any) =>
                    r.policy_id === this.policyId ||
                    r.policy_number === this.policy.policyNumber
                );
                this.renewalRequest = policyRenewal || null;
            } else if (renewalData) {
                this.renewalRequest = renewalData;
            }
        } catch (err: any) {
            console.error('Error fetching renewal requests:', err);
            this.renewalError = err?.message || 'Failed to load renewal information';
        } finally {
            this.renewalLoading = false;
        }
    }

    calculateDaysToRenew(endDate: string): number | null {
        if (!endDate) return null;

        try {
            const expiryDate = new Date(endDate);
            const currentDate = new Date();
            const diffTime = expiryDate.getTime() - currentDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (e) {
            console.error('Error calculating days to renewal:', e);
            return null;
        }
    }

    async handleDownloadPdf(): Promise<void> {
        try {
            this.downloading = true;
            const blob = await this.policyService.downloadPolicyPdf(Number(this.policyId)).toPromise();

            // Create blob and download
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Policy_${this.policy?.policyNumber || this.policyId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading policy PDF:', error);
            this.notificationService.error('Failed to download policy PDF. Please try again.');
        } finally {
            this.downloading = false;
        }
    }

    async handleRenewPolicy(): Promise<void> {
        try {
            this.renewalLoading = true;
            this.renewalError = null;

            const response = await this.policyService.renewPolicy(this.policy.policyNumber).toPromise();
            const result = response?.result || response;

            if (result && result.success === true) {
                this.notificationService.success(`Renewal Request Created Successfully!`);
                window.location.reload();
            } else {
                const errorMessage = result?.error || result?.message || 'Failed to create renewal request';
                this.notificationService.error(errorMessage);
                this.renewalError = errorMessage;
            }
        } catch (err: any) {
            console.error('Error creating renewal request:', err);
            const backendError = err?.error?.result?.error ||
                err?.error?.error ||
                err?.error?.message ||
                err?.message ||
                'Failed to create renewal request';
            this.notificationService.error(backendError);
            this.renewalError = backendError;
        } finally {
            this.renewalLoading = false;
        }
    }

    goBack(): void {
        this.router.navigate(['/dashboard/broker/policies']);
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    endorsePolicy(): void {
        this.router.navigate(['/dashboard/broker/endorsement', this.policyId]);
    }

    calculateNetPremium(): number {
        if (!this.policy) return 0;
        let net = this.policy.premium.base;
        this.policy.premium.discounts.forEach((d: any) => net += d.amount);
        this.policy.premium.loadings.forEach((l: any) => net += l.amount);
        return net;
    }

    getRenewalButtonText(): string {
        if (this.renewalLoading) return 'Processing...';
        if (this.renewalRequest) return 'Renewal Requested';
        return 'Renew Policy';
    }

    canRenew(): boolean {
        return !this.renewalRequest && !this.renewalLoading;
    }

    getRiskCoverAmount(risk: any): number {
        // Try to find specific Comprehensive cover first
        const compCover = risk.risk_covers?.find((c: any) =>
            c.cover_name?.toLowerCase().includes('comprehensive') ||
            c.cover_name?.toLowerCase().includes('own damage')
        );
        return compCover ? compCover.si_now : (risk.vehicle_sum_insured || 0);
    }
}
