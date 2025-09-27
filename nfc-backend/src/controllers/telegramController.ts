import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import { similarityService } from '../services/similarityService';
import { claudeService } from '../services/claudeService';
import { pdfParser } from '../utils/pdfParser';

// Validation schemas
const generateMessageSchema = z.object({
    fromUserId: z.string().uuid('Invalid from user ID format'),
    toUserId: z.string().uuid('Invalid to user ID format'),
});

const sendTelegramMessageSchema = z.object({
    fromUserId: z.string().uuid('Invalid from user ID format'),
    toUserId: z.string().uuid('Invalid to user ID format'),
    message: z.string().min(1, 'Message is required'),
});

/**
 * Determine message type based on similarity analysis
 */
function determineMessageType(similarity: number, profileMatching: string[]) {
    // Check if interests are the top matching field
    const interestsMatch = profileMatching.includes('interests') && profileMatching.indexOf('interests') <= 2;
    
    // Check if career-related fields are prominent
    const careerMatch = profileMatching.some(field => 
        ['company', 'position', 'experience', 'isHiring'].includes(field)
    ) && profileMatching.indexOf('interests') > 2;

    if (interestsMatch && similarity > 0.4) {
        return 'sports';
    } else if (careerMatch && similarity > 0.3) {
        return 'career';
    } else {
        return 'relationship';
    }
}

/**
 * POST /api/telegram/generate-message
 * Generate a personalized message based on similarity analysis
 */
export async function generateMessage(req: Request, res: Response) {
    try {
        // Validate request body
        const validation = generateMessageSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { fromUserId, toUserId } = validation.data;

        // Get both users from database
        const [fromUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, fromUserId))
            .limit(1);

        const [toUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, toUserId))
            .limit(1);

        if (!fromUser || !toUser) {
            return res.status(404).json({
                success: false,
                error: 'One or both users not found',
            });
        }

        // Check if both users have telegram IDs in their data field
        const fromUserTelegramId = fromUser.data?.telegramId;
        const toUserTelegramId = toUser.data?.telegramId;
        
        if (!fromUserTelegramId || !toUserTelegramId) {
            return res.status(400).json({
                success: false,
                error: 'Both users must have telegram IDs to send messages',
            });
        }

        // Calculate similarity between users
        const similarityResult = await similarityService.calculateSimilarity(fromUserId, toUserId);

        // Determine message type based on similarity
        const messageType = determineMessageType(similarityResult.similarity, similarityResult.profileMatching);

        // Get shared interests for context
        const sharedInterests = Array.isArray(fromUser.interests) && Array.isArray(toUser.interests)
            ? fromUser.interests.filter(interest => toUser.interests.includes(interest))
            : [];

        // Parse resume if it's a career message and resume URL exists
        let resumeContent = '';
        if (messageType === 'career' && toUser.resumeUrl) {
            try {
                const resumeData = await pdfParser.parseResume(toUser.resumeUrl);
                resumeContent = resumeData.summary || resumeData.fullText;
            } catch (error) {
                console.warn('Failed to parse resume, continuing without resume context:', error);
            }
        }

        // Generate personalized message using Claude
        const message = await claudeService.generatePersonalizedMessage(
            {
                firstName: fromUser.firstName || 'there',
                interests: fromUser.interests,
                company: fromUser.company,
                position: fromUser.position,
            },
            {
                firstName: toUser.firstName || 'there',
                interests: toUser.interests,
                company: toUser.company,
                position: toUser.position,
                resumeContent,
            },
            messageType,
            sharedInterests
        );

        // Generate Telegram URL
        const telegramUrl = generateTelegramUrl(message, toUserTelegramId);

        return res.status(200).json({
            success: true,
            data: {
                message,
                messageType,
                similarity: similarityResult.similarity,
                sharedInterests,
                telegramUrl,
                fromUser: {
                    id: fromUser.id,
                    firstName: fromUser.firstName,
                    telegramId: fromUserTelegramId,
                },
                toUser: {
                    id: toUser.id,
                    firstName: toUser.firstName,
                    telegramId: toUserTelegramId,
                },
            },
            message: 'Message generated successfully',
        });
    } catch (error: any) {
        console.error('Error generating message:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate message',
            message: error.message || 'Internal server error',
        });
    }
}

/**
 * POST /api/telegram/send-message
 * Send a message via Telegram (returns URL to open Telegram)
 */
export async function sendTelegramMessage(req: Request, res: Response) {
    try {
        // Validate request body
        const validation = sendTelegramMessageSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { fromUserId, toUserId, message } = validation.data;

        // Get both users from database
        const [fromUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, fromUserId))
            .limit(1);

        const [toUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, toUserId))
            .limit(1);

        if (!fromUser || !toUser) {
            return res.status(404).json({
                success: false,
                error: 'One or both users not found',
            });
        }

        // Check if both users have telegram IDs in their data field
        const fromUserTelegramId = fromUser.data?.telegramId;
        const toUserTelegramId = toUser.data?.telegramId;
        
        if (!fromUserTelegramId || !toUserTelegramId) {
            return res.status(400).json({
                success: false,
                error: 'Both users must have telegram IDs to send messages',
            });
        }

        // Generate Telegram URL
        const telegramUrl = generateTelegramUrl(message, toUserTelegramId);

        return res.status(200).json({
            success: true,
            data: {
                telegramUrl,
                message,
                fromUser: {
                    id: fromUser.id,
                    firstName: fromUser.firstName,
                    telegramId: fromUserTelegramId,
                },
                toUser: {
                    id: toUser.id,
                    firstName: toUser.firstName,
                    telegramId: toUserTelegramId,
                },
            },
            message: 'Telegram URL generated successfully',
        });
    } catch (error: any) {
        console.error('Error sending telegram message:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send telegram message',
            message: error.message || 'Internal server error',
        });
    }
}

/**
 * Generate Telegram URL with prefilled message
 */
function generateTelegramUrl(message: string, telegramId: string) {
    const base = "https://t.me/share/url";
    const params = new URLSearchParams();
    
    // Add the message text
    params.append("text", message);
    
    // Add the telegram user ID as the URL (this will open a direct message)
    params.append("url", `https://t.me/${telegramId}`);
    
    return `${base}?${params.toString()}`;
}

/**
 * GET /api/telegram/user/{userId}/telegram-id
 * Get user's telegram ID
 */
export async function getUserTelegramId(req: Request, res: Response) {
    try {
        const { userId } = req.params;

        const [user] = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                data: users.data,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const telegramId = user.data?.telegramId;
        
        return res.status(200).json({
            success: true,
            data: {
                id: user.id,
                firstName: user.firstName,
                telegramId: telegramId,
            },
            message: 'User telegram ID retrieved successfully',
        });
    } catch (error: any) {
        console.error('Error getting user telegram ID:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get user telegram ID',
            message: error.message || 'Internal server error',
        });
    }
}
