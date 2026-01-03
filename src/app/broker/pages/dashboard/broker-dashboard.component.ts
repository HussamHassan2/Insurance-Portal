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
  performanceRows: any[] = [];

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
        // Robust extraction matching BrokerClaimsComponent
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray(res.data)) items = res.data;
        else if (res.data?.result?.data) items = res.data.result.data;
        else if (res.data?.data) items = res.data.data;
        else if (res.result?.data) items = res.result.data; // Also check standard Odoo wrapper

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

    // Claims (use intimation_date, claim_date, etc - matching BrokerClaims)
    const filteredClaims = this.claims.filter(c => isWithinPeriod(c.intimation_date || c.claim_date || c.create_date || c.date || c.date_of_loss));


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
    if (!this.policies.length && !this.claims.length) {
      this.performanceRows = [];
      return;
    }

    console.log('Calculating Performance...');
    const now = new Date();
    let daysToFilter = 36500;
    if (this.selectedPeriod === 'week') daysToFilter = 7;
    if (this.selectedPeriod === 'month') daysToFilter = 30;
    if (this.selectedPeriod === 'year') daysToFilter = 365;

    const startDate = new Date(now.getTime() - (daysToFilter * 24 * 60 * 60 * 1000));

    const extractName = (field: any): string | null => {
      if (Array.isArray(field) && field.length > 1) {
        return field[1];
      }
      return field || null;
    };

    // 1. Production Performance (Top Products)
    // Filter policies
    const filteredPolicies = this.policies.filter(p => {
      if (!p.issue_date) return true;
      const d = new Date(p.issue_date);
      return d >= startDate && d <= now;
    });

    const productGroups: { [key: string]: any } = {};
    filteredPolicies.forEach(p => {
      const name = extractName(p.product_id || p.product_name) || 'Unknown Product';
      if (!productGroups[name]) {
        productGroups[name] = { name, policies: 0, totalPremium: 0 };
      }
      productGroups[name].policies++;
      productGroups[name].totalPremium += Number(p.net_premium) || 0;
    });

    const topProducts = Object.values(productGroups)
      .map((g: any) => ({
        name: g.name,
        policies: g.policies,
        revenue: `EGP ${Math.round(g.totalPremium).toLocaleString()}`,
        rawRevenue: g.totalPremium
      }))
      .sort((a: any, b: any) => b.rawRevenue - a.rawRevenue)
      .slice(0, 5);


    // 2. Claim Performance (Grouped by State)
    const filteredClaims = this.claims.filter(c => {
      const claimDate = c.intimation_date || c.claim_date || c.create_date || c.date || c.date_of_loss;
      if (!claimDate) return false;
      const d = new Date(claimDate);
      return d >= startDate && d <= now;
    });

    // Helper for state icons/colors
    const getStateConfig = (state: string) => {
      const s = state.toLowerCase();
      if (['new', 'draft', 'open', 'intimated', 'claim request'].includes(s)) return { icon: 'file-plus', color: 'text-blue-500', bg: 'bg-blue-50' };
      if (['in progress', 'review', 'under review', 'processing', 'pending', 'surveying'].includes(s)) return { icon: 'clock', color: 'text-orange-500', bg: 'bg-orange-50' };
      if (['paid', 'approved', 'settled', 'closed', 'active', 'fully paid', 'partially paid'].includes(s)) return { icon: 'check-circle', color: 'text-green-500', bg: 'bg-green-50' };
      if (['rejected', 'cancelled', 'canceled', 'declined', 'reopen'].includes(s)) return { icon: 'x-circle', color: 'text-red-500', bg: 'bg-red-50' };
      return { icon: 'help-circle', color: 'text-gray-400', bg: 'bg-gray-50' };
    };

    // Helper for state mapping
    const mapClaimState = (rawState: string): string => {
      const s = rawState.toLowerCase();
      const mapping: { [key: string]: string } = {
        'claim_request': 'Claim Request',
        'draft': 'Draft',
        'open': 'Intimated',
        'surveying': 'Surveying',
        'partial': 'Partially Paid',
        'full': 'Fully Paid',
        'closed': 'Closed',
        'reopen': 'Reopen'
      };
      return mapping[s] || rawState.charAt(0).toUpperCase() + rawState.slice(1).toLowerCase();
    };

    const stateGroups: { [key: string]: any } = {};
    filteredClaims.forEach(c => {
      const rawState = extractName(c.stage_id) || c.state || c.status || 'Unknown';
      const state = mapClaimState(rawState);

      if (!stateGroups[state]) {
        stateGroups[state] = { state, count: 0, amount: 0, config: getStateConfig(state) };
      }
      stateGroups[state].count++;
      stateGroups[state].amount += Number(c.amount) || Number(c.estimated_amount) || Number(c.claim_amount) || 0;
    });

    const topStates = Object.values(stateGroups)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    // 3. Merge for Table Rows
    const maxRows = Math.max(topProducts.length, topStates.length);
    this.performanceRows = [];

    for (let i = 0; i < maxRows; i++) {
      this.performanceRows.push({
        product: topProducts[i] || null,
        claimStat: topStates[i] || null
      });
    }

    // For compliance with template (will update template to use performanceRows)
    this.topPerformers = this.performanceRows;

    console.log('Performance Rows:', this.performanceRows);
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

  // Helper to get keys of an object (for template)
  objectKeys(obj: any) {
    return Object.keys(obj);
  }
}
