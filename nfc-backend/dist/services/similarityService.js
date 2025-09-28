import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import { calculateUserSimilarity, calculateUserSimilarityWithFields } from '../utils/user-similarity';
/**
 * Service class for handling user similarity calculations
 */
export class SimilarityService {
    /**
     * Fetches user profile data from the database by user ID
     * @param userId - The user ID to fetch
     * @returns User profile data or null if not found
     */
    async fetchUserProfile(userId) {
        try {
            const [user] = await db
                .select({
                interests: users.interests,
                skillLevel: users.skillLevel,
                availability: users.availability,
                company: users.company,
                position: users.position,
                experience: users.experience,
                isHiring: users.isHiring,
                resumeUrl: users.resumeUrl,
                data: users.data,
            })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);
            if (!user) {
                return null;
            }
            return {
                interests: user.interests,
                skillLevel: user.skillLevel,
                availability: user.availability,
                company: user.company,
                position: user.position,
                experience: user.experience,
                isHiring: user.isHiring,
                resumeUrl: user.resumeUrl,
                data: user.data,
            };
        }
        catch (error) {
            console.error(`Error fetching user profile for ID ${userId}:`, error);
            throw new Error('Failed to fetch user profile');
        }
    }
    /**
     * Calculates similarity between two users by their IDs
     * @param userId1 - First user ID
     * @param userId2 - Second user ID
     * @returns Similarity score, field similarities, and user details
     */
    async calculateSimilarity(userId1, userId2) {
        // Validate input
        if (!userId1 || !userId2) {
            throw new Error('Both user IDs are required');
        }
        if (userId1 === userId2) {
            throw new Error('Cannot calculate similarity between the same user');
        }
        // Fetch both user profiles
        const [user1Profile, user2Profile] = await Promise.all([
            this.fetchUserProfile(userId1),
            this.fetchUserProfile(userId2),
        ]);
        // Check if both users exist
        if (!user1Profile) {
            throw new Error(`User with ID ${userId1} not found`);
        }
        if (!user2Profile) {
            throw new Error(`User with ID ${userId2} not found`);
        }
        // Calculate similarity score with field details
        const { totalSimilarity, fieldSimilarities } = calculateUserSimilarityWithFields(user1Profile, user2Profile);
        // Sort fields by similarity score (highest to lowest) and extract field names
        const profileMatching = fieldSimilarities
            .sort((a, b) => b.similarity - a.similarity)
            .map(field => field.field);
        return {
            similarity: totalSimilarity,
            profileMatching,
            user1: {
                id: userId1,
                profile: user1Profile,
            },
            user2: {
                id: userId2,
                profile: user2Profile,
            },
        };
    }
    /**
     * Gets similar users for a given user ID with a minimum similarity threshold
     * @param userId - The user ID to find similar users for
     * @param minSimilarity - Minimum similarity threshold (0-1)
     * @param limit - Maximum number of similar users to return
     * @returns Array of similar users with their similarity scores
     */
    async getSimilarUsers(userId, minSimilarity = 0.3, limit = 10) {
        // Validate input
        if (!userId) {
            throw new Error('User ID is required');
        }
        if (minSimilarity < 0 || minSimilarity > 1) {
            throw new Error('Minimum similarity must be between 0 and 1');
        }
        // Get the target user's profile
        const targetProfile = await this.fetchUserProfile(userId);
        if (!targetProfile) {
            throw new Error(`User with ID ${userId} not found`);
        }
        // Get all other users
        const allUsers = await db
            .select({
            id: users.id,
            interests: users.interests,
            skillLevel: users.skillLevel,
            availability: users.availability,
            company: users.company,
            position: users.position,
            experience: users.experience,
            isHiring: users.isHiring,
            resumeUrl: users.resumeUrl,
            data: users.data,
        })
            .from(users)
            .where(eq(users.id, userId)); // This will be modified to exclude the target user
        // For now, let's get all users and filter out the target user
        const allUsersData = await db
            .select({
            id: users.id,
            interests: users.interests,
            skillLevel: users.skillLevel,
            availability: users.availability,
            company: users.company,
            position: users.position,
            experience: users.experience,
            isHiring: users.isHiring,
            resumeUrl: users.resumeUrl,
            data: users.data,
        })
            .from(users);
        // Calculate similarities and filter
        const similarities = allUsersData
            .filter(user => user.id !== userId)
            .map(user => {
            const profile = {
                interests: user.interests,
                skillLevel: user.skillLevel,
                availability: user.availability,
                company: user.company,
                position: user.position,
                experience: user.experience,
                isHiring: user.isHiring,
                resumeUrl: user.resumeUrl,
                data: user.data,
            };
            const similarity = calculateUserSimilarity(targetProfile, profile);
            return {
                userId: user.id,
                similarity,
                profile,
            };
        })
            .filter(result => result.similarity >= minSimilarity)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
        return similarities;
    }
    /**
     * Gets users grouped by shared interests with the target user
     * @param userId - The user ID to find interest-based connections for
     * @returns Array of interests with connected users and their full data
     */
    async getInterestBasedConnections(userId) {
        // Validate input
        if (!userId) {
            throw new Error('User ID is required');
        }
        // Get the target user's profile
        const targetProfile = await this.fetchUserProfile(userId);
        if (!targetProfile) {
            throw new Error(`User with ID ${userId} not found`);
        }
        // Get target user's interests
        const targetInterests = targetProfile.interests || [];
        if (targetInterests.length === 0) {
            return {
                userId,
                similarity: [],
            };
        }
        // Get all other users with full data
        const allUsers = await db
            .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            phone: users.phone,
            location: users.location,
            interests: users.interests,
            skillLevel: users.skillLevel,
            availability: users.availability,
            company: users.company,
            position: users.position,
            experience: users.experience,
            isHiring: users.isHiring,
            resumeUrl: users.resumeUrl,
            data: users.data,
            createdAt: users.createdAt,
        })
            .from(users);
        // Group users by shared interests
        const interestGroups = new Map();
        // Initialize map with target user's interests
        targetInterests.forEach(interest => {
            interestGroups.set(interest, []);
        });
        // Find users who share each interest
        allUsers
            .filter(user => user.id !== userId)
            .forEach(user => {
            const userInterests = user.interests || [];
            // Check which interests this user shares with the target user
            userInterests.forEach(interest => {
                if (targetInterests.includes(interest)) {
                    const existingGroup = interestGroups.get(interest) || [];
                    existingGroup.push({
                        userId: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        location: user.location,
                        interests: user.interests,
                        skillLevel: user.skillLevel,
                        availability: user.availability,
                        company: user.company,
                        position: user.position,
                        experience: user.experience,
                        isHiring: user.isHiring,
                        resumeUrl: user.resumeUrl,
                        data: user.data,
                        createdAt: user.createdAt,
                    });
                    interestGroups.set(interest, existingGroup);
                }
            });
        });
        // Convert map to array format
        const similarity = Array.from(interestGroups.entries())
            .map(([interest, connectedUsers]) => ({
            interest,
            connectedUsers,
        }))
            .sort((a, b) => b.connectedUsers.length - a.connectedUsers.length); // Sort by number of connections
        return {
            userId,
            similarity,
        };
    }
}
// Export a singleton instance
export const similarityService = new SimilarityService();
