import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TenantConfigService } from '../services/tenant-config.service';

export const featureGuard: CanActivateFn = (route) => {
    const configService = inject(TenantConfigService);
    const router = inject(Router);

    const requiredFeature = route.data['requiredFeature'] as string;

    if (!requiredFeature || configService.hasFeature(requiredFeature)) {
        return true;
    }

    console.warn(`Feature '${requiredFeature}' not enabled for this client`);
    // Redirect to home or unauthorized page
    return router.createUrlTree(['/']);
};
