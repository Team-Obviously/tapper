import { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react'
import { publicKeyInfoToPEM, initPKIjs } from '@/lib/pdf-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import PdfViewer from './PdfViewer'
import {
    AlertCircle,
    Check,
    FileText,
    Loader2,
    Search,
    Upload,
    Zap
} from 'lucide-react'

type VerificationMode = 'extract' | 'text' | 'substring'

export const ZkPdfVerifier = () => {
    // State management
    const [status, setStatus] = useState<string>('Drop a PDF file here or click to select')
    const [publicKeyPEM, setPublicKeyPEM] = useState<string | null>(null)
    const [signatureValid, setSignatureValid] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
    const [pages, setPages] = useState<string[]>([])
    const [selectedPage, setSelectedPage] = useState<number>(0)
    const [selectedText, setSelectedText] = useState<string>('')
    const [selectionStart, setSelectionStart] = useState<number>(0)
    const [verificationResult, setVerificationResult] = useState<any>(null)
    const [proofData, setProofData] = useState<string | null>(null)
    const [proofError, setProofError] = useState<string | null>(null)
    const [proofLoading, setProofLoading] = useState<boolean>(false)
    const [showDecoded, setShowDecoded] = useState(false)
    const [proofVerified, setProofVerified] = useState<boolean | null>(null)
    const [verificationMode, setVerificationMode] = useState<VerificationMode>('extract')
    const [isDragOver, setIsDragOver] = useState(false)
    const [calculatedOffset, setCalculatedOffset] = useState<number | null>(null)
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
    const [substringCheck, setSubstringCheck] = useState({
        text: '',
        page: 0
    })
    const [isLoading, setIsLoading] = useState(false)

    // Initialize PKIjs
    useEffect(() => {
        initPKIjs()
    }, [])

    const encoder = useMemo(() => new TextEncoder(), [])

    // Reset state when starting new verification
    const resetState = useCallback(() => {
        setError(null)
        setSignatureValid(null)
        setPublicKeyPEM(null)
        setPdfBytes(null)
        setPages([])
        setSelectedPage(0)
        setSelectedText('')
        setSelectionStart(0)
        setVerificationResult(null)
        setProofData(null)
        setProofError(null)
        setProofLoading(false)
        setShowDecoded(false)
        setProofVerified(null)
        setCalculatedOffset(null)
        setUploadedFileName(null)
    }, [])

    // Process uploaded PDF file
    const processFile = useCallback(async (file: File) => {
        setStatus('Processing PDF file...')
        setIsLoading(true)
        resetState()
        setUploadedFileName(file.name)

        try {
            // Basic validation checks
            if (file.type !== 'application/pdf') {
                setError('Selected file is not a PDF. Please upload a PDF document.')
                setStatus('❌ Invalid file type')
                setIsLoading(false)
                return
            }

            // Size check - limit to 50MB
            const maxSize = 50 * 1024 * 1024; // 50MB in bytes
            if (file.size > maxSize) {
                setError(`PDF file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`)
                setStatus('❌ File too large')
                setIsLoading(false)
                return
            }

            setStatus('Reading file content...')
            const buffer = await file.arrayBuffer()
            const uint8 = new Uint8Array(buffer)
            setPdfBytes(uint8)

            // We'll let the PdfViewer component handle the text extraction
            // The text will be provided via the onTextExtracted callback
            setStatus('PDF loaded. Extracting text...')

            // For signature verification (to be implemented)
            try {
                // Basic signature check could be added here in the future
                // For now, we'll just set it as not verified
                setSignatureValid(false)
                setPublicKeyPEM("Signature verification not implemented in this version.")
            } catch (signatureError: any) {
                console.error('Signature verification error:', signatureError)
            }
        } catch (err: any) {
            console.error('File handling error:', err)
            setError(err.message || 'Error processing file')
            setStatus('❌ Error processing file')
            setIsLoading(false)
        }
        // Don't set isLoading to false here for success path,
        // as the PdfViewer component will do that via callbacks
    }, [resetState])

    // Callback for when the PDF viewer extracts text
    const handleTextExtracted = useCallback((extractedText: string[], numPages: number) => {
        setPages(extractedText)
        setStatus(`✅ Successfully extracted text from ${numPages} pages`)
        setIsLoading(false)
    }, [])

    // Callback for PDF viewer errors
    const handlePdfViewerError = useCallback((error: Error) => {
        console.error('PDF viewer error:', error)
        setError(error.message || 'Error processing PDF')
        setStatus('❌ PDF processing failed')
        setIsLoading(false)
    }, [])

    // File input change handler
    const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            await processFile(file)
        }
    }

    // Drag and drop handlers
    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const file = e.dataTransfer.files[0]
        if (file && file.type === 'application/pdf') {
            await processFile(file)
        } else {
            setError('Please drop a PDF file')
            setStatus('Invalid file type')
        }
    }, [processFile])

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    // Text selection handler
    const onTextSelect = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const t = e.target as HTMLTextAreaElement
        const value = t.value
        const start = t.selectionStart
        const end = t.selectionEnd

        setSelectedText(value.substring(start, end))
        setSelectionStart(encoder.encode(value.slice(0, start)).length)
    }

    // Verify selected text with offset
    const onVerifySelection = async () => {
        if (!pdfBytes || !selectedText) {
            setError('Please enter text to verify')
            return
        }

        setIsLoading(true)
        try {
            const wasm = await loadWasm()
            setStatus('Verifying text and signature...')

            const res = await wasm.wasm_verify_text(
                pdfBytes,
                selectedPage,
                selectedText,
                selectionStart
            )

            setVerificationResult(res)

            if (res && typeof res === 'object') {
                const resObj = res as any
                if (resObj.success) {
                    setSignatureValid(resObj.signature?.is_valid)
                    setStatus('✅ Text verification completed successfully')

                    // If signature is valid, show public key
                    if (resObj.signature?.is_valid && resObj.signature?.public_key) {
                        try {
                            // Handle public key if available (might be a placeholder in our implementation)
                            if (resObj.signature.public_key !== "EXTRACTED_KEY_PLACEHOLDER") {
                                const binaryString = atob(resObj.signature.public_key)
                                const bytes = new Uint8Array(binaryString.length)
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i)
                                }
                                setPublicKeyPEM(publicKeyInfoToPEM(bytes.buffer))
                            } else {
                                // Use placeholder text for now
                                setPublicKeyPEM("PDF.js cannot extract signature keys directly.\nImplement actual key extraction with cryptography libraries.")
                            }
                        } catch (e) {
                            console.warn('Could not convert public key to PEM:', e)
                        }
                    }
                } else {
                    setError(resObj.error || 'Text verification failed')
                    setStatus('❌ Text verification failed')
                }
            }
        } catch (err: any) {
            setError(`Verification error: ${err.message}`)
            setStatus('❌ Verification error')
        } finally {
            setIsLoading(false)
        }
    }

    // Verify substring
    const onVerifySubstring = async () => {
        if (!pdfBytes || !substringCheck.text) {
            setError('Please enter text to verify')
            return
        }

        setIsLoading(true)
        try {
            const wasm = await loadWasm()
            setStatus('Verifying substring with signature...')

            // Find the substring in the text
            const pageText = pages[substringCheck.page]
            if (!pageText) {
                setError(`Page ${substringCheck.page} not found`)
                setIsLoading(false)
                return
            }

            const calculatedOffset = pageText.indexOf(substringCheck.text)
            if (calculatedOffset === -1) {
                setError(`Text "${substringCheck.text}" not found on page ${substringCheck.page}`)
                setIsLoading(false)
                return
            }

            setCalculatedOffset(calculatedOffset)

            const res = await wasm.wasm_verify_text(
                pdfBytes,
                substringCheck.page,
                substringCheck.text,
                calculatedOffset
            )

            setVerificationResult(res)

            if (res && typeof res === 'object') {
                const resObj = res as any
                if (resObj.success) {
                    setSignatureValid(resObj.signature?.is_valid)

                    if (resObj.substring_matches) {
                        setStatus('✅ Substring found and verified successfully')
                    } else {
                        setStatus('❌ Substring not found at calculated offset')
                    }

                    // If signature is valid, show public key
                    if (resObj.signature?.is_valid && resObj.signature?.public_key) {
                        try {
                            // Handle public key if available (might be a placeholder in our implementation)
                            if (resObj.signature.public_key !== "EXTRACTED_KEY_PLACEHOLDER") {
                                const binaryString = atob(resObj.signature.public_key)
                                const bytes = new Uint8Array(binaryString.length)
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i)
                                }
                                setPublicKeyPEM(publicKeyInfoToPEM(bytes.buffer))
                            } else {
                                // Use placeholder text for now
                                setPublicKeyPEM("PDF.js cannot extract signature keys directly.\nImplement actual key extraction with cryptography libraries.")
                            }
                        } catch (e) {
                            console.warn('Could not convert public key to PEM:', e)
                        }
                    }
                } else {
                    setError(resObj.error || 'Substring verification failed')
                    setStatus('❌ Substring verification failed')
                }
            }
        } catch (err: any) {
            setError(`Verification error: ${err.message}`)
            setStatus('❌ Verification error')
        } finally {
            setIsLoading(false)
        }
    }

    // Generate ZK proof
    const onGenerateProof = async () => {
        setStatus('Generating proof...')
        setProofLoading(true)
        setProofError(null)
        setProofData(null)

        try {
            // Note: You would need to set up the API endpoint for proof generation
            const res = await fetch('http://localhost:3001/prove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdf_bytes: Array.from(pdfBytes!),
                    page_number: selectedPage,
                    offset: selectionStart,
                    sub_string: selectedText,
                }),
            })

            if (!res.ok) throw new Error(`Status ${res.status}`)

            const data = await res.json()
            setProofData(JSON.stringify(data, null, 2))
        } catch (e: any) {
            if (
                e.message.includes("fetch") ||
                e.message.includes("Failed to fetch") ||
                e.message.includes("ECONNREFUSED")
            ) {
                setProofError("Prover API is not set up. Please check the documentation to set up a local prover API.")
            } else {
                setProofError(e.message)
            }
        } finally {
            setProofLoading(false)
            setStatus('Ready.')
        }
    }

    // Check if proof is valid
    const onVerifyProof = () => {
        if (decoded) setProofVerified(decoded[decoded.length - 1])
    }

    // Decode proof data
    const decoded = useMemo(() => {
        if (!proofData) return null
        try {
            return JSON.parse(proofData).public_values.buffer.data.map((v: number) =>
                Boolean(v)
            )
        } catch {
            return null
        }
    }, [proofData])

    return (
        <div className="w-full flex flex-col">
            <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">PDF Verification</h1>
                <p className="text-muted-foreground">
                    Verify PDF signatures and generate zero-knowledge proofs
                </p>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left panel - Upload & Mode Selection */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                PDF Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Verification Mode Selection */}
                            <div className="space-y-2">
                                <Label>Verification Mode</Label>
                                <Tabs
                                    defaultValue="extract"
                                    value={verificationMode}
                                    onValueChange={(value) => setVerificationMode(value as VerificationMode)}
                                    className="w-full"
                                >
                                    <TabsList className="grid grid-cols-2 w-full">
                                        <TabsTrigger value="extract">Extract + Verify</TabsTrigger>
                                        <TabsTrigger value="substring">Check Substring</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Substring Mode Options */}
                            {verificationMode === 'substring' && (
                                <Card className="bg-muted">
                                    <CardContent className="pt-4 space-y-3">
                                        <div className="text-sm font-medium">Substring Check</div>

                                        <div className="text-xs bg-blue-500/10 border border-blue-200 rounded-md p-2 dark:bg-blue-950/50 dark:border-blue-900">
                                            <p className="font-medium mb-1">How to use:</p>
                                            <ol className="list-decimal pl-5 space-y-0.5">
                                                <li>Upload PDF to extract text first</li>
                                                <li>Enter the text you want to find</li>
                                                <li>Specify which page (0-based index)</li>
                                                <li>Click "Verify Substring"</li>
                                            </ol>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="check-text" className="text-sm">Text to Check:</Label>
                                            <Input
                                                id="check-text"
                                                value={substringCheck.text}
                                                onChange={(e) => setSubstringCheck(prev => ({
                                                    ...prev,
                                                    text: e.target.value
                                                }))}
                                                placeholder="Enter exact text to search for"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="page-number" className="text-sm">Page Number:</Label>
                                            <Input
                                                id="page-number"
                                                type="number"
                                                min="0"
                                                value={substringCheck.page}
                                                onChange={(e) => setSubstringCheck(prev => ({
                                                    ...prev,
                                                    page: parseInt(e.target.value) || 0
                                                }))}
                                                placeholder="0"
                                            />
                                        </div>

                                        <Button
                                            onClick={onVerifySubstring}
                                            disabled={!substringCheck.text || !pdfBytes || isLoading}
                                            className="w-full"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="h-4 w-4 mr-2" />
                                                    Verify Substring
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* File Drop Area */}
                            <div
                                className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-all ${isDragOver
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                                    }`}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                style={{ minHeight: '180px' }}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={onFileChange}
                                    className="hidden"
                                    id="pdf-input"
                                />

                                {isLoading ? (
                                    <div className="text-center">
                                        <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
                                        <p className="text-lg font-medium">{status}</p>
                                        <p className="text-sm text-muted-foreground mt-2">Please wait while we process your file</p>
                                    </div>
                                ) : (
                                    <label htmlFor="pdf-input" className="cursor-pointer text-center">
                                        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-lg font-medium">{status}</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Click to select or drag and drop a PDF file
                                        </p>
                                    </label>
                                )}
                            </div>

                            {/* Status Information */}
                            {uploadedFileName && (
                                <div className="bg-blue-500/10 border border-blue-200 rounded-md p-3 text-sm dark:bg-blue-950/50 dark:border-blue-900">
                                    <span className="font-medium">File: </span>
                                    {uploadedFileName}
                                </div>
                            )}

                            {error ? (
                                <div className="bg-red-500/10 border border-red-200 rounded-md p-3 text-sm dark:bg-red-950/50 dark:border-red-900">
                                    <div className="font-medium flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                        Error:
                                    </div>
                                    <div className="mt-1">{error}</div>
                                </div>
                            ) : signatureValid !== null ? (
                                <div className={`border rounded-md p-3 text-sm ${signatureValid
                                    ? 'bg-green-500/10 border-green-200 dark:bg-green-950/50 dark:border-green-900'
                                    : 'bg-red-500/10 border-red-200 dark:bg-red-950/50 dark:border-red-900'
                                    }`}>
                                    {verificationMode === 'substring' ? (
                                        <>
                                            <div className="font-medium flex items-center">
                                                {verificationResult?.substring_matches ? (
                                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                                )}
                                                Substring Check: {verificationResult?.substring_matches ? 'Found' : 'Not Found'}
                                            </div>
                                            {calculatedOffset !== null && (
                                                <div className="mt-1">
                                                    Text: "{substringCheck.text}" found at offset {calculatedOffset}
                                                </div>
                                            )}
                                            <div className="mt-1">
                                                Signature Valid: {signatureValid ? 'Yes' : 'No'}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-medium flex items-center">
                                                {signatureValid ? (
                                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                                )}
                                                Signature: {signatureValid ? 'Valid' : 'Invalid'}
                                            </div>
                                            <div className="mt-1">
                                                zkPDF Compatible: {signatureValid ? 'Yes' : 'No'}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : null}

                            {/* Public Key Display */}
                            {publicKeyPEM && (
                                <div className="space-y-2">
                                    <Label className="text-sm">Signer's Public Key:</Label>
                                    <div className="bg-muted p-3 rounded-md overflow-x-auto">
                                        <pre className="text-xs">{publicKeyPEM}</pre>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right panel - Text Content & Proof Generation */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2" />
                                    Extracted Content
                                </div>
                                {pages.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-muted-foreground">Page:</span>
                                        <select
                                            value={selectedPage}
                                            onChange={(e) => setSelectedPage(+e.target.value)}
                                            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                                        >
                                            {pages.map((_, i) => (
                                                <option key={i} value={i}>
                                                    {i + 1}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pages.length > 0 ? (
                                <>
                                    <Textarea
                                        readOnly
                                        value={pages[selectedPage] || ''}
                                        onMouseUp={onTextSelect}
                                        className="font-mono h-48 resize-none"
                                        placeholder="Text will appear here when extracted..."
                                    />

                                    {/* Text Selection Tools */}
                                    <div className="space-y-4">
                                        <Separator />

                                        <div className="space-y-3">
                                            <Label className="text-sm">Text Selection</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs mb-1">Selected Text:</Label>
                                                    <Input
                                                        value={selectedText}
                                                        onChange={(e) => setSelectedText(e.target.value)}
                                                        placeholder="Text to verify"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs mb-1">Position (offset):</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectionStart}
                                                        onChange={(e) => setSelectionStart(+e.target.value)}
                                                        placeholder="Offset"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={onVerifySelection}
                                                disabled={!selectedText || isLoading}
                                                className="w-full"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="h-4 w-4 mr-2" />
                                                        Verify Selected Text
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <Separator />

                                        {/* ZK Proof Generation */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">Generate ZK Proof</Label>
                                                <Badge variant="outline">
                                                    Advanced
                                                </Badge>
                                            </div>

                                            <Button
                                                onClick={onGenerateProof}
                                                disabled={proofLoading || !pdfBytes || !selectedText}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                {proofLoading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Generating Proof...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap className="h-4 w-4 mr-2" />
                                                        Generate zk-SNARK Proof
                                                    </>
                                                )}
                                            </Button>

                                            {proofError && (
                                                <div className="bg-red-500/10 border border-red-200 rounded-md p-3 text-sm dark:bg-red-950/50 dark:border-red-900">
                                                    <div className="font-medium">Proof Error:</div>
                                                    <div className="mt-1 whitespace-pre-line">{proofError}</div>
                                                </div>
                                            )}

                                            {proofData && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm">Generated Proof</Label>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="show-decoded"
                                                                checked={showDecoded}
                                                                onChange={(e) => setShowDecoded(e.target.checked)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="show-decoded" className="text-xs">Show decoded</Label>
                                                            <Button
                                                                onClick={onVerifyProof}
                                                                size="sm"
                                                                variant="secondary"
                                                            >
                                                                Verify
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="bg-muted p-3 rounded-md">
                                                        <pre className="text-xs overflow-auto max-h-32">
                                                            {proofData}
                                                        </pre>
                                                    </div>

                                                    {showDecoded && decoded && (
                                                        <div className="bg-muted p-3 rounded-md">
                                                            <pre className="text-xs overflow-auto max-h-24">
                                                                {JSON.stringify(decoded, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {proofVerified !== null && (
                                                        <div className={`flex items-center justify-center p-2 rounded-md ${proofVerified
                                                            ? 'bg-green-500/10 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900'
                                                            : 'bg-red-500/10 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900'
                                                            }`}>
                                                            {proofVerified ? (
                                                                <><Check className="h-4 w-4 mr-2" /> Proof Valid</>
                                                            ) : (
                                                                <><AlertCircle className="h-4 w-4 mr-2" /> Proof Invalid</>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                    <FileText className="h-12 w-12 mb-3" />
                                    <h3 className="text-lg font-medium">No Text Extracted</h3>
                                    <p className="text-sm text-center max-w-md mt-1">
                                        Upload a PDF file to see extracted text content
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default ZkPdfVerifier
