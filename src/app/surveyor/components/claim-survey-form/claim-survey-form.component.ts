import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-claim-survey-form',
    template: `
    <div class="space-y-6">
       <!-- Claim Specifics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Damage Description *</label>
             <textarea 
                 [(ngModel)]="data.damage_description" 
                 (ngModelChange)="onDataChange()"
                 rows="3"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 required></textarea>
            </div>
            <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (KM)</label>
             <input type="number" 
                 [(ngModel)]="data.odometer_reading" 
                 (ngModelChange)="onDataChange()"
                 class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
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
    </div>
  `
})
export class ClaimSurveyFormComponent {
    @Input() data: any = {};
    @Output() dataChange = new EventEmitter<any>();

    onDataChange() {
        this.dataChange.emit(this.data);
    }

    onFileChange(event: any) {
        if (event.target.files) {
            this.data.photos = Array.from(event.target.files);
            this.onDataChange();
        }
    }
}
