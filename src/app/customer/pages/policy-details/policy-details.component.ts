import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService } from '../../../core/services/policy.service';

@Component({
    selector: 'app-policy-details',
    templateUrl: './policy-details.component.html',
    styleUrls: ['./policy-details.component.css']
})
export class PolicyDetailsComponent implements OnInit {
    policyId: string = '';
    policy: any = null;
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private policyService: PolicyService
    ) { }

    ngOnInit(): void {
        this.policyId = this.route.snapshot.params['id'];
        this.loadPolicy();
    }

    loadPolicy(): void {
        this.policyService.getPolicy(parseInt(this.policyId)).subscribe({
            next: (response) => {
                this.policy = response.data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading policy:', err);
                this.loading = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/dashboard/customer/policies']);
    }

    downloadPolicy(): void {
        console.log('Downloading policy PDF...');
    }

    renewPolicy(): void {
        console.log('Renewing policy...');
    }
}
