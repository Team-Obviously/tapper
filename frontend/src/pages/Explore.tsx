import { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
    Search,
    Smartphone,
    Wifi,
    Loader2,
    AlertCircle,
    Users,
    CheckCircle,
    Clock,
    UserPlus
} from 'lucide-react'
import NfcDetector from '../components/NfcDetector'
import { postRequest, getRequest } from '../utility/generalServices'
import { getCurrentUser, getUserId } from '../utility/auth'
import { toast } from 'sonner'

interface Connection {
    id: string
    fromUserId: string
    toUserId: string
    fromNfcId: string
    toNfcId: string
    data: any
    createdAt: string
}

interface ScannedNfc {
    nfcId: string
    data: any
    timestamp: string
}

export default function Explore() {
    const [showNfcDetector, setShowNfcDetector] = useState(false)
    const [scannedNfc, setScannedNfc] = useState<ScannedNfc | null>(null)
    const [connections, setConnections] = useState<Connection[]>([])
    const [isLoadingConnections, setIsLoadingConnections] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load user's connections on component mount
    useEffect(() => {
        const user = getCurrentUser()
        if (user?.isLoggedIn) {
            loadConnections()
        }
    }, [])

    const loadConnections = async () => {
        const userId = getUserId()
        if (!userId) {
            setError('User not logged in')
            return
        }

        setIsLoadingConnections(true)
        setError(null)

        try {
            const response = await getRequest(`/nfc/connections/${userId}`)
            if (response.status === 200) {
                setConnections(Array.isArray(response.data) ? response.data : [])
            } else {
                setError('Failed to load connections')
            }
        } catch (error) {
            console.error('Error loading connections:', error)
            setError('Failed to load connections')
        } finally {
            setIsLoadingConnections(false)
        }
    }

    const handleNfcDetected = (data: any) => {
        const nfcData = {
            nfcId: `scanned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: data,
            timestamp: new Date().toISOString()
        }
        setScannedNfc(nfcData)
        console.log('NFC Data detected:', nfcData)
    }

    const handleNfcError = (error: string) => {
        console.error('NFC Error:', error)
        setError(error)
    }

    const connectWithUser = async (scannedNfcData: ScannedNfc) => {
        const userId = getUserId()
        if (!userId) {
            setError('User not logged in')
            return
        }

        setIsConnecting(true)
        setError(null)

        try {
            // Generate a temporary NFC ID for the current user (since they might not have registered their own NFC yet)
            const fromNfcId = `temp_${userId}_${Date.now()}`

            const connectionPayload = {
                fromUserId: userId,
                toNfcId: scannedNfcData.nfcId,
                fromNfcId: fromNfcId
            }

            const response = await postRequest('/nfc/connect', connectionPayload)

            if (response.status === 201) {
                console.log('Connection created successfully:', response.data)
                toast.success('Successfully connected with user!')
                setScannedNfc(null) // Clear the scanned data
                await loadConnections() // Reload connections
            } else {
                console.log('Failed to create connection:', response.data)
                throw new Error(response.data?.error || 'Failed to create connection')
            }
        } catch (error: any) {
            console.error('Error creating connection:', error)
            setError(error.message || 'Failed to create connection')
            toast.error(error.message || 'Failed to create connection')
        } finally {
            setIsConnecting(false)
        }
    }

    const currentUser = getCurrentUser()

    if (!currentUser?.isLoggedIn) {
        return (
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-yellow-800">
                                <AlertCircle className="w-5 h-5" />
                                <span>Login Required</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-yellow-600 mb-4">
                                You need to be logged in to explore and connect with other users.
                            </p>
                            <Button
                                onClick={() => window.location.href = '/register'}
                                className="bg-yellow-600 hover:bg-yellow-700"
                            >
                                Go to Registration
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-4">
                        <Search className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold md:text-4xl">Explore</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Scan other users' NFC tags to connect and network
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Welcome, {currentUser.firstName}! Start exploring and connecting.
                    </div>
                </div>

                {/* NFC Scanner Section */}
                <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-blue-800">
                            <Smartphone className="w-6 h-6" />
                            <span>Scan Other Users' NFC Tags</span>
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                            Scan NFC tags from other users to connect and network with them
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!showNfcDetector ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3 p-4 bg-blue-100 rounded-lg">
                                    <Wifi className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-blue-800">Ready to scan other users' NFC tags</p>
                                        <p className="text-sm text-blue-600">
                                            Click the button below to start scanning for connections
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setShowNfcDetector(true)}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                >
                                    <Smartphone className="w-4 h-4 mr-2" />
                                    Start Scanning for Connections
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-blue-800">NFC Scanner</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowNfcDetector(false)}
                                    >
                                        Close Scanner
                                    </Button>
                                </div>
                                <NfcDetector
                                    onNfcDetected={handleNfcDetected}
                                    onError={handleNfcError}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Scanned NFC Display */}
                {scannedNfc && (
                    <Card className="mb-8 border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-green-800">
                                <CheckCircle className="w-5 h-5" />
                                <span>NFC Tag Detected</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="bg-green-100 rounded-lg p-4">
                                    <h4 className="font-medium text-green-800 mb-2">Connection Ready</h4>
                                    <p className="text-sm text-green-700">
                                        NFC tag detected successfully! You can now connect with this user.
                                        The connection will be established even if the user hasn't registered yet.
                                    </p>
                                </div>
                                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setScannedNfc(null)}
                                        variant="outline"
                                    >
                                        Clear Data
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowNfcDetector(true)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Scan Again
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => connectWithUser(scannedNfc)}
                                        disabled={isConnecting}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isConnecting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Connect with User
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error Display */}
                {error && (
                    <Card className="mb-8 border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-red-800">
                                <AlertCircle className="w-5 h-5" />
                                <span>Error</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600">{error}</p>
                            <Button
                                size="sm"
                                onClick={() => setError(null)}
                                variant="outline"
                                className="mt-2"
                            >
                                Dismiss
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Connections History */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Users className="w-5 h-5" />
                                <span>Your Connections ({connections.length})</span>
                            </div>
                            <Button
                                onClick={loadConnections}
                                disabled={isLoadingConnections}
                                size="sm"
                                variant="outline"
                            >
                                {isLoadingConnections ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Refresh'
                                )}
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Your connection history with other users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingConnections ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="ml-2 text-blue-600">Loading connections...</span>
                            </div>
                        ) : connections.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                                <p className="text-muted-foreground">
                                    Start scanning other users' NFC tags to make connections
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {connections.map((connection) => (
                                    <Card key={connection.id} className="border-blue-200 bg-blue-50">
                                        <CardContent className="p-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-blue-800">Connection</h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {new Date(connection.createdAt).toLocaleDateString()}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-blue-600">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(connection.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-xs text-blue-500">
                                                    NFC ID: {connection.toNfcId}
                                                </p>
                                                {connection.data && (
                                                    <div className="bg-white rounded p-2 border">
                                                        <pre className="text-xs text-gray-700 overflow-x-auto">
                                                            {JSON.stringify(connection.data, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
