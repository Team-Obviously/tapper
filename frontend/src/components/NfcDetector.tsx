import { useState } from 'react'
import { useNfc } from 'use-nfc-hook'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
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
    onRegisterNfc?: (data: any) => void
    isRegistering?: boolean
}

export default function NfcDetector({ onNfcDetected, onError, onRegisterNfc, isRegistering }: NfcDetectorProps) {
    const { isNDEFAvailable, permission, read, abortReadCtrl } = useNfc()
    const [detectionState, setDetectionState] = useState<'idle' | 'scanning' | 'detected' | 'error'>('idle')
    const [detectedData, setDetectedData] = useState<any>(null)
    const [isScanningState, setIsScanningState] = useState(false)
    const [nfcName, setNfcName] = useState('')

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
        setNfcName('')
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
            <Card className={`transition-all duration-500 ${detectionState === 'scanning'
                ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-100'
                : detectionState === 'detected'
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-100'
                    : detectionState === 'error'
                        ? 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg ring-2 ring-red-100'
                        : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'
                }`}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {isScanningState && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-blue-700">Scanning...</span>
                                </>
                            )}
                            {detectionState === 'detected' && (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700">Success!</span>
                                </>
                            )}
                            {detectionState === 'error' && (
                                <>
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700">Failed</span>
                                </>
                            )}
                            {detectionState === 'idle' && (
                                <>
                                    <Smartphone className="w-5 h-5 text-gray-600" />
                                    <span className="text-gray-700">Ready</span>
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
                        <div className="space-y-4">
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                                    <Smartphone className="w-8 h-8 text-blue-600 animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-blue-800">Bring NFC chip close</h3>
                                    <p className="text-sm text-blue-600">Hold it steady within 1-2 cm of your device</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {detectionState === 'detected' && detectedData && (
                        <div className="space-y-4">
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-green-800">Chip detected!</h3>
                                    <p className="text-sm text-green-600">Data successfully read from NFC tag</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                <div className="bg-gray-50 rounded-md p-3 border max-h-32 overflow-y-auto">
                                    <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                                        {JSON.stringify(detectedData, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            {/* Register Button - Only show when onRegisterNfc is provided */}
                            {onRegisterNfc && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center space-x-2 mb-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-medium text-green-800">Ready to register</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="nfc-name" className="text-sm font-medium text-green-800">
                                                Tag Name
                                            </Label>
                                            <Input
                                                id="nfc-name"
                                                type="text"
                                                placeholder="Enter a name for this NFC tag"
                                                value={nfcName}
                                                onChange={(e) => setNfcName(e.target.value)}
                                                className="w-full"
                                            />
                                        </div>

                                        <Button
                                            onClick={() => onRegisterNfc({ ...detectedData, name: nfcName || `NFC Tag ${new Date().toLocaleDateString()}` })}
                                            disabled={isRegistering}
                                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                            size="lg"
                                        >
                                            {isRegistering ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Registering...
                                                </>
                                            ) : (
                                                <>
                                                    <Smartphone className="w-4 h-4 mr-2" />
                                                    Register Tag
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {detectionState === 'error' && (
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-red-800">Detection failed</h3>
                                <p className="text-sm text-red-600">Try bringing the chip closer or check if it's working</p>
                            </div>
                        </div>
                    )}

                    {detectionState === 'idle' && (
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <Smartphone className="w-8 h-8 text-gray-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-gray-800">Ready to scan</h3>
                                <p className="text-sm text-gray-600">Click the button below to start detection</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                {detectionState === 'idle' && (
                    <Button
                        onClick={handleStartScan}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Start Scanning
                    </Button>
                )}

                {isScanningState && (
                    <Button
                        onClick={handleStopScan}
                        variant="outline"
                        className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
                        size="lg"
                    >
                        <WifiOff className="w-4 h-4 mr-2" />
                        Stop
                    </Button>
                )}

                {(detectionState === 'detected' || detectionState === 'error') && (
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 w-full">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="flex-1 sm:flex-none border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                        {detectionState === 'detected' && (
                            <Button
                                onClick={handleStartScan}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-800">Quick guide</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-blue-600">1</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Enable NFC</p>
                                        <p className="text-xs text-blue-600">Turn on NFC in device settings</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-blue-600">2</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Start scanning</p>
                                        <p className="text-xs text-blue-600">Click the button above</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-blue-600">3</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Hold close</p>
                                        <p className="text-xs text-blue-600">Within 1-2 cm of device</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-blue-600">4</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Keep steady</p>
                                        <p className="text-xs text-blue-600">Until detection completes</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
