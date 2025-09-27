import { Request, Response } from 'express';
import { db } from '../db';
import { invitations, acceptedConnections, users } from '../schema';
import { eq, and, or, desc } from 'drizzle-orm';

// Send an invitation to connect based on shared interest
export const sendInvitation = async (req: Request, res: Response) => {
    try {
        const { fromUserId, toUserId, interest, message } = req.body;

        if (!fromUserId || !toUserId || !interest) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: fromUserId, toUserId, interest'
            });
        }

        // Check if invitation already exists
        const existingInvitation = await db
            .select()
            .from(invitations)
            .where(
                and(
                    eq(invitations.fromUserId, fromUserId),
                    eq(invitations.toUserId, toUserId),
                    eq(invitations.interest, interest),
                    eq(invitations.status, 'pending')
                )
            )
            .limit(1);

        if (existingInvitation.length > 0) {
            // If invitation already exists, just return it as if it was newly created
            console.log(`Invitation already exists from ${fromUserId} to ${toUserId} for ${interest}`);
            return res.status(200).json({
                success: true,
                data: existingInvitation[0],
                message: 'Invitation already sent'
            });
        }

        // Create new invitation
        const newInvitation = await db
            .insert(invitations)
            .values({
                fromUserId,
                toUserId,
                interest,
                message: message || null,
                status: 'pending'
            })
            .returning();

        res.status(201).json({
            success: true,
            data: newInvitation[0]
        });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send invitation'
        });
    }
};

// Get pending invitations for a user
export const getPendingInvitations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const pendingInvitations = await db
            .select({
                id: invitations.id,
                fromUserId: invitations.fromUserId,
                toUserId: invitations.toUserId,
                interest: invitations.interest,
                message: invitations.message,
                createdAt: invitations.createdAt,
                fromUser: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email
                }
            })
            .from(invitations)
            .leftJoin(users, eq(invitations.fromUserId, users.id))
            .where(
                and(
                    eq(invitations.toUserId, userId),
                    eq(invitations.status, 'pending')
                )
            )
            .orderBy(desc(invitations.createdAt));

        res.status(200).json({
            success: true,
            data: pendingInvitations
        });
    } catch (error) {
        console.error('Error fetching pending invitations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending invitations'
        });
    }
};

// Respond to an invitation (accept or reject)
export const respondToInvitation = async (req: Request, res: Response) => {
    try {
        const { invitationId } = req.params;
        const { response } = req.body; // 'accepted' or 'rejected'

        if (!invitationId) {
            return res.status(400).json({
                success: false,
                error: 'Invitation ID is required'
            });
        }

        if (!['accepted', 'rejected'].includes(response)) {
            return res.status(400).json({
                success: false,
                error: 'Response must be either "accepted" or "rejected"'
            });
        }

        // Get the invitation
        const invitation = await db
            .select()
            .from(invitations)
            .where(eq(invitations.id, invitationId))
            .limit(1);

        if (invitation.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Invitation not found'
            });
        }

        if (invitation[0]?.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Invitation has already been responded to'
            });
        }

        // Update invitation status
        const updatedInvitation = await db
            .update(invitations)
            .set({
                status: response,
                respondedAt: new Date()
            })
            .where(eq(invitations.id, invitationId))
            .returning();

        // If accepted, create an accepted connection
        if (response === 'accepted' && invitation[0]) {
            await db.insert(acceptedConnections).values({
                userId1: invitation[0].fromUserId,
                userId2: invitation[0].toUserId,
                sharedInterest: invitation[0].interest,
                invitationId: invitation[0].id
            });
        }

        res.status(200).json({
            success: true,
            data: updatedInvitation[0]
        });
    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to respond to invitation'
        });
    }
};

// Get accepted connections for a user
export const getAcceptedConnections = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const connections = await db
            .select({
                id: acceptedConnections.id,
                userId1: acceptedConnections.userId1,
                userId2: acceptedConnections.userId2,
                sharedInterest: acceptedConnections.sharedInterest,
                createdAt: acceptedConnections.createdAt,
                otherUser: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email
                }
            })
            .from(acceptedConnections)
            .leftJoin(
                users,
                or(
                    and(
                        eq(acceptedConnections.userId1, userId),
                        eq(acceptedConnections.userId2, users.id)
                    ),
                    and(
                        eq(acceptedConnections.userId2, userId),
                        eq(acceptedConnections.userId1, users.id)
                    )
                )
            )
            .where(
                or(
                    eq(acceptedConnections.userId1, userId),
                    eq(acceptedConnections.userId2, userId)
                )
            )
            .orderBy(desc(acceptedConnections.createdAt));

        res.status(200).json({
            success: true,
            data: connections
        });
    } catch (error) {
        console.error('Error fetching accepted connections:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch accepted connections'
        });
    }
};

// Get invitations sent by a user
export const getSentInvitations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const sentInvitations = await db
            .select({
                id: invitations.id,
                fromUserId: invitations.fromUserId,
                toUserId: invitations.toUserId,
                interest: invitations.interest,
                message: invitations.message,
                status: invitations.status,
                createdAt: invitations.createdAt,
                toUser: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email
                }
            })
            .from(invitations)
            .leftJoin(users, eq(invitations.toUserId, users.id))
            .where(eq(invitations.fromUserId, userId))
            .orderBy(desc(invitations.createdAt));

        res.status(200).json({
            success: true,
            data: sentInvitations
        });
    } catch (error) {
        console.error('Error fetching sent invitations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sent invitations'
        });
    }
};

// Get users with shared interests for sending invitations
export const getUsersWithSharedInterests = async (req: Request, res: Response) => {
    try {
        const { userId, interest } = req.params;

        if (!userId || !interest) {
            return res.status(400).json({
                success: false,
                error: 'User ID and interest are required'
            });
        }

        console.log(`🔍 Looking for users with interest: ${interest} (excluding user ${userId})`);

        // Get users who have this interest in their interests array (excluding current user)
        const allUsers = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                interests: users.interests
            })
            .from(users)
            .limit(50); // Get more users to filter from

        console.log(`📊 Found ${allUsers.length} total users in database`);
        console.log(`📊 First few users:`, allUsers.slice(0, 3));

        // Filter users who have the interest and are not the current user
        const filteredUsers = allUsers
            .filter(user => user.id !== userId)
            .filter(user => {
                try {
                    // Handle both array and string formats
                    const interests = Array.isArray(user.interests)
                        ? user.interests
                        : JSON.parse(String(user.interests || '[]'));

                    return Array.isArray(interests) && interests.includes(interest);
                } catch (error) {
                    console.error('Error parsing interests for user', user.id, error);
                    return false;
                }
            })
            .map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                sharedInterest: interest,
                similarityScore: Math.random() * 0.3 + 0.7 // Random score between 0.7-1.0
            }));

        console.log(`✅ Found ${filteredUsers.length} users with interest '${interest}'`);
        if (filteredUsers.length > 0) {
            console.log(`✅ First matching user:`, filteredUsers[0]);
        }

        res.status(200).json({
            success: true,
            data: filteredUsers
        });
    } catch (error) {
        console.error('Error fetching users with shared interests:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users with shared interests'
        });
    }
};

// Get users by preference (hiring or dating)
export const getUsersByPreference = async (req: Request, res: Response) => {
    try {
        const { userId, preference } = req.params;

        if (!userId || !preference) {
            return res.status(400).json({
                success: false,
                error: 'User ID and preference are required'
            });
        }

        if (!['hiring', 'dating'].includes(preference)) {
            return res.status(400).json({
                success: false,
                error: 'Preference must be either "hiring" or "dating"'
            });
        }

        console.log(`🔍 Looking for users with preference: ${preference} (excluding user ${userId})`);

        // Get users with the specified preference
        const allUsers = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                isHiring: users.isHiring,
                isOpenToRelationships: users.isOpenToRelationships,
                interests: users.interests,
                company: users.company,
                position: users.position
            })
            .from(users)
            .limit(50);

        console.log(`📊 Found ${allUsers.length} total users in database`);

        // Filter users based on preference
        const filteredUsers = allUsers
            .filter(user => user.id !== userId)
            .filter(user => {
                if (preference === 'hiring') {
                    return user.isHiring === 'true';
                } else if (preference === 'dating') {
                    return user.isOpenToRelationships === 'true';
                }
                return false;
            })
            .map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                company: user.company,
                position: user.position,
                sharedInterest: preference === 'hiring' ? 'Professional Opportunity' : 'Dating',
                similarityScore: Math.random() * 0.3 + 0.7 // Random score between 0.7-1.0
            }));

        console.log(`✅ Found ${filteredUsers.length} users with preference '${preference}'`);
        if (filteredUsers.length > 0) {
            console.log(`✅ First matching user:`, filteredUsers[0]);
        }

        res.status(200).json({
            success: true,
            data: filteredUsers
        });
    } catch (error) {
        console.error('Error fetching users by preference:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users by preference'
        });
    }
};
