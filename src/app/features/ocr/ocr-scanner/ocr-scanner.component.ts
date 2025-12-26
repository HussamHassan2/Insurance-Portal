import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OcrEngineService } from '../../../core/services/ocr/ocr-engine.service';
import { OcrProcessingService, ExtractedData } from '../../../core/services/ocr/ocr-processing.service';
import { SharedModule } from '../../../shared/shared.module';
import { ImageEditorComponent } from '../image-editor/image-editor.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-ocr-scanner',
    standalone: true,
    imports: [CommonModule, FormsModule, ImageEditorComponent],
    templateUrl: './ocr-scanner.component.html',
    styles: [`
    .drag-active {
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.05);
    }
  `]
})
export class OcrScannerComponent implements OnDestroy {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    imageUrl: string | null = null;
    processedImageUrl: string | null = null;
    isProcessing = false;
    progress = 0;
    extractedData: ExtractedData | null = null;
    isDragActive = false;
    showCamera = false;
    mediaStream: MediaStream | null = null;

    // Editor State
    showEditor = false;
    imageChangedEvent: any = '';

    private destroy$ = new Subject<void>();

    constructor(
        private ocrEngine: OcrEngineService,
        private textProcessor: OcrProcessingService
    ) {
        this.ocrEngine.progress.pipe(takeUntil(this.destroy$)).subscribe(p => {
            this.progress = Math.round(p * 100);
        });
    }

    ngOnDestroy() {
        this.stopCamera();
        this.destroy$.next();
        this.destroy$.complete();
    }

    onFileSelected(event: Event) {
        // Intercept file selection -> Open Editor
        this.imageChangedEvent = event;
        if (this.imageChangedEvent.target.files?.length > 0) {
            this.showEditor = true;
        }
    }

    onEditorCancel() {
        this.showEditor = false;
        this.imageChangedEvent = null;
        // Reset input so change event fires again if same file selected
        if (this.fileInput) this.fileInput.nativeElement.value = '';
    }

    async onEditorComplete(croppedBlob: Blob) {
        this.showEditor = false;
        this.extractedData = null; // Reset previous results

        // Convert Blob to File for consistency
        const file = new File([croppedBlob], "edited-image.png", { type: "image/png" });
        this.imageUrl = URL.createObjectURL(file);

        // Run OCR on the edited image
        await this.runOcr(file);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragActive = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragActive = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragActive = false;

        if (event.dataTransfer?.files?.length) {
            // Force Editor on Drop to ensure user removes background (wood table etc.)
            this.imageChangedEvent = { target: { files: event.dataTransfer.files } };
            this.showEditor = true;
        }
    }

    // Direct process without edit (e.g. from Camera for now - but we should arguably edit that too)
    async processFile(file: File) {
        // This method is now mostly internal or for direct flows. 
        // We redirect everything through the editor flow if possible.
        this.imageUrl = URL.createObjectURL(file);
        await this.runOcr(file);
    }

    // ... camera and preprocess logic remains same ...

    async runOcr(imageSource: File | string) {
        this.isProcessing = true;
        this.progress = 0;

        try {
            // Preprocess image for better OCR accuracy
            const processedImage = await this.preprocessImage(imageSource);

            // Store processed image separately to preserve original
            this.processedImageUrl = processedImage;

            // Update parameters dynamically if possible, or rely on Engine default.
            // For Mixed layouts (ID Cards), PSM 3 (Auto) or 11 (Sparse) is often better than 6.
            // We'll stick to Engine config, but let's re-verify Engine settings.

            const result = await this.ocrEngine.recognize(processedImage);
            console.log('OCR Raw Result:', result);
            this.extractedData = this.textProcessor.processText(result.data.text);
        } catch (err) {
            console.error('OCR Error:', err);
            alert('Failed to process image');
        } finally {
            this.isProcessing = false;
        }
    }

    async preprocessImage(source: File | string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    // Step 1: Calculate optimal size for Arabic OCR (minimum 1500px width)
                    let targetWidth = Math.max(img.width, 1500);
                    let targetHeight = (img.height / img.width) * targetWidth;

                    // Cap maximum size to avoid memory issues
                    const maxSize = 4000;
                    if (targetWidth > maxSize) {
                        targetWidth = maxSize;
                        targetHeight = (img.height / img.width) * targetWidth;
                    }

                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    // Step 2: Draw image with high quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Step 3: Apply Arabic-specific preprocessing pipeline
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    // Apply in correct order
                    this.applyCLAHE(imageData); // Better than simple contrast
                    this.applyGrayscale(imageData); // Ensure grayscale
                    this.applyUnsharpMask(imageData, canvas.width, canvas.height); // Better than sharpen
                    this.applyMedianFilter(imageData, canvas.width, canvas.height); // Remove noise while preserving text
                    this.applyMorphologicalOperations(imageData, canvas.width, canvas.height); // Arabic-specific

                    ctx.putImageData(imageData, 0, 0);

                    // Step 4: Apply global threshold (OTSU) - Better for Arabic than adaptive
                    const binaryCanvas = document.createElement('canvas');
                    binaryCanvas.width = canvas.width;
                    binaryCanvas.height = canvas.height;
                    const binaryCtx = binaryCanvas.getContext('2d')!;
                    binaryCtx.drawImage(canvas, 0, 0);

                    const binaryImageData = binaryCtx.getImageData(0, 0, binaryCanvas.width, binaryCanvas.height);
                    this.applyOtsuThreshold(binaryImageData);
                    binaryCtx.putImageData(binaryImageData, 0, 0);

                    resolve(binaryCanvas.toDataURL('image/png', 1.0));
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = reject;

            if (typeof source === 'string') {
                img.src = source;
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target?.result as string;
                };
                reader.readAsDataURL(source);
            }
        });
    }

    // NEW: CLAHE (Contrast Limited Adaptive Histogram Equalization) - Best for text
    private applyCLAHE(imageData: ImageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Convert to grayscale first (needed for CLAHE calculation)
        const grayData = new Uint8Array(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            grayData[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // Apply CLAHE-like enhancement
        const blockSize = 8;
        const clipLimit = 3.0;

        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                // Calculate histogram for block
                const hist = new Array(256).fill(0);
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const idx = (y + by) * width + (x + bx);
                        hist[grayData[idx]]++;
                    }
                }

                // Clip histogram
                const clipCount = Math.floor(clipLimit * blockSize * blockSize / 256);
                let excess = 0;
                for (let i = 0; i < 256; i++) {
                    if (hist[i] > clipCount) {
                        excess += hist[i] - clipCount;
                        hist[i] = clipCount;
                    }
                }

                // Redistribute excess
                const addPerBin = Math.floor(excess / 256);
                for (let i = 0; i < 256; i++) {
                    hist[i] += addPerBin;
                }

                // Create CDF
                const cdf = new Array(256).fill(0);
                cdf[0] = hist[0];
                for (let i = 1; i < 256; i++) {
                    cdf[i] = cdf[i - 1] + hist[i];
                }

                // Apply to block
                const totalPixels = Math.min(blockSize, height - y) * Math.min(blockSize, width - x);
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const idx = ((y + by) * width + (x + bx)) * 4;
                        const grayIdx = (y + by) * width + (x + bx);
                        const newValue = Math.floor(255 * cdf[grayData[grayIdx]] / totalPixels);

                        data[idx] = newValue;
                        data[idx + 1] = newValue;
                        data[idx + 2] = newValue;
                    }
                }
            }
        }
    }

    private applyGrayscale(imageData: ImageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = avg; // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
        }
    }

    // NEW: Unsharp Mask (Better than simple sharpen)
    private applyUnsharpMask(imageData: ImageData, width: number, height: number) {
        const data = imageData.data;
        const original = new Uint8ClampedArray(data);

        // Gaussian blur
        const kernel = [1 / 16, 2 / 16, 1 / 16, 2 / 16, 4 / 16, 2 / 16, 1 / 16, 2 / 16, 1 / 16];
        const blurData = new Uint8ClampedArray(data.length);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const weight = kernel[(ky + 1) * 3 + (kx + 1)];
                        sum += original[idx] * weight;
                    }
                }
                const idx = (y * width + x) * 4;
                blurData[idx] = sum;
                blurData[idx + 1] = sum;
                blurData[idx + 2] = sum;
            }
        }

        // Unsharp mask: original + (original - blurred) * amount
        const amount = 0.8;
        for (let i = 0; i < data.length; i += 4) {
            const sharp = original[i] + (original[i] - blurData[i]) * amount;
            data[i] = Math.max(0, Math.min(255, sharp));
            data[i + 1] = Math.max(0, Math.min(255, sharp));
            data[i + 2] = Math.max(0, Math.min(255, sharp));
        }
    }

    // NEW: Median Filter for noise removal
    private applyMedianFilter(imageData: ImageData, width: number, height: number) {
        const data = imageData.data;
        const original = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Collect neighborhood values
                const values = [];
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const nIdx = ((y + ky) * width + (x + kx)) * 4;
                        values.push(original[nIdx]);
                    }
                }

                // Get median
                values.sort((a, b) => a - b);
                const median = values[4]; // 9 values, index 4 is median

                data[idx] = median;
                data[idx + 1] = median;
                data[idx + 2] = median;
            }
        }
    }

    // NEW: Morphological operations for Arabic script
    private applyMorphologicalOperations(imageData: ImageData, width: number, height: number) {
        const data = imageData.data;
        const original = new Uint8ClampedArray(data);

        // Opening: erosion then dilation (removes small dots while preserving Arabic diacritics)

        // Erosion
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Find minimum in 3x3 neighborhood
                let minVal = 255;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const nIdx = ((y + ky) * width + (x + kx)) * 4;
                        minVal = Math.min(minVal, original[nIdx]);
                    }
                }

                data[idx] = minVal;
                data[idx + 1] = minVal;
                data[idx + 2] = minVal;
            }
        }

        // Copy eroded result
        const eroded = new Uint8ClampedArray(data);

        // Dilation
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Find maximum in 3x3 neighborhood
                let maxVal = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const nIdx = ((y + ky) * width + (x + kx)) * 4;
                        maxVal = Math.max(maxVal, eroded[nIdx]);
                    }
                }

                data[idx] = maxVal;
                data[idx + 1] = maxVal;
                data[idx + 2] = maxVal;
            }
        }
    }

    // NEW: Otsu threshold (better for Arabic than adaptive)
    private applyOtsuThreshold(imageData: ImageData) {
        const data = imageData.data;

        // Calculate histogram
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i];
            histogram[gray]++;
        }

        // Calculate total pixels
        const total = data.length / 4;

        // Otsu's method to find optimal threshold
        let sum = 0;
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }

        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVariance = 0;
        let threshold = 0;

        for (let i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB === 0) continue;

            wF = total - wB;
            if (wF === 0) break;

            sumB += i * histogram[i];

            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;

            const variance = wB * wF * (mB - mF) ** 2;

            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = i;
            }
        }

        // Apply threshold
        for (let i = 0; i < data.length; i += 4) {
            const value = data[i] < threshold ? 0 : 255;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
    }

    // Performance Optimization: Handle large images
    private async optimizeImageForOCR(file: File): Promise<File> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');

                    // Calculate optimal size (max 2000px on longer side)
                    const maxDimension = 2000;
                    let width = img.width;
                    let height = img.height;

                    if (width > height && width > maxDimension) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to PNG with compression
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const optimizedFile = new File(
                                [blob],
                                file.name.replace(/\.[^/.]+$/, "") + '_optimized.png',
                                { type: 'image/png' }
                            );
                            resolve(optimizedFile);
                        } else {
                            reject(new Error('Failed to optimize image'));
                        }
                    }, 'image/png', 0.9); // 90% quality
                };
                img.src = e.target?.result as string;
            };

            reader.readAsDataURL(file);
        });
    }

    async debugOCR(imageUrl: string) {
        // Save the processed image for inspection
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'debug_processed_image.png';
        link.click();
    }

    // Camera Logic
    async startCamera() {
        this.showCamera = true;
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setTimeout(() => {
                if (this.videoElement) {
                    this.videoElement.nativeElement.srcObject = this.mediaStream;
                }
            }, 0);
        } catch (err) {
            console.error('Camera Access Error:', err);
            alert('Could not access camera');
            this.showCamera = false;
        }
    }

    captureImage() {
        if (!this.videoElement || !this.canvasElement) return;

        const video = this.videoElement.nativeElement;
        const canvas = this.canvasElement.nativeElement;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);

            // Convert to Blob for later editing if needed, or just DataURL
            canvas.toBlob(blob => {
                if (blob) {
                    // For camera capture, we can also trigger editor if we want.
                    // For now, let's keep it simple: Camera -> Direct OCR
                    // Or ideally Camera -> Edit -> OCR.
                    // Let's create a fake event for consistency or update Editor to accept blobs.

                    // To keep flow fast, I will just run OCR.
                    // But if user wants edits, we could show editor.
                    const file = new File([blob], "capture.png", { type: "image/png" });
                    this.imageUrl = URL.createObjectURL(file);
                    this.stopCamera();
                    this.runOcr(file);
                }
            });
        }
    }

    stopCamera() {
        this.showCamera = false;
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    triggerFileInput() {
        this.fileInput.nativeElement.click();
    }
}
