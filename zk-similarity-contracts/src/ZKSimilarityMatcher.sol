// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ZKSimilarityMatcher
 * @dev Smart contract for managing ZK-powered anonymous user similarity matching
 * 
 * Features:
 * - Anonymous commitment storage
 * - ZK proof verification for similarity claims
 * - Escrow mechanism for identity reveals
 * - Atomic mutual consent process
 * - Reputation system for verified matches
 */
contract ZKSimilarityMatcher is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event CommitmentCreated(bytes32 indexed commitmentHash, address indexed user, uint256 timestamp);
    event SimilarityProofSubmitted(bytes32 indexed proofId, bytes32 commitment1, bytes32 commitment2, bool isMatch);
    event ProofVerified(bytes32 indexed proofId, bool isValid);
    event EscrowCreated(bytes32 indexed escrowId, bytes32 proofId, uint256 amount);
    event IdentityRevealed(bytes32 indexed escrowId, address user1, address user2);
    event ReputationUpdated(address indexed user, uint256 newScore);

    // Structs
    struct Commitment {
        bytes32 commitmentHash;
        address user;
        uint256 timestamp;
        bool isActive;
        string metadataURI; // IPFS hash for additional data
    }

    struct SimilarityProof {
        bytes32 proofId;
        bytes32 commitment1;
        bytes32 commitment2;
        bytes proof; // Groth16 proof data
        uint256[] publicSignals;
        bool isVerified;
        bool isMatch;
        uint256 similarityScore; // Scaled by 10000 for precision
        uint256 timestamp;
    }

    struct EscrowData {
        bytes32 escrowId;
        bytes32 proofId;
        address user1;
        address user2;
        uint256 amount;
        bool user1Consented;
        bool user2Consented;
        bool isRevealed;
        uint256 createdAt;
        uint256 expiresAt;
    }

    struct UserReputation {
        uint256 totalMatches;
        uint256 successfulMatches;
        uint256 reputationScore; // 0-10000 scale
        uint256 lastUpdated;
    }

    // State variables
    mapping(bytes32 => Commitment) public commitments;
    mapping(bytes32 => SimilarityProof) public similarityProofs;
    mapping(bytes32 => EscrowData) public escrows;
    mapping(address => UserReputation) public userReputations;
    mapping(address => bytes32[]) public userCommitments;
    mapping(bytes32 => address) public commitmentToUser;

    // Configuration
    uint256 public constant SIMILARITY_THRESHOLD = 3000; // 30% scaled by 10000
    uint256 public constant ESCROW_TIMEOUT = 24 hours;
    uint256 public constant COMMITMENT_VALIDITY = 7 days;
    uint256 public escrowFee = 0.001 ether; // Fee for escrow service
    
    // Proof verification (simplified - in production use actual ZK verifier)
    bool public constant MOCK_VERIFICATION = true;

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Create an anonymous commitment to a user profile
     * @param _commitmentHash Hash of the user's profile + salt
     * @param _metadataURI IPFS URI for additional metadata
     */
    function createCommitment(bytes32 _commitmentHash, string memory _metadataURI) 
        external 
        whenNotPaused 
    {
        require(_commitmentHash != bytes32(0), "Invalid commitment hash");
        require(commitments[_commitmentHash].timestamp == 0, "Commitment already exists");

        commitments[_commitmentHash] = Commitment({
            commitmentHash: _commitmentHash,
            user: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            metadataURI: _metadataURI
        });

        userCommitments[msg.sender].push(_commitmentHash);
        commitmentToUser[_commitmentHash] = msg.sender;

        emit CommitmentCreated(_commitmentHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Submit a ZK proof of similarity between two commitments
     * @param _proofId Unique identifier for this proof
     * @param _commitment1 First user's commitment hash
     * @param _commitment2 Second user's commitment hash
     * @param _proof Groth16 proof data
     * @param _publicSignals Public signals for the proof
     * @param _similarityScore Claimed similarity score (scaled by 10000)
     */
    function submitSimilarityProof(
        bytes32 _proofId,
        bytes32 _commitment1,
        bytes32 _commitment2,
        bytes memory _proof,
        uint256[] memory _publicSignals,
        uint256 _similarityScore
    ) external whenNotPaused {
        require(_proofId != bytes32(0), "Invalid proof ID");
        require(similarityProofs[_proofId].timestamp == 0, "Proof already exists");
        require(commitments[_commitment1].isActive, "Commitment 1 not active");
        require(commitments[_commitment2].isActive, "Commitment 2 not active");
        require(_commitment1 != _commitment2, "Cannot compare same commitment");

        // Verify the user owns one of the commitments
        require(
            commitmentToUser[_commitment1] == msg.sender || 
            commitmentToUser[_commitment2] == msg.sender,
            "User must own one of the commitments"
        );

        bool isMatch = _similarityScore >= SIMILARITY_THRESHOLD;

        similarityProofs[_proofId] = SimilarityProof({
            proofId: _proofId,
            commitment1: _commitment1,
            commitment2: _commitment2,
            proof: _proof,
            publicSignals: _publicSignals,
            isVerified: false,
            isMatch: isMatch,
            similarityScore: _similarityScore,
            timestamp: block.timestamp
        });

        emit SimilarityProofSubmitted(_proofId, _commitment1, _commitment2, isMatch);
    }

    /**
     * @dev Verify a submitted ZK proof (simplified for demo)
     * @param _proofId ID of the proof to verify
     */
    function verifySimilarityProof(bytes32 _proofId) external {
        require(similarityProofs[_proofId].timestamp != 0, "Proof does not exist");
        require(!similarityProofs[_proofId].isVerified, "Proof already verified");

        // In production, this would call the actual ZK verifier contract
        // For demo purposes, we'll use a simplified verification
        bool isValid = MOCK_VERIFICATION ? true : _verifyGroth16Proof(
            similarityProofs[_proofId].proof,
            similarityProofs[_proofId].publicSignals
        );

        similarityProofs[_proofId].isVerified = isValid;

        emit ProofVerified(_proofId, isValid);
    }

    /**
     * @dev Create an escrow for identity reveal with mutual consent
     * @param _proofId ID of the verified similarity proof
     */
    function createIdentityEscrow(bytes32 _proofId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value >= escrowFee, "Insufficient escrow fee");
        require(similarityProofs[_proofId].isVerified, "Proof not verified");
        require(similarityProofs[_proofId].isMatch, "Similarity below threshold");

        SimilarityProof memory proof = similarityProofs[_proofId];
        address user1 = commitmentToUser[proof.commitment1];
        address user2 = commitmentToUser[proof.commitment2];

        require(user1 != address(0) && user2 != address(0), "Invalid users");
        require(msg.sender == user1 || msg.sender == user2, "Unauthorized");

        bytes32 escrowId = keccak256(abi.encodePacked(_proofId, block.timestamp));

        escrows[escrowId] = EscrowData({
            escrowId: escrowId,
            proofId: _proofId,
            user1: user1,
            user2: user2,
            amount: msg.value,
            user1Consented: msg.sender == user1,
            user2Consented: msg.sender == user2,
            isRevealed: false,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + ESCROW_TIMEOUT
        });

        emit EscrowCreated(escrowId, _proofId, msg.value);
    }

    /**
     * @dev Provide consent for identity reveal
     * @param _escrowId ID of the escrow
     */
    function consentToReveal(bytes32 _escrowId) external whenNotPaused {
        EscrowData storage escrow = escrows[_escrowId];
        require(escrow.createdAt != 0, "Escrow does not exist");
        require(!escrow.isRevealed, "Already revealed");
        require(block.timestamp <= escrow.expiresAt, "Escrow expired");
        require(msg.sender == escrow.user1 || msg.sender == escrow.user2, "Unauthorized");

        if (msg.sender == escrow.user1) {
            escrow.user1Consented = true;
        } else {
            escrow.user2Consented = true;
        }

        // If both users consented, reveal identities
        if (escrow.user1Consented && escrow.user2Consented) {
            _revealIdentities(_escrowId);
        }
    }

    /**
     * @dev Internal function to reveal identities after mutual consent
     * @param _escrowId ID of the escrow
     */
    function _revealIdentities(bytes32 _escrowId) internal {
        EscrowData storage escrow = escrows[_escrowId];
        escrow.isRevealed = true;

        // Update user reputations
        _updateReputation(escrow.user1, true);
        _updateReputation(escrow.user2, true);

        // Return escrow funds (minus fee)
        uint256 refundAmount = escrow.amount - escrowFee;
        if (refundAmount > 0) {
            payable(escrow.user1).transfer(refundAmount / 2);
            payable(escrow.user2).transfer(refundAmount / 2);
        }

        emit IdentityRevealed(_escrowId, escrow.user1, escrow.user2);
    }

    /**
     * @dev Update user reputation after a match
     * @param _user User address
     * @param _successful Whether the match was successful
     */
    function _updateReputation(address _user, bool _successful) internal {
        UserReputation storage reputation = userReputations[_user];
        reputation.totalMatches += 1;
        
        if (_successful) {
            reputation.successfulMatches += 1;
        }

        // Calculate reputation score (0-10000 scale)
        reputation.reputationScore = (reputation.successfulMatches * 10000) / reputation.totalMatches;
        reputation.lastUpdated = block.timestamp;

        emit ReputationUpdated(_user, reputation.reputationScore);
    }

    /**
     * @dev Claim refund if escrow expires without mutual consent
     * @param _escrowId ID of the escrow
     */
    function claimExpiredEscrow(bytes32 _escrowId) external nonReentrant {
        EscrowData storage escrow = escrows[_escrowId];
        require(escrow.createdAt != 0, "Escrow does not exist");
        require(!escrow.isRevealed, "Already revealed");
        require(block.timestamp > escrow.expiresAt, "Escrow not expired");
        require(msg.sender == escrow.user1 || msg.sender == escrow.user2, "Unauthorized");

        // Mark as expired and refund minus fee
        escrow.isRevealed = true;
        uint256 refundAmount = escrow.amount - escrowFee;
        
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
    }

    /**
     * @dev Simplified ZK proof verification (placeholder)
     * In production, this would integrate with the actual Groth16 verifier
     */
    function _verifyGroth16Proof(
        bytes memory _proof,
        uint256[] memory _publicSignals
    ) internal pure returns (bool) {
        // Placeholder for actual ZK verification
        // In production, this would call the Groth16 verifier contract
        return _proof.length > 0 && _publicSignals.length > 0;
    }

    // View functions
    function getCommitment(bytes32 _commitmentHash) external view returns (Commitment memory) {
        return commitments[_commitmentHash];
    }

    function getSimilarityProof(bytes32 _proofId) external view returns (SimilarityProof memory) {
        return similarityProofs[_proofId];
    }

    function getEscrow(bytes32 _escrowId) external view returns (EscrowData memory) {
        return escrows[_escrowId];
    }

    function getUserReputation(address _user) external view returns (UserReputation memory) {
        return userReputations[_user];
    }

    function getUserCommitments(address _user) external view returns (bytes32[] memory) {
        return userCommitments[_user];
    }

    // Owner functions
    function setEscrowFee(uint256 _fee) external onlyOwner {
        escrowFee = _fee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
