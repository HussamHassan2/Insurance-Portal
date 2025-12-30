import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-claim-survey-form',
    template: `
    <div class="space-y-6">
       <!-- Claim Specifics -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Assessment Details
             </h3>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Damage Description -->
                <div class="col-span-1 md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Damage Description <span class="text-red-500">*</span></label>
                    <textarea 
                        [(ngModel)]="data.damage_description" 
                        (ngModelChange)="onDataChange()"
                        rows="3"
                        placeholder="Describe the damage in detail..."
                        class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm transition-colors py-2 px-3"
                        required></textarea>
                </div>
                
                <!-- Odometer -->
                <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer Reading (KM)</label>
                     <div class="relative rounded-md shadow-sm">
                        <input type="number" 
                            [(ngModel)]="data.odometer_reading" 
                            (ngModelChange)="onDataChange()"
                             placeholder="e.g. 50000"
                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-3 pr-12 focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm py-2">
                         <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                             <span class="text-gray-500 sm:text-sm">km</span>
                         </div>
                     </div>
                </div>

                <!-- Estimated Repair Cost (Read Only / Display) -->
                 <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Repair Cost</label>
                     <div class="relative rounded-md shadow-sm">
                         <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                             <span class="text-gray-500 sm:text-sm">$</span>
                         </div>
                        <input type="number" 
                            [ngModel]="data.estimated_repair_cost" 
                            disabled
                            class="block w-full rounded-md border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-600 pl-7 focus:border-primary focus:ring-primary dark:text-gray-200 sm:text-sm py-2 cursor-not-allowed">
                     </div>
                </div>

                <!-- Conclusion -->
                 <div class="col-span-1 md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conclusion <span class="text-red-500">*</span></label>
                    <textarea 
                        [(ngModel)]="data.conclusion" 
                        (ngModelChange)="onDataChange()"
                        rows="2"
                         placeholder="Final conclusion..."
                        class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm transition-colors py-2 px-3"
                        required></textarea>
                </div>
                
                <!-- Recommendation -->
                <div class="col-span-1 md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recommendation <span class="text-red-500">*</span></label>
                    <textarea 
                        [(ngModel)]="data.recommendation" 
                        (ngModelChange)="onDataChange()"
                        rows="2"
                         placeholder="Recommended action..."
                        class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm transition-colors py-2 px-3"
                        required></textarea>
                </div>
            </div>
        </div>

        <!-- Photos Upload (Hidden as per request) -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700" *ngIf="false">
        <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photos
        </h4>
        
        <label class="flex justify-center w-full h-32 px-4 transition bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary dark:hover:border-primary focus:outline-none">
            <span class="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span class="font-medium text-gray-600 dark:text-gray-400">
                    Drop files to Attach, or <span class="text-primary underline">browse</span>
                </span>
            </span>
            <input type="file" name="file_upload" class="hidden" multiple (change)="onFileChange($event)">
        </label>

        <div class="mt-4" *ngIf="data.photos?.length > 0">
             <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Selected Photos</h5>
             <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div *ngFor="let photo of data.photos" class="relative group bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center justify-center">
                    <span class="text-xs text-gray-700 dark:text-gray-300 truncate w-full text-center">{{ photo.name }}</span>
                 </div>
             </div>
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
