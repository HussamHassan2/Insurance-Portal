import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { createWorker } from 'tesseract.js';

@Injectable({
    providedIn: 'root'
})
export class OcrEngineService {
    private worker: any;
    progress = new Subject<number>();
    private workerReady$ = new BehaviorSubject<boolean>(false);

    constructor() {
        this.initializeTesseract();
    }

    get isReady(): Observable<boolean> {
        return this.workerReady$.asObservable();
    }

    private async initializeTesseract() {
        try {
            console.log('🔄 Initializing Tesseract OCR Worker...');

            // Initialize worker
            this.worker = await createWorker();
            console.log('✅ Worker created successfully');

            // CRITICAL: Load Arabic language with specific settings
            console.log('🔄 Loading Arabic language data...');
            await this.worker.loadLanguage('ara');
            console.log('✅ Arabic language loaded');

            console.log('🔄 Initializing Arabic language...');
            await this.worker.initialize('ara');
            console.log('✅ Arabic language initialized');

            // Set Arabic-optimized parameters
            console.log('🔄 Setting OCR parameters...');
            await this.worker.setParameters({
                tessedit_pageseg_mode: '6', // Single uniform block - BEST FOR ARABIC
                tessedit_ocr_engine_mode: '1', // LSTM only
                preserve_interword_spaces: '1',
                textord_min_linesize: '2.5', // Better for Arabic script
                tessedit_char_blacklist: '|><}{][)(*&^%$#@!~`_+=-\\', // Remove unwanted symbols
                user_defined_dpi: '300', // Force high DPI
                debug_file: '/dev/null'
            });
            console.log('✅ OCR parameters set');

            this.workerReady$.next(true);
            console.log('✅ OCR Worker Optimized for Arabic Ready');
        } catch (error) {
            console.error('❌ Failed to initialize OCR worker:', error);
            alert('Failed to initialize OCR engine. Please check console for details.');
        }
    }

    async recognize(imageData: string): Promise<any> {
        console.log('🔄 Starting OCR recognition...');

        if (!this.worker) {
            console.log('⚠️ Worker not initialized, initializing now...');
            await this.initializeTesseract();
        }

        try {
            console.log('🔄 Running Tesseract recognition...');
            const result = await this.worker.recognize(imageData);
            console.log('✅ OCR Recognition complete');
            console.log('📝 Raw text extracted:', result.data.text);

            // Post-process Arabic text
            result.data.text = this.postProcessArabic(result.data.text);
            console.log('✅ Post-processing complete');
            console.log('📝 Processed text:', result.data.text);

            return result;
        } catch (error) {
            console.error('❌ OCR Recognition Error:', error);
            alert('OCR recognition failed. Please check console for details.');
            throw error;
        }
    }

    private postProcessArabic(text: string): string {
        // Fix common Arabic OCR errors
        const corrections: { [key: string]: string } = {
            // Fix Arabic letter forms
            'ﺍ': 'ا', 'ﺎ': 'ا', 'ﺏ': 'ب', 'ﺐ': 'ب',
            'ﺓ': 'ة', 'ﺔ': 'ة', 'ﺕ': 'ت', 'ﺖ': 'ت',
            'ﺙ': 'ث', 'ﺚ': 'ث', 'ﺝ': 'ج', 'ﺞ': 'ج',
            'ﺡ': 'ح', 'ﺢ': 'ح', 'ﺥ': 'خ', 'ﺦ': 'خ',
            'ﺩ': 'د', 'ﺪ': 'د', 'ﺫ': 'ذ', 'ﺬ': 'ذ',
            'ﺭ': 'ر', 'ﺮ': 'ر', 'ﺯ': 'ز', 'ﺰ': 'ز',
            'ﺱ': 'س', 'ﺲ': 'س', 'ﺵ': 'ش', 'ﺶ': 'ش',
            'ﺹ': 'ص', 'ﺺ': 'ص', 'ﺽ': 'ض', 'ﺾ': 'ض',
            'ﻁ': 'ط', 'ﻂ': 'ط', 'ﻅ': 'ظ', 'ﻆ': 'ظ',
            'ﻉ': 'ع', 'ﻊ': 'ع', 'ﻍ': 'غ', 'ﻎ': 'غ',
            'ﻑ': 'ف', 'ﻒ': 'ف', 'ﻕ': 'ق', 'ﻖ': 'ق',
            'ﻙ': 'ك', 'ﻚ': 'ك', 'ﻝ': 'ل', 'ﻞ': 'ل',
            'ﻡ': 'م', 'ﻢ': 'م', 'ﻥ': 'ن', 'ﻦ': 'ن',
            'ﻩ': 'ه', 'ﻪ': 'ه', 'ﻭ': 'و', 'ﻮ': 'و',
            'ﻱ': 'ي', 'ﻲ': 'ي', 'ﻯ': 'ى', 'ﻰ': 'ى',

            // Fix ligatures
            'ﻻ': 'لا', 'ﻼ': 'لا', 'ﻷ': 'لأ', 'ﻸ': 'لأ',
            'ﻹ': 'لإ', 'ﻺ': 'لإ', 'ﻵ': 'لآ', 'ﻶ': 'لآ',

            // Fix numbers (Eastern Arabic numerals)
            '٠': '۰', '١': '۱', '٢': '۲', '٣': '۳',
            '٤': '۴', '٥': '۵', '٦': '۶', '٧': '۷',
            '٨': '۸', '٩': '۹',

            // Common misrecognitions
            'c': 'س', 'C': 'س', 's': 'ص', 'S': 'ص',
            'o': '٠', 'O': '٠', '0': '۰', '1': '۱',
            '2': '۲', '3': '۳', '4': '۴', '5': '۵',
            '6': '۶', '7': '۷', '8': '۸', '9': '۹',
        };

        let processedText = text;
        for (const [wrong, correct] of Object.entries(corrections)) {
            processedText = processedText.replace(new RegExp(wrong, 'g'), correct);
        }

        // Remove extra spaces
        processedText = processedText.replace(/\s+/g, ' ').trim();

        return processedText;
    }

    async destroy() {
        if (this.worker) {
            await this.worker.terminate();
        }
    }
}
