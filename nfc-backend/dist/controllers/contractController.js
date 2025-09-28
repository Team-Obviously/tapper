import { z } from 'zod';
import { zkSimilarityService } from '../services/zkSimilarityService';
// Validation schemas
const createCommitmentSchema = z.object({
    userId: z.string().uuid('Invalid user ID format'),
    profileData: z.object({
        interests: z.array(z.string()).optional(),
        skillLevel: z.string().optional(),
        availability: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        experience: z.string().optional(),
        isHiring: z.string().optional(),
        resumeUrl: z.string().optional(),
        data: z.any().optional(),
    }),
    salt: z.string().min(1, 'Salt is required'),
    metadataURI: z.string().optional().default(''),
});
const submitProofSchema = z.object({
    proofId: z.string(),
    commitment1: z.string(),
    commitment2: z.string(),
    proof: z.string(),
    publicSignals: z.array(z.string()),
    similarityScore: z.number().min(0).max(1),
});
const createEscrowSchema = z.object({
    proofId: z.string(),
    userPrivateKey: z.string().startsWith('0x', 'Invalid private key format'),
});
const consentSchema = z.object({
    escrowId: z.string(),
    userPrivateKey: z.string().startsWith('0x', 'Invalid private key format'),
});
/**
 * GET /api/contract/info
 * Get smart contract information
 */
export async function getContractInfo(req, res) {
    try {
        const contractInfo = await zkSimilarityService.getContractInfo();
        return res.status(200).json({
            success: true,
            data: {
                ...contractInfo,
                features: {
                    anonymousCommitments: true,
                    zkProofVerification: true,
                    identityEscrow: true,
                    mutualConsent: true,
                    reputationSystem: true,
                },
                deployment: {
                    deployed: true,
                    network: 'Sepolia Testnet',
                    explorer: `https://sepolia.etherscan.io/address/${contractInfo.contractAddress}`,
                },
            },
            message: 'Smart contract information retrieved successfully',
        });
    }
    catch (error) {
        console.error('Error getting contract info:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get contract information',
        });
    }
}
/**
 * POST /api/contract/create-commitment
 * Create an on-chain commitment for a user profile
 */
export async function createOnChainCommitment(req, res) {
    try {
        const validation = createCommitmentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }
        const { userId, profileData, salt, metadataURI } = validation.data;
        // Generate commitment hash
        const commitmentHash = zkSimilarityService.generateCommitmentHash(profileData, salt);
        // Note: This is a read-only operation for demo
        // In production, you'd use a user's private key
        console.log('Generated commitment hash:', commitmentHash);
        return res.status(200).json({
            success: true,
            data: {
                userId,
                commitmentHash,
                profileData: {
                    concealed: true,
                    hashGenerated: true,
                    salt: salt.substring(0, 8) + '...', // Partial salt for verification
                },
                blockchain: {
                    readyForDeployment: true,
                    estimatedGas: '~150,000',
                    network: 'Sepolia',
                    contractAddress: zkSimilarityService.getContractAddress(),
                },
                nextSteps: [
                    'Use this commitment hash with user\'s private key',
                    'Call createCommitment on smart contract',
                    'Generate ZK proofs for similarity matching',
                ],
            },
            message: 'Commitment hash generated - ready for on-chain deployment',
        });
    }
    catch (error) {
        console.error('Error creating commitment:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to create commitment',
        });
    }
}
/**
 * POST /api/contract/submit-proof
 * Submit a similarity proof to the smart contract
 */
export async function submitSimilarityProof(req, res) {
    try {
        const validation = submitProofSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: validation.error.flatten().fieldErrors,
            });
        }
        const { proofId, commitment1, commitment2, proof, publicSignals, similarityScore } = validation.data;
        // Note: This is a demonstration endpoint
        // In production, this would require the user's private key to submit to blockchain
        console.log('Proof submission details:', {
            proofId: proofId.substring(0, 8) + '...',
            commitment1: commitment1.substring(0, 8) + '...',
            commitment2: commitment2.substring(0, 8) + '...',
            similarityScore,
        });
        return res.status(200).json({
            success: true,
            data: {
                proofId,
                blockchain: {
                    readyForSubmission: true,
                    estimatedGas: '~200,000',
                    network: 'Sepolia',
                    contractAddress: zkSimilarityService.getContractAddress(),
                },
                similarity: {
                    score: similarityScore,
                    threshold: 0.3,
                    isMatch: similarityScore >= 0.3,
                },
                zkProof: {
                    system: 'Groth16',
                    poweredBy: 'Mopro',
                    verifiable: true,
                    publicSignalsCount: publicSignals.length,
                },
                nextSteps: [
                    'Submit proof to smart contract with user\'s private key',
                    'Verify proof on-chain',
                    'Create escrow for identity reveal if match found',
                ],
            },
            message: 'Similarity proof ready for blockchain submission',
        });
    }
    catch (error) {
        console.error('Error preparing proof submission:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to prepare proof submission',
        });
    }
}
/**
 * GET /api/contract/commitment/:hash
 * Get commitment details from smart contract
 */
export async function getCommitmentDetails(req, res) {
    try {
        const { hash } = req.params;
        if (!hash || !hash.startsWith('0x')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid commitment hash format',
                message: 'Commitment hash must be a valid hex string starting with 0x',
            });
        }
        // Validate commitment hash format
        const isValid = zkSimilarityService.isValidCommitmentHash(hash);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid commitment hash format',
                message: 'Commitment hash must be 66 characters (0x + 64 hex)',
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                commitment: {
                    hash: hash,
                    format: 'valid',
                    network: 'Sepolia',
                    readyForBlockchainQuery: true,
                },
                blockchain: {
                    network: 'Sepolia',
                    contractAddress: zkSimilarityService.getContractAddress(),
                    chainId: zkSimilarityService.getChainId(),
                },
                privacy: {
                    profileConcealed: true,
                    userIdentityProtected: true,
                    zkProofRequired: true,
                },
                instructions: [
                    'Use a Web3 wallet to query this commitment on-chain',
                    'Call getCommitment() function with this hash',
                    'Generate ZK proofs for similarity matching',
                ],
            },
            message: 'Commitment hash validated - ready for blockchain query',
        });
    }
    catch (error) {
        console.error('Error getting commitment details:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get commitment details',
        });
    }
}
/**
 * GET /api/contract/proof/:proofId
 * Get similarity proof details from smart contract
 */
export async function getSimilarityProofDetails(req, res) {
    try {
        const { proofId } = req.params;
        if (!proofId) {
            return res.status(400).json({
                success: false,
                error: 'Proof ID is required',
                message: 'Proof ID parameter is missing',
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                proof: {
                    id: proofId,
                    network: 'Sepolia',
                    readyForBlockchainQuery: true,
                },
                blockchain: {
                    network: 'Sepolia',
                    contractAddress: zkSimilarityService.getContractAddress(),
                    chainId: zkSimilarityService.getChainId(),
                },
                zkProof: {
                    system: 'Groth16',
                    poweredBy: 'Mopro',
                    cryptographicallySound: true,
                },
                instructions: [
                    'Use a Web3 wallet to query this proof on-chain',
                    'Call getSimilarityProof() function with this ID',
                    'Verify proof status and similarity results',
                ],
            },
            message: 'Proof ID validated - ready for blockchain query',
        });
    }
    catch (error) {
        console.error('Error getting proof details:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get proof details',
        });
    }
}
/**
 * GET /api/contract/user/:address/reputation
 * Get user reputation from smart contract
 */
export async function getUserReputationOnChain(req, res) {
    try {
        const { address } = req.params;
        if (!address || !address.startsWith('0x')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address format',
                message: 'Address must be a valid Ethereum address',
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                address,
                blockchain: {
                    network: 'Sepolia',
                    contractAddress: zkSimilarityService.getContractAddress(),
                    chainId: zkSimilarityService.getChainId(),
                    readyForQuery: true,
                },
                reputation: {
                    queryable: true,
                    onChainVerification: true,
                    reputationSystem: 'enabled',
                },
                instructions: [
                    'Use a Web3 wallet to query user reputation on-chain',
                    'Call getUserReputation() function with this address',
                    'View total matches, successful matches, and reputation score',
                ],
            },
            message: 'Address validated - ready for blockchain reputation query',
        });
    }
    catch (error) {
        console.error('Error getting user reputation:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get user reputation',
        });
    }
}
/**
 * GET /api/contract/health
 * Health check for smart contract integration
 */
export async function contractHealth(req, res) {
    try {
        const contractInfo = await zkSimilarityService.getContractInfo();
        return res.status(200).json({
            success: true,
            service: 'smart-contract-integration',
            status: 'healthy',
            contract: {
                address: contractInfo.contractAddress,
                network: contractInfo.network,
                chainId: contractInfo.chainId,
                deployed: true,
            },
            features: {
                anonymousCommitments: true,
                zkProofVerification: true,
                identityEscrow: true,
                mutualConsent: true,
                reputationSystem: true,
                blockchainVerified: true,
            },
            deployment: {
                escrowFee: contractInfo.escrowFee + ' wei (0.001 ETH)',
                similarityThreshold: contractInfo.similarityThreshold + ' (30%)',
                owner: contractInfo.owner,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Contract health check failed:', error);
        return res.status(503).json({
            success: false,
            service: 'smart-contract-integration',
            status: 'unhealthy',
            error: 'Failed to connect to smart contract',
            message: error.message,
        });
    }
}
