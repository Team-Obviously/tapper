import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Progress } from '../components/ui/progress'
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  User,
  Gamepad2,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { postRequest } from '../utility/generalServices'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { uploadFileWithTusky, validateFile, formatFileSize } from '../utility/tuskyUpload'
import { EnsProfile } from '../components/EnsProfile'
import { useConnect } from 'wagmi'


interface BasicInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  githubUsername: string
  linkedinProfile: string
  telegramUsername: string
  discordUsername: string
}

interface SportsInfo {
  interests: string[]
  skillLevel: string
  availability: string
}

interface WorkInfo {
  resume: File | null
  resumeBlob?: ArrayBuffer
  resumeProof?: string
  resumeCommitment?: string
  resumePublicSignals?: string[]
  resumeData?: any
  isHiring: boolean
  isOpenToRelationships: boolean
  company: string
  position: string
  experience: string
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

export default function Registration() {
  const router = useNavigate()
  const { connect, connectors } = useConnect()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null)
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    githubUsername: '',
    linkedinProfile: '',
    telegramUsername: '',
    discordUsername: '',
  })
  const [sportsInfo, setSportsInfo] = useState<SportsInfo>({
    interests: [],
    skillLevel: '',
    availability: '',
  })
  const [workInfo, setWorkInfo] = useState<WorkInfo>({
    resume: null,
    isHiring: false,
    isOpenToRelationships: false,
    company: '',
    position: '',
    experience: '',
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const handleWalletConnect = () => {
    try {
      const connector = connectors[0] // Use the first available connector (usually MetaMask)
      connect({ connector })
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet. Please try again.')
    }
  }

  const handleBasicInfoChange = (field: keyof BasicInfo, value: string) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleSportsInterestChange = (sport: string, checked: boolean) => {
    setSportsInfo((prev) => ({
      ...prev,
      interests: checked
        ? [...prev.interests, sport]
        : prev.interests.filter((s) => s !== sport),
    }))
  }

  const handleWorkInfoChange = (
    field: keyof WorkInfo,
    value: string | boolean | File | null
  ) => {
    setWorkInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null

    if (!file) {
      setWorkInfo((prev) => ({ ...prev, resume: null }))
      return
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      setResumeUploadError(validation.error || 'Invalid file')
      toast.error(validation.error || 'Invalid file')
      return
    }

    setIsUploadingResume(true)
    setResumeUploadError(null)

    try {


      // Upload file with Tusky
      const uploadResult = await uploadFileWithTusky(file, `resume_${Date.now()}_${file.name}`)

      if (uploadResult.success && uploadResult.fileBuffer) {
        // Store the file and URL
        setWorkInfo((prev) => ({
          ...prev,
          resume: file,
          resumeBlob: uploadResult.fileBuffer
        }))
        toast.success('Resume uploaded successfully!')
      } else {
        throw new Error(uploadResult.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Resume upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setResumeUploadError(errorMessage)
      toast.error(`Resume upload failed: ${errorMessage}`)
    } finally {
      setIsUploadingResume(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Prepare the data for API submission
      const socialData = {
        githubUsername: basicInfo.githubUsername || undefined,
        linkedinProfile: basicInfo.linkedinProfile || undefined,
        telegramUsername: basicInfo.telegramUsername || undefined,
        discordUsername: basicInfo.discordUsername || undefined,
      };

      const registrationData = {
        // Basic Information
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        email: basicInfo.email,
        phone: basicInfo.phone || undefined,
        location: basicInfo.location || undefined,
        // Social Media Information (stored in data column)
        data: JSON.stringify(socialData),
        // Sports Information
        interests: sportsInfo.interests.length > 0 ? sportsInfo.interests : undefined,
        skillLevel: sportsInfo.skillLevel || undefined,
        availability: sportsInfo.availability || undefined,
        // Work Information
        company: workInfo.company || undefined,
        position: workInfo.position || undefined,
        experience: workInfo.experience || undefined,
        isHiring: workInfo.isHiring,
        isOpenToRelationships: workInfo.isOpenToRelationships,
        resumeBlob: workInfo.resumeBlob,
      }

      console.log('Submitting registration data:', registrationData)

      // Call the API
      const response = await postRequest('/users/create-user', registrationData)

      if (response.status === 201) {
        console.log('Registration successful:', response.data)

        // Store user data in localStorage
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          isLoggedIn: true,
          loginTime: new Date().toISOString()
        }

        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('jwt', 'dummy-jwt-token') // You can implement proper JWT later

        toast.success('Registration successful')
        router('/dashboard/home')


        // Reset form
        setCurrentStep(1)
        setBasicInfo({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          location: '',
          githubUsername: '',
          linkedinProfile: '',
          telegramUsername: '',
          discordUsername: '',
        })
        setSportsInfo({
          interests: [],
          skillLevel: '',
          availability: '',
        })
        setWorkInfo({
          resume: null,
          isHiring: false,
          isOpenToRelationships: false,
          company: '',
          position: '',
          experience: '',
        })
      } else {
        throw new Error(response.data?.message || 'Registration failed')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setSubmitError(
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          basicInfo.firstName &&
          basicInfo.lastName &&
          basicInfo.email &&
          basicInfo.phone
        )
      case 2:
        return (
          sportsInfo.interests.length > 0 &&
          sportsInfo.skillLevel &&
          sportsInfo.availability
        )
      case 3:
        return workInfo.company && workInfo.position && workInfo.experience
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>

            {/* ENS Profile Section */}
            <div className="mb-6">
              <Label className="text-base font-medium mb-3 block">Connect Your Wallet (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your wallet to display your ENS name and avatar
              </p>
              <EnsProfile onConnect={handleWalletConnect} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={basicInfo.firstName}
                  onChange={(e) =>
                    handleBasicInfoChange('firstName', e.target.value)
                  }
                  placeholder="Enter your first name"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={basicInfo.lastName}
                  onChange={(e) =>
                    handleBasicInfoChange('lastName', e.target.value)
                  }
                  placeholder="Enter your last name"
                  className="text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={basicInfo.email}
                onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                placeholder="Enter your email"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={basicInfo.phone}
                onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={basicInfo.location}
                  onChange={(e) =>
                    handleBasicInfoChange('location', e.target.value)
                  }
                  placeholder="City, State"
                  className="text-base"
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Social Media Profiles</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="githubUsername">GitHub Username</Label>
                  <Input
                    id="githubUsername"
                    value={basicInfo.githubUsername}
                    onChange={(e) =>
                      handleBasicInfoChange('githubUsername', e.target.value)
                    }
                    placeholder="username"
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                  <Input
                    id="linkedinProfile"
                    value={basicInfo.linkedinProfile}
                    onChange={(e) =>
                      handleBasicInfoChange('linkedinProfile', e.target.value)
                    }
                    placeholder="linkedin.com/in/username"
                    className="text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="telegramUsername">Telegram Username</Label>
                  <Input
                    id="telegramUsername"
                    value={basicInfo.telegramUsername}
                    onChange={(e) =>
                      handleBasicInfoChange('telegramUsername', e.target.value)
                    }
                    placeholder="@username"
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discordUsername">Discord Username</Label>
                  <Input
                    id="discordUsername"
                    value={basicInfo.discordUsername}
                    onChange={(e) =>
                      handleBasicInfoChange('discordUsername', e.target.value)
                    }
                    placeholder="username#0000"
                    className="text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Sports Interests</h2>
              <p className="text-muted-foreground">
                What sports are you interested in?
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">
                Select your interests *
              </Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {sportsOptions.map((sport) => (
                  <div key={sport} className="flex items-center space-x-2">
                    <Checkbox
                      id={sport}
                      checked={sportsInfo.interests.includes(sport)}
                      onCheckedChange={(checked) =>
                        handleSportsInterestChange(sport, checked as boolean)
                      }
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
              <Label className="text-base font-medium">Skill Level *</Label>
              <RadioGroup
                value={sportsInfo.skillLevel}
                onValueChange={(value) =>
                  setSportsInfo((prev) => ({ ...prev, skillLevel: value }))
                }
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {skillLevels.map((level) => (
                  <div
                    key={level.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={level.value} id={level.value} />
                    <Label htmlFor={level.value} className="cursor-pointer">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Availability *</Label>
              <RadioGroup
                value={sportsInfo.availability}
                onValueChange={(value) =>
                  setSportsInfo((prev) => ({ ...prev, availability: value }))
                }
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {availabilityOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Work Information</h2>
              <p className="text-muted-foreground">
                Tell us about your professional background
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Upload Resume</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {isUploadingResume ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
                    <p className="text-sm text-blue-600">Uploading resume...</p>
                    <p className="text-xs text-muted-foreground">Please wait while we upload your file</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {workInfo.resume
                          ? `${workInfo.resume.name} (${formatFileSize(workInfo.resume.size)})`
                          : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX (max 10MB)
                      </p>
                      {workInfo.resumeBlob && (
                        <div className="space-y-1">
                          <p className="text-xs text-green-600">
                            ✓ Resume uploaded successfully
                          </p>
                          {workInfo.resumeProof && (
                            <p className="text-xs text-blue-600">
                              🔒 Zero-knowledge proof generated
                            </p>
                          )}
                          {workInfo.resumeData && (
                            <div className="text-xs text-gray-600 mt-2">
                              <p>Verified attributes:</p>
                              <ul className="text-left mt-1 space-y-0.5">
                                {workInfo.resumeData.hasDegree && (
                                  <li>• Degree: {workInfo.resumeData.degreeText || 'Verified'}</li>
                                )}
                                {workInfo.resumeData.hasExperience && (
                                  <li>• Experience: {workInfo.resumeData.experienceYears} years</li>
                                )}
                                {workInfo.resumeData.hasSkills && (
                                  <li>• Skills: {workInfo.resumeData.skillsCount} found</li>
                                )}
                                {workInfo.resumeData.hasCertification && (
                                  <li>• Certifications: {workInfo.resumeData.certificationsCount} found</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {resumeUploadError && (
                        <p className="text-xs text-red-600">
                          ✗ {resumeUploadError}
                        </p>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="mt-4"
                      disabled={isUploadingResume}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isHiring"
                  checked={workInfo.isHiring}
                  onCheckedChange={(checked) =>
                    handleWorkInfoChange('isHiring', checked as boolean)
                  }
                />
                <Label
                  htmlFor="isHiring"
                  className="text-base font-medium cursor-pointer"
                >
                  I am currently hiring
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOpenToRelationships"
                  checked={workInfo.isOpenToRelationships}
                  onCheckedChange={(checked) =>
                    handleWorkInfoChange('isOpenToRelationships', checked as boolean)
                  }
                />
                <Label
                  htmlFor="isOpenToRelationships"
                  className="text-base font-medium cursor-pointer"
                >
                  I am open to dating and relationships
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={workInfo.company}
                  onChange={(e) =>
                    handleWorkInfoChange('company', e.target.value)
                  }
                  placeholder="Enter company name"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={workInfo.position}
                  onChange={(e) =>
                    handleWorkInfoChange('position', e.target.value)
                  }
                  placeholder="Enter your position"
                  className="text-base"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">
                Experience Level *
              </Label>
              <RadioGroup
                value={workInfo.experience}
                onValueChange={(value) =>
                  handleWorkInfoChange('experience', value)
                }
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {experienceLevels.map((level) => (
                  <div
                    key={level.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={level.value} id={level.value} />
                    <Label htmlFor={level.value} className="cursor-pointer">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 md:text-4xl">Join Tapper</h1>
          <p className="text-muted-foreground">
            Create your account in just a few steps
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStepContent()}

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid() || isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
