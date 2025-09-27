import { Request, Response } from 'express';
import { z } from 'zod';
import { similarityService } from '../services/similarityService';

// Validation schemas
const getSimilaritySchema = z.object({
    userId1: z.string().uuid('Invalid user ID format for user1'),
    userId2: z.string().uuid('Invalid user ID format for user2'),
});

const getSimilarUsersSchema = z.object({
    userId: z.string().uuid('Invalid user ID format'),
    minSimilarity: z.coerce.number().min(0).max(1).optional().default(0.3),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

/**
 * GET /api/similarity/get-similarity
 * Calculates similarity between two users
 * Query params: userId1, userId2
 */
export async function getSimilarity(req: Request, res: Response) {
    try {
        // Validate query parameters
        const validation = getSimilaritySchema.safeParse(req.query);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { userId1, userId2 } = validation.data;

        // Calculate similarity
        const result = await similarityService.calculateSimilarity(userId1, userId2);

        return res.status(200).json({
            success: true,
            data: {
                similarity: result.similarity,
                profileMatching: result.profileMatching,
                user1: {
                    id: result.user1.id,
                    profile: result.user1.profile,
                },
                user2: {
                    id: result.user2.id,
                    profile: result.user2.profile,
                },
            },
            message: 'Similarity calculated successfully',
        });
    } catch (error: any) {
        console.error('Error calculating similarity:', error);

        // Handle specific error cases
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: error.message,
            });
        }

        if (error.message.includes('same user')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: error.message,
            });
        }

        if (error.message.includes('required')) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: error.message,
            });
        }

        // Generic error response
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to calculate similarity',
        });
    }
}

/**
 * GET /api/similarity/similar-users/:userId
 * Gets similar users for a given user
 * Query params: minSimilarity (optional, default 0.3), limit (optional, default 10)
 */
export async function getSimilarUsers(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required',
                message: 'User ID parameter is missing from the URL',
            });
        }
        
        const queryParams = {
            userId,
            ...req.query,
        };

        // Validate parameters
        const validation = getSimilarUsersSchema.safeParse(queryParams);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { minSimilarity, limit } = validation.data;

        // Get similar users
        const similarUsers = await similarityService.getSimilarUsers(
            userId,
            minSimilarity,
            limit
        );

        return res.status(200).json({
            success: true,
            data: {
                targetUserId: userId,
                similarUsers,
                count: similarUsers.length,
                minSimilarity,
                limit,
            },
            message: 'Similar users retrieved successfully',
        });
    } catch (error: any) {
        console.error('Error getting similar users:', error);

        // Handle specific error cases
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: error.message,
            });
        }

        if (error.message.includes('required')) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: error.message,
            });
        }

        if (error.message.includes('between 0 and 1')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameter value',
                message: error.message,
            });
        }

        // Generic error response
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get similar users',
        });
    }
}

/**
 * GET /api/similarity/interest-connections/:userId
 * Gets users grouped by shared interests with the target user
 * Path params: userId
 */
export async function getInterestConnections(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required',
                message: 'User ID parameter is missing from the URL',
            });
        }

        // Get interest-based connections
        const result = await similarityService.getInterestBasedConnections(userId);

        return res.status(200).json({
            success: true,
            data: {
                user_id: result.userId,
                similarity: result.similarity,
            },
            message: 'Interest-based connections retrieved successfully',
        });
    } catch (error: any) {
        console.error('Error getting interest connections:', error);

        // Handle specific error cases
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: error.message,
            });
        }

        if (error.message.includes('required')) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: error.message,
            });
        }

        // Generic error response
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get interest connections',
        });
    }
}

/**
 * GET /api/similarity/health
 * Health check endpoint for similarity service
 */
export async function similarityHealth(req: Request, res: Response) {
    try {
        // Simple health check - could be enhanced with database connectivity check
        return res.status(200).json({
            success: true,
            service: 'similarity-service',
            status: 'healthy',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            service: 'similarity-service',
            status: 'unhealthy',
            error: 'Health check failed',
        });
    }
}
