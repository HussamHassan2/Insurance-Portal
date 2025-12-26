import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { SurveyorService } from '../../../core/services/surveyor.service';

@Component({
  selector: 'app-surveyor-dashboard',
  templateUrl: './surveyor-dashboard.component.html',
  styles: []
})
export class SurveyorDashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  showWizard = false;

  stats: any = {
    totalSurveys: 62,
    pending: 12,
    completed: 45,
    urgent: 2,
    inProgress: 5
  };

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private surveyorService: SurveyorService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
    });

    // Check for wizard query param
    this.route.queryParams.subscribe(params => {
      if (params['wizard'] === 'true') {
        this.showWizard = true;
      }
    });
  }

  ngOnDestroy(): void {
  }

  openWizard(): void {
    this.showWizard = true;
  }

  closeWizard(): void {
    this.showWizard = false;
    // Clear query param so that clicking logo again works (triggers change)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { wizard: null },
      queryParamsHandling: 'merge'
    });
  }

  handleWizardSelect(type: string): void {
    this.showWizard = false;
    // Navigate to stages page with selected type
    this.router.navigate(['/dashboard/surveyor/stages'], {
      queryParams: {
        type: type
      }
    });
  }
}
