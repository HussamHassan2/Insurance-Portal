import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
    selector: 'app-issuance-survey-form',
    template: `
    <div class="space-y-6">
      <!-- Vehicle Condition -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Vehicle Condition *</label>
          <input type="text" 
                 [(ngModel)]="data.vehicle_condition" 
                 (ngModelChange)="onDataChange()"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 placeholder="e.g. Good" required>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (KM) *</label>
          <input type="number" 
                 [(ngModel)]="data.odometer_reading" 
                 (ngModelChange)="onDataChange()"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 required>
        </div>

         <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Market Value *</label>
          <input type="number" 
                 [(ngModel)]="data.market_value" 
                 (ngModelChange)="onDataChange()"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 required>
        </div>
         <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Zero Price *</label>
          <input type="number" 
                 [(ngModel)]="data.zero_price" 
                 (ngModelChange)="onDataChange()"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 required>
        </div>
      </div>

       <!-- Conclusion & Recommendations -->
      <div class="grid grid-cols-1 gap-6">
         <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Conclusion *</label>
          <textarea 
                 [(ngModel)]="data.conclusion" 
                 (ngModelChange)="onDataChange()"
                 rows="3"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 required></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Recommendation *</label>
          <textarea 
                 [(ngModel)]="data.recommendation" 
                 (ngModelChange)="onDataChange()"
                 rows="3"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 required></textarea>
        </div>
      </div>

       <!-- Photos Upload -->
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 class="text-sm font-medium text-gray-900 mb-2">Photos</h4>
        <input type="file" multiple (change)="onFileChange($event)" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        <div class="mt-2 text-xs text-gray-500">
             {{ data.photos?.length || 0 }} photos selected.
        </div>
      </div>

      <div class="bg-yellow-50 p-4 rounded-md">
        <div class="flex">
            <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Checklist</h3>
            <div class="mt-2 text-sm text-yellow-700">
                <ul class="list-disc pl-5 space-y-1">
                 <li>Check Exterior condition</li>
                 <li>Check Interior condition</li>
                 <li>Verify WIN number</li>
                </ul>
            </div>
            </div>
        </div>
        </div>
    </div>
  `
})
export class IssuanceSurveyFormComponent implements OnInit {
    @Input() data: any = {};
    @Output() dataChange = new EventEmitter<any>();

    ngOnInit() {
        // Init defaults
        this.data.zero_price = this.data.zero_price || 0;
        this.data.market_value = this.data.market_value || 0;
    }

    onDataChange() {
        this.dataChange.emit(this.data);
    }

    onFileChange(event: any) {
        if (event.target.files) {
            // Convert FileList to Array
            this.data.photos = Array.from(event.target.files);
            this.onDataChange();
        }
    }
}
