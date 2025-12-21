import { Component, OnInit, AfterViewChecked, ViewChild } from '@angular/core';
import { AuthService, User } from 'src/app/core/services/auth.service';
import { PolicyService } from 'src/app/core/services/policy.service';
import { CrmService } from 'src/app/core/services/crm.service';
import { ClaimService } from 'src/app/core/services/claim.service';
import { forkJoin } from 'rxjs';
import { ChartConfiguration, ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

declare var lucide: any;

@Component({
    selector: 'app-analytics-dashboard',
    templateUrl: './analytics-dashboard.component.html',
    styles: []
})
export class AnalyticsDashboardComponent implements OnInit, AfterViewChecked {
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

    user: User | null = null;
    loading = false;
    dateRange = '30';

    // Data
    claims: any[] = [];
    opportunities: any[] = [];
    quotations: any[] = [];
    policies: any[] = [];

    // KPIs
    kpis = {
        totalPolicies: 0,
        netPremium: 0,
        grossPremium: 0,
        activeClaims: 0,
        claimsPercentage: 0,
        openOpportunities: 0,
        conversionRate: 0,
        pendingQuotations: 0,
        dueForRenewal: 0
    };

    // Chart Options
    barChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true },
        }
    };

    pieChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right' }
        }
    };

    // Chart Data
    pipelineData: ChartData<'bar'> = { labels: [], datasets: [] };
    salesPersonData: ChartData<'bar'> = { labels: [], datasets: [] };
    quoteStatusData: ChartData<'pie'> = { labels: [], datasets: [] };
    premiumData: ChartData<'bar'> = { labels: [], datasets: [] };
    claimsStatusData: ChartData<'pie'> = { labels: [], datasets: [] };
    claimsLobData: ChartData<'bar'> = { labels: [], datasets: [] };

    constructor(
        private authService: AuthService,
        private policyService: PolicyService,
        private crmService: CrmService,
        private claimService: ClaimService
    ) { }

    ngOnInit(): void {
        this.authService.currentUser.subscribe(user => {
            if (user) {
                this.user = user;
                this.fetchData();
            }
        });
    }

    ngAfterViewChecked(): void {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    fetchData() {
        if (!this.user) return;
        this.loading = true;

        const userId = this.user.id || 2;
        const userType = this.user.role || 'broker';

        forkJoin({
            claims: this.claimService.listClaims({ user_id: userId, user_type: userType, limit: 1000, offset: 0, domain: [] }),
            opportunities: this.crmService.listOpportunities({ user_id: userId, user_type: userType, limit: 1000, offset: 0, domain: [] }),
            policies: this.policyService.listPolicies({ user_id: userId, user_type: userType, limit: 1000, offset: 0, domain: [] })
        }).subscribe({
            next: (res: any) => {
                this.claims = this.extractData(res.claims);
                this.opportunities = this.extractData(res.opportunities);
                this.policies = this.extractData(res.policies);
                this.quotations = this.policies; // Reuse policies as quotations per React logic

                this.calculateMetrics();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching analytics', err);
                this.loading = false;
            }
        });
    }

    private extractData(res: any): any[] {
        return res?.result?.data || res?.data?.data || res?.data || [];
    }

    private calculateMetrics() {
        // Filter by date
        const now = new Date();
        const days = parseInt(this.dateRange);
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        const filterDate = (items: any[], dateField: string) => {
            return items.filter(i => {
                if (!i[dateField]) return true;
                const d = new Date(i[dateField]);
                return d >= startDate && d <= now;
            });
        };

        const fClaims = filterDate(this.claims, 'intimation_date');
        const fOpps = filterDate(this.opportunities, 'opportunity_date');
        const fQuotes = filterDate(this.quotations, 'issue_date');

        // KPIs
        const approved = fQuotes.filter(q => q.state === 'Approved');
        const won = fOpps.filter(o => o.stage_name === 'Won');
        const activeClaims = fClaims.filter(c => c.state === 'Claim Request').length;

        this.kpis = {
            totalPolicies: approved.length,
            netPremium: approved.reduce((acc, q) => acc + (Number(q.net_premium) || 0), 0),
            grossPremium: approved.reduce((acc, q) => acc + (Number(q.gross_premium) || 0), 0),
            activeClaims: activeClaims,
            claimsPercentage: approved.length ? Number(((activeClaims / approved.length) * 100).toFixed(1)) : 0,
            openOpportunities: fOpps.filter(o => o.stage_name !== 'Won').length,
            conversionRate: fOpps.length ? Number(((won.length / fOpps.length) * 100).toFixed(1)) : 0,
            pendingQuotations: fQuotes.filter(q => q.state === 'Draft').length,
            dueForRenewal: 0 // Simplification for now
        };

        // Charts
        this.updateCharts(fOpps, fQuotes, fClaims);
    }

    private updateCharts(fOpps: any[], fQuotes: any[], fClaims: any[]) {
        // 1. Pipeline
        const stages = ['New', 'Qualified', 'Surveying', 'Review', 'Approved', 'Won'];
        const pipeCounts = stages.map(s => fOpps.filter(o => o.stage_name === s).length);
        this.pipelineData = {
            labels: stages,
            datasets: [{ data: pipeCounts, label: 'Count', backgroundColor: '#3b82f6' }]
        };

        // 2. Sales Person
        const salesMap: any = {};
        fOpps.forEach(o => {
            const name = o.sales_person || 'Unassigned';
            salesMap[name] = (salesMap[name] || 0) + 1;
        });
        const salesLabels = Object.keys(salesMap).sort((a, b) => salesMap[b] - salesMap[a]).slice(0, 5);
        this.salesPersonData = {
            labels: salesLabels,
            datasets: [{ data: salesLabels.map(l => salesMap[l]), label: 'Opportunities', backgroundColor: '#06b6d4' }]
        };

        // 3. Quote Status
        const qStateMap: any = {};
        fQuotes.forEach(q => {
            const s = q.state || 'Unknown';
            qStateMap[s] = (qStateMap[s] || 0) + 1;
        });
        this.quoteStatusData = {
            labels: Object.keys(qStateMap),
            datasets: [{ data: Object.values(qStateMap), backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899'] }]
        };

        // 4. Premium By Product
        const prodMap: any = {};
        fQuotes.filter(q => q.state === 'Approved').forEach(q => {
            const name = q.product_name || 'Unknown';
            if (!prodMap[name]) prodMap[name] = 0;
            prodMap[name] += (Number(q.net_premium) || 0);
        });
        const prodLabels = Object.keys(prodMap).sort((a, b) => prodMap[b] - prodMap[a]).slice(0, 5);
        this.premiumData = {
            labels: prodLabels,
            datasets: [{ data: prodLabels.map(l => prodMap[l]), label: 'Net Premium', backgroundColor: '#10b981' }]
        };

        // 5. Claims Status
        const cStateMap: any = {};
        fClaims.forEach(c => {
            const s = c.state || 'Unknown';
            cStateMap[s] = (cStateMap[s] || 0) + 1;
        });
        this.claimsStatusData = {
            labels: Object.keys(cStateMap),
            datasets: [{ data: Object.values(cStateMap), backgroundColor: ['#f59e0b', '#ef4444', '#10b981'] }]
        };

        // 6. Claims LOB
        const lobMap: any = {};
        fClaims.forEach(c => {
            const l = c.lob || 'Unknown';
            lobMap[l] = (lobMap[l] || 0) + 1;
        });
        const lobLabels = Object.keys(lobMap);
        this.claimsLobData = {
            labels: lobLabels,
            datasets: [{ data: lobLabels.map(l => lobMap[l]), label: 'Claims', backgroundColor: '#ec4899' }]
        };
    }
}
