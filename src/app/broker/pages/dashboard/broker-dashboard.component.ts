import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from 'src/app/core/services/auth.service';
import { PolicyService } from 'src/app/core/services/policy.service';
import { CrmService } from 'src/app/core/services/crm.service';
import { ClaimService } from 'src/app/core/services/claim.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
    paidPolicies: 0,
    paidPoliciesAmount: 0,
    notPaidPolicies: 0,
    notPaidPoliciesAmount: 0,
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
    const userId = this.user.id || 2;
    const userType = this.user.role || 'broker';

    forkJoin({
      policies: this.fetchAllPolicies(userId, userType),
      opportunities: this.fetchAllOpportunities(userId, userType),
      claims: this.fetchAllClaims(userId, userType)
    }).subscribe({
      next: (res: any) => {
        this.policies = res.policies;
        // User requested to exclude 'Draft' from ALL cards
        this.policies = this.policies.filter(p => (p.state || '').toLowerCase() !== 'draft');

        this.opportunities = res.opportunities;
        this.claims = res.claims;

        this.calculateAnalytics();
        this.calculateTopPerformers();
        this.loading = false;
        console.log(`Loaded Dashboard Data: ${this.policies.length} Policies (Non-Draft), ${this.opportunities.length} Opportunities, ${this.claims.length} Claims`);
      },
      error: (err) => {
        console.error('Error fetching dashboard data', err);
        this.loading = false;
      }
    });
  }

  fetchAllPolicies(userId: number, userType: string, offset = 0, accrued: any[] = []): Observable<any[]> {
    return this.policyService.listPolicies({
      user_id: userId,
      user_type: userType,
      limit: 1000,
      offset: offset,
      domain: []
    }).pipe(
      switchMap((res: any) => {
        const data = res.result?.data || res.data || res || [];
        const items = Array.isArray(data) ? data : [];
        const all = [...accrued, ...items];

        if (items.length < 1000) {
          return of(all);
        }
        return this.fetchAllPolicies(userId, userType, offset + 1000, all);
      })
    );
  }

  fetchAllOpportunities(userId: number, userType: string, offset = 0, accrued: any[] = []): Observable<any[]> {
    return this.crmService.listOpportunities({
      user_id: userId,
      user_type: userType,
      limit: 1000,
      offset: offset,
      domain: []
    }).pipe(
      switchMap((res: any) => {
        const data = res.result?.data || res.data || res || [];
        const items = Array.isArray(data) ? data : [];
        const all = [...accrued, ...items];

        if (items.length < 1000) {
          return of(all);
        }
        return this.fetchAllOpportunities(userId, userType, offset + 1000, all);
      })
    );
  }

  fetchAllClaims(userId: number, userType: string, offset = 0, accrued: any[] = []): Observable<any[]> {
    return this.claimService.listClaims({
      user_id: userId,
      user_type: userType,
      limit: 1000,
      offset: offset,
      domain: []
    }).pipe(
      switchMap((res: any) => {
        const data = res.result?.data || res.data || res || [];
        const items = Array.isArray(data) ? data : [];
        const all = [...accrued, ...items];

        if (items.length < 1000) {
          return of(all);
        }
        return this.fetchAllClaims(userId, userType, offset + 1000, all);
      })
    );
  }

  calculateAnalytics() {
    // 1. Determine Date Range
    const now = new Date();
    let daysToFilter = 36500; // Default: All time (approx 100 years)

    if (this.selectedPeriod === 'week') daysToFilter = 7;
    if (this.selectedPeriod === 'month') daysToFilter = 30;
    if (this.selectedPeriod === 'year') daysToFilter = 365;

    const startDate = new Date(now.getTime() - (daysToFilter * 24 * 60 * 60 * 1000));

    // 2. Filter Data Helper
    const isWithinPeriod = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= startDate && d <= now;
    };

    // 3. Apply Filters
    // Policies (use issue_date)
    const filteredPolicies = this.policies.filter(p => isWithinPeriod(p.issue_date || p.start_date || p.create_date));

    // Opportunities (use create_date or date_deadline or write_date)
    const filteredOpportunities = this.opportunities.filter(o => isWithinPeriod(o.create_date || o.date_deadline));

    // Claims (use date or create_date)
    const filteredClaims = this.claims.filter(c => isWithinPeriod(c.date || c.create_date || c.date_of_loss));


    // 4. Calculate Stats using Filtered Data

    // Active/Approved Policies
    // User requested: state 'Approved' only
    const activePolicies = filteredPolicies.filter(p => p.state === 'Approved');
    const active = activePolicies.length;
    const activePoliciesAmount = activePolicies.reduce((sum, p) => sum + (Number(p.net_premium) || 0), 0);

    // Paid Policies
    const paidPolicies = filteredPolicies.filter(p => ['paid', 'completed'].includes((p.payment_status || '').toLowerCase()));
    const paid = paidPolicies.length;
    const paidPoliciesAmount = paidPolicies.reduce((sum, p) => sum + (Number(p.net_premium) || 0), 0);

    // Not Paid Policies
    const notPaidPolicies = filteredPolicies.filter(p => !['paid', 'completed'].includes((p.payment_status || '').toLowerCase()));
    const notPaid = notPaidPolicies.length;
    const notPaidPoliciesAmount = notPaidPolicies.reduce((sum, p) => sum + (Number(p.net_premium) || 0), 0);

    // Canceled Policies
    const canceledPolicies = filteredPolicies.filter(p => ['Cancelled', 'Cancel', 'Canceled'].includes(p.state));
    const canceled = canceledPolicies.length;
    const canceledPoliciesAmount = canceledPolicies.reduce((sum, p) => sum + (Number(p.net_premium) || 0), 0);

    // Cancellation Rate
    const rate = filteredPolicies.length > 0 ? ((canceled / filteredPolicies.length) * 100).toFixed(1) : '0';

    // Unique Clients (Map customer_name)
    const uniqueClients = new Set(filteredPolicies.map(p => p.customer_name || p.customer_id).filter(Boolean)).size;

    // Won Opportunities
    const won = filteredOpportunities.filter(o => o.stage_name === 'Won').length;

    // Conversion Rate
    const convRate = filteredOpportunities.length > 0 ? ((won / filteredOpportunities.length) * 100).toFixed(1) : '0';

    // Total Premium
    const premium = activePoliciesAmount;

    // Open Opportunities
    const open = filteredOpportunities.filter(o => o.stage_name !== 'Won' && o.stage_name !== 'Lost').length;

    // Opportunities Amount
    const opportunitiesAmount = filteredOpportunities.reduce((sum, o) => sum + (Number(o.expected_revenue) || Number(o.planned_revenue) || 0), 0);

    // Claims Analytics
    const totalClaims = filteredClaims.length;
    const activeClaims = filteredClaims.filter(c => !['Settled', 'Closed', 'Rejected'].includes(c.status || c.state)).length;
    const totalClaimAmount = filteredClaims.reduce((sum, c) => sum + (Number(c.amount) || Number(c.estimated_amount) || Number(c.claim_amount) || 0), 0);

    this.analytics = {
      activePolicies: active,
      activePoliciesAmount: Math.round(activePoliciesAmount),
      paidPolicies: paid,
      paidPoliciesAmount: Math.round(paidPoliciesAmount),
      notPaidPolicies: notPaid,
      notPaidPoliciesAmount: Math.round(notPaidPoliciesAmount),
      canceledPolicies: canceled,
      canceledPoliciesAmount: Math.round(canceledPoliciesAmount),
      cancellationRate: Number(rate),
      totalClients: uniqueClients,
      totalOpportunities: filteredOpportunities.length,
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
    // Re-use logic or leave as is since selectedPeriod is used there too.
    // But strictly speaking, top performers already uses selectedPeriod. 
    // We can optimize code later, but for now focusing on analytics.
    if (!this.policies.length) return;

    const now = new Date();
    let daysToFilter = 36500;
    if (this.selectedPeriod === 'week') daysToFilter = 7;
    if (this.selectedPeriod === 'month') daysToFilter = 30;
    if (this.selectedPeriod === 'year') daysToFilter = 365;

    const startDate = new Date(now.getTime() - (daysToFilter * 24 * 60 * 60 * 1000));

    const filtered = this.policies.filter(p => {
      // NOTE: We rely on issue_date here same as above
      if (!p.issue_date) return true; // Drafts excluded globally now, but if no date, maybe include? 
      // Safest is strict check
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
    if (this.selectedPeriod === period) {
      this.selectedPeriod = 'all'; // Deselect if clicked again
    } else {
      this.selectedPeriod = period;
    }
    this.calculateAnalytics();
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
