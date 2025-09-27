import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    Clock,
    Bell,
    CheckCircle,
    XCircle,
    ExternalLink
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

interface Invitation {
    id: string
    fromUserId: string
    toUserId: string
    interest: string
    message?: string
    status: 'pending' | 'accepted' | 'rejected'
    createdAt: string
    fromUser?: {
        firstName: string
        lastName: string
        email: string
    }
}

interface AcceptedConnection {
    id: string
    userId1: string
    userId2: string
    sharedInterest: string
    createdAt: string
    otherUser?: {
        firstName: string
        lastName: string
        email: string
    }
}

export default function Explore() {
    const [showNfcDetector, setShowNfcDetector] = useState(false)
    const [, setScannedNfc] = useState<ScannedNfc | null>(null)
    const [connections, setConnections] = useState<Connection[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [acceptedConnections, setAcceptedConnections] = useState<AcceptedConnection[]>([])
    const [isLoadingConnections, setIsLoadingConnections] = useState(false)
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)
    const [isLoadingAcceptedConnections, setIsLoadingAcceptedConnections] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isRespondingToInvitation, setIsRespondingToInvitation] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Load user's connections and invitations on component mount
    useEffect(() => {
        const user = getCurrentUser()
        if (user?.isLoggedIn) {
            loadConnections()
            loadInvitations()
            loadAcceptedConnections()
        }
    }, [])

    // Function to load accepted connections
    const loadAcceptedConnections = async () => {
        const userId = getUserId()
        if (!userId) {
            setError('User not logged in')
            return
        }

        console.log('🤝 Loading accepted connections for user:', userId)
        setIsLoadingAcceptedConnections(true)
        setError(null)

        try {
            const response = await getRequest(`/invitations/accepted/${userId}`)
            console.log('🤝 Accepted connections response:', response)

            if (response.status === 200) {
                const connectionsData = Array.isArray(response.data?.data) ? response.data.data : []
                console.log('🤝 Setting accepted connections:', connectionsData)
                setAcceptedConnections(connectionsData)
            } else {
                console.error('❌ Failed to load accepted connections:', response)
                setError('Failed to load accepted connections')
            }
        } catch (error) {
            console.error('❌ Error loading accepted connections:', error)
            setError('Failed to load accepted connections')
        } finally {
            setIsLoadingAcceptedConnections(false)
        }
    }

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

    const loadInvitations = async () => {
        const userId = getUserId()
        if (!userId) {
            setError('User not logged in')
            return
        }

        console.log('🔔 Loading pending invitations for user:', userId)
        setIsLoadingInvitations(true)
        setError(null)

        try {
            const response = await getRequest(`/invitations/pending/${userId}`)
            console.log('🔔 Invitations response:', response)

            if (response.status === 200) {
                const invitationsData = Array.isArray(response.data?.data) ? response.data.data : []
                console.log('🔔 Setting invitations:', invitationsData)
                setInvitations(invitationsData)
            } else {
                console.error('❌ Failed to load invitations:', response)
                setError('Failed to load invitations')
            }
        } catch (error) {
            console.error('❌ Error loading invitations:', error)
            setError('Failed to load invitations')
        } finally {
            setIsLoadingInvitations(false)
        }
    }

    const respondToInvitation = async (invitationId: string, response: 'accepted' | 'rejected') => {
        console.log(`🤝 Responding to invitation ${invitationId} with: ${response}`)
        setIsRespondingToInvitation(invitationId)
        setError(null)

        try {
            const result = await postRequest(`/invitations/respond/${invitationId}`, { response })
            console.log('🤝 Response result:', result)

            if (result.status === 200) {
                console.log(`✅ Invitation ${response} successfully`)
                toast.success(`Invitation ${response}!`)
                // Remove the invitation from the list
                setInvitations(prev => prev.filter(inv => inv.id !== invitationId))

                // If accepted, refresh the accepted connections list
                if (response === 'accepted') {
                    loadAcceptedConnections()
                }
            } else {
                console.error('❌ Failed to respond to invitation:', result)
                throw new Error(result.data?.error || 'Failed to respond to invitation')
            }
        } catch (error: any) {
            console.error('❌ Error responding to invitation:', error)
            setError(error.message || 'Failed to respond to invitation')
            toast.error(error.message || 'Failed to respond to invitation')
        } finally {
            setIsRespondingToInvitation(null)
        }
    }

    const handleNfcDetected = async (data: any) => {
        const nfcData = {
            nfcId: `scanned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: data,
            timestamp: new Date().toISOString()
        }
        setScannedNfc(nfcData)
        console.log('NFC Data detected:', nfcData)

        // Automatically trigger connection
        await connectWithUser(nfcData)
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

                // Check if NFC data contains a URL and redirect to it
                if (scannedNfcData.data && Array.isArray(scannedNfcData.data)) {
                    const urlRecord = scannedNfcData.data.find((record: any) => record.type === 'url')
                    if (urlRecord && urlRecord.data) {
                        // Redirect to the URL from the NFC data
                        window.open(urlRecord.data, '_blank')
                        toast.success('Redirecting to the website...')
                    }
                }
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



    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Search className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold md:text-4xl">Explore</h1>
                        </div>

                        <Link to="/dashboard/notifications" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="font-medium">Notifications</span>
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>
                    <p className="text-muted-foreground">
                        Scan other users' NFC tags to connect and network
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Welcome, {currentUser?.firstName || 'User'}! Start exploring and connecting.
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

                {/* Connection Status Display */}
                {isConnecting && (
                    <Card className="mb-8 border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-blue-800">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Connecting...</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="bg-blue-100 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 mb-2">Establishing Connection</h4>
                                    <p className="text-sm text-blue-700">
                                        Connecting with the user and processing the NFC data...
                                    </p>
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


                {/* Accepted Connections */}
                <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span>Your Accepted Connections ({acceptedConnections.length})</span>
                            </div>
                            <Button
                                onClick={loadAcceptedConnections}
                                disabled={isLoadingAcceptedConnections}
                                size="sm"
                                variant="outline"
                            >
                                {isLoadingAcceptedConnections ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Refresh'
                                )}
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            People you've connected with based on shared interests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAcceptedConnections ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                                <span className="ml-2 text-green-600">Loading connections...</span>
                            </div>
                        ) : acceptedConnections.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-medium mb-2">No accepted connections yet</h3>
                                <p className="text-muted-foreground">
                                    Accept invitations to connect with people who share your interests
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {acceptedConnections.map((connection) => (
                                    <Card key={connection.id} className="border-green-200 bg-green-50">
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-green-800">
                                                        {connection.otherUser?.firstName} {connection.otherUser?.lastName}
                                                    </h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {new Date(connection.createdAt).toLocaleDateString()}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-green-600">
                                                    <span className="font-medium">Connected over:</span>
                                                    <span className="bg-green-100 px-2 py-1 rounded text-green-700">
                                                        {connection.sharedInterest}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-green-500">
                                                    Email: {connection.otherUser?.email}
                                                </p>
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
