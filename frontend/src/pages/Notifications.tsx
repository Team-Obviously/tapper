import { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
    Bell,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    UserPlus
} from 'lucide-react'
import { getRequest, putRequest } from '../utility/generalServices'
import { getCurrentUser, getUserId } from '../utility/auth'
import { toast } from 'sonner'

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

export default function Notifications() {
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)
    const [isRespondingToInvitation, setIsRespondingToInvitation] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Load user's invitations on component mount
    useEffect(() => {
        const user = getCurrentUser()
        if (user?.isLoggedIn) {
            loadInvitations()
        }
    }, [])

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
            const result = await putRequest(`/invitations/respond/${invitationId}`, { response })
            console.log('🤝 Response result:', result)

            if (result.status === 200) {
                console.log(`✅ Invitation ${response} successfully`)
                toast.success(`Invitation ${response === 'accepted' ? 'accepted! Connected successfully.' : 'rejected.'}`)

                // Remove the invitation from the list or update its status
                setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
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

    const currentUser = getCurrentUser()

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-4">
                        <Bell className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold md:text-4xl">Notifications</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Connection requests waiting for your response
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Welcome, {currentUser?.firstName || 'User'}! You have {invitations.length} pending requests.
                    </div>
                </div>

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

                {/* Loading State */}
                {isLoadingInvitations ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading your notifications...</p>
                    </div>
                ) : invitations.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Bell className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">No new notifications</h2>
                                <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                                    You don't have any pending connection requests at the moment
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={loadInvitations}
                                    className="flex items-center"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {invitations.map((invitation) => (
                            <Card key={invitation.id} className="border-primary/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex justify-between items-center">
                                        <span>Connection Request</span>
                                        <Badge variant="secondary">
                                            {new Date(invitation.createdAt).toLocaleDateString()}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        From {invitation.fromUser?.firstName} {invitation.fromUser?.lastName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="bg-muted p-3 rounded-md">
                                            <p className="text-sm font-medium mb-1">Shared Interest:</p>
                                            <Badge>{invitation.interest}</Badge>
                                        </div>

                                        {invitation.message && (
                                            <div className="bg-muted p-3 rounded-md">
                                                <p className="text-sm font-medium mb-1">Message:</p>
                                                <p className="text-sm">{invitation.message}</p>
                                            </div>
                                        )}

                                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 pt-3">
                                            <Button
                                                onClick={() => respondToInvitation(invitation.id, 'accepted')}
                                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                                disabled={isRespondingToInvitation === invitation.id}
                                            >
                                                {isRespondingToInvitation === invitation.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                )}
                                                Accept
                                            </Button>
                                            <Button
                                                onClick={() => respondToInvitation(invitation.id, 'rejected')}
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                                                disabled={isRespondingToInvitation === invitation.id}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
