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

    // Mark as Lost state
    isLostModalOpen = false;
    lostReasons: any[] = [];
    selectedLostReason: any = null;
    lostFeedback: string = '';
    lostLoading = false;

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

    downloading = false;

    async downloadQuotation(): Promise<void> {
        if (!this.quotation?.opportunity_proposal?.length) {
            this.notificationService.warning('No proposal documents available to download.');
            return;
        }

        const proposal = this.quotation.opportunity_proposal[0];
        const proposalId = proposal.id || proposal.proposal_id;

        if (!proposalId) {
            this.notificationService.error('Analysis failed: Proposal ID is missing.');
            return;
        }

        try {
            this.downloading = true;
            const blob = await this.quoteService.downloadProposalPdf(Number(proposalId)).toPromise();

            // Create blob and download
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Quotation_${this.displayData?.header?.opportunityNumber || this.quotationId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error: any) {
            console.error('Error downloading quotation PDF:', error);
            console.error('Error Details:', {
                status: error.status,
                statusText: error.statusText,
                url: error.url,
                headers: error.headers ? error.headers.keys() : 'N/A'
            });
            this.notificationService.error('Failed to download quotation PDF. Please try again.');
        } finally {
            this.downloading = false;
        }
    }

    goBack(): void {
        this.router.navigate(['/dashboard/broker/quotations']);
    }

    isStageNew(): boolean {
        return this.displayData?.header?.stage?.toLowerCase() === 'new';
    }

    isStageLostAllowed(): boolean {
        const stage = this.displayData?.header?.stage?.toLowerCase();
        return stage !== 'won' && stage !== 'approved';
    }

    async loadLostReasons(): Promise<void> {
        try {
            const res = await this.crmService.getLostReasons().toPromise();
            const raw = res?.result?.data || res?.data || res;

            // Map list similar to quote flow
            if (Array.isArray(raw)) {
                this.lostReasons = raw;
            } else if (raw && typeof raw === 'object') {
                if (raw.items && Array.isArray(raw.items)) this.lostReasons = raw.items;
                else if (raw.data && Array.isArray(raw.data)) this.lostReasons = raw.data;
                else {
                    const key = Object.keys(raw).find(k => Array.isArray(raw[k]));
                    if (key) this.lostReasons = raw[key];
                    else this.lostReasons = [];
                }
            } else {
                this.lostReasons = [];
            }

            // Normalize structure
            this.lostReasons = this.lostReasons.map(item => ({
                id: item.id,
                name: item.item || item.name || item.value || item.display || item.label
            }));

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
        if (!this.quotationId || !this.selectedLostReason) return;

        this.lostLoading = true;
        try {
            await this.crmService.markLost(
                Number(this.quotationId),
                this.selectedLostReason,
                this.lostFeedback
            ).toPromise();

            this.closeLostModal();
            this.notificationService.success('Quotation marked as lost successfully');

            // Reload quotation to update status
            this.loadQuotation();
        } catch (err) {
            console.error('Failed to mark as lost', err);
            this.notificationService.error('Failed to mark as lost. Please try again.');
        } finally {
            this.lostLoading = false;
        }
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
            const response = await this.crmService.postChatterMessage(
                Number(this.quotationId),
                this.newMessage,
                attachments
            ).toPromise();

            // Check for error in 200 OK response
            if (response && (response.error || (response.result && response.result.error) || response.success === false)) {
                let errorMessage = response.error || (response.result && response.result.error) || 'Failed to send message';

                if (typeof errorMessage === 'string' && errorMessage.includes('security restrictions')) {
                    errorMessage = 'You do not have permission to perform this action.';
                }

                this.notificationService.error(errorMessage);
                return;
            }

            // Add message to local list
            this.messages.push({
                userName: 'You',
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
