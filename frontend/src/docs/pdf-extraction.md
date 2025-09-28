# PDF Text Extraction with PDF.js

This document explains how PDF text extraction is implemented in our application using Mozilla's PDF.js library.

## Overview

We've implemented PDF text extraction functionality that allows users to:

1. Upload PDF documents
2. Extract text content from all pages
3. Search for specific text within the document
4. Verify if text appears at specific positions in the document

## Implementation

### Libraries Used

- **pdfjs-dist**: Mozilla's PDF.js distributed through npm (version 4.0.379)
- Our own wrapper services to provide a consistent API

### Core Components

1. **pdf-service.ts**: Core service for PDF text extraction
   - `extractTextFromPdf()`: Extracts text from a PDF document by page
   - `findSubstringInPage()`: Checks if a substring exists on a specific page
   - `extractPdfMetadata()`: Extracts PDF metadata 
   - `analyzePdf()`: Comprehensive PDF analysis

2. **wasm-loader.ts**: API compatibility layer
   - Implements a consistent API similar to zkPDF's WASM interface
   - Makes the transition to actual zkPDF implementation easier in future

3. **ZkPdfVerifier.tsx**: UI Component
   - Provides user interface for PDF upload and text verification
   - Displays extracted text and verification results

## PDF.js Integration

The integration with PDF.js follows these steps:

1. **PDF Loading**: PDF.js loads the document and processes its structure
2. **Text Extraction**: We extract text content from each page
3. **Text Processing**: We analyze and format the extracted text
4. **Search and Verification**: We implement search functionality on the extracted text

## Usage Example

```typescript
import { analyzePdf } from '../lib/pdf-service';

// Process a PDF file
async function processPdf(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Get full PDF analysis
  const analysis = await analyzePdf(arrayBuffer);
  
  // Access extracted text by page
  const pages = analysis.pages;
  
  // Search for text
  const searchTerm = "example";
  const pageIndex = 0;
  
  if (pages[pageIndex].text.includes(searchTerm)) {
    console.log("Text found!");
    
    // Find exact position
    const offset = pages[pageIndex].text.indexOf(searchTerm);
    console.log(`Found at offset: ${offset}`);
  }
}
```

## Limitations

1. **PDF Structure Variations**: PDF.js may extract text differently depending on how the PDF was created
2. **Complex Layouts**: Tables, multiple columns, and complex layouts might not extract perfectly
3. **Signature Detection**: Basic signature detection only; no cryptographic verification
4. **Font Embedding**: Special fonts may not render correctly in extracted text

## Future Improvements

1. Improve text extraction for complex layouts
2. Add cryptographic signature verification
3. Extract embedded images and metadata
4. Integrate with the actual zkPDF WASM module
5. Support for encrypted PDFs

