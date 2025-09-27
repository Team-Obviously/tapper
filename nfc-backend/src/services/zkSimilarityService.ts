import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import { createHash } from 'crypto';

// --- Configuration ---
const CONTRACT_ADDRESS = "0x99C8CA6842C20F5428c8C17e6c79634e8dA539D8"; // Deployed contract address
const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com"; // Sepolia RPC URL
const CHAIN_ID = 11155111; // Sepolia Chain ID

// ABI for ZKSimilarityMatcher (simplified for essential functions)
const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function escrowFee() view returns (uint256)",
    "function SIMILARITY_THRESHOLD() view returns (uint256)",
    "function createCommitment(bytes32 _commitmentHash, string memory _metadataURI) returns (bool)",
    "function getCommitment(bytes32 _commitmentHash) view returns (bytes32 commitmentHash, address owner, string metadataURI, uint256 createdAt, uint256 expiresAt, bool isActive)",
    "function submitSimilarityProof(bytes32 _proofId, bytes32 _commitmentHash1, bytes32 _commitmentHash2, bytes memory _proof, uint256[] memory _publicSignals, uint256 _similarityScore) returns (bool)",
    "function verifySimilarityProof(bytes32 _proofId) view returns (bool)",
    "function createIdentityEscrow(bytes32 _proofId) payable returns (bytes32)",
    "function consentToReveal(bytes32 _escrowId) payable returns (bool)",
    "function getEscrow(bytes32 _escrowId) view returns (bytes32 escrowId, bytes32 proofId, address party1, address party2, uint256 createdAt, uint256 expiresAt, bool party1Consented, bool party2Consented, bool identitiesRevealed, uint256 feeAmount)",
    "function getUserReputation(address _userAddress) view returns (uint256)",
    "function getUserCommitments(address _userAddress) view returns (bytes32[] memory)",
    "event CommitmentCreated(bytes32 indexed commitmentHash, address indexed owner, string metadataURI, uint256 timestamp)",
    "event SimilarityProofSubmitted(bytes32 indexed proofId, bytes32 indexed commitmentHash1, bytes32 indexed commitmentHash2, address prover, uint256 similarityScore, uint256 timestamp)",
    "event EscrowCreated(bytes32 indexed escrowId, bytes32 indexed proofId, address indexed creator, uint256 feeAmount, uint256 timestamp)",
    "event IdentitiesRevealed(bytes32 indexed escrowId, address indexed party1, address indexed party2, uint256 timestamp)",
];

// Define types for contract data
export interface CommitmentData {
    commitmentHash: string;
    owner: string;
    metadataURI: string;
    createdAt: bigint;
    expiresAt: bigint;
    isActive: boolean;
}

export interface SimilarityProofData {
    proofId: string;
    commitmentHash1: string;
    commitmentHash2: string;
    prover: string;
    similarityScore: bigint;
    createdAt: bigint;
    isVerified: boolean;
    isActive: boolean;
}

export interface IdentityEscrowData {
    escrowId: string;
    proofId: string;
    party1: string;
    party2: string;
    createdAt: bigint;
    expiresAt: bigint;
    party1Consented: boolean;
    party2Consented: boolean;
    identitiesRevealed: boolean;
    feeAmount: bigint;
}

export interface UserReputationData {
    totalMatches: bigint;
    successfulMatches: bigint;
    reputationScore: bigint;
    lastUpdated: bigint;
}

export interface ZKSimilarityProof {
    proof: string;
    publicSignals: string[];
    similarityScore: number;
    isMatch: boolean;
    commitmentHash1: string;
    commitmentHash2: string;
    proofId: string;
}

class ZKSimilarityService {
    private provider: JsonRpcProvider;
    private contract: Contract;
    private signer?: Wallet;

    constructor(privateKey?: string) {
        this.provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
        this.contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);

        if (privateKey) {
            this.signer = new Wallet(privateKey, this.provider);
            this.contract = this.contract.connect(this.signer) as Contract;
        }
    }

    /**
     * Create an anonymous profile commitment
     */
    async createAnonymousProfile(profile: any, minSimilarity: number): Promise<any> {
        const salt = Math.random().toString(36).substring(2, 15);
        const commitmentHash = this.generateCommitmentHash(profile, salt);
        
        return {
            commitmentHash,
            salt,
            profile: {
                concealed: true,
                hashGenerated: true,
            },
            blockchain: {
                readyForDeployment: true,
                estimatedGas: '~150,000',
                network: 'Sepolia',
                contractAddress: this.getContractAddress(),
            },
        };
    }

    /**
     * Generate a similarity proof between two profiles
     */
    async generateSimilarityProof(profile1: any, profile2: any, threshold: number): Promise<ZKSimilarityProof> {
        // Calculate similarity score using the same logic as user-similarity.ts
        const similarityScore = this.calculateSimilarityScore(profile1, profile2);
        const isMatch = similarityScore >= threshold;

        // Generate commitment hashes
        const salt1 = Math.random().toString(36).substring(2, 15);
        const salt2 = Math.random().toString(36).substring(2, 15);
        const commitmentHash1 = this.generateCommitmentHash(profile1, salt1);
        const commitmentHash2 = this.generateCommitmentHash(profile2, salt2);

        // Generate proof ID
        const proofId = '0x' + createHash('sha256')
            .update(commitmentHash1 + commitmentHash2 + Date.now().toString())
            .digest('hex');

        // Mock ZK proof (in production, this would be a real ZK proof)
        const proof = '0x' + createHash('sha256')
            .update(JSON.stringify({ profile1, profile2, similarityScore, threshold }))
            .digest('hex');

        const publicSignals = [
            similarityScore.toString(),
            threshold.toString(),
            isMatch.toString(),
        ];

        return {
            proof,
            publicSignals,
            similarityScore,
            isMatch,
            commitmentHash1,
            commitmentHash2,
            proofId,
        };
    }

    /**
     * Verify a similarity proof
     */
    async verifyProof(proofData: { proof: string; publicSignals: string[]; threshold: number }): Promise<boolean> {
        const { proof, publicSignals, threshold } = proofData;
        
        if (publicSignals.length < 3) {
            return false;
        }

        const similarityScore = parseFloat(publicSignals[0] || '0');
        const proofThreshold = parseFloat(publicSignals[1] || '0');
        const isMatch = publicSignals[2] === 'true';

        // Validate that the proof is consistent
        const expectedMatch = similarityScore >= threshold;
        if (isMatch !== expectedMatch) {
            return false;
        }

        if (proofThreshold !== threshold) {
            return false;
        }

        // Validate proof format (basic check)
        if (!proof.startsWith('0x')) {
            return false;
        }

        return true;
    }

    /**
     * Find anonymous matches for a user
     */
    async findAnonymousMatches(userId: string, threshold: number): Promise<any[]> {
        // This would typically query a database of anonymous commitments
        // For now, return mock data
        return [
            {
                commitmentHash: '0x' + createHash('sha256').update(userId + '1').digest('hex'),
                similarityScore: 0.75,
                isMatch: true,
                profile: {
                    concealed: true,
                    interests: ['Football', 'Running'],
                    skillLevel: 'Expert',
                },
            },
            {
                commitmentHash: '0x' + createHash('sha256').update(userId + '2').digest('hex'),
                similarityScore: 0.65,
                isMatch: true,
                profile: {
                    concealed: true,
                    interests: ['Basketball', 'Swimming'],
                    skillLevel: 'Intermediate',
                },
            },
        ];
    }

    /**
     * Reveal identities after mutual consent
     */
    async revealIdentities(proofId: string): Promise<any> {
        // This would typically query the smart contract for escrow details
        // For now, return mock data
        return {
            proofId,
            identitiesRevealed: true,
            party1: '0x1234567890123456789012345678901234567890',
            party2: '0x0987654321098765432109876543210987654321',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Health check for the ZK similarity service
     */
    async healthCheck(): Promise<boolean> {
        try {
            if (this.contract) {
                await (this.contract as any).owner();
            }
            return true;
        } catch (error) {
            console.error('ZK Similarity Service health check failed:', error);
            return false;
        }
    }

    /**
     * Calculate similarity score between two profiles
     * Uses the same logic as user-similarity.ts
     */
    private calculateSimilarityScore(profile1: any, profile2: any): number {
        let totalScore = 0;
        const weights = {
            interests: 0.40,
            skillLevel: 0.20,
            availability: 0.15,
            company: 0.05,
            position: 0.05,
            experience: 0.05,
            isHiring: 0.05,
            resumeUrl: 0.00,
            data: 0.05,
        };

        // Interests similarity (Jaccard)
        const interests1 = profile1.interests || [];
        const interests2 = profile2.interests || [];
        const interestsSim = this.jaccardSimilarity(interests1, interests2);
        totalScore += interestsSim * weights.interests;

        // Other fields (exact match)
        const fields = ['skillLevel', 'availability', 'company', 'position', 'experience', 'isHiring'];
        for (const field of fields) {
            const sim = this.textSimilarity(profile1[field], profile2[field]);
            totalScore += sim * weights[field as keyof typeof weights];
        }

        return totalScore;
    }

    private jaccardSimilarity(arr1: string[], arr2: string[]): number {
        if (arr1.length === 0 && arr2.length === 0) return 1.0;
        if (arr1.length === 0 || arr2.length === 0) return 0.0;

        const set1 = new Set(arr1.map(item => item.toLowerCase().trim()));
        const set2 = new Set(arr2.map(item => item.toLowerCase().trim()));

        let intersectionSize = 0;
        for (const item of set1) {
            if (set2.has(item)) {
                intersectionSize++;
            }
        }

        const unionSize = set1.size + set2.size - intersectionSize;
        return unionSize > 0 ? intersectionSize / unionSize : 0;
    }

    private textSimilarity(text1: string | null, text2: string | null): number {
        const t1 = (text1 || '').trim().toLowerCase();
        const t2 = (text2 || '').trim().toLowerCase();
        
        if (!t1 && !t2) return 1.0;
        if (!t1 || !t2) return 0.0;
        return t1 === t2 ? 1.0 : 0.0;
    }

    /**
     * Get contract information
     */
    async getContractInfo() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            const contract = this.contract as any;
            const [escrowFee, similarityThreshold, owner] = await Promise.all([
                contract.escrowFee(),
                contract.SIMILARITY_THRESHOLD(),
                contract.owner(),
            ]);

            return {
                contractAddress: CONTRACT_ADDRESS,
                network: "Sepolia",
                chainId: CHAIN_ID,
                rpcUrl: SEPOLIA_RPC_URL,
                escrowFee: escrowFee.toString(),
                similarityThreshold: similarityThreshold.toString(),
                owner: owner,
                features: {
                    anonymousCommitments: true,
                    zkProofVerification: true,
                    identityEscrow: true,
                    mutualConsent: true,
                    reputationSystem: true,
                },
                deployment: {
                    deployed: true,
                    network: "Sepolia Testnet",
                    explorer: `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
                },
            };
        } catch (error) {
            console.error('Error getting contract info:', error);
            return {
                contractAddress: CONTRACT_ADDRESS,
                network: "Sepolia",
                chainId: CHAIN_ID,
                rpcUrl: SEPOLIA_RPC_URL,
                escrowFee: "1000000000000000", // 0.001 ETH in wei
                similarityThreshold: "3000", // 30% in basis points
                owner: "0x0000000000000000000000000000000000000000",
                features: {
                    anonymousCommitments: true,
                    zkProofVerification: true,
                    identityEscrow: true,
                    mutualConsent: true,
                    reputationSystem: true,
                },
                deployment: {
                    deployed: false,
                    network: "Sepolia Testnet",
                    explorer: `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
                    error: "Contract not accessible",
                },
            };
        }
    }

    /**
     * Generates a cryptographic hash for a user's profile data and salt.
     * This hash serves as the anonymous commitment.
     * @param profileData - The user's profile data (e.g., interests, skillLevel)
     * @param salt - A random salt for privacy
     * @returns A hex string of the commitment hash
     */
    generateCommitmentHash(profileData: any, salt: string): string {
        const dataString = JSON.stringify(profileData) + salt;
        return '0x' + createHash('sha256').update(dataString).digest('hex');
    }

    /**
     * Checks if a given string is a valid commitment hash format (0x + 64 hex chars).
     * @param hash The string to validate.
     * @returns True if valid, false otherwise.
     */
    isValidCommitmentHash(hash: string): boolean {
        return /^0x[0-9a-fA-F]{64}$/.test(hash);
    }

    // --- Getters for contract constants ---
    getContractAddress(): string {
        return CONTRACT_ADDRESS;
    }

    getChainId(): number {
        return CHAIN_ID;
    }
}

// Export singleton instance (read-only)
export const zkSimilarityService = new ZKSimilarityService();

// Export class for creating instances with private keys
export { ZKSimilarityService };