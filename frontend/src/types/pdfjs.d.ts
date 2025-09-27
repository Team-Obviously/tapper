// Type definitions for PDF.js

// Extend the PDF.js types
declare module 'pdfjs-dist' {
    // GlobalWorkerOptions
    const GlobalWorkerOptions: {
        workerSrc: string;
        workerPort: any;
        disableWorker?: boolean;
    };

    // DocumentInitParameters
    interface DocumentInitParameters {
        // Core properties
        data?: Uint8Array | BufferSource;
        url?: string;
        
        // Additional properties
        verbosity?: number;
        disableFontFace?: boolean;
        nativeImageDecoderSupport?: 'none' | 'display' | 'all';
        cMapUrl?: string;
        cMapPacked?: boolean;
        disableRange?: boolean;
        disableAutoFetch?: boolean;
        disableStream?: boolean;
        isEvalSupported?: boolean;
        [key: string]: any;
    }

    // PDFDocumentProxy
    interface PDFDocumentProxy {
        numPages: number;
        getPage(pageNumber: number): Promise<PDFPageProxy>;
        getMetadata(): Promise<PDFDocumentMetadata>;
        [key: string]: any;
    }

    // PDFPageProxy
    interface PDFPageProxy {
        getTextContent(params?: {}): Promise<PDFTextContent>;
        [key: string]: any;
    }

    // PDFTextContent
    interface PDFTextContent {
        items: Array<PDFTextItem>;
        [key: string]: any;
    }

    // PDFTextItem
    interface PDFTextItem {
        str: string;
        [key: string]: any;
    }

    // PDFDocumentMetadata
    interface PDFDocumentMetadata {
        info: PDFInfo;
        metadata: any;
        [key: string]: any;
    }

    // PDFInfo
    interface PDFInfo {
        Title?: string;
        Author?: string;
        Subject?: string;
        Keywords?: string;
        Creator?: string;
        Producer?: string;
        CreationDate?: string;
        ModDate?: string;
        Custom?: {
            Creator?: string;
            [key: string]: any;
        };
        [key: string]: any;
    }

    // getDocument function
    function getDocument(params: string | URL | TypedArray | DocumentInitParameters): PDFDocumentLoadingTask;

    // PDFDocumentLoadingTask
    interface PDFDocumentLoadingTask {
        promise: Promise<PDFDocumentProxy>;
        [key: string]: any;
    }

    // Basic types
    type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;
}
