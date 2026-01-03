import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from 'src/app/core/services/auth.service';
import { PolicyService } from 'src/app/core/services/policy.service';
import { CrmService } from 'src/app/core/services/crm.service';
import { ClaimService } from 'src/app/core/services/claim.service';
import { forkJoin } from 'rxjs';

declare var lucide: any;

@Component({
  selector: 'app-broker-dashboard',
  templateUrl: './broker-dashboard.component.html',
  styles: []
})
export class BrokerDashboardComponent implements OnInit, AfterViewChecked {
  user: User | null = null;
  loading = false;
  selectedPeriod = 'month';
  policies: any[] = [];
  claims: any[] = [];
  opportunities: any[] = [];

  analytics = {
    activePolicies: 0,
    activePoliciesAmount: 0,
    canceledPolicies: 0,
    canceledPoliciesAmount: 0,
    cancellationRate: 0,
    totalClients: 0,
    totalOpportunities: 0,
    totalOpportunitiesAmount: 0,
    openOpportunities: 0,
    conversionRate: 0,
    totalPremium: 0,
    totalCommissions: 0,
    totalClaims: 0,
    activeClaims: 0,
    totalClaimAmount: 0
  };

  topPerformers: any[] = [];

  // Flag to ensure icons re-render only when needed or periodically
  iconsRendered = false;

  showChassisModal = false;

  constructor(
    private authService: AuthService,
    private policyService: PolicyService,
    private crmService: CrmService,
    private claimService: ClaimService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.user = user;
        this.fetchDashboardData();
      }
    });
  }

  ngAfterViewChecked(): void {
    // Re-run Lucide icons creation if DOM changes
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  fetchDashboardData() {
    if (!this.user) return;
    this.loading = true;

    const userId = this.user.id || 2; // Fallback matches React
    const userType = this.user.role || 'broker';

    const policiesRequest = this.policyService.listPolicies({
      user_id: userId,
      user_type: userType,
      limit: 1000,
      offset: 0,
      domain: []
    });

    const opportunitiesRequest = this.crmService.listOpportunities({
      user_id: userId,
      user_type: userType,
      limit: 1000,
      offset: 0,
      domain: []
    });

    const claimsRequest = this.claimService.listClaims({
      user_id: userId,
      user_type: userType,
      limit: 1000,
      offset: 0,
      domain: []
    });

    forkJoin({
      policies: policiesRequest,
      opportunities: opportunitiesRequest,
      claims: claimsRequest
    }).subscribe({
      next: (res: any) => {
        // Parse policies
        const pData = res.policies.result?.data || res.policies.data || res.policies || [];
        this.policies = Array.isArray(pData) ? pData : [];

        // Parse opportunities
        const oData = res.opportunities.result?.data || res.opportunities.data || res.opportunities || [];
        this.opportunities = Array.isArray(oData) ? oData : [];

        // Parse claims
        const cData = res.claims.result?.data || res.claims.data || res.claims || [];
        this.claims = Array.isArray(cData) ? cData : [];

        this.calculateAnalytics();
        this.calculateTopPerformers();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard data', err);
        this.loading = false;
      }
    });
  }

  calculateAnalytics() {
    // Active/Approved Policies
    const activePolicies = this.policies.filter(p => p.state === 'Active' || p.state === 'Approved');
    const active = activePolicies.length;
    const activePoliciesAmount = activePolicies.reduce((sum, p) => sum + (Number(p.net_premium) || 0), 0);

    // Canceled Policies
    const canceledPolicies = this.policies.filter(p => ['Cancelled', 'Cancel', 'Canceled'].includes(p.state));
    const canceled = canceledPolicies.length;
    const canceledPoliciesAmount = canceledPolicies.reduce((sum, p) => sum + (Number(p.net_premium) || 0), 0);

    // Cancellation Rate
    const rate = this.policies.length > 0 ? ((canceled / this.policies.length) * 100).toFixed(1) : '0';

    // Unique Clients (Map customer_name)
    const uniqueClients = new Set(this.policies.map(p => p.customer_name || p.customer_id).filter(Boolean)).size;

    // Won Opportunities
    const won = this.opportunities.filter(o => o.stage_name === 'Won').length;

    // Conversion Rate
    const convRate = this.opportunities.length > 0 ? ((won / this.opportunities.length) * 100).toFixed(1) : '0';

    // Total Premium
    const premium = activePoliciesAmount;

    // Open Opportunities
    const open = this.opportunities.filter(o => o.stage_name !== 'Won' && o.stage_name !== 'Lost').length;

    // Opportunities Amount (using expected_revenue or similar field)
    const opportunitiesAmount = this.opportunities.reduce((sum, o) => sum + (Number(o.expected_revenue) || Number(o.planned_revenue) || 0), 0);

    // Claims Analytics
    const totalClaims = this.claims.length;
    const activeClaims = this.claims.filter(c => !['Settled', 'Closed', 'Rejected'].includes(c.status || c.state)).length;
    const totalClaimAmount = this.claims.reduce((sum, c) => sum + (Number(c.amount) || Number(c.estimated_amount) || Number(c.claim_amount) || 0), 0);

    this.analytics = {
      activePolicies: active,
      activePoliciesAmount: Math.round(activePoliciesAmount),
      canceledPolicies: canceled,
      canceledPoliciesAmount: Math.round(canceledPoliciesAmount),
      cancellationRate: Number(rate),
      totalClients: uniqueClients,
      totalOpportunities: this.opportunities.length,
      totalOpportunitiesAmount: Math.round(opportunitiesAmount),
      openOpportunities: open,
      conversionRate: Number(convRate),
      totalPremium: Math.round(premium),
      totalCommissions: 0,
      totalClaims: totalClaims,
      activeClaims: activeClaims,
      totalClaimAmount: Math.round(totalClaimAmount)
    };
  }

  calculateTopPerformers() {
    if (!this.policies.length) return;

    const now = new Date();
    let daysToFilter = 30;
    if (this.selectedPeriod === 'week') daysToFilter = 7;
    if (this.selectedPeriod === 'year') daysToFilter = 365;

    const startDate = new Date(now.getTime() - (daysToFilter * 24 * 60 * 60 * 1000));

    const filtered = this.policies.filter(p => {
      if (!p.issue_date) return true;
      const d = new Date(p.issue_date);
      return d >= startDate && d <= now;
    });

    const groups: { [key: string]: any } = {};

    filtered.forEach(p => {
      const name = p.product_name || 'Unknown Product';
      if (!groups[name]) {
        groups[name] = { name, policies: 0, totalPremium: 0 };
      }
      groups[name].policies++;
      groups[name].totalPremium += Number(p.net_premium) || 0;
    });

    this.topPerformers = Object.values(groups)
      .map((g: any) => ({
        name: g.name,
        policies: g.policies,
        revenue: `EGP ${Math.round(g.totalPremium).toLocaleString()}`,
        growth: g.policies > 0 ? `${g.policies} policies` : '0 policies'
      }))
      .sort((a: any, b: any) => {
        // Sort by revenue num
        const valA = parseInt(a.revenue.replace(/[^0-9]/g, ''));
        const valB = parseInt(b.revenue.replace(/[^0-9]/g, ''));
        return valB - valA;
      })
      .slice(0, 5);
  }

  setSelectedPeriod(period: string) {
    this.selectedPeriod = period;
    this.calculateTopPerformers();
  }

  toggleChassisModal() {
    this.showChassisModal = !this.showChassisModal;
  }

  isCustomerModalOpen = false;

  openCustomerModal() {
    this.isCustomerModalOpen = true;
  }

  onCustomerSelected(customer: any) {
    this.isCustomerModalOpen = false;
    this.router.navigate(['/dashboard/broker/quote/new'], {
      state: { customer: customer }
    });
  }
}
