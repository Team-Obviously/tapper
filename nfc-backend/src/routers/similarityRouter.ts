import { Router } from 'express';
import { getSimilarity, getSimilarUsers, getInterestConnections, similarityHealth } from '../controllers/similarityController';

export const similarityRouter = Router();

// Health check endpoint
similarityRouter.get('/health', similarityHealth);

// Get similarity between two users
// GET /api/similarity/get-similarity?userId1=uuid&userId2=uuid
similarityRouter.get('/get-similarity', getSimilarity);

// Get similar users for a specific user
// GET /api/similarity/similar-users/:userId?minSimilarity=0.3&limit=10
similarityRouter.get('/similar-users/:userId', getSimilarUsers);

// Get interest-based connections for a specific user
// GET /api/similarity/interest-connections/:userId
similarityRouter.get('/interest-connections/:userId', getInterestConnections);
