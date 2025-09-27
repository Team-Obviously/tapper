import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { getRequest, postRequest } from '../utility/generalServices'
import {
  Users,
  Trophy,
  Briefcase,
  Heart,
  Loader2,
  Send,
  UserPlus,
  CheckCircle,
  ExternalLink,
  Tag,
  User
} from 'lucide-react'
import { toast } from 'sonner'

interface InterestConnection {
  user_id: string
  similarity_score: number
  shared_interests: string[]
}

interface InterestData {
  sports?: InterestConnection[]
  professional?: InterestConnection[]
  interests?: InterestConnection[]
  skills?: InterestConnection[]
}

interface ConnectionSummary {
  sports: number
  professional: number
  interests: number
  skills: number
  total: number
}

interface InterestBreakdown {
  [key: string]: number
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

export default function Home() {
  const navigate = useNavigate()
  const [connectionSummary, setConnectionSummary] = useState<ConnectionSummary>(
    {
      sports: 0,
      professional: 0,
      interests: 0,
      skills: 0,
      total: 0,
    }
  )
  const [interestBreakdown, setInterestBreakdown] = useState<InterestBreakdown>(
    {}
  )
  const [acceptedConnections, setAcceptedConnections] = useState<AcceptedConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingInvitations, setSendingInvitations] = useState<Set<string>>(new Set())
  const [sentInvitationCounts, setSentInvitationCounts] = useState<{ [key: string]: number }>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [connectionsPerPage] = useState(5)
  const [totalPages, setTotalPages] = useState(1)

  // Get user ID from localStorage
  const getUserId = () => {
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

  const userId = getUserId()

  // Function to send invitations to all people with shared interest
  const sendInvitationsForInterest = async (interest: string) => {
    if (!userId) {
      toast.error('User not logged in')
      return
    }

    try {
      console.log(`📤 Sending invitations for interest: ${interest}`)
      setSendingInvitations(prev => new Set(prev).add(interest))

      // Get users with shared interest (this would be from your similarity service)
      const response = await getRequest(`/invitations/shared-interests/${userId}/${interest}`)
      console.log(`👥 Users with shared interest ${interest}:`, response)

      if (response?.status === 200 && Array.isArray(response.data?.data)) {
        const users = response.data.data
        console.log(`📋 Found ${users.length} users with interest ${interest}:`, users)

        // Send invitations to all users
        const invitationPromises = users.map(async (user: any) => {
          try {
            console.log(`📨 Sending invitation to ${user.firstName} ${user.lastName}`)
            const response = await postRequest('/invitations/send', {
              fromUserId: userId,
              toUserId: user.id,
              interest: interest,
              message: `Hi! I noticed we both share an interest in ${interest}. Would you like to connect?`
            })

            if (response?.status === 200 || response?.status === 201) {
              console.log(`✅ Invitation sent to ${user.firstName}`, response)
              return true
            } else {
              console.warn(`⚠️ Unexpected response when sending invitation to ${user.firstName}:`, response)
              return false
            }
          } catch (error) {
            console.error(`❌ Failed to send invitation to ${user.firstName}:`, error)
            return false
          }
        })

        const results = await Promise.all(invitationPromises)
        const successCount = results.filter(Boolean).length
        console.log(`🎉 ${successCount}/${users.length} invitations sent for ${interest}`)

        if (successCount > 0) {
          toast.success(`Invitations sent to ${successCount} people interested in ${interest}!`)
          // Update the sent invitations count immediately
          setSentInvitationCounts(prev => ({
            ...prev,
            [interest]: (prev[interest] || 0) + successCount
          }))
          // Refresh sent invitations data
          loadSentInvitations()
        } else {
          toast.info('No new invitations were sent. You may have already invited everyone.')
        }
      } else {
        console.log(`📝 Using mock data for ${interest} invitations`)
        // Mock sending invitations for demo
        toast.success(`Invitations sent to people interested in ${interest}!`)
      }
    } catch (error) {
      console.error('❌ Error sending invitations:', error)
      toast.error('Failed to send invitations')
    } finally {
      setSendingInvitations(prev => {
        const newSet = new Set(prev)
        newSet.delete(interest)
        return newSet
      })
    }
  }

  // Function to send invitations based on preference (hiring or dating)
  const sendInvitationsByPreference = async (preference: 'hiring' | 'dating') => {
    if (!userId) {
      toast.error('User not logged in')
      return
    }

    try {
      const preferenceLabel = preference === 'hiring' ? 'Professional Opportunity' : 'Dating'
      console.log(`📤 Sending invitations for preference: ${preference}`)
      setSendingInvitations(prev => new Set(prev).add(preferenceLabel))

      // Get users with the specified preference
      const response = await getRequest(`/invitations/preference/${userId}/${preference}`)
      console.log(`👥 Users with preference ${preference}:`, response)

      if (response?.status === 200 && Array.isArray(response.data?.data)) {
        const users = response.data.data
        console.log(`📋 Found ${users.length} users with preference ${preference}:`, users)

        // Send invitations to all users
        const invitationPromises = users.map(async (user: any) => {
          try {
            console.log(`📨 Sending invitation to ${user.firstName} ${user.lastName}`)
            const message = preference === 'hiring'
              ? `Hi! I noticed you're currently hiring. I'd like to connect for professional opportunities.`
              : `Hi! I noticed we're both open to dating. Would you like to connect?`

            const response = await postRequest('/invitations/send', {
              fromUserId: userId,
              toUserId: user.id,
              interest: preferenceLabel,
              message
            })

            if (response?.status === 200 || response?.status === 201) {
              console.log(`✅ Invitation sent to ${user.firstName}`, response)
              return true
            } else {
              console.warn(`⚠️ Unexpected response when sending invitation to ${user.firstName}:`, response)
              return false
            }
          } catch (error) {
            console.error(`❌ Failed to send invitation to ${user.firstName}:`, error)
            return false
          }
        })

        const results = await Promise.all(invitationPromises)
        const successCount = results.filter(Boolean).length
        console.log(`🎉 ${successCount}/${users.length} invitations sent for ${preference}`)

        if (successCount > 0) {
          toast.success(`Invitations sent to ${successCount} people for ${preferenceLabel}!`)
          // Update the sent invitations count immediately
          setSentInvitationCounts(prev => ({
            ...prev,
            [preferenceLabel]: (prev[preferenceLabel] || 0) + successCount
          }))
          // Refresh sent invitations data
          loadSentInvitations()
        } else {
          toast.info('No new invitations were sent. You may have already invited everyone.')
        }
      } else {
        console.log(`📝 Using mock data for ${preference} invitations`)
        // Mock sending invitations for demo
        toast.success(`Invitations sent to people for ${preferenceLabel}!`)
      }
    } catch (error) {
      console.error('❌ Error sending invitations:', error)
      toast.error('Failed to send invitations')
    } finally {
      const preferenceLabel = preference === 'hiring' ? 'Professional Opportunity' : 'Dating'
      setSendingInvitations(prev => {
        const newSet = new Set(prev)
        newSet.delete(preferenceLabel)
        return newSet
      })
    }
  }

  // Function to load accepted connections
  const loadAcceptedConnections = async () => {
    if (!userId) {
      console.log('User not logged in, skipping accepted connections load')
      return
    }

    try {
      console.log('🤝 Loading accepted connections for user:', userId)
      const response = await getRequest(`/invitations/accepted/${userId}`)
      console.log('🤝 Accepted connections response:', response)

      if (response?.data?.success && response.data.data) {
        const connections = response.data.data
        console.log(`✅ Setting ${connections.length} accepted connections:`, connections)

        // Log each connection for debugging
        connections.forEach((conn: any, index: number) => {
          console.log(`Connection ${index + 1}: ${conn.otherUser?.firstName} ${conn.otherUser?.lastName} - ${conn.sharedInterest}`)
        })

        setAcceptedConnections(connections)

        // Calculate total pages
        const totalPagesCount = Math.ceil(connections.length / connectionsPerPage)
        setTotalPages(totalPagesCount > 0 ? totalPagesCount : 1)
      } else {
        console.log('📝 Using mock data for accepted connections')
        // Mock data for demo
        const mockConnections = [
          {
            id: '1',
            userId1: userId,
            userId2: 'user-2',
            sharedInterest: 'Tennis',
            createdAt: new Date().toISOString(),
            otherUser: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            }
          },
          {
            id: '2',
            userId1: userId,
            userId2: 'user-3',
            sharedInterest: 'JavaScript',
            createdAt: new Date().toISOString(),
            otherUser: {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com'
            }
          }
        ]
        setAcceptedConnections(mockConnections)

        // Calculate total pages for mock data
        const totalPagesCount = Math.ceil(mockConnections.length / connectionsPerPage)
        setTotalPages(totalPagesCount > 0 ? totalPagesCount : 1)
      }
    } catch (error) {
      console.error('❌ Error loading accepted connections:', error)
    }
  }

  // Get current connections for pagination
  const getCurrentPageConnections = () => {
    const indexOfLastConnection = currentPage * connectionsPerPage
    const indexOfFirstConnection = indexOfLastConnection - connectionsPerPage
    return acceptedConnections.slice(indexOfFirstConnection, indexOfLastConnection)
  }

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Function to load sent invitations count
  const loadSentInvitations = async () => {
    if (!userId) {
      console.log('User not logged in, skipping sent invitations load')
      return
    }

    try {
      console.log('📤 Loading sent invitations for user:', userId)

      // In a real app, you would have an API endpoint for this
      // For now, we'll use a mock response based on the seeded data
      const response = await getRequest(`/invitations/sent/${userId}`)
      console.log('📤 Sent invitations response:', response)

      if (response?.status === 200 && Array.isArray(response.data?.data)) {
        // Group invitations by interest
        const counts: { [key: string]: number } = {}
        response.data.data.forEach((invitation: any) => {
          counts[invitation.interest] = (counts[invitation.interest] || 0) + 1
        })
        console.log('📤 Sent invitation counts:', counts)
        setSentInvitationCounts(counts)
      } else {
        // For demo, use the seeded data
        console.log('📝 Using mock data for sent invitations')
        setSentInvitationCounts({
          Basketball: 10
        })
      }
    } catch (error) {
      console.error('❌ Error loading sent invitations:', error)
    }
  }

  // Function to navigate to user profile page
  const navigateToUserProfile = (connection: AcceptedConnection) => {
    console.log('👤 Navigating to user profile for:', connection)

    // Navigate to the user profile page with connection data
    navigate(`/dashboard/user/${connection.userId2}`, {
      state: {
        userData: {
          id: connection.userId2,
          firstName: connection.otherUser?.firstName || 'Unknown',
          lastName: connection.otherUser?.lastName || 'User',
          email: connection.otherUser?.email,
        },
        connectionDetails: {
          sharedInterest: connection.sharedInterest,
          connectedDate: connection.createdAt
        }
      }
    })
  }

  useEffect(() => {
    const fetchInterestConnections = async () => {
      if (!userId) {
        setError('User not logged in')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await getRequest(
          `/similarity/interest-connections/${userId}`
        )

        if (response?.data?.success && response.data.data) {
          console.log('📊 Raw API Response:', response.data)
          const similarityData = response.data.data.similarity || []
          console.log('📈 Similarity Data:', similarityData)

          // Transform the API response to match our expected format
          const interestData: InterestData = {
            sports: [],
            professional: [],
            interests: [],
            skills: []
          }

          // Process the similarity data
          if (Array.isArray(similarityData)) {
            similarityData.forEach((item: any) => {
              if (item.interest && item.connectedUsers) {
                // Categorize based on interest type
                const interest = item.interest.toLowerCase()
                const mappedUsers = item.connectedUsers.map((user: any) => ({
                  user_id: user.userId,
                  similarity_score: 0.8, // Default score
                  shared_interests: [item.interest]
                }))

                if (['tennis', 'basketball', 'football', 'soccer', 'swimming', 'running', 'cricket', 'volleyball', 'badminton', 'boxing', 'yoga', 'mma', 'pilates'].includes(interest)) {
                  interestData.sports = [...(interestData.sports || []), ...mappedUsers]
                } else if (['javascript', 'react', 'node.js', 'python', 'typescript', 'coding', 'programming'].includes(interest)) {
                  interestData.skills = [...(interestData.skills || []), ...mappedUsers]
                } else if (['leadership', 'public speaking', 'writing', 'design', 'marketing', 'product management', 'ui/ux design', 'data science', 'management', 'business', 'entrepreneurship', 'networking', 'professional'].includes(interest)) {
                  interestData.professional = [...(interestData.professional || []), ...mappedUsers]
                } else {
                  interestData.interests = [...(interestData.interests || []), ...mappedUsers]
                }
              }
            })
          }

          console.log('📈 Processed Interest Data:', interestData)

          const summary: ConnectionSummary = {
            sports: interestData.sports?.length || 0,
            professional: interestData.professional?.length || 0,
            interests: interestData.interests?.length || 0,
            skills: interestData.skills?.length || 0,
            total: 0,
          }

          summary.total =
            summary.sports +
            summary.professional +
            summary.interests +
            summary.skills

          console.log('📊 Connection Summary:', summary)

          // Process interest breakdown
          const breakdown: InterestBreakdown = {}

          // Process all categories - with proper array checks
          Object.entries(interestData).forEach(([category, connections]) => {
            console.log(`🔍 Processing category: ${category}`, connections)

            // Check if connections is an array before iterating
            if (Array.isArray(connections)) {
              connections.forEach((connection: InterestConnection) => {
                console.log('🔗 Processing connection:', connection)
                if (Array.isArray(connection.shared_interests)) {
                  connection.shared_interests.forEach((interest: string) => {
                    breakdown[interest] = (breakdown[interest] || 0) + 1
                  })
                }
              })
            } else {
              console.warn(`⚠️ Connections for ${category} is not an array:`, connections)
            }
          })

          // Also process the original similarity data for interest breakdown
          if (Array.isArray(similarityData)) {
            similarityData.forEach((item: any) => {
              if (item.interest && item.connectedUsers) {
                breakdown[item.interest] = item.connectedUsers.length
              }
            })
          }

          console.log('📈 Interest Breakdown:', breakdown)

          setConnectionSummary(summary)
          setInterestBreakdown(breakdown)
        } else {
          // If API fails, show mock data for demo
          setConnectionSummary({
            sports: 12,
            professional: 8,
            interests: 15,
            skills: 6,
            total: 41,
          })
          setInterestBreakdown({
            Tennis: 8,
            Basketball: 6,
            React: 5,
            Photography: 4,
            Running: 3,
            JavaScript: 7,
            Leadership: 4,
            Cooking: 2,
          })
        }
      } catch (err) {
        console.error('Error fetching interest connections:', err)
        setError('Failed to load connection data')
        // Show mock data on error
        setConnectionSummary({
          sports: 12,
          professional: 8,
          interests: 15,
          skills: 6,
          total: 41,
        })
        setInterestBreakdown({
          Tennis: 8,
          Basketball: 6,
          React: 5,
          Photography: 4,
          Running: 3,
          JavaScript: 7,
          Leadership: 4,
          Cooking: 2,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInterestConnections()
    loadAcceptedConnections()
    loadSentInvitations()
  }, [userId])

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="py-8 px-4 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 md:text-5xl">
              Welcome to Tapper
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your personal networking dashboard
            </p>
          </div>
        </div>
      </section>

      {/* Connection Summary Section */}
      <section className="py-6 px-4 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2 md:text-3xl">
              Your Connections
            </h2>
            <p className="text-muted-foreground">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your connections...
                </span>
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                `You met ${connectionSummary.total} people with similar interests as you`
              )}
            </p>
          </div>

          {/* Connection Stats Cards - Horizontal Layout */}
          <div className="mb-8">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Sports */}
                  <div className="flex-1 text-center p-6 border-b sm:border-b-0 sm:border-r border-border">
                    <div className="mb-3">
                      <div className="mx-auto mb-2 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Sports</h3>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      ) : (
                        connectionSummary.sports
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Shared interests
                    </p>
                  </div>

                  {/* Professional */}
                  <div className="flex-1 text-center p-6 border-b sm:border-b-0 sm:border-r border-border">
                    <div className="mb-3">
                      <div className="mx-auto mb-2 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Professional</h3>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      ) : (
                        connectionSummary.professional
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Career connections
                    </p>
                  </div>

                  {/* Interests */}
                  <div className="flex-1 text-center p-6 border-b sm:border-b-0 sm:border-r border-border">
                    <div className="mb-3">
                      <div className="mx-auto mb-2 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-pink-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Interests</h3>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      ) : (
                        connectionSummary.interests
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Common hobbies
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="flex-1 text-center p-6">
                    <div className="mb-3">
                      <div className="mx-auto mb-2 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Skills</h3>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      ) : (
                        connectionSummary.skills
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Shared skills
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interest-based Invitations - Mobile */}
          <div className="lg:hidden mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Send Connection Invitations
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Connect with people who share your interests
            </p>
            <div className="space-y-3">
              {Object.entries(interestBreakdown)
                .sort(([, a], [, b]) => b - a) // Sort by count descending
                .slice(0, 6) // Show top 6 interests
                .map(([interest, count]) => (
                  <Card key={interest} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg">
                            {interest.toLowerCase().includes('tennis') && '🎾'}
                            {interest.toLowerCase().includes('basketball') &&
                              '🏀'}
                            {interest.toLowerCase().includes('running') && '🏃'}
                            {interest.toLowerCase().includes('react') && '⚛️'}
                            {interest.toLowerCase().includes('javascript') &&
                              '💻'}
                            {interest.toLowerCase().includes('photography') &&
                              '📸'}
                            {interest.toLowerCase().includes('leadership') &&
                              '👥'}
                            {interest.toLowerCase().includes('cooking') && '👨‍🍳'}
                            {![
                              'tennis',
                              'basketball',
                              'running',
                              'react',
                              'javascript',
                              'photography',
                              'leadership',
                              'cooking',
                            ].some((keyword) =>
                              interest.toLowerCase().includes(keyword)
                            ) && '🎯'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            You met{' '}
                            <span className="font-bold text-primary">
                              {count}
                            </span>{' '}
                            people into
                          </p>
                          <p className="text-lg font-semibold">{interest}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendInvitationsForInterest(interest)}
                        disabled={sendingInvitations.has(interest)}
                        size="sm"
                        className="ml-2"
                      >
                        {sendingInvitations.has(interest) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* Accepted Connections */}
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Your Accepted Connections</h3>
              <Badge variant="outline">{acceptedConnections.length} total</Badge>
            </div>

            {acceptedConnections.length === 0 ? (
              <Card className="p-6 text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-medium mb-2">No connections yet</h4>
                <p className="text-muted-foreground">
                  Send invitations to start building your network
                </p>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {getCurrentPageConnections().map((connection) => (
                    <Card
                      key={connection.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigateToUserProfile(connection)}
                    >
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {connection.otherUser?.firstName} {connection.otherUser?.lastName}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span>Connected over </span>
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {connection.sharedInterest}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground mr-2">
                            {new Date(connection.createdAt).toLocaleDateString()}
                          </span>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        &lt;
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(pageNumber)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        &gt;
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Total Summary Card */}
          <div className="max-w-md mx-auto">
            <Card className="text-center bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-xl">Total Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold mb-2">
                  {loading ? (
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                  ) : (
                    acceptedConnections.length
                  )}
                </div>
                <p className="opacity-90">People with shared interests</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-6 px-4 md:py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2 md:text-3xl">
              Quick Actions
            </h2>
            <p className="text-muted-foreground">
              Explore and manage your connections
            </p>
          </div>

          {/* Sent Invitations Status */}
          <div className="mb-8 max-w-4xl mx-auto">
            <Card className="border border-green-200 overflow-hidden">
              <div className="bg-green-50 py-3 px-4 border-b border-green-200 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-800">Sent Invitations</h3>
              </div>
              <CardContent className="p-4">
                {Object.keys(sentInvitationCounts).length === 0 ? (
                  <p className="text-center text-muted-foreground py-2">No invitations sent yet</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto pr-2">
                    <table className="w-full">
                      <thead className="text-xs text-muted-foreground">
                        <tr>
                          <th className="text-left py-2 font-medium">Interest</th>
                          <th className="text-right py-2 font-medium">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(sentInvitationCounts).map(([interest, count]) => (
                          <tr key={interest} className="border-t border-muted">
                            <td className="py-2">{interest}</td>
                            <td className="text-right font-medium">{count} people</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preference-based Invitations */}
          <div className="mb-12 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Connect Based on Preferences</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Hiring Preference Card */}
              <Card className="overflow-hidden">
                <div className="bg-blue-50 p-4 flex justify-between items-center border-b">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Hiring Opportunities</h4>
                      <p className="text-xs text-muted-foreground">
                        {connectionSummary.professional || '0'} professionals available
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {sentInvitationCounts['Professional Opportunity'] || 0} sent
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Connect with professionals who are currently hiring</p>
                    </div>
                    <Button
                      onClick={() => sendInvitationsByPreference('hiring')}
                      disabled={sendingInvitations.has('Professional Opportunity')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {sendingInvitations.has('Professional Opportunity') ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dating Preference Card */}
              <Card className="overflow-hidden">
                <div className="bg-pink-50 p-4 flex justify-between items-center border-b">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Dating Connections</h4>
                      <p className="text-xs text-muted-foreground">
                        Find meaningful relationships
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-200">
                    {sentInvitationCounts['Dating'] || 0} sent
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Connect with people open to relationships</p>
                    </div>
                    <Button
                      onClick={() => sendInvitationsByPreference('dating')}
                      disabled={sendingInvitations.has('Dating')}
                      size="sm"
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {sendingInvitations.has('Dating') ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card
              className="hover:bg-muted/50 transition-all cursor-pointer"
              onClick={() => navigate('/dashboard/explore')}
            >
              <CardContent className="p-4 flex items-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Explore People</h4>
                  <p className="text-xs text-muted-foreground">Discover new connections</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:bg-muted/50 transition-all cursor-pointer"
              onClick={() => navigate('/dashboard/my-tags')}
            >
              <CardContent className="p-4 flex items-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">My Tags</h4>
                  <p className="text-xs text-muted-foreground">Manage your interests</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:bg-muted/50 transition-all cursor-pointer"
              onClick={() => navigate('/dashboard/profile')}
            >
              <CardContent className="p-4 flex items-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Profile</h4>
                  <p className="text-xs text-muted-foreground">Update your settings</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
