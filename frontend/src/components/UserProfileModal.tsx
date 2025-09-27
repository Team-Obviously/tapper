import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Mail, MapPin, Calendar, Tag } from 'lucide-react'

interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
    user: {
        firstName: string
        lastName: string
        email?: string
        location?: string
        joinDate?: string
        bio?: string
    } | null
    connectionDetails: {
        sharedInterest: string
        connectedDate: string
    } | null
}

export function UserProfileModal({
    isOpen,
    onClose,
    user,
    connectionDetails
}: UserProfileModalProps) {
    if (!user) return null

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">User Profile</DialogTitle>
                    <DialogDescription className="text-center">
                        Connection details
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4 py-4">
                    {/* User Avatar */}
                    <Avatar className="h-24 w-24 text-xl">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                    </Avatar>

                    {/* User Name */}
                    <h2 className="text-2xl font-bold">
                        {user.firstName} {user.lastName}
                    </h2>

                    {/* Connection Badge */}
                    {connectionDetails && (
                        <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="px-3 py-1 border-green-500 text-green-700 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Connected over {connectionDetails.sharedInterest}
                            </Badge>
                        </div>
                    )}

                    {/* User Details */}
                    <div className="w-full space-y-3 mt-4">
                        {user.email && (
                            <div className="flex items-center space-x-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>
                        )}

                        {user.location && (
                            <div className="flex items-center space-x-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{user.location}</span>
                            </div>
                        )}

                        {connectionDetails && (
                            <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Connected on {new Date(connectionDetails.connectedDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <div className="w-full mt-4">
                            <h3 className="text-sm font-medium mb-2">About</h3>
                            <p className="text-sm text-muted-foreground">{user.bio}</p>
                        </div>
                    )}

                    {/* Connection Message */}
                    {connectionDetails && (
                        <div className="w-full bg-muted p-3 rounded-md mt-2">
                            <p className="text-sm text-center">
                                You and {user.firstName} connected over your shared interest in{' '}
                                <span className="font-medium">{connectionDetails.sharedInterest}</span>
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-center sm:justify-center">
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
