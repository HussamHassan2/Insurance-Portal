import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../shared/components/logo/logo.component';
import { TenantConfigService } from '../core/services/tenant-config.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LogoComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <app-logo size="large"></app-logo>
          <h1 class="text-3xl font-bold text-primary mt-4">
            Welcome to {{tenantName}}
          </h1>
          <p class="text-gray-600 mt-2">Client ID: {{clientId}}</p>
        </div>

        <!-- Color Demo Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-primary text-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold mb-2">Primary Color</h2>
            <p>This uses the primary brand color</p>
          </div>
          
          <div class="bg-secondary text-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold mb-2">Secondary Color</h2>
            <p>This uses the secondary brand color</p>
          </div>
          
          <div class="bg-accent text-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold mb-2">Accent Color</h2>
            <p>This uses the accent brand color</p>
          </div>
        </div>

        <!-- Features -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-primary mb-4">Available Features</h3>
          <div class="space-y-2">
            <div *ngFor="let feature of features" 
                 class="flex items-center p-3 bg-primary-light rounded">
              <span class="w-3 h-3 bg-primary rounded-full mr-3"></span>
              <span class="font-medium capitalize">{{feature}}</span>
            </div>
          </div>
          
          <div *ngIf="features.length === 0" class="text-gray-500 text-center py-4">
            No features available
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex gap-4">
          <button class="btn-primary">Primary Action</button>
          <button class="btn-secondary">Secondary Action</button>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  tenantName: string = '';
  clientId: string = '';
  features: string[] = [];

  constructor(private configService: TenantConfigService) {
    const config = this.configService.getConfig();
    if (config) {
      this.tenantName = config.name;
      this.features = config.features;
    }
    this.clientId = this.configService.getClientId();
  }
}
