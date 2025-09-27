pragma circom 2.0.0;

/*
 * Anonymous User Similarity Circuit
 * 
 * This circuit proves that two users have a similarity score above a threshold
 * without revealing their actual profile data.
 *
 * Public inputs:
 * - similarity_threshold: minimum similarity score required
 * - user_commitment_1: commitment to user 1's profile hash
 * - user_commitment_2: commitment to user 2's profile hash
 *
 * Private inputs:
 * - interests_1[MAX_INTERESTS]: user 1's interests (as field elements)
 * - interests_2[MAX_INTERESTS]: user 2's interests (as field elements)
 * - skill_level_1, skill_level_2: skill levels (encoded as numbers)
 * - availability_1, availability_2: availability (encoded as numbers)
 * - company_1, company_2: company (encoded as numbers)
 * - position_1, position_2: position (encoded as numbers)
 * - experience_1, experience_2: experience (encoded as numbers)
 * - salt_1, salt_2: random salts for commitments
 *
 * The circuit computes similarity using the same weighted algorithm as the backend
 * and proves the similarity score meets the threshold.
 */

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/gates.circom";

template SimilarityProof() {
    // Constants
    var MAX_INTERESTS = 10;
    var SIMILARITY_PRECISION = 10000; // Scale factor for floating point simulation
    
    // Field weights (scaled by SIMILARITY_PRECISION)
    var INTEREST_WEIGHT = 4000;     // 40%
    var SKILL_WEIGHT = 2000;        // 20%
    var AVAILABILITY_WEIGHT = 1500; // 15%
    var COMPANY_WEIGHT = 500;       // 5%
    var POSITION_WEIGHT = 500;      // 5%
    var EXPERIENCE_WEIGHT = 500;    // 5%
    
    // Public inputs
    signal input similarity_threshold; // Scaled by SIMILARITY_PRECISION
    signal input user_commitment_1;
    signal input user_commitment_2;
    
    // Private inputs - User 1
    signal private input interests_1[MAX_INTERESTS];
    signal private input skill_level_1;
    signal private input availability_1;
    signal private input company_1;
    signal private input position_1;
    signal private input experience_1;
    signal private input salt_1;
    
    // Private inputs - User 2
    signal private input interests_2[MAX_INTERESTS];
    signal private input skill_level_2;
    signal private input availability_2;
    signal private input company_2;
    signal private input position_2;
    signal private input experience_2;
    signal private input salt_2;
    
    // Outputs
    signal output similarity_score;
    signal output is_match; // 1 if similarity >= threshold, 0 otherwise
    
    // Components for hashing
    component user_hash_1 = Poseidon(MAX_INTERESTS + 6); // interests + 5 other fields + salt
    component user_hash_2 = Poseidon(MAX_INTERESTS + 6);
    
    // Hash user 1's profile
    for (var i = 0; i < MAX_INTERESTS; i++) {
        user_hash_1.inputs[i] <== interests_1[i];
    }
    user_hash_1.inputs[MAX_INTERESTS] <== skill_level_1;
    user_hash_1.inputs[MAX_INTERESTS + 1] <== availability_1;
    user_hash_1.inputs[MAX_INTERESTS + 2] <== company_1;
    user_hash_1.inputs[MAX_INTERESTS + 3] <== position_1;
    user_hash_1.inputs[MAX_INTERESTS + 4] <== experience_1;
    user_hash_1.inputs[MAX_INTERESTS + 5] <== salt_1;
    
    // Hash user 2's profile
    for (var i = 0; i < MAX_INTERESTS; i++) {
        user_hash_2.inputs[i] <== interests_2[i];
    }
    user_hash_2.inputs[MAX_INTERESTS] <== skill_level_2;
    user_hash_2.inputs[MAX_INTERESTS + 1] <== availability_2;
    user_hash_2.inputs[MAX_INTERESTS + 2] <== company_2;
    user_hash_2.inputs[MAX_INTERESTS + 3] <== position_2;
    user_hash_2.inputs[MAX_INTERESTS + 4] <== experience_2;
    user_hash_2.inputs[MAX_INTERESTS + 5] <== salt_2;
    
    // Verify commitments
    user_commitment_1 === user_hash_1.out;
    user_commitment_2 === user_hash_2.out;
    
    // Calculate Jaccard similarity for interests
    signal interests_intersection_count;
    signal interests_union_count;
    signal jaccard_similarity;
    
    component interest_intersection = InterestIntersection(MAX_INTERESTS);
    component interest_union = InterestUnion(MAX_INTERESTS);
    
    for (var i = 0; i < MAX_INTERESTS; i++) {
        interest_intersection.interests_1[i] <== interests_1[i];
        interest_intersection.interests_2[i] <== interests_2[i];
        interest_union.interests_1[i] <== interests_1[i];
        interest_union.interests_2[i] <== interests_2[i];
    }
    
    interests_intersection_count <== interest_intersection.count;
    interests_union_count <== interest_union.count;
    
    // Calculate Jaccard similarity: intersection / union * SIMILARITY_PRECISION
    // If union is 0, similarity is 1 (both empty)
    component union_is_zero = IsZero();
    union_is_zero.in <== interests_union_count;
    
    // If union is zero, set jaccard to SIMILARITY_PRECISION (1.0), else calculate
    jaccard_similarity <== union_is_zero.out * SIMILARITY_PRECISION + 
                          (1 - union_is_zero.out) * (interests_intersection_count * SIMILARITY_PRECISION) / interests_union_count;
    
    // Calculate field similarities (exact matches)
    component skill_match = IsEqual();
    skill_match.in[0] <== skill_level_1;
    skill_match.in[1] <== skill_level_2;
    
    component availability_match = IsEqual();
    availability_match.in[0] <== availability_1;
    availability_match.in[1] <== availability_2;
    
    component company_match = IsEqual();
    company_match.in[0] <== company_1;
    company_match.in[1] <== company_2;
    
    component position_match = IsEqual();
    position_match.in[0] <== position_1;
    position_match.in[1] <== position_2;
    
    component experience_match = IsEqual();
    experience_match.in[0] <== experience_1;
    experience_match.in[1] <== experience_2;
    
    // Calculate weighted similarity score
    signal weighted_interests <== jaccard_similarity * INTEREST_WEIGHT / SIMILARITY_PRECISION;
    signal weighted_skill <== skill_match.out * SKILL_WEIGHT;
    signal weighted_availability <== availability_match.out * AVAILABILITY_WEIGHT;
    signal weighted_company <== company_match.out * COMPANY_WEIGHT;
    signal weighted_position <== position_match.out * POSITION_WEIGHT;
    signal weighted_experience <== experience_match.out * EXPERIENCE_WEIGHT;
    
    similarity_score <== weighted_interests + weighted_skill + weighted_availability + 
                        weighted_company + weighted_position + weighted_experience;
    
    // Check if similarity meets threshold
    component threshold_check = GreaterEqualThan(32);
    threshold_check.in[0] <== similarity_score;
    threshold_check.in[1] <== similarity_threshold;
    
    is_match <== threshold_check.out;
}

template InterestIntersection(n) {
    signal input interests_1[n];
    signal input interests_2[n];
    signal output count;
    
    signal matches[n];
    signal cumulative[n + 1];
    
    cumulative[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        component is_match = IsEqual();
        is_match.in[0] <== interests_1[i];
        is_match.in[1] <== interests_2[i];
        
        // Only count if both are non-zero (valid interests)
        component both_nonzero = AND();
        component nonzero_1 = IsZero();
        component nonzero_2 = IsZero();
        
        nonzero_1.in <== interests_1[i];
        nonzero_2.in <== interests_2[i];
        
        both_nonzero.a <== 1 - nonzero_1.out;
        both_nonzero.b <== 1 - nonzero_2.out;
        
        matches[i] <== is_match.out * both_nonzero.out;
        cumulative[i + 1] <== cumulative[i] + matches[i];
    }
    
    count <== cumulative[n];
}

template InterestUnion(n) {
    signal input interests_1[n];
    signal input interests_2[n];
    signal output count;
    
    signal unique[n];
    signal cumulative[n + 1];
    
    cumulative[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        // Count unique interests (either from user 1 or user 2, but not double-counting)
        component has_interest_1 = IsZero();
        component has_interest_2 = IsZero();
        component either_has = OR();
        
        has_interest_1.in <== interests_1[i];
        has_interest_2.in <== interests_2[i];
        
        either_has.a <== 1 - has_interest_1.out;
        either_has.b <== 1 - has_interest_2.out;
        
        unique[i] <== either_has.out;
        cumulative[i + 1] <== cumulative[i] + unique[i];
    }
    
    count <== cumulative[n];
}

component main = SimilarityProof();

