/**
 * Utility functions for file handling - Matches React app's file.utils.js
 */

/**
 * Converts a Base64 string to a Blob
 */
export function base64ToBlob(b64Data: string, contentType: string = 'application/pdf', sliceSize: number = 512): Blob {
    // Clean up base64 string
    const cleanB64 = b64Data.replace(/[\n\r\s]/g, '');

    const byteCharacters = atob(cleanB64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

/**
 * Extract Base64 data from various API response structures
 */
export function extractBase64FromResponse(responseData: any): string | null {
    if (!responseData) return null;

    if (typeof responseData === 'string') return responseData;

    // Common patterns: { result: { data: "..." } }, { data: "..." }, { result: "..." }
    return responseData.result?.data ||
        responseData.data?.data ||
        responseData.data ||
        responseData.result ||
        null;
}

/**
 * Downloads a file from Base64 data
 */
export async function downloadBase64File(
    data: string | Blob | any,
    fileName: string,
    mimeType: string = 'application/pdf'
): Promise<boolean> {
    try {
        // If data is already a Blob, check if it's actually JSON (error or wrapped base64)
        if (data instanceof Blob) {
            // Read first few bytes to check signature
            const header = await data.slice(0, 50).text();

            // If it looks like JSON, parse it
            if (header.trim().startsWith('{')) {
                const text = await data.text();
                try {
                    const json = JSON.parse(text);
                    // Extract base64 from the parsed JSON and recurse
                    const base64 = extractBase64FromResponse(json);
                    return await downloadBase64File(base64, fileName, mimeType);
                } catch (e) {
                    console.error('Failed to parse JSON from Blob', e);
                    // Fallback to downloading the blob as is if parse fails
                }
            }

            // Otherwise treat as binary file
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            return true;
        }

        let base64String: string | null = null;

        if (typeof data === 'string') {
            base64String = data;
        } else {
            base64String = extractBase64FromResponse(data);
        }

        if (!base64String || typeof base64String !== 'string') {
            console.error('Invalid base64 data for download', data);
            return false;
        }

        const blob = base64ToBlob(base64String, mimeType);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        return true;
    } catch (error) {
        console.error('Error downloading file:', error);
        return false;
    }
}

/**
 * Convert file to Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // Remove data URL prefix (e.g., "data:image/png;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error('Failed to convert file to base64'));
            }
        };
        reader.onerror = error => reject(error);
    });
}
