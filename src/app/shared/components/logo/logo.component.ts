import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantConfigService } from '../../../core/services/tenant-config.service';

@Component({
    selector: 'app-logo',
    standalone: true,
    imports: [CommonModule],
    template: `
    <img 
      [src]="logoPath" 
      [alt]="clientName + ' Logo'"
      [class]="sizeClass"
      (error)="onImageError()"
    />
  `,
    styles: [`
    .logo-small { height: 2rem; width: auto; }
    .logo-medium { height: 3rem; width: auto; }
    .logo-large { height: 4rem; width: auto; }
  `]
})
export class LogoComponent {
    @Input() size: 'small' | 'medium' | 'large' = 'medium';

    logoPath = 'assets/logo.png'; // Will be replaced by build process
    clientName: string;

    constructor(private configService: TenantConfigService) {
        const config = this.configService.getConfig();
        this.clientName = config?.name || 'Company';
    }

    get sizeClass(): string {
        return `logo-${this.size}`;
    }

    onImageError(): void {
        console.error('Logo failed to load');
        // Fallback if needed, or just let it be broken if strictly required
        // this.logoPath = 'assets/fallback-logo.png'; 
    }
}
