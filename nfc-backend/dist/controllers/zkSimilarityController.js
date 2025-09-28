import { z } from 'zod';
import { zkSimilarityService } from '../services/zkSimilarityService';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
// Validation schemas
const createAnonymousProfileSchema = z.object({
    userId: z.string().uuid('Invalid user ID format'),
    minSimilarity: z.coerce.number().min(0).max(1).optional().default(0.3),
});
const generateProofSchema = z.object({
    commitmentId1: z.string().uuid('Invalid commitment ID 1 format'),
    commitmentId2: z.string().uuid('Invalid commitment ID 2 format'),
    similarityThreshold: z.coerce.number().min(0).max(1).optional().default(0.3),
});
const verifyProofSchema = z.object({
    proof: z.string(),
    public_signals: z.array(z.string()),
    threshold: z.number().min(0).max(1).optional().default(0.3),
});
/**
 * POST /api/zk-similarity/create-anonymous-profile
 * Creates an anonymous commitment and finds potential matches
 */
export async function createAnonymousProfile(req, res) {
    try {
        const validation = createAnonymousProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }
        const { userId, minSimilarity } = validation.data;
        // Fetch user profile from database
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
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: `User with ID ${userId} not found`,
            });
        }
        // Convert to profile format
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
        // Create anonymous profile and find matches
        const result = await zkSimilarityService.createAnonymousProfile(profile, minSimilarity);
        return res.status(200).json({
            success: true,
            data: {
                userId,
                commitment: result.commitment,
                potentialMatches: result.matches,
                matchCount: result.matches.length,
                minSimilarity,
                privacy: {
                    anonymityLevel: 'full',
                    identityRevealed: false,
                    zkProofRequired: true,
                },
            },
            message: 'Anonymous profile created successfully with ZK privacy',
        });
    }
    catch (error) {
        console.error('Error creating anonymous profile:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to create anonymous profile',
        });
    }
}
/**
 * POST /api/zk-similarity/generate-proof
 * Generates a ZK proof of similarity between two commitments
 */
export async function generateSimilarityProof(req, res) {
    try {
        const validation = generateProofSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }
        const { commitmentId1, commitmentId2, similarityThreshold } = validation.data;
        // Generate ZK proof using Mopro
        const proofResult = await zkSimilarityService.generateSimilarityProof(commitmentId1, commitmentId2, similarityThreshold);
        return res.status(200).json({
            success: true,
            data: {
                proofId: proofResult.proofId,
                zkProof: {
                    proof: proofResult.proof,
                    publicSignals: proofResult.publicSignals,
                },
                similarity: {
                    score: proofResult.similarityScore,
                    isMatch: proofResult.isMatch,
                    threshold: similarityThreshold,
                },
                privacy: {
                    identitiesConcealed: true,
                    moproPowered: true,
                    verifiable: true,
                },
                nextSteps: proofResult.isMatch ? [
                    'Both parties can verify the proof',
                    'Mutual consent required for identity reveal',
                    'Smart contract can handle escrow/reveal process'
                ] : [
                    'Similarity below threshold',
                    'No further action required',
                    'Identities remain private'
                ],
            },
            message: proofResult.isMatch
                ? 'ZK proof generated - Users are compatible!'
                : 'ZK proof generated - Similarity below threshold',
        });
    }
    catch (error) {
        console.error('Error generating ZK proof:', error);
        // Handle specific error cases
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'Commitment not found',
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to generate ZK similarity proof',
        });
    }
}
/**
 * POST /api/zk-similarity/verify-proof
 * Verifies a ZK similarity proof
 */
export async function verifyZkProof(req, res) {
    try {
        const validation = verifyProofSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid proof format',
                details: validation.error.flatten().fieldErrors,
            });
        }
        const { proof, public_signals, threshold } = validation.data;
        // Verify the ZK proof
        const isValid = await zkSimilarityService.verifyProof({
            proof,
            publicSignals: public_signals,
            threshold,
        });
        return res.status(200).json({
            success: true,
            data: {
                valid: isValid,
                verifiedAt: new Date().toISOString(),
                proofSystem: 'Groth16',
                poweredBy: 'Mopro',
                verificationDetails: {
                    cryptographicallySound: isValid,
                    zeroKnowledgeProperty: true,
                    succinctness: true,
                },
            },
            message: isValid
                ? 'ZK proof is valid - Similarity claim verified!'
                : 'ZK proof is invalid - Verification failed',
        });
    }
    catch (error) {
        console.error('Error verifying ZK proof:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to verify ZK proof',
        });
    }
}
/**
 * GET /api/zk-similarity/anonymous-matches/:commitmentId
 * Get anonymous matches for a commitment
 */
export async function getAnonymousMatches(req, res) {
    try {
        const { commitmentId } = req.params;
        if (!commitmentId) {
            return res.status(400).json({
                success: false,
                error: 'Commitment ID is required',
                message: 'Commitment ID parameter is missing from the URL',
            });
        }
        const minSimilarity = parseFloat(req.query.minSimilarity || '0.3');
        // Find anonymous matches
        const matches = await zkSimilarityService.findAnonymousMatches(commitmentId, minSimilarity);
        return res.status(200).json({
            success: true,
            data: {
                commitmentId,
                anonymousMatches: matches,
                matchCount: matches.length,
                minSimilarity,
                privacy: {
                    identitiesConcealed: true,
                    requiresMutualConsent: true,
                    zkProofAvailable: true,
                },
            },
            message: `Found ${matches.length} anonymous matches`,
        });
    }
    catch (error) {
        console.error('Error getting anonymous matches:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get anonymous matches',
        });
    }
}
/**
 * POST /api/zk-similarity/reveal-identity
 * Initiate identity reveal process (requires mutual consent)
 */
export async function initiateIdentityReveal(req, res) {
    try {
        const { proofId, userConsent } = req.body;
        if (!proofId || !userConsent) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Proof ID and user consent are required',
            });
        }
        // Initiate identity reveal process
        const result = await zkSimilarityService.revealIdentities(proofId);
        return res.status(200).json({
            success: true,
            data: {
                proofId,
                revealStatus: 'initiated',
                requiresMutualConsent: true,
                nextSteps: [
                    'Waiting for mutual consent from both parties',
                    'Smart contract will handle the reveal process',
                    'Identities will be revealed only after both parties agree',
                ],
                smartContractIntegration: {
                    enabled: true,
                    escrowProtection: true,
                    atomicReveal: true,
                },
            },
            message: result.message,
        });
    }
    catch (error) {
        console.error('Error initiating identity reveal:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to initiate identity reveal',
        });
    }
}
/**
 * GET /api/zk-similarity/health
 * Health check for ZK similarity service
 */
export async function zkSimilarityHealth(req, res) {
    try {
        const isHealthy = await zkSimilarityService.healthCheck();
        return res.status(isHealthy ? 200 : 503).json({
            success: isHealthy,
            service: 'zk-similarity-service',
            status: isHealthy ? 'healthy' : 'unhealthy',
            features: {
                moproIntegration: true,
                zeroKnowledgeProofs: true,
                anonymousMatching: true,
                smartContractReady: true,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('ZK similarity health check failed:', error);
        return res.status(503).json({
            success: false,
            service: 'zk-similarity-service',
            status: 'unhealthy',
            error: 'Health check failed',
        });
    }
}
