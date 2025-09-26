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

interface BasicInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  location: string
}

interface SportsInfo {
  interests: string[]
  skillLevel: string
  availability: string
}

interface WorkInfo {
  resume: File | null
  isHiring: boolean
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
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    location: '',
  })
  const [sportsInfo, setSportsInfo] = useState<SportsInfo>({
    interests: [],
    skillLevel: '',
    availability: '',
  })
  const [workInfo, setWorkInfo] = useState<WorkInfo>({
    resume: null,
    isHiring: false,
    company: '',
    position: '',
    experience: '',
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

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

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setWorkInfo((prev) => ({ ...prev, resume: file }))
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
      const registrationData = {
        // Basic Information
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        email: basicInfo.email,
        phone: basicInfo.phone || undefined,
        dateOfBirth: basicInfo.dateOfBirth || undefined,
        location: basicInfo.location || undefined,
        // Sports Information
        interests: sportsInfo.interests.length > 0 ? sportsInfo.interests : undefined,
        skillLevel: sportsInfo.skillLevel || undefined,
        availability: sportsInfo.availability || undefined,
        // Work Information
        company: workInfo.company || undefined,
        position: workInfo.position || undefined,
        experience: workInfo.experience || undefined,
        isHiring: workInfo.isHiring,
        resumeUrl: workInfo.resume ? URL.createObjectURL(workInfo.resume) : undefined,
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
          dateOfBirth: '',
          location: '',
        })
        setSportsInfo({
          interests: [],
          skillLevel: '',
          availability: '',
        })
        setWorkInfo({
          resume: null,
          isHiring: false,
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
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={basicInfo.dateOfBirth}
                  onChange={(e) =>
                    handleBasicInfoChange('dateOfBirth', e.target.value)
                  }
                  className="text-base"
                />
              </div>
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
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {workInfo.resume
                      ? workInfo.resume.name
                      : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX (max 10MB)
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="mt-4"
                />
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
