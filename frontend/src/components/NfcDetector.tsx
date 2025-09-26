import { useState } from 'react'
import { useNfc } from 'use-nfc-hook'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import {
    WifiOff,
    Smartphone,
    CheckCircle,
    AlertCircle,
    Loader2,
    Zap,
    Shield,
    Clock
} from 'lucide-react'

interface NfcDetectorProps {
    onNfcDetected: (data: any) => void
    onError?: (error: string) => void
}

export default function NfcDetector({ onNfcDetected, onError }: NfcDetectorProps) {
    const { isNDEFAvailable, permission, read, abortReadCtrl } = useNfc()
    const [detectionState, setDetectionState] = useState<'idle' | 'scanning' | 'detected' | 'error'>('idle')
    const [detectedData, setDetectedData] = useState<any>(null)
    const [isScanningState, setIsScanningState] = useState(false)

    const handleStartScan = async () => {
        try {
            setDetectionState('scanning')
            setIsScanningState(true)
            const response = await read()

            // Process the NFC data
            if (response.message && response.message.records && response.message.records.length > 0) {
                const records = response.message.records.map((record: any) => {
                    if (record.recordType === 'text') {
                        const decoder = new TextDecoder('utf-8')
                        return {
                            type: 'text',
                            data: decoder.decode(record.data),
                            mediaType: record.mediaType
                        }
                    } else if (record.recordType === 'url') {
                        const decoder = new TextDecoder('utf-8')
                        return {
                            type: 'url',
                            data: decoder.decode(record.data)
                        }
                    } else {
                        return {
                            type: record.recordType,
                            data: record.data
                        }
                    }
                })

                setDetectedData(records)
                setDetectionState('detected')
                onNfcDetected(records)
            } else {
                setDetectedData({ message: 'No data found on NFC tag' })
                setDetectionState('detected')
                onNfcDetected({ message: 'No data found on NFC tag' })
            }
        } catch (err) {
            setDetectionState('error')
            onError?.(err instanceof Error ? err.message : 'Failed to read NFC tag')
        } finally {
            setIsScanningState(false)
        }
    }

    const handleStopScan = () => {
        abortReadCtrl()
        setIsScanningState(false)
        setDetectionState('idle')
    }

    const handleReset = () => {
        setDetectionState('idle')
        setDetectedData(null)
    }

    if (!isNDEFAvailable) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <span>NFC Not Supported</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600">
                        Your device doesn't support NFC technology. Please use a device with NFC capabilities.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (permission === 'denied') {
        return (
            <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-yellow-700">
                        <WifiOff className="w-5 h-5" />
                        <span>NFC Permission Denied</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-yellow-600">
                        NFC permission has been denied. Please enable NFC permissions in your browser settings.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Status Card */}
            <Card className={`transition-all duration-300 ${detectionState === 'scanning'
                ? 'border-blue-200 bg-blue-50 shadow-lg'
                : detectionState === 'detected'
                    ? 'border-green-200 bg-green-50 shadow-lg'
                    : detectionState === 'error'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200'
                }`}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {isScanningState && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-blue-700">Scanning for NFC...</span>
                                </>
                            )}
                            {detectionState === 'detected' && (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700">NFC Detected!</span>
                                </>
                            )}
                            {detectionState === 'error' && (
                                <>
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700">Detection Failed</span>
                                </>
                            )}
                            {detectionState === 'idle' && (
                                <>
                                    <Smartphone className="w-5 h-5 text-gray-600" />
                                    <span className="text-gray-700">Ready to Scan</span>
                                </>
                            )}
                        </div>
                        <Badge variant={isScanningState ? 'default' : 'secondary'}>
                            {isScanningState ? 'Active' : 'Standby'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isScanningState && (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-blue-600">
                                <Zap className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">Bring your NFC chip close to the device</span>
                            </div>
                            <div className="bg-blue-100 rounded-lg p-3">
                                <div className="flex items-center space-x-2 text-blue-700">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm">Keep the chip steady for better detection</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {detectionState === 'detected' && detectedData && (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">NFC chip detected successfully!</span>
                            </div>
                            <div className="bg-green-100 rounded-lg p-3">
                                <div className="text-sm text-green-700">
                                    <strong>Data received:</strong> {JSON.stringify(detectedData, null, 2)}
                                </div>
                            </div>
                        </div>
                    )}

                    {detectionState === 'error' && (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Failed to detect NFC chip</span>
                            </div>
                            <div className="bg-red-100 rounded-lg p-3">
                                <div className="text-sm text-red-700">
                                    Please try again or check if the NFC chip is working properly.
                                </div>
                            </div>
                        </div>
                    )}

                    {detectionState === 'idle' && (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Ready to detect NFC chips</span>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-3">
                                <div className="text-sm text-gray-700">
                                    Click "Start Scanning" and bring your NFC chip close to the device.
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                {detectionState === 'idle' && (
                    <Button
                        onClick={handleStartScan}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        size="lg"
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Start NFC Scanning
                    </Button>
                )}

                {isScanningState && (
                    <Button
                        onClick={handleStopScan}
                        variant="outline"
                        className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50"
                        size="lg"
                    >
                        <WifiOff className="w-4 h-4 mr-2" />
                        Stop Scanning
                    </Button>
                )}

                {(detectionState === 'detected' || detectionState === 'error') && (
                    <div className="flex space-x-3 w-full sm:w-auto">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="flex-1 sm:flex-none"
                        >
                            Reset
                        </Button>
                        {detectionState === 'detected' && (
                            <Button
                                onClick={handleStartScan}
                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Scan Again
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Instructions */}
            {detectionState === 'idle' && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-800">How to use NFC detection:</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Make sure NFC is enabled on your device</li>
                                <li>• Click "Start NFC Scanning" to begin detection</li>
                                <li>• Bring your NFC chip close to the device (within 1-2 cm)</li>
                                <li>• Keep the chip steady until detection is complete</li>
                                <li>• The detected data will be displayed automatically</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
