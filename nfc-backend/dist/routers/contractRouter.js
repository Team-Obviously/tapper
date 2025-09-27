import { Router } from 'express';
import { getContractInfo, createOnChainCommitment, submitSimilarityProof, getCommitmentDetails, getSimilarityProofDetails, getUserReputationOnChain, contractHealth, } from '../controllers/contractController';
export const contractRouter = Router();
// Health check endpoint
contractRouter.get('/health', contractHealth);
// Get smart contract information
// GET /api/contract/info
contractRouter.get('/info', getContractInfo);
// Create commitment (generates hash for on-chain deployment)
// POST /api/contract/create-commitment
contractRouter.post('/create-commitment', createOnChainCommitment);
// Submit similarity proof to smart contract
// POST /api/contract/submit-proof
contractRouter.post('/submit-proof', submitSimilarityProof);
// Get commitment details from smart contract
// GET /api/contract/commitment/:hash
contractRouter.get('/commitment/:hash', getCommitmentDetails);
// Get similarity proof details from smart contract
// GET /api/contract/proof/:proofId
contractRouter.get('/proof/:proofId', getSimilarityProofDetails);
// Get user reputation from smart contract
// GET /api/contract/user/:address/reputation
contractRouter.get('/user/:address/reputation', getUserReputationOnChain);
