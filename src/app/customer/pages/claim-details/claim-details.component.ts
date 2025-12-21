import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';

@Component({
    selector: 'app-claim-details',
    templateUrl: './claim-details.component.html',
    styleUrls: ['./claim-details.component.css']
})
export class ClaimDetailsComponent implements OnInit {
    claimId: string = '';
    claim: any = null;
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private claimService: ClaimService
    ) { }

    ngOnInit(): void {
        this.claimId = this.route.snapshot.params['id'];
        this.loadClaim();
    }

    loadClaim(): void {
        this.claimService.getClaim(parseInt(this.claimId)).subscribe({
            next: (response) => {
                this.claim = response.data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading claim:', err);
                this.loading = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/dashboard/customer/claims']);
    }

    uploadDocument(): void {
        console.log('Uploading document...');
    }

    getStatusColor(status: string): string {
        const colors: any = {
            'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
        return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    }
}
