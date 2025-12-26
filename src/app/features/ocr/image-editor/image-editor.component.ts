import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-image-editor',
    standalone: true,
    imports: [CommonModule, ImageCropperComponent],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <!-- Toolbar -->
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h3 class="font-bold text-gray-700 dark:text-gray-200">Edit Image</h3>
          <div class="flex gap-2">
            <button (click)="rotateLeft()" class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Rotate Left">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button (click)="rotateRight()" class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="Rotate Right">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
            <button (click)="cancel.emit()" class="p-2 hover:bg-red-100 text-red-600 rounded-lg" title="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Cropper Area -->
        <div class="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
            <image-cropper
                [imageChangedEvent]="imageChangedEvent"
                [maintainAspectRatio]="false"
                [aspectRatio]="1.6" 
                [resizeToWidth]="0" 
                [onlyScaleDown]="false" 
                format="png"
                (imageCropped)="imageCropped($event)"
                (imageLoaded)="imageLoaded($event)"
                (cropperReady)="cropperReady()"
                (loadImageFailed)="loadImageFailed()"
                [transform]="transform"
                class="max-h-full"
            ></image-cropper>
        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
            <button (click)="cancel.emit()" class="px-6 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
            </button>
            <button (click)="confirmCrop()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Done / Scan
            </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    :host { display: contents; }
  `]
})
export class ImageEditorComponent {
    @Input() imageChangedEvent: any = '';
    @Output() cropComplete = new EventEmitter<Blob>();
    @Output() cancel = new EventEmitter<void>();

    croppedImage: Blob | null | undefined = null;
    transform: any = {};

    constructor(private sanitizer: DomSanitizer) { }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.blob;
    }

    imageLoaded(image: LoadedImage) {
        // show cropper
    }

    cropperReady() {
        // cropper ready
    }

    loadImageFailed() {
        // should show message
        console.error('Image Load Failed');
    }

    rotateLeft() {
        this.transform = { ...this.transform, rotate: (this.transform.rotate || 0) - 90 };
    }

    rotateRight() {
        this.transform = { ...this.transform, rotate: (this.transform.rotate || 0) + 90 };
    }

    confirmCrop() {
        if (this.croppedImage) {
            this.cropComplete.emit(this.croppedImage);
        }
    }
}
