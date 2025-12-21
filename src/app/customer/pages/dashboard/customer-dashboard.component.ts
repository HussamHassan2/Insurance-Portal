import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';
import { PolicyService } from '../../../core/services/policy.service';
import { ClaimService } from '../../../core/services/claim.service';
import { QuoteService } from '../../../core/services/quote.service'; // Assuming this export exists
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-customer-dashboard',
    templateUrl: './customer-dashboard.component.html',
    styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
    user: User | null = null;
    loading = true;

    stats = [
        {
            title: 'Total Policies',
            value: '0',
            icon: 'shield',
            color: 'bg-blue-500',
            change: '+0%'
        },
        {
            title: 'Active Claims',
            value: '0',
            icon: 'file-text',
            color: 'bg-green-500',
            change: '+0%'
        },
        {
            title: 'Pending Payments',
            value: '$0', // React app might have currency logic
            icon: 'credit-card',
            color: 'bg-yellow-500',
            change: '+0%'
        },
        {
            title: 'Quotations',
            value: '0',
            icon: 'scroll-text',
            color: 'bg-purple-500',
            change: '+0%'
        }
    ];

    recentActivities = [
        { title: 'Welcome to Orient Insurance Portal', description: 'Get started by exploring your dashboard', time: 'Just now', type: 'info' }
    ];

    constructor(
        private authService: AuthService,
        private policyService: PolicyService,
        private claimService: ClaimService,
        private quoteService: QuoteService
    ) { }

    ngOnInit(): void {
        this.authService.currentUser.subscribe(user => {
            this.user = user;
            if (user) {
                this.loadDashboardData(user.id);
            }
        });
    }

    loadDashboardData(userId: number): void {
        this.loading = true;

        // Parallel requests
        forkJoin({
            policies: this.policyService.listPolicies({ user_id: userId, user_type: 'customer', limit: 100 }), // Get enough to count
            claims: this.claimService.listClaims({ user_id: userId, user_type: 'customer', limit: 100 }),
            quotes: this.quoteService.listQuotations({ user_id: userId, user_type: 'customer', limit: 100 })
        }).subscribe({
            next: (results) => {
                const policies = results.policies?.result?.data?.policies || [];
                const claims = results.claims?.result?.data?.claims || [];
                const quotes = results.quotes?.result?.data?.quotations || [];

                // Update details
                this.stats[0].value = policies.length.toString();
                this.stats[0].change = `+${policies.filter((p: any) => new Date(p.date).getMonth() === new Date().getMonth()).length} this month`;

                this.stats[1].value = claims.filter((c: any) => c.stage_name !== 'Closed').length.toString();

                // Mocking payments for now as API might be different, but using quotes count
                this.stats[3].value = quotes.length.toString();
                this.stats[3].change = `+${quotes.filter((q: any) => new Date(q.date).getMonth() === new Date().getMonth()).length} this month`;

                // Logic for pending payments could be derived from unpaid policies/quotes, setting to 0 or derived if possible
                const unpaid = policies.filter((p: any) => p.payment_state === 'not_paid').length;
                this.stats[2].value = unpaid.toString();

                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading dashboard data', err);
                this.loading = false;
            }
        });
    }
}
