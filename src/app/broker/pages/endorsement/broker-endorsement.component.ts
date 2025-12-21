import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EndorsementService, EndorsementType, EndorsementReason } from '../../../core/services/endorsement.service';
import { PolicyService } from '../../../core/services/policy.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppTranslateService } from '../../../core/services/app-translate.service';

declare var lucide: any;

@Component({
    selector: 'app-broker-endorsement',
    templateUrl: './broker-endorsement.component.html',
    styles: []
})
export class BrokerEndorsementComponent implements OnInit, AfterViewChecked {
    policyId: string = '';
    policyNumber: string = '';
    loading = false;
    submitting = false;
    error: string | null = null;
    pageLoading = true;

    types: EndorsementType[] = [];
    reasons: EndorsementReason[] = [];

    formData = {
        end_sub_type_code: '',
        endorsement_reason_id: '',
        effective_from_date: new Date().toISOString().split('T')[0],
        remarks: ''
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private endorsementService: EndorsementService,
        private policyService: PolicyService,
        private notificationService: NotificationService,
        private appTranslate: AppTranslateService
    ) { }

    ngOnInit(): void {
        this.policyId = this.route.snapshot.params['id'];
        if (this.policyId) {
            this.loadInitialData();
        } else {
            this.error = 'BROKER.ENDORSEMENT.ERROR.POLICY_MISSING';
            this.pageLoading = false;
        }
    }

    async loadInitialData(): Promise<void> {
        try {
            // Fetch policy details to get the real policy number
            const policyRes = await this.policyService.getPolicy(Number(this.policyId)).toPromise();
            const policyData = policyRes?.result?.data || policyRes?.data || policyRes || {};

            this.policyNumber = policyData.policy_number || policyData.name || policyData.policyId || this.policyId;

            // Fetch endorsement types
            const types = await this.endorsementService.getEndorsementTypes().toPromise();
            this.types = types || [];

            this.pageLoading = false;
        } catch (err) {
            console.error('Failed to load initial data', err);
            this.error = 'BROKER.ENDORSEMENT.ERROR.LOAD_FAILED';
            this.pageLoading = false;
        }
    }

    async onTypeChange(typeCode: string): Promise<void> {
        this.formData.end_sub_type_code = typeCode;
        this.formData.endorsement_reason_id = '';
        this.formData.remarks = '';
        this.reasons = [];

        if (!typeCode) return;

        try {
            const reasons = await this.endorsementService.getEndorsementReasons(typeCode).toPromise();
            this.reasons = reasons || [];
        } catch (err) {
            console.error('Failed to load reasons', err);
        }
    }

    onReasonChange(reasonId: string | number): void {
        this.formData.endorsement_reason_id = String(reasonId);

        const selectedReason = this.reasons.find(r => String(r.id) === String(reasonId));
        if (selectedReason) {
            this.formData.remarks = selectedReason.title || selectedReason.name || '';
        }
    }

    async submit(): Promise<void> {
        if (!this.formData.end_sub_type_code || !this.formData.endorsement_reason_id || !this.formData.effective_from_date) {
            this.error = 'BROKER.ENDORSEMENT.ERROR.REQUIRED_FIELDS';
            this.notificationService.warning(this.appTranslate.instant('BROKER.ENDORSEMENT.ERROR.REQUIRED_FIELDS'));
            return;
        }

        this.submitting = true;
        this.error = null;

        try {
            const payload = {
                params: {
                    data: {
                        policy_number: this.policyNumber,
                        lead_source: 'Web Portal',
                        endorsement_data: {
                            calculation_type: 'prorata',
                            end_sub_type_code: this.formData.end_sub_type_code,
                            endorsement_reason_id: Number(this.formData.endorsement_reason_id),
                            effective_from_date: this.formData.effective_from_date,
                            remarks: this.formData.remarks || ''
                        }
                    }
                }
            };

            const response: any = await this.endorsementService.createEndorsement(payload).toPromise();

            // Check for JSON-RPC error in 200 OK response
            if (response?.error) {
                const specificMsg = response.error.data?.message || response.error.message;
                throw new Error(specificMsg || 'BROKER.ENDORSEMENT.ERROR.CREATION_FAILED');
            }

            this.notificationService.success(this.appTranslate.instant('BROKER.ENDORSEMENT.SUCCESS_MSG'));
            this.router.navigate(['/dashboard/broker/quotations']);

        } catch (err: any) {
            console.error('Failed to submit endorsement', err);

            // Try to extract the specific Odoo error message
            let errorMsg = 'BROKER.ENDORSEMENT.ERROR.SUBMISSION_FAILED';

            if (err?.error?.error?.data?.message) {
                errorMsg = err.error.error.data.message;
            } else if (err?.error?.data?.message) {
                errorMsg = err.error.data.message;
            } else if (err?.error?.message) {
                errorMsg = err.error.message;
            } else if (err?.message) {
                errorMsg = err.message;
            }

            this.error = errorMsg;
            // If the error message is our key, translate it. Otherwise use as is.
            const translatedError = errorMsg === 'BROKER.ENDORSEMENT.ERROR.SUBMISSION_FAILED'
                ? this.appTranslate.instant(errorMsg)
                : errorMsg;

            this.notificationService.error(translatedError);
        } finally {
            this.submitting = false;
        }
    }

    goBack(): void {
        this.router.navigate(['/dashboard/broker/policies', this.policyId]);
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}
