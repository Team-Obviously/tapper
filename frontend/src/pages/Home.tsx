import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { getRequest } from '../utility/generalServices'
import { getCurrentUser } from '../utility/auth'
import { Users, Trophy, Briefcase, Heart, Loader2 } from 'lucide-react'

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

export default function Home() {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user ID from auth context
  const currentUser = getCurrentUser()
  const userId = currentUser?.id

  useEffect(() => {
    const fetchInterestConnections = async () => {
      if (!userId) {
        setError('Please log in to view your connections')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await getRequest(
          `/api/similarity/interest-connections/${userId}`
        )

        if (response?.data?.success && response.data.data) {
          const interestData: InterestData = response.data.data.similarity || {}

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

          // Process interest breakdown
          const breakdown: InterestBreakdown = {}

          // Process all categories
          Object.entries(interestData).forEach(([, connections]) => {
            connections?.forEach((connection: InterestConnection) => {
              connection.shared_interests.forEach((interest: string) => {
                breakdown[interest] = (breakdown[interest] || 0) + 1
              })
            })
          })

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

          {/* Mobile Interest Breakdown - Only visible on mobile */}
          <div className="lg:hidden mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Your Interest Connections
            </h3>
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
                        <div>
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
                      <div className="text-2xl font-bold text-primary">
                        {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          count
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
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
                    connectionSummary.total
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Explore People</CardTitle>
                <CardDescription>
                  Discover new connections based on your interests
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">My Tags</CardTitle>
                <CardDescription>
                  Manage your interests and skill tags
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>
                  Update your profile and preferences
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
