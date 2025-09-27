// Import the library types
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js to use built-in worker
if (typeof window !== 'undefined') {
    try {
        console.log('Setting up PDF.js to use built-in workers');

        // Force PDF.js to use fake workers to avoid CORS issues
        // @ts-ignore - This is a valid configuration option for PDF.js
        pdfjsLib.GlobalWorkerOptions.disableWorker = true;

        // This will tell PDF.js to disable worker threads and run in main thread
        // which is more compatible with different environments
        console.log('PDF.js worker disabled, will run in main thread');
    } catch (error) {
        console.error('Failed to set up PDF.js worker:', error);
    }
}

export interface ExtractedPage {
    pageNumber: number;
    text: string;
}

// Type definition for any buffer-like object
export type BufferSource = ArrayBuffer | SharedArrayBuffer;

// Helper function to ensure we pass a valid buffer to PDF.js
function createPdfDataSource(buffer: BufferSource): { data: Uint8Array } {
    // Convert buffer to Uint8Array which is accepted by PDF.js
    return { data: new Uint8Array(buffer) };
}

/**
 * Extract text from a PDF file
 * 
 * @param pdfData - The PDF file data as an ArrayBuffer or SharedArrayBuffer
 * @returns Promise with array of extracted text by page
 */
export async function extractTextFromPdf(pdfData: BufferSource): Promise<ExtractedPage[]> {
    try {
        console.log('Starting PDF extraction...');

        // Get the data source
        const dataSource = createPdfDataSource(pdfData);
        console.log('PDF data source created, length:', dataSource.data.length);

        // Use the simplest PDF loading configuration possible
        const loadingTask = pdfjsLib.getDocument(dataSource.data);

        // Set a timeout for loading
        const loadingPromise = Promise.race([
            loadingTask.promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('PDF loading timeout')), 10000))
        ]);

        console.log('PDF document loading...');
        const pdf = await loadingPromise as pdfjsLib.PDFDocumentProxy;
        console.log('PDF loaded successfully, pages:', pdf.numPages);

        // Get total number of pages
        const numPages = pdf.numPages;
        const extractedPages: ExtractedPage[] = [];

        // Process each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
                console.log(`Processing page ${pageNum}...`);

                // Get page
                const page = await pdf.getPage(pageNum);

                // Extract text content
                const textContent = await page.getTextContent();
                console.log(`Got text content for page ${pageNum}, items:`, textContent.items.length);

                // Concatenate the text items
                let pageText = '';
                textContent.items.forEach((item: any) => {
                    if ('str' in item) {
                        pageText += item.str + ' ';
                    }
                });

                extractedPages.push({
                    pageNumber: pageNum - 1, // Convert to 0-based index
                    text: pageText.trim() || `[No text content found on page ${pageNum}]`
                });

                console.log(`Page ${pageNum} processed, text length:`, pageText.length);
            } catch (err) {
                console.error(`Error extracting text from page ${pageNum}:`, err);
                extractedPages.push({
                    pageNumber: pageNum - 1,
                    text: `[Error extracting text from page ${pageNum}: ${err instanceof Error ? err.message : String(err)}]`
                });
            }
        }

        console.log('PDF extraction completed successfully');
        return extractedPages;
    } catch (err) {
        console.error('Error processing PDF:', err);
        // Return at least one page with error message instead of throwing
        return [{
            pageNumber: 0,
            text: `[PDF processing error: ${err instanceof Error ? err.message : String(err)}]`
        }];
    }
}

/**
 * Check if a substring exists in a specific page of PDF text
 * 
 * @param pages - Array of extracted page texts
 * @param pageIndex - The page to search (0-based index)
 * @param substring - The text to search for
 * @returns Object with match info including offset
 */
export function findSubstringInPage(
    pages: ExtractedPage[],
    pageIndex: number,
    substring: string
): { found: boolean; offset: number; pageText: string } {
    // Validate inputs
    if (pageIndex < 0 || pageIndex >= pages.length) {
        return { found: false, offset: -1, pageText: '' };
    }

    const page = pages[pageIndex];
    const pageText = page.text;

    // Search for the substring
    const offset = pageText.indexOf(substring);

    return {
        found: offset !== -1,
        offset,
        pageText
    };
}

/**
 * Extract PDF metadata including signatures
 * 
 * @param pdfData - The PDF file data as ArrayBuffer or SharedArrayBuffer
 * @returns Promise with PDF metadata
 */
export async function extractPdfMetadata(pdfData: BufferSource): Promise<any> {
    try {
        console.log('Extracting PDF metadata...');

        // Get the data source
        const dataSource = createPdfDataSource(pdfData);

        // Use the simplest PDF loading configuration possible
        const loadingTask = pdfjsLib.getDocument(dataSource.data);

        console.log('Loading PDF for metadata extraction...');
        const pdf = await loadingTask.promise;

        // Get the metadata
        console.log('Getting PDF metadata...');
        const metadata = await pdf.getMetadata();
        console.log('PDF metadata retrieved:', metadata.info);

        // Check if the PDF might have a signature (basic check)
        let hasSignature = false;

        // Look for common signature indicators in metadata
        // @ts-ignore - Type is defined in our declaration file
        if (metadata.info && metadata.info.Custom && metadata.info.Custom.Creator) {
            // @ts-ignore - Type is defined in our declaration file
            const creatorString = metadata.info.Custom.Creator.toString().toLowerCase();
            hasSignature = creatorString.includes('sign') ||
                creatorString.includes('certif') ||
                creatorString.includes('adobe') ||
                creatorString.includes('docusign');
        }

        return {
            info: metadata.info,
            metadata: metadata.metadata,
            hasSignature: hasSignature
        };
    } catch (err) {
        console.error('Error extracting PDF metadata:', err);
        // Return basic metadata with error instead of throwing
        return {
            info: { Title: 'Error extracting metadata' },
            metadata: null,
            hasSignature: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}

/**
 * Create a full analysis of a PDF document
 * 
 * @param pdfData - The PDF file data as an ArrayBuffer or SharedArrayBuffer
 * @returns Promise with complete PDF analysis
 */
export async function analyzePdf(pdfData: BufferSource): Promise<{
    pages: ExtractedPage[];
    metadata: any;
    hasSignature: boolean;
    success: boolean;
    error?: string;
}> {
    try {
        console.log('Starting comprehensive PDF analysis...');

        // Extract text first
        const pages = await extractTextFromPdf(pdfData);
        console.log('Text extraction complete, pages:', pages.length);

        // Then get metadata
        const metadata = await extractPdfMetadata(pdfData);
        console.log('Metadata extraction complete');

        // Check if any errors occurred
        const hasErrors = pages.some(page => page.text.startsWith('[PDF processing error:') ||
            page.text.startsWith('[Error extracting text'));

        const metadataError = metadata.error ? true : false;

        // Analysis success if no errors in either extraction
        const success = !hasErrors && !metadataError;

        return {
            pages,
            metadata,
            hasSignature: metadata.hasSignature || false,
            success,
            ...((!success) && { error: 'PDF analysis completed with some errors' })
        };
    } catch (err) {
        console.error('Error analyzing PDF:', err);

        // Return partial results rather than throwing
        return {
            pages: [{
                pageNumber: 0,
                text: `[Failed to analyze PDF: ${err instanceof Error ? err.message : String(err)}]`
            }],
            metadata: { info: { Title: 'Error analyzing PDF' } },
            hasSignature: false,
            success: false,
            error: `Failed to analyze PDF: ${err instanceof Error ? err.message : String(err)}`
        };
    }
}
