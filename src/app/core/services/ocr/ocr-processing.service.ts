import { Injectable } from '@angular/core';

export interface ExtractedData {
    nationalId?: string;
    trafficUnit?: string;
    ownerName?: string;
    vehicleModel?: string;
    chassisNumber?: string;
    motorNumber?: string;
    amounts?: number[];
    dates?: string[];
    rawText: string;
}

@Injectable({
    providedIn: 'root'
})
export class OcrProcessingService {

    constructor() { }

    public processText(text: string): ExtractedData {
        // 1. Normalize Text (Arabic chars, numbers, cleanup)
        const normalizedText = this.normalizeArabicText(text);

        // 2. Filter Noise
        const cleanTextLines = this.filterNoise(normalizedText);
        const cleanText = cleanTextLines.join('\n');

        // Log for debugging
        console.log('Cleaned Text:', cleanText);

        return {
            nationalId: this.extractNationalId(cleanText),
            trafficUnit: this.extractTrafficUnit(cleanText),
            ownerName: this.extractName(cleanText),
            vehicleModel: this.extractVehicleModel(cleanText),
            chassisNumber: this.extractChassisNumber(cleanText),
            motorNumber: this.extractMotorNumber(cleanText),
            amounts: this.extractAmounts(cleanText),
            dates: this.extractDates(cleanText),
            rawText: cleanText // Use the cleaned (but not aggressively regexed) text for display
        };
    }

    /**
     * Comprehensive Arabic Normalization
     */
    private normalizeArabicText(text: string): string {
        if (!text) return '';

        let res = text;

        // 0. Pre-Cleanup: Remove common OCR glitches
        res = res.replace(/[¢®©¥§]/g, ''); // Common symbol noise
        res = res.replace(/\|/g, '');       // Vertical bars often misread 1s or l's

        // 1. Normalize Numerals (Eastern to Western)
        res = res.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);

        // 2. Remove Kashida (Tatweel) "ـ"
        res = res.replace(/\u0640/g, '');

        // 3. Unify Alifs (أ إ آ -> ا)
        res = res.replace(/[أإآ]/g, 'ا');

        // 4. Normalize Teh Marbuta (ة -> ه)
        res = res.replace(/ة/g, 'ه');

        // 5. Normalize Ya (ي -> ي or ى -> ي depending on preference, usually unification helps)
        res = res.replace(/ى/g, 'ي');

        // 6. Fix specific glitches seen in user log (e.g. '8' -> 'ب' in specific contexts inside arabic words?)
        // Be careful with this. Only do safe replacements.
        // e.g. "baa8" -> "baab" is risky without context.
        // Instead, let's just clean excessive spaces locally
        // "م ع ا ذ" -> "معاذ" (Merge isolated single letters?)
        // Too complex for Regex. Let's rely on word-level cleanups below.

        return res;
    }

    private filterNoise(text: string): string[] {
        return text.split('\n').map(line => line.trim()).filter(line => {
            if (line.length < 2) return false;

            // Check Ratio of valid Arabic/English vs Symbols
            const validChars = line.match(/[a-zA-Z\u0600-\u06FF0-9\s]/g)?.length || 0;
            const ratio = validChars / line.length;

            // Heuristic: If line has < 40% valid chars, it's noise.
            if (ratio < 0.4) return false;

            // Specific garbage filter ("aa", "T", "||")
            if (line.length < 4 && !line.match(/\d/)) return false; // Filter short non-numeric lines

            return true;
        }).map(line => {
            // Post-Filter Cleanup: Remove short English noise tokens from Arabic lines
            // e.g. "حسام 2F" -> "حسام"
            // If line is predominantly Arabic, remove distinct English tokens < 3 chars
            const arabicCount = line.match(/[\u0600-\u06FF]/g)?.length || 0;
            if (arabicCount > 5) {
                // Replace short english/number noise (like '2F', 'T') that are isolated
                // keeping long english words (possible names/codes)
                return line.split(' ').filter(token => {
                    const isEnglish = /^[a-zA-Z0-9]+$/.test(token);
                    if (isEnglish && token.length < 3) return false; // Drop "2F", "T", "s"
                    return true;
                }).join(' ');
            }
            return line;
        });
    }

    private extractNationalId(text: string): string | undefined {
        // Look for 14 digits starting with 2 or 3
        // Improved: Allow spaces between digits (OCR often gaps them)
        const match = text.match(/(?:2|3)[\d\s]{13,20}/);
        if (match) {
            const digits = match[0].replace(/\s/g, '');
            if (digits.length === 14) return digits;
            // If length is >14, take first 14 if valid checksum? Or just slice.
            if (digits.length > 14) return digits.slice(0, 14);
        }
        return undefined;
    }

    // ... (Other extractors remain similar, but let's improve Name and Address logic) ...

    private extractTrafficUnit(text: string): string | undefined {
        // Strategy: Match keyword, take rest of line.
        // Support: "مرور ...", "وحدة ..."
        const lineMatch = text.match(/(?:وحدة|إدارة|مرور|قسم)(.*)/);
        if (lineMatch) {
            let val = lineMatch[1];
            // Clean: Remove symbols but keep AR, EN, Numbers, Spaces
            val = val.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ').trim();
            // Remove extra spaces
            val = val.replace(/\s+/g, ' ');

            if (val.length > 2) return `مرور ${val}`;
        }
        return undefined;
    }

    private extractName(text: string): string | undefined {
        // 1. Explicit Label Search
        // Regex: Keyword -> (ignore colon/dash/noise) -> capture rest of line
        const explicit = text.match(/(?:الاسم|المالك)[^:\n]*[:\-\.]?\s*(.*)/);
        if (explicit) {
            let val = explicit[1];
            // Clean symbols
            val = val.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, ' '); // Keep Ar/En/Space (Remove numbers likely? Name shouldn't have numbers usually)
            // Actually, keep numbers just in case of weird OCR (e.g. "Ahmed 2nd") - User said mixed content.
            // But traditionally names don't have numbers. Let's allowing everything except symbols.
            val = val.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ').trim();
            val = val.replace(/\s+/g, ' ');

            if (val.length > 3) return val;
        }

        // 2. Fallback: Heuristic
        const lines = text.split('\n');
        for (const line of lines) {
            const cleanLine = line.trim();
            // Heuristic: Length > 10, Contains Arabic, NO keywords
            // And also check it's NOT a number line (like ID or dates)
            if (cleanLine.length > 10 &&
                /[\u0600-\u06FF]/.test(cleanLine) &&
                !cleanLine.match(/(?:وحدة|إدارة|مرور|قسم|محافظة|رقم|قومي|بطاقة|جمهورية|شاسيه|موتور|موديل)/) &&
                !cleanLine.match(/\d{5,}/) // Not a long number
            ) {
                // Clean symbols
                const cleaned = cleanLine.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '').trim();
                const words = cleaned.split(/\s+/);
                // Name usually 3-5 words
                if (words.length >= 3 && words.length <= 6) {
                    return cleaned;
                }
            }
        }

        return undefined;
    }

    private extractVehicleModel(text: string): string | undefined {
        // Capture everything after "Model"
        const modelMatch = text.match(/موديل\s*[:\.]?\s*([^\n]+)/);
        if (modelMatch) {
            let model = modelMatch[1].trim();
            // Clean symbols
            model = model.replace(/[^\w\u0600-\u06FF0-9\s\-]/g, '');
            return model.trim();
        }
        return undefined;
    }

    private extractChassisNumber(text: string): string | undefined {
        // 1. Explicit
        const keywordMatch = text.match(/شاسيه\s*[:\.]?\s*([A-HJ-NPR-Z0-9\s]+)/); // Allow spaces
        if (keywordMatch) {
            return keywordMatch[1].replace(/\s/g, '').trim(); // Remove spaces from ID
        }

        // 2. Fallback VIN (17 chars)
        const vinRegex = /\b[A-HJ-NPR-Z0-9]{17}\b/;
        const matches = text.match(vinRegex);
        return matches ? matches[0] : undefined;
    }

    private extractMotorNumber(text: string): string | undefined {
        const match = text.match(/موتور\s*[:\.]?\s*([A-Z0-9\s]+)/);
        if (match) return match[1].trim();
        return undefined;
    }

    private extractAmounts(text: string): number[] {
        // Amounts often have "EGP", "ج.م", etc.
        // We look for currency-like patterns
        const amountRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/g;
        const matches = text.match(amountRegex);
        if (!matches) return [];
        return matches.map(m => parseFloat(m.replace(/,/g, '')));
    }

    private extractDates(text: string): string[] {
        // DD/MM/YYYY or DD-MM-YYYY
        const dateRegex = /\b\d{2}[/-]\d{2}[/-]\d{4}\b/g;
        const matches = text.match(dateRegex);
        return matches || [];
    }
}
