import { analyzePdf, extractTextFromPdf, findSubstringInPage, ExtractedPage } from './pdf-service';

// This combines both the WASM functionality (future) and our PDF.js service
let wasmInstance: any = null;

export interface PdfAnalysisResult {
    success: boolean;
    pages: string[];
    extractedPages?: ExtractedPage[];
    signature?: {
        is_valid: boolean;
        public_key?: string;
    };
    metadata?: any;
    error?: string;
}

export interface SubstringVerificationResult {
    success: boolean;
    substring_matches: boolean;
    offset?: number;
    signature?: {
        is_valid: boolean;
        public_key?: string;
    };
    error?: string;
}

export async function loadWasm() {
    if (wasmInstance) return wasmInstance;

    try {
        // Instead of using WASM, we'll use our PDF.js service directly
        // In the future, we can integrate actual WASM here
        wasmInstance = {
            // Extract text and check signature
            wasm_verify_and_extract: async (uint8: Uint8Array): Promise<PdfAnalysisResult> => {
                try {
                    console.log("Extracting text from PDF with PDF.js...");
                    // Convert to proper ArrayBuffer if needed
                    const pdfData = uint8.buffer.slice(0);

                    const analysis = await analyzePdf(pdfData);

                    // Convert ExtractedPage[] to string[]
                    const pageTexts = analysis.pages.map(page => page.text);

                    return {
                        success: analysis.success,
                        pages: pageTexts,
                        extractedPages: analysis.pages,
                        signature: {
                            is_valid: analysis.hasSignature,
                            // No actual public key available through PDF.js
                            public_key: analysis.hasSignature ? "EXTRACTED_KEY_PLACEHOLDER" : undefined
                        },
                        metadata: analysis.metadata,
                        ...(analysis.error && { error: analysis.error })
                    };
                } catch (error: any) {
                    console.error("PDF extraction error:", error);
                    return {
                        success: false,
                        pages: [],
                        error: error.message || "Failed to extract PDF"
                    };
                }
            },

            // Just extract text
            wasm_extract_text: async (uint8: Uint8Array): Promise<string[]> => {
                try {
                    console.log("Extracting text from PDF with PDF.js...");
                    // Convert to proper ArrayBuffer if needed
                    const pdfData = uint8.buffer.slice(0);

                    const extractedPages = await extractTextFromPdf(pdfData);
                    return extractedPages.map(page => page.text);
                } catch (error) {
                    console.error("PDF text extraction error:", error);
                    return ["Error extracting text from PDF"];
                }
            },

            // Verify text with offset
            wasm_verify_text: async (
                uint8: Uint8Array,
                page: number,
                text: string,
                offset: number
            ): Promise<SubstringVerificationResult> => {
                try {
                    console.log(`Verifying text "${text}" on page ${page} at offset ${offset}`);
                    // Convert to proper ArrayBuffer if needed
                    const pdfData = uint8.buffer.slice(0);

                    // Extract all text first
                    const extractedPages = await extractTextFromPdf(pdfData);

                    // Find substring
                    let substringMatch;

                    if (offset >= 0) {
                        // Check if the substring is at the exact offset
                        const pageText = extractedPages[page]?.text || "";
                        const substringAtOffset = pageText.substring(offset, offset + text.length);
                        substringMatch = substringAtOffset === text;
                    } else {
                        // Just check if substring exists anywhere on the page
                        const result = findSubstringInPage(extractedPages, page, text);
                        substringMatch = result.found;
                        offset = result.offset; // Update offset with found position
                    }

                    // Also get metadata for signature info
                    const metadata = await analyzePdf(pdfData);

                    return {
                        success: true,
                        substring_matches: substringMatch,
                        offset: offset >= 0 ? offset : undefined,
                        signature: {
                            is_valid: metadata.hasSignature,
                            // No actual public key available through PDF.js
                            public_key: metadata.hasSignature ? "EXTRACTED_KEY_PLACEHOLDER" : undefined
                        }
                    };
                } catch (error: any) {
                    console.error("PDF verification error:", error);
                    return {
                        success: false,
                        substring_matches: false,
                        error: error.message || "Failed to verify text in PDF"
                    };
                }
            }
        };

        return wasmInstance;
    } catch (error) {
        console.error("Failed to initialize PDF processor:", error);
        throw error;
    }
}
