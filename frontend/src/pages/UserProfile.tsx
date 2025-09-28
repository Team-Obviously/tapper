import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
    Mail,
    MapPin,
    Calendar,
    Tag,
    ArrowLeft,
    Share2,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import TelegramMessageButton from '../components/TelegramMessageButton'

interface UserProfileData {
    id: string
    firstName: string
    lastName: string
    email?: string
    location?: string
    joinDate?: string
    bio?: string
    interests?: string[]
}

interface ConnectionDetails {
    sharedInterest: string
    connectedDate: string
}

export default function UserProfile() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [user, setUser] = useState<UserProfileData | null>(null)
    const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Get current user ID from localStorage
    const getCurrentUserId = () => {
        const userData = localStorage.getItem('user')
        if (userData) {
            try {
                const user = JSON.parse(userData)
                return user.id
            } catch (error) {
                console.error('Error parsing user data:', error)
                return null
            }
        }
        return null
    }

    // Get connection details from location state if available
    useEffect(() => {
        if (location.state?.connectionDetails) {
            setConnectionDetails(location.state.connectionDetails)
        }

        if (location.state?.userData) {
            setUser(location.state.userData)
            setLoading(false)
        } else {
            // If no data was passed in location state, fetch user data
            fetchUserData()
        }
    }, [userId, location.state])

    const fetchUserData = async () => {
        if (!userId) {
            setError('User ID is missing')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            console.log('🔍 Fetching user data for:', userId)

            // For now, we'll use mock data
            // In a real app, you would fetch this data from your API
            setTimeout(() => {
                const mockUser: UserProfileData = {
                    id: userId,
                    firstName: location.state?.firstName || 'John',
                    lastName: location.state?.lastName || 'Doe',
                    email: location.state?.email || 'john.doe@example.com',
                    location: 'New Delhi, India',
                    joinDate: new Date().toISOString(),
                    bio: 'A passionate individual who loves connecting with like-minded people.',
                    interests: ['Basketball', 'Tennis', 'JavaScript', 'React', 'Photography']
                }

                setUser(mockUser)
                setLoading(false)
            }, 500)

        } catch (error) {
            console.error('Error fetching user data:', error)
            setError('Failed to load user data')
            setLoading(false)
        }
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    const goBack = () => {
        navigate(-1)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading user profile...</p>
                </div>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>
                            {error || 'User not found'}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={goBack}>Go Back</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Back Button */}
            <div className="container px-4 py-4">
                <Button variant="ghost" onClick={goBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>

            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-8 mb-6">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6">
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 text-2xl">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="mt-4 md:mt-0 text-center md:text-left">
                            <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>

                            {connectionDetails && (
                                <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                    Connected over {connectionDetails.sharedInterest}
                                </Badge>
                            )}

                            <div className="mt-4 flex flex-col space-y-2">
                                {user.email && (
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>{user.email}</span>
                                    </div>
                                )}

                                {user.location && (
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{user.location}</span>
                                    </div>
                                )}

                                {connectionDetails && (
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Connected on {new Date(connectionDetails.connectedDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Message */}
            {connectionDetails && (
                <div className="container px-4 md:px-6 mb-6">
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                                <div className="mt-1">
                                    <Tag className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg text-green-800">Your Connection</h3>
                                    <p className="mt-2 text-green-700">
                                        You and {user.firstName} connected over your shared interest in{' '}
                                        <span className="font-semibold">{connectionDetails.sharedInterest}</span>.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Profile Content */}
            <div className="container grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-6">
                {/* Left Column - About */}
                <div className="md:col-span-2 space-y-6">
                    {/* About Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {user.bio || `${user.firstName} hasn't added a bio yet.`}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Connection Context */}
                    {connectionDetails && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Connection Context</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    You both share an interest in <span className="font-medium">{connectionDetails.sharedInterest}</span>.
                                    This could be a great starting point for conversations!
                                </p>

                                <h3 className="font-medium mb-2">Suggested Topics:</h3>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {connectionDetails.sharedInterest.toLowerCase() === 'basketball' && (
                                        <>
                                            <li>Favorite basketball teams or players</li>
                                            <li>Recent games or tournaments</li>
                                            <li>Playing techniques and strategies</li>
                                        </>
                                    )}
                                    {connectionDetails.sharedInterest.toLowerCase() === 'javascript' && (
                                        <>
                                            <li>Favorite JavaScript frameworks</li>
                                            <li>Current projects you're working on</li>
                                            <li>New features in the language</li>
                                        </>
                                    )}
                                    {!['basketball', 'javascript'].includes(connectionDetails.sharedInterest.toLowerCase()) && (
                                        <>
                                            <li>How you got started with {connectionDetails.sharedInterest}</li>
                                            <li>Recent experiences related to {connectionDetails.sharedInterest}</li>
                                            <li>Resources you'd recommend about {connectionDetails.sharedInterest}</li>
                                        </>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Actions & Stats */}
                <div className="space-y-6">
                    {/* Action Buttons */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <TelegramMessageButton
                                fromUserId={getCurrentUserId() || ''}
                                toUserId={user.id}
                                toUserName={user.firstName}
                                className="w-full"
                            />
                            <Button variant="outline" className="w-full">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Profile
                            </Button>
                        </CardContent>
                    </Card>

                    
                </div>
            </div>
        </div>
    )
}
