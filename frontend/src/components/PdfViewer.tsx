import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

// Set up PDF.js worker
// This is important - react-pdf needs to know where to find the worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

interface PdfViewerProps {
    pdfData: ArrayBuffer | null;
    onTextExtracted?: (text: string[], numPages: number) => void;
    onError?: (error: Error) => void;
}

export function PdfViewer({ pdfData, onTextExtracted, onError }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [extractedText, setExtractedText] = useState<string[]>([]);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

    // Convert ArrayBuffer to Blob when pdfData changes
    useEffect(() => {
        if (pdfData) {
            const blob = new Blob([pdfData], { type: 'application/pdf' });
            setPdfBlob(blob);
            setIsLoading(true);
            setExtractedText([]);
            setNumPages(0);
            setPageNumber(1);
        } else {
            setPdfBlob(null);
        }
    }, [pdfData]);

    // Function to extract text from a page
    const extractTextFromPage = async (pageIndex: number, pdf: any): Promise<string> => {
        try {
            const page = await pdf.getPage(pageIndex);
            const textContent = await page.getTextContent();

            // Concatenate the text items
            let pageText = '';
            textContent.items.forEach((item: any) => {
                if ('str' in item) {
                    pageText += item.str + ' ';
                }
            });

            return pageText.trim();
        } catch (err) {
            console.error(`Error extracting text from page ${pageIndex}:`, err);
            return `[Error extracting text from page ${pageIndex}]`;
        }
    };

    // On document load success
    const onDocumentLoadSuccess = async ({ numPages, pdf }: { numPages: number, pdf: any }) => {
        setNumPages(numPages);
        setIsLoading(false);

        try {
            // Extract text from all pages
            const textPromises = Array.from({ length: numPages }, (_, i) =>
                extractTextFromPage(i + 1, pdf)
            );

            const extractedText = await Promise.all(textPromises);
            setExtractedText(extractedText);

            // Call the callback with extracted text
            if (onTextExtracted) {
                onTextExtracted(extractedText, numPages);
            }

        } catch (error) {
            console.error('Error extracting text:', error);
            if (onError && error instanceof Error) {
                onError(error);
            }
        }
    };

    // Page navigation
    const previousPage = () => {
        setPageNumber(prev => Math.max(prev - 1, 1));
    };

    const nextPage = () => {
        setPageNumber(prev => Math.min(prev + 1, numPages));
    };

    // Handle document load error
    const onDocumentLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
        setIsLoading(false);
        if (onError) {
            onError(error);
        }
    };

    return (
        <div className="flex flex-col items-center">
            {pdfBlob ? (
                <>
                    <div className="border rounded-lg p-4 bg-muted/30 w-full">
                        <Document
                            file={pdfBlob}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="flex flex-col items-center justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                    <p>Loading PDF...</p>
                                </div>
                            }
                            error={
                                <div className="text-center text-destructive p-8">
                                    <p>Failed to load PDF. The document might be corrupted or unsupported.</p>
                                </div>
                            }
                            className="pdf-document"
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="pdf-page"
                                width={Math.min(600, window.innerWidth - 40)}
                            />
                        </Document>
                    </div>

                    {/* Navigation controls */}
                    {numPages > 0 && (
                        <div className="flex items-center justify-between w-full mt-4">
                            <Button
                                onClick={previousPage}
                                disabled={pageNumber <= 1}
                                variant="outline"
                                size="sm"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>

                            <div className="text-sm">
                                Page {pageNumber} of {numPages}
                            </div>

                            <Button
                                onClick={nextPage}
                                disabled={pageNumber >= numPages}
                                variant="outline"
                                size="sm"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}

                    {/* Text content section (optional) */}
                    {extractedText.length > 0 && pageNumber <= extractedText.length && (
                        <Card className="w-full mt-4 p-4 max-h-48 overflow-auto text-sm">
                            <h3 className="font-medium mb-2">Extracted Text (Page {pageNumber}):</h3>
                            <div className="text-muted-foreground whitespace-pre-wrap">
                                {extractedText[pageNumber - 1]}
                            </div>
                        </Card>
                    )}
                </>
            ) : (
                <div className="text-center p-8 border border-dashed rounded-lg w-full">
                    <p>Upload a PDF file to view and extract text</p>
                </div>
            )}
        </div>
    );
}

export default PdfViewer;

