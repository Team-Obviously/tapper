import { Router } from 'express';
import {
    createAnonymousProfile,
    generateSimilarityProof,
    verifyZkProof,
    getAnonymousMatches,
    initiateIdentityReveal,
    zkSimilarityHealth,
} from '../controllers/zkSimilarityController';

export const zkSimilarityRouter = Router();

// Health check endpoint
zkSimilarityRouter.get('/health', zkSimilarityHealth);

// Create anonymous profile and find matches
// POST /api/zk-similarity/create-anonymous-profile
zkSimilarityRouter.post('/create-anonymous-profile', createAnonymousProfile);

// Generate ZK proof of similarity between two commitments
// POST /api/zk-similarity/generate-proof
zkSimilarityRouter.post('/generate-proof', generateSimilarityProof);

// Verify a ZK similarity proof
// POST /api/zk-similarity/verify-proof
zkSimilarityRouter.post('/verify-proof', verifyZkProof);

// Get anonymous matches for a commitment
// GET /api/zk-similarity/anonymous-matches/:commitmentId
zkSimilarityRouter.get('/anonymous-matches/:commitmentId', getAnonymousMatches);

// Initiate identity reveal process (requires mutual consent)
// POST /api/zk-similarity/reveal-identity
zkSimilarityRouter.post('/reveal-identity', initiateIdentityReveal);

