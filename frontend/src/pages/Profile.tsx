import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import {
    User,
    Gamepad2,
    Briefcase,
    Loader2,
    Edit,
    Save,
    X,
    AlertCircle,
} from 'lucide-react'
import { getRequest, putRequest } from '../utility/generalServices'
import { getCurrentUser, getUserId } from '../utility/auth'
import { toast } from 'sonner'

interface UserData {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    location?: string
    interests?: string[]
    skillLevel?: string
    availability?: string
    company?: string
    position?: string
    experience?: string
    isHiring?: string
    resumeUrl?: string
}

const sportsOptions = [
    'Football',
    'Basketball',
    'Tennis',
    'Soccer',
    'Baseball',
    'Volleyball',
    'Swimming',
    'Running',
    'Cycling',
    'Golf',
    'Hockey',
    'Cricket',
    'Badminton',
    'Table Tennis',
    'Boxing',
    'MMA',
    'Yoga',
    'Pilates',
    'Rock Climbing',
    'Surfing',
    'Skiing',
    'Snowboarding',
    'Other',
]

const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'professional', label: 'Professional' },
]

const availabilityOptions = [
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'evenings', label: 'Evenings' },
    { value: 'flexible', label: 'Flexible' },
]

const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6-10 years)' },
    { value: 'executive', label: 'Executive Level (10+ years)' },
]

export default function Profile() {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editData, setEditData] = useState<Partial<UserData>>({})

    // Load user data on component mount
    useEffect(() => {
        loadUserData()
    }, [])

    const loadUserData = async () => {
        const userId = getUserId()
        if (!userId) {
            setError('User not logged in')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await getRequest(`/users/${userId}`)
            if (response.status === 200) {
                setUserData(response.data)
                setEditData(response.data)
            } else {
                setError('Failed to load profile data')
            }
        } catch (error) {
            console.error('Error loading profile:', error)
            setError('Failed to load profile data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = () => {
        setIsEditing(true)
        setEditData(userData || {})
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEditData(userData || {})
    }

    const handleSave = async () => {
        const userId = getUserId()
        if (!userId) {
            setError('User not logged in')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const response = await putRequest(`/users/${userId}`, editData)
            if (response.status === 200) {
                setUserData(response.data.user)
                setIsEditing(false)
                toast.success('Profile updated successfully!')
            } else {
                throw new Error(response.data?.error || 'Failed to update profile')
            }
        } catch (error: any) {
            console.error('Error updating profile:', error)
            setError(error.message || 'Failed to update profile')
            toast.error(error.message || 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleInputChange = (field: keyof UserData, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }))
    }

    const handleSportsInterestChange = (sport: string, checked: boolean) => {
        setEditData(prev => ({
            ...prev,
            interests: checked
                ? [...(prev.interests || []), sport]
                : (prev.interests || []).filter(s => s !== sport)
        }))
    }

    const currentUser = getCurrentUser()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-blue-600">Loading profile...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error && !userData) {
        return (
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-red-800">
                                <AlertCircle className="w-5 h-5" />
                                <span>Error</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={loadUserData} className="bg-red-600 hover:bg-red-700">
                                Try Again
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <User className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold md:text-4xl">Profile</h1>
                        </div>
                        {!isEditing ? (
                            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex space-x-2">
                                <Button onClick={handleCancel} variant="outline">
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-2">
                        {isEditing ? 'Edit your profile information' : 'View and manage your profile information'}
                    </p>
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

                {/* Basic Information */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <User className="w-5 h-5" />
                            <span>Basic Information</span>
                        </CardTitle>
                        <CardDescription>
                            Your personal details and contact information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={isEditing ? editData.firstName || '' : userData?.firstName || ''}
                                    onChange={isEditing ? (e) => handleInputChange('firstName', e.target.value) : undefined}
                                    disabled={!isEditing}
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={isEditing ? editData.lastName || '' : userData?.lastName || ''}
                                    onChange={isEditing ? (e) => handleInputChange('lastName', e.target.value) : undefined}
                                    disabled={!isEditing}
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={isEditing ? editData.email || '' : userData?.email || ''}
                                    onChange={isEditing ? (e) => handleInputChange('email', e.target.value) : undefined}
                                    disabled={!isEditing}
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={isEditing ? editData.phone || '' : userData?.phone || ''}
                                    onChange={isEditing ? (e) => handleInputChange('phone', e.target.value) : undefined}
                                    disabled={!isEditing}
                                    className="text-base"
                                />
                            </div>
                            {/*  */}
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={isEditing ? editData.location || '' : userData?.location || ''}
                                    onChange={isEditing ? (e) => handleInputChange('location', e.target.value) : undefined}
                                    disabled={!isEditing}
                                    placeholder="City, State"
                                    className="text-base"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sports Information */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Gamepad2 className="w-5 h-5" />
                            <span>Sports Interests</span>
                        </CardTitle>
                        <CardDescription>
                            Your sports preferences and skill level
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Sports Interests</Label>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                    {sportsOptions.map((sport) => (
                                        <div key={sport} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={sport}
                                                checked={isEditing
                                                    ? (editData.interests || []).includes(sport)
                                                    : (userData?.interests || []).includes(sport)
                                                }
                                                onCheckedChange={isEditing
                                                    ? (checked) => handleSportsInterestChange(sport, checked as boolean)
                                                    : undefined
                                                }
                                                disabled={!isEditing}
                                            />
                                            <Label
                                                htmlFor={sport}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {sport}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base font-medium">Skill Level</Label>
                                <RadioGroup
                                    value={isEditing ? editData.skillLevel || '' : userData?.skillLevel || ''}
                                    onValueChange={isEditing ? (value) => handleInputChange('skillLevel', value) : undefined}
                                    disabled={!isEditing}
                                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                                >
                                    {skillLevels.map((level) => (
                                        <div key={level.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={level.value} id={level.value} />
                                            <Label htmlFor={level.value} className="cursor-pointer">
                                                {level.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base font-medium">Availability</Label>
                                <RadioGroup
                                    value={isEditing ? editData.availability || '' : userData?.availability || ''}
                                    onValueChange={isEditing ? (value) => handleInputChange('availability', value) : undefined}
                                    disabled={!isEditing}
                                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                                >
                                    {availabilityOptions.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option.value} id={option.value} />
                                            <Label htmlFor={option.value} className="cursor-pointer">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Work Information */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Briefcase className="w-5 h-5" />
                            <span>Work Information</span>
                        </CardTitle>
                        <CardDescription>
                            Your professional background and career details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isHiring"
                                        checked={isEditing
                                            ? editData.isHiring === 'true'
                                            : userData?.isHiring === 'true'
                                        }
                                        onCheckedChange={isEditing
                                            ? (checked) => handleInputChange('isHiring', checked ? 'true' : 'false')
                                            : undefined
                                        }
                                        disabled={!isEditing}
                                    />
                                    <Label htmlFor="isHiring" className="text-base font-medium cursor-pointer">
                                        I am currently hiring
                                    </Label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        value={isEditing ? editData.company || '' : userData?.company || ''}
                                        onChange={isEditing ? (e) => handleInputChange('company', e.target.value) : undefined}
                                        disabled={!isEditing}
                                        placeholder="Enter company name"
                                        className="text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position">Position</Label>
                                    <Input
                                        id="position"
                                        value={isEditing ? editData.position || '' : userData?.position || ''}
                                        onChange={isEditing ? (e) => handleInputChange('position', e.target.value) : undefined}
                                        disabled={!isEditing}
                                        placeholder="Enter your position"
                                        className="text-base"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base font-medium">Experience Level</Label>
                                <RadioGroup
                                    value={isEditing ? editData.experience || '' : userData?.experience || ''}
                                    onValueChange={isEditing ? (value) => handleInputChange('experience', value) : undefined}
                                    disabled={!isEditing}
                                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                                >
                                    {experienceLevels.map((level) => (
                                        <div key={level.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={level.value} id={level.value} />
                                            <Label htmlFor={level.value} className="cursor-pointer">
                                                {level.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {userData?.resumeUrl && (
                                <div className="space-y-2">
                                    <Label>Resume</Label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-sm text-gray-600">
                                            Resume uploaded: <a href={userData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
