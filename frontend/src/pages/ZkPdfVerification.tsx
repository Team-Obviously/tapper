import ZkPdfVerifier from '@/components/ZkPdfVerifier'

export default function ZkPdfVerificationPage() {
    return (
        <div className="container py-6 md:py-10">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-3">Zero-Knowledge PDF Verification</h1>
                    <p className="text-muted-foreground">
                        Verify PDF signatures and generate zero-knowledge proofs to prove document authenticity without revealing the entire document.
                    </p>
                </div>

                <div className="bg-card rounded-lg shadow-sm border p-4 md:p-6">
                    <ZkPdfVerifier />
                </div>

                <div className="mt-8 space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                        <h2 className="text-xl font-semibold mb-3">About Zero-Knowledge PDF Verification</h2>
                        <p className="mb-3">
                            This tool allows you to verify the authenticity of PDF documents and create zero-knowledge proofs about their content without revealing the entire document.
                        </p>
                        <h3 className="font-medium mt-4 mb-2">How it works:</h3>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>Upload a PDF document with a digital signature</li>
                            <li>The system verifies the document's signature</li>
                            <li>Extract text from specific pages</li>
                            <li>Generate a zero-knowledge proof that can verify claims about the document without revealing its full content</li>
                        </ol>
                    </div>

                    <div className="bg-blue-500/10 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-900 p-4">
                        <h2 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-400">Use Cases</h2>
                        <ul className="list-disc pl-6 space-y-1 text-blue-800 dark:text-blue-300">
                            <li>Prove you have a valid government document without revealing personal information</li>
                            <li>Verify employment or education credentials privately</li>
                            <li>Confirm document authenticity without sharing sensitive data</li>
                            <li>Ensure document integrity in legal proceedings</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
