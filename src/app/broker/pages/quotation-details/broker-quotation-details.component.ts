import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CrmService } from '../../../core/services/crm.service';
import { QuoteService } from '../../../core/services/quote.service';
import { PolicyService } from '../../../core/services/policy.service';
import {
    transformQuotationData,
    QuotationApiResponse,
    QuotationDisplayData
} from '../../../core/services/utils/quotation-transformer';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-broker-quotation-details',
    templateUrl: './broker-quotation-details.component.html',
    styleUrls: ['./broker-quotation-details.component.css']
})
export class BrokerQuotationDetailsComponent implements OnInit {
    quotationId: string = '';
    quotation: any = null;
    proposals: any[] = [];
    loading = true;
    error: string | null = null;

    // Transformed display data
    displayData: QuotationDisplayData | null = null;

    // Chat functionality
    messages: any[] = []
        ;
    newMessage: string = '';
    selectedFile: File | null = null;
    sendingMessage: boolean = false;

    // Collapse states
    isPolicyConditionsCollapsed: boolean = true;
    isRequiredDocumentsCollapsed: boolean = true;
    isProposalsCollapsed: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private crmService: CrmService,
        private quoteService: QuoteService,
        private policyService: PolicyService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.quotationId = this.route.snapshot.params['id'];
        this.loadQuotation();
    }

    async loadQuotation(): Promise<void> {
        if (!this.quotationId) return;

        this.loading = true;
        this.error = null;

        try {
            // Fetch quotation details
            const quoteRes = await this.crmService.getQuotation(Number(this.quotationId)).toPromise();
            this.quotation = quoteRes?.result?.data || quoteRes?.data || quoteRes;

            // Transform the raw API response to display-ready format
            if (this.quotation) {
                this.displayData = transformQuotationData(this.quotation as QuotationApiResponse);
            }

            // Fetch proposals from API response
            if (this.quotation && this.quotation.opportunity_proposal) {
                // Map opportunity_proposal to display format
                this.proposals = this.quotation.opportunity_proposal.map((prop: any, index: number) => ({
                    company: prop.proposal_company_name || `Insurance Provider ${index + 1}`,
                    type: prop.proposal_type || 'Standard',
                    premium: this.formatCurrency(prop.proposal_gross_premium),
                    netPremium: this.formatCurrency(prop.proposal_net_premium),
                    coverage: this.formatCurrency(prop.proposal_sum_insured),
                    deductible: prop.proposal_deductible ? this.formatCurrency(prop.proposal_deductible) : 'N/A',
                    taxes: this.formatCurrency(prop.proposal_tax_amount),
                    fees: this.formatCurrency(prop.proposal_fees),
                    state: prop.proposal_state || prop.state || 'Pending'
                }));
            } else {
                this.proposals = [];
            }

        } catch (err: any) {
            console.error('Failed to load quotation details', err);
            this.error = 'Failed to load quotation details. Please try again.';
        } finally {
            this.loading = false;
        }
    }

    async downloadQuotation(): Promise<void> {
        // Implement PDF download if API available, currently placeholder
        console.log('Downloading quotation PDF...');
    }

    goBack(): void {
        this.router.navigate(['/dashboard/broker/quotations']);
    }

    isStageNew(): boolean {
        return this.displayData?.header?.stage?.toLowerCase() === 'new';
    }

    editQuotation(): void {
        // Navigate to quote flow with the quotation ID to continue editing
        this.router.navigate(['/dashboard/broker/quote/new'], {
            queryParams: {
                quotationId: this.quotationId,
                edit: true
            }
        });
    }

    getUploadedCount(): number {
        if (!this.displayData || !this.displayData.documents) return 0;
        return this.displayData.documents.filter(doc => doc.status === 'Uploaded').length;
    }

    formatCurrency(value: number | null | undefined): string {
        if (value === null || value === undefined || isNaN(value)) {
            return '0 EGP';
        }
        const formatted = value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${formatted} EGP`;
    }

    getStatusClass(status: string): string {
        const classes: any = {
            'draft': 'bg-gray-100 text-gray-800',
            'sent': 'bg-blue-100 text-blue-800',
            'accepted': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'expired': 'bg-gray-100 text-gray-800'
        };
        return classes[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    }

    getProposalStateClass(state: string): string {
        const stateClasses: any = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'draft': 'bg-gray-100 text-gray-800',
            'sent': 'bg-blue-100 text-blue-800',
            'accepted': 'bg-green-100 text-green-800'
        };
        return stateClasses[state?.toLowerCase()] || 'bg-yellow-100 text-yellow-800';
    }

    // Chat methods
    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    removeFile(): void {
        this.selectedFile = null;
    }

    async sendMessage(): Promise<void> {
        if (!this.newMessage.trim() || this.sendingMessage) return;

        this.sendingMessage = true;

        try {
            // Prepare attachments if file is selected
            const attachments: any[] = [];
            if (this.selectedFile) {
                const base64 = await this.fileToBase64(this.selectedFile);
                attachments.push({
                    name: this.selectedFile.name,
                    datas: base64,
                    mimetype: this.selectedFile.type
                });
            }

            // Call the API
            await this.crmService.postChatterMessage(
                Number(this.quotationId),
                this.newMessage,
                attachments
            ).toPromise();

            // Add message to local list
            this.messages.push({
                userName: 'You',
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                message: this.newMessage,
                attachment: this.selectedFile ? this.selectedFile.name : null
            });

            // Clear input
            this.newMessage = '';
            this.selectedFile = null;

        } catch (err: any) {
            console.error('Failed to send message', err);

            // Check if it's a 404 error
            if (err.status === 404) {
                this.notificationService.error('The chat API endpoint is not available on the backend to send messages.');
            } else if (err.status === 400) {
                this.notificationService.error(`Bad Request: ${err.error?.message || err.error?.error || 'Invalid request parameters'}`);
            } else {
                this.notificationService.error(`Failed to send message: ${err.error?.message || err.message || 'Please try again.'}`);
            }

            // For testing: Still add message locally even if API fails
            // Remove this in production once API is working
            this.messages.push({
                userName: 'You (Not Sent)',
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                message: this.newMessage,
                attachment: this.selectedFile ? this.selectedFile.name : null
            });

            this.newMessage = '';
            this.selectedFile = null;
        } finally {
            this.sendingMessage = false;
        }
    }

    private fileToBase64(file: File): Promise<string> {
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
}
