import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';

declare var lucide: any;

@Component({
  selector: 'app-quote-success',
  templateUrl: './quote-success.component.html',
  styleUrls: ['./quote-success.component.css'],
  standalone: true,
  imports: [CommonModule, SharedModule]
})
export class QuoteSuccessComponent implements OnInit, AfterViewChecked {
  message = '';
  opportunityNumber = '';
  policyState = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (history.state as any);

    if (state && state.issuanceData) {
      this.message = state.issuanceData.message || 'Your request has been submitted';
      this.opportunityNumber = state.issuanceData.opportunity_number || '';
      this.policyState = state.issuanceData.policy_state || '';
    } else {
      // If no data, redirect to quotations
      this.router.navigate(['/dashboard/broker/quotations']);
    }
  }

  ngAfterViewChecked(): void {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  goToQuotations(): void {
    this.router.navigate(['/dashboard/broker/quotations']);
  }

  createNewQuote(): void {
    this.router.navigate(['/dashboard/broker/quotations']);
  }
}
