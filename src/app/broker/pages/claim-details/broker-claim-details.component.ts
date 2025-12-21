import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-broker-claim-details',
    templateUrl: './broker-claim-details.component.html',
    styles: []
})
export class BrokerClaimDetailsComponent implements OnInit {
    claimId: string | null = null;
    claim: any = null;
    loading = true;
    error: string | null = null;
    status: string = 'under_assessment';
    activeTab: string = 'overview';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private claimService: ClaimService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.claimId = this.route.snapshot.paramMap.get('id');
        this.loadClaimDetails();
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    loadClaimDetails(): void {
        if (!this.claimId) return;

        this.loading = true;
        // Convert claimId to number if possible, as API expects number
        const numericId = parseInt(this.claimId, 10);

        if (isNaN(numericId)) {
            this.error = 'Invalid Claim ID';
            this.loading = false;
            return;
        }

        this.claimService.getClaim(numericId).subscribe({
            next: (response) => {
                console.log('Claim details response:', response);
                const apiData = response.result || response.data || response;

                if (apiData) {
                    this.mapClaimData(apiData);
                } else {
                    this.error = 'No claim data found';
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching claim details:', err);
                this.error = 'Failed to load claim details';
                this.notificationService.error('Failed to load claim details');
                this.loading = false;
            }
        });
    }

    mapClaimData(apiData: any): void {
        this.claim = {
            id: apiData.id || this.claimId,
            claimNumber: apiData.claim_number || 'N/A',
            claimType: apiData.product_name || 'Motor Insurance',
            claimDate: apiData.intimation_date || 'N/A',
            receivedDate: apiData.received_date || 'N/A',
            deliveredDate: apiData.delivered_date || 'N/A',
            reportedDate: apiData.intimation_date || 'N/A',
            lossDate: apiData.date_of_loss || 'N/A',
            status: (apiData.state || 'draft').toLowerCase().replace(/\s+/g, '_'),
            state: apiData.state || 'Intimated',
            priority: apiData.severity ? (apiData.severity.toLowerCase() === 'high' ? 'high' : 'medium') : 'medium',
            paidOn: apiData.claim_paid_on || 'Not Paid',
            source: apiData.claim_source || 'N/A',
            intimationMode: apiData.intimation_mode || 'N/A',
            calculationType: apiData.calculation_type || 'N/A',
            withoutObligation: apiData.without_obligation || false,
            invoiceDate: apiData.received_invoice_date || 'N/A',

            intimator: {
                isInsured: apiData.intimator_is_insured,
                name: apiData.intimator_name || 'N/A',
                phone: apiData.intimator_phone || 'N/A',
                address: apiData.intimator_address || 'N/A',
                relation: apiData.relative || 'N/A'
            },

            claimant: {
                name: apiData.customer_name || 'N/A',
                code: apiData.customer_code || 'N/A',
                phone: apiData.customer_mobile || 'N/A',
                email: 'N/A',
                beneficiary: apiData.beneficiary_name || 'N/A'
            },

            policy: {
                id: apiData.policy_number || 'N/A',
                applicationNumber: apiData.application_number || 'N/A',
                type: apiData.product_name || 'Motor Insurance',
                productCode: apiData.product_code || 'N/A',
                lob: apiData.lob || 'N/A',
                transactionType: apiData.policy_transaction_type || 'N/A',
                status: apiData.policy_payment_status || 'Active',
                effectiveFrom: apiData.policy_effective_from || 'N/A',
                effectiveTo: apiData.policy_effective_to || 'N/A',
                approveDate: apiData.policy_approve_date || 'N/A',
                paymentDate: apiData.policy_payment_date || 'N/A',
                sumInsured: apiData.risk_sum_insured || 0,
                currency: apiData.currency || 'EGP',
                brokerName: apiData.broker_name || 'Direct',
                brokerCode: apiData.broker_code || 'N/A',
                branch: apiData.branch || 'Head Office',
                paymentStatus: apiData.policy_payment_status || 'N/A',
                sourceOfBusiness: apiData.source_of_business || 'broker'
            },

            vehicle: {
                plateNumber: apiData.vehicle_plate_number || 'N/A',
                chassisNumber: apiData.vehicle_chassis_number || 'N/A',
                motorNumber: apiData.vehicle_motor_number || 'N/A',
                make: apiData.vehicle_make || 'N/A',
                model: apiData.vehicle_model || 'N/A',
                category: apiData.vehicle_category || 'N/A',
                cc: apiData.vehicle_cc || 'N/A',
                year: apiData.vehicle_manufacturing_year || 'N/A',
                marketValue: apiData.vehicle_market_value || 'N/A',
                bodyType: apiData.vehicle_body_type || 'N/A', // Assuming field name if not in sample
                licenceStart: apiData.vehicle_licence_start_date || 'N/A',
                licenceExpiry: apiData.vehicle_licence_expiration_date || 'N/A'
            },

            incident: {
                date: apiData.date_of_loss || 'N/A',
                location: apiData.accident_address || [apiData.accident_city, apiData.accident_governorate].filter(Boolean).join(', ') || 'N/A',
                city: apiData.accident_city || 'N/A',
                governorate: apiData.accident_governorate || 'N/A',
                description: apiData.accident_description || apiData.initial_damage_description || 'N/A',
                initialDamage: apiData.initial_damage_description || 'N/A',
                causeOfLoss: apiData.cause_of_loss || 'N/A',
                natureOfLoss: apiData.nature_of_loss || 'N/A',
                severity: apiData.severity || 'Normal',
                surveyDate: apiData.requested_survey_date || 'N/A',
                estimatedCost: 0,
                /* Police Report */
                policeReportNumber: apiData.police_report_number || 'N/A',
                policeReportCity: apiData.police_report_city || 'N/A',
                policeReportDescription: apiData.police_report_description || 'N/A'
            },

            driver: {
                name: apiData.driver_name || 'N/A',
                birthDate: apiData.driver_birth_date || 'N/A',
                gender: apiData.driver_gender || 'N/A',
                licenceType: apiData.driver_licence_type || 'N/A',
                licenceStart: apiData.driver_licence_start_date || 'N/A',
                licenceExpiry: apiData.driver_licence_expiration_date || 'N/A'
            },

            workshop: {
                name: apiData.workshop || 'N/A',
                address: apiData.workshop_address || 'N/A',
                phone: apiData.workshop_number || 'N/A'
            },

            documents: (apiData.claim_documents || []).map((doc: any) => ({
                id: doc.id,
                name: doc.document_name,
                type: 'Document',
                size: 'N/A',
                lastUpdated: doc.last_updated_on,
                updatedBy: doc.last_updated_by,
                hasFiles: doc.documents_base64 && doc.documents_base64.length > 0
            })),

            timeline: [
                { event: 'Claim Intimated', date: apiData.intimation_date || 'N/A', status: 'completed', icon: 'file-text' },
                { event: 'Under Assessment', date: 'Pending', status: 'current', icon: 'clock' },
                { event: 'Decision Made', date: '-', status: 'pending', icon: 'check-circle' }
            ]
        };

        this.status = this.claim.status;
    }

    getStatusClass(status: string): string {
        const lowerStatus = status?.toLowerCase() || '';
        if (lowerStatus.includes('paid') || lowerStatus.includes('approved') || lowerStatus.includes('settled')) {
            return 'bg-green-100 text-green-800';
        }
        if (lowerStatus.includes('reject') || lowerStatus.includes('declined')) {
            return 'bg-red-100 text-red-800';
        }
        if (lowerStatus.includes('new') || lowerStatus.includes('intimated')) {
            return 'bg-blue-100 text-blue-800';
        }
        return 'bg-yellow-100 text-yellow-800';
    }

    goBack(): void {
        this.router.navigate(['/dashboard/broker/claims']);
    }

    isBroker(): boolean {
        const user = this.authService.currentUserValue;
        return user?.role === 'broker' || user?.role === 'admin';
    }

    approveClaim(): void {
        if (!this.claimId) return;
        this.loading = true;
        // In a real app, this would call a service method
        setTimeout(() => {
            this.notificationService.success('Claim approved successfully!');
            this.loadClaimDetails(); // Reload to get updated status
            this.loading = false;
        }, 1000);
    }

    rejectClaim(): void {
        if (!this.claimId) return;
        this.loading = true;
        // In a real app, this would call a service method
        setTimeout(() => {
            this.notificationService.error('Claim rejected.');
            this.loadClaimDetails(); // Reload to get updated status
            this.loading = false;
        }, 1000);
    }
}
