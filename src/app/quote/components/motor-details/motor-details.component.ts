import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { QuoteService } from 'src/app/core/services/quote.service';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-motor-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './motor-details.component.html',
  styleUrl: './motor-details.component.css'
})
export class MotorDetailsComponent implements OnInit {
  vehicleForm: FormGroup;
  loading = false;

  // Dropdown options
  makers: any[] = [];
  models: any[] = [];
  categories: any[] = [];
  years: any[] = [];

  constructor(
    private fb: FormBuilder,
    private quoteService: QuoteService, // Ensure QuoteService is provided in root
    private router: Router
  ) {
    this.vehicleForm = this.fb.group({
      maker_code: ['', Validators.required],
      model_code: ['', Validators.required],
      model_category_code: [''], // Optional depending on flow, but often required
      model_year_id: ['', Validators.required],
      vehicle_value: ['', [Validators.required, Validators.min(0)]],
      // Add other common fields
      vehicle_usage: [''],
      body_type: ['']
    });
  }

  ngOnInit(): void {
    this.loadMakers();
    this.setupDependencyListeners();
  }

  loadMakers() {
    this.loading = true;
    this.quoteService.getVehicleMakers().subscribe({
      next: (res) => {
        console.log('API Response - Vehicle Makers:', res); // DEBUG LOG
        this.makers = (res || []).map((maker: any) => {
          if (maker.risk_image && !maker.risk_image.startsWith('data:image')) {
            // Assume PNG if not specified, mostly likely for logos
            maker.risk_image = `data:image/png;base64,${maker.risk_image}`;
          }
          return maker;
        });
        console.log('Processed Makers:', this.makers); // DEBUG LOG
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading makers', err);
        this.loading = false;
      }
    });
  }

  setupDependencyListeners() {
    this.vehicleForm.get('maker_code')?.valueChanges.subscribe(makerCode => {
      this.vehicleForm.patchValue({ model_code: '', model_category_code: '', model_year_id: '' });
      this.models = [];
      this.categories = [];
      this.years = [];
      if (makerCode) this.loadModels(makerCode);
    });

    this.vehicleForm.get('model_code')?.valueChanges.subscribe(modelCode => {
      this.vehicleForm.patchValue({ model_category_code: '', model_year_id: '' });
      this.categories = [];
      this.years = [];
      if (modelCode) this.loadCategories(modelCode);
      // Assuming we can derive years from model directly or category
      if (modelCode) this.loadYears(modelCode);
    });
  }

  loadModels(makerCode: string) {
    this.quoteService.getVehicleModels(makerCode).subscribe(res => this.models = res || []);
  }

  loadCategories(modelCode: string) {
    this.quoteService.getVehicleModelCategories(modelCode).subscribe(res => this.categories = res || []);
  }

  loadYears(modelId: string) {
    // API expects model_id. We might only have code. 
    // Need to ensure model object has ID.
    // If models array has objects with { id, code, name }, we should find the ID.
    // Since valueChanges gives us the value (code), we need to look it up.

    // Wait, if models are loaded, I can find the selected model.
    // But the subscription gives just the value.
    // I'll do the lookup in the subscription or a separate method.
    // Simplified here:
    const model = this.models.find(m => m.code === modelId); // assuming value is code
    if (model && model.id) {
      this.quoteService.getVehicleModelYears(model.id).subscribe(res => this.years = res || []);
    } else {
      // Fallback if APIs are using code everywhere or mixed
      this.quoteService.getVehicleModelYears(modelId).subscribe(res => this.years = res || []);
    }
  }

  onSubmit() {
    if (this.vehicleForm.valid) {
      console.log('Vehicle Data:', this.vehicleForm.value);
      // Persist data (Service/LocalState)
      localStorage.setItem('quote_vehicle_details', JSON.stringify(this.vehicleForm.value));
      this.router.navigate(['/quote/driver']);
    } else {
      this.vehicleForm.markAllAsTouched();
    }
  }
}
