import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Search, Tag, Smartphone, Wifi, Loader2, AlertCircle, Power } from 'lucide-react'
import NfcDetector from '../components/NfcDetector'
import { postRequest, getRequest } from '../utility/generalServices'
import { getCurrentUser, getUserId } from '../utility/auth'
import { toast } from 'sonner'

interface Tag {
  id: string
  name: string
  category: 'sport' | 'skill' | 'interest' | 'professional'
  color: string
}

interface UserNfc {
  id: string
  userId: string
  nfcId: string
  name: string
  data: any
  isActive: string
  createdAt: string
}

const mockTags: Tag[] = [
  { id: '1', name: 'Basketball', category: 'sport', color: 'bg-orange-500' },
  { id: '2', name: 'Tennis', category: 'sport', color: 'bg-green-500' },
  { id: '3', name: 'React', category: 'skill', color: 'bg-blue-500' },
  {
    id: '4',
    name: 'Leadership',
    category: 'professional',
    color: 'bg-purple-500',
  },
  { id: '5', name: 'Photography', category: 'interest', color: 'bg-pink-500' },
  { id: '6', name: 'Running', category: 'sport', color: 'bg-red-500' },
]

const categoryLabels = {
  sport: 'Sports',
  skill: 'Skills',
  interest: 'Interests',
  professional: 'Professional',
}

export default function MyTags() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showNfcDetector, setShowNfcDetector] = useState(false)
  const [nfcData, setNfcData] = useState<any>(null)
  const [userNfcs, setUserNfcs] = useState<UserNfc[]>([])
  const [isLoadingNfcs, setIsLoadingNfcs] = useState(false)
  const [nfcError, setNfcError] = useState<string | null>(null)
  const [isRegisteringNfc, setIsRegisteringNfc] = useState(false)
  const [togglingNfc, setTogglingNfc] = useState<string | null>(null)
  const [showInactiveNfcs, setShowInactiveNfcs] = useState(false)


  // Filter NFC tags based on active status
  const filteredNfcs = userNfcs.filter((nfc) => {
    if (showInactiveNfcs) return true
    return nfc.isActive === 'true'
  })




  const handleNfcDetected = (data: any) => {
    setNfcData(data)
    console.log('NFC Data detected:', data)
  }

  const handleNfcError = (error: string) => {
    console.error('NFC Error:', error)
    setNfcError(error)
  }

  // Load user's NFC tags from backend
  const loadUserNfcs = async () => {
    const userId = getUserId()
    if (!userId) {
      setNfcError('User not logged in')
      return
    }

    setIsLoadingNfcs(true)
    setNfcError(null)

    try {
      const response = await getRequest(`/nfc/user/${userId}`)
      if (response.status === 200) {
        // Ensure we always set an array, even if the response is null or undefined
        setUserNfcs(Array.isArray(response.data) ? response.data : [])
      } else {
        setNfcError('Failed to load NFC tags')
        setUserNfcs([]) // Set empty array on error
      }
    } catch (error) {
      console.error('Error loading NFC tags:', error)
      setNfcError('Failed to load NFC tags')
      setUserNfcs([]) // Set empty array on error
    } finally {
      setIsLoadingNfcs(false)
    }
  }

  // Register NFC tag with backend
  const registerNfcTag = async (nfcData: any) => {
    const userId = getUserId()
    if (!userId) {
      setNfcError('User not logged in')
      return
    }

    setIsRegisteringNfc(true)
    setNfcError(null)

    try {
      // Generate a unique NFC ID from the detected data
      const nfcId = `nfc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const nfcPayload = {
        userId: userId,
        nfcId: nfcId,
        name: `NFC Tag ${new Date().toLocaleDateString()}`,
        data: nfcData,
        isActive: 'true' // New NFC tags are active by default
      }

      const response = await postRequest('/nfc/register', nfcPayload)

      if (response.status === 201) {
        console.log('NFC registered successfully:', response.data)
        // Reload user NFCs
        await loadUserNfcs()
        setNfcData(null) // Clear the detected data
        toast.success('NFC tag registered successfully!')
      } else {
        console.log('Failed to register NFC tag:', response.data)
        throw new Error(response.data?.error || 'Failed to register NFC tag')
      }
    } catch (error: any) {
      console.error('Error registering NFC tag:', error)
      setNfcError(error.message || 'Failed to register NFC tag')
      toast.error(error.message || 'Failed to register NFC tag')
    } finally {
      setIsRegisteringNfc(false)
    }
  }

  // Toggle NFC status
  const toggleNfcStatus = async (nfcId: string, isActive: boolean) => {
    setTogglingNfc(nfcId)
    setNfcError(null)

    try {
      const response = await postRequest(`/nfc/toggle/${nfcId}`, { isActive })

      if (response.status === 200) {
        // Update the local state
        setUserNfcs(prev =>
          prev.map(nfc =>
            nfc.nfcId === nfcId
              ? { ...nfc, isActive: isActive.toString() }
              : nfc
          )
        )
        toast.success(response.data.message)
      } else {
        console.log('Failed to toggle NFC status:', response.data)
        throw new Error(response.data?.error || 'Failed to toggle NFC status')
      }
    } catch (error: any) {
      console.error('Error toggling NFC status:', error)
      setNfcError(error.message || 'Failed to toggle NFC status')
      toast.error(error.message || 'Failed to toggle NFC status')
    } finally {
      setTogglingNfc(null)
    }
  }

  // Load user NFCs on component mount
  useEffect(() => {
    const user = getCurrentUser()
    if (user?.isLoggedIn) {
      loadUserNfcs()
    }
  }, [])

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
                You need to be logged in to access your NFC tags and manage your profile.
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
            <Tag className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold md:text-4xl">My Tags</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your personal tags and interests
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            Welcome back, {currentUser.firstName} {currentUser.lastName}!
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search tags
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search your tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* NFC Detection Section */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Smartphone className="w-6 h-6" />
              <span>NFC Tag Detection</span>
            </CardTitle>
            <CardDescription className="text-blue-600">
              Detect and read data from your NFC tags or chips
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showNfcDetector ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-100 rounded-lg">
                  <Wifi className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Ready to detect NFC tags</p>
                    <p className="text-sm text-blue-600">
                      Click the button below to start NFC scanning
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowNfcDetector(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Start NFC Detection
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

                {/* NFC Data Display - Integrated into the same card */}
                {nfcData && (
                  <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">NFC Detected!</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-green-800 mb-2 text-sm">Data received:</h4>
                        <div className="bg-white rounded p-3 border max-h-32 overflow-y-auto">
                          <pre className="text-xs text-green-700 whitespace-pre-wrap break-words">
                            {JSON.stringify(nfcData, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Button
                          size="sm"
                          onClick={() => setNfcData(null)}
                          variant="outline"
                          className="text-xs"
                        >
                          Clear Data
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowNfcDetector(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          Scan Again
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => registerNfcTag(nfcData)}
                          disabled={isRegisteringNfc}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          {isRegisteringNfc ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            'Register NFC Tag'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {nfcError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{nfcError}</p>
              <Button
                size="sm"
                onClick={() => setNfcError(null)}
                variant="outline"
                className="mt-2"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* User's NFC Tags */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>My NFC Tags ({filteredNfcs.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-inactive" className="text-sm">
                    Show Inactive
                  </Label>
                  <Switch
                    id="show-inactive"
                    checked={showInactiveNfcs}
                    onCheckedChange={setShowInactiveNfcs}
                  />
                </div>
                <Button
                  onClick={loadUserNfcs}
                  disabled={isLoadingNfcs}
                  size="sm"
                  variant="outline"
                >
                  {isLoadingNfcs ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Your registered NFC tags and their data. Toggle switches to enable/disable NFC tags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingNfcs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-blue-600">Loading NFC tags...</span>
              </div>
            ) : filteredNfcs.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No NFC tags found</h3>
                <p className="text-muted-foreground">
                  Register your first NFC tag using the scanner above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNfcs.map((nfc) => (
                  <Card key={nfc.id} className={`${nfc.isActive === 'true' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Power className={`w-4 h-4 ${nfc.isActive === 'true' ? 'text-green-600' : 'text-gray-400'}`} />
                            <h4 className={`font-medium ${nfc.isActive === 'true' ? 'text-green-800' : 'text-gray-600'}`}>
                              {nfc.name}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={nfc.isActive === 'true' ? 'default' : 'secondary'}
                              className={`text-xs ${nfc.isActive === 'true' ? 'bg-green-600' : 'bg-gray-500'}`}
                            >
                              {nfc.isActive === 'true' ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {new Date(nfc.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className={`text-sm ${nfc.isActive === 'true' ? 'text-green-600' : 'text-gray-500'}`}>
                            ID: {nfc.nfcId}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`toggle-${nfc.id}`} className="text-sm font-medium">
                              {nfc.isActive === 'true' ? 'Enabled' : 'Disabled'}
                            </Label>
                            <Switch
                              id={`toggle-${nfc.id}`}
                              checked={nfc.isActive === 'true'}
                              onCheckedChange={(checked: boolean) => toggleNfcStatus(nfc.nfcId, checked)}
                              disabled={togglingNfc === nfc.nfcId}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </div>

                        {togglingNfc === nfc.nfcId && (
                          <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Updating status...</span>
                          </div>
                        )}

                        {nfc.data && (
                          <div className="bg-white rounded p-2 border">
                            <pre className="text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(nfc.data, null, 2)}
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
