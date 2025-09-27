// ==============================================================================
// 1. TYPE DEFINITIONS
// ==============================================================================

/**
 * Defines the required profile fields for similarity calculation, matching
 * the relevant parts of your 'users' schema.
 */
export interface UserProfile {
    interests: string[] | null; // array of sports interests (jsonb in DB)
    skillLevel: string | null;
    availability: string | null;
    company: string | null;
    position: string | null;
    experience: string | null;
    isHiring: string | null; // 'true' or 'false'
    resumeUrl: string | null;
    data: any; // Additional JSON data
}

/**
 * Defines the weight (importance) of each field in the total score calculation.
 * These weights should sum up to 1.0 for a properly normalized score.
 */
const FIELD_WEIGHTS: Record<keyof UserProfile, number> = {
    interests: 0.40,      // High importance for matching sports partners
    skillLevel: 0.20,     // High importance for matching opponents/teammates
    availability: 0.15,   // Moderate importance for scheduling
    company: 0.05,
    position: 0.05,
    experience: 0.05,
    isHiring: 0.05,       // Relevant for professional networking matches
    resumeUrl: 0.00,      // Usually ignored for direct similarity
    data: 0.05,           // Reserve weight for custom logic
};

// ==============================================================================
// 2. SIMILARITY UTILITY FUNCTIONS
// ==============================================================================

/**
 * Calculates Jaccard Similarity Coefficient for two arrays of strings (sets).
 * J(A, B) = |A ∩ B| / |A ∪ B|
 * Score is between 0 (no overlap) and 1 (identical sets).
 */
const jaccardSimilarity = (arr1: string[] | null, arr2: string[] | null): number => {
    const a = arr1 ? arr1.map(item => item.trim().toLowerCase()) : [];
    const b = arr2 ? arr2.map(item => item.trim().toLowerCase()) : [];
    
    // Handle null/empty cases
    if (a.length === 0 && b.length === 0) return 1.0; 
    if (a.length === 0 || b.length === 0) return 0.0;

    const set1 = new Set(a);
    const set2 = new Set(b);

    let intersectionSize = 0;
    for (const item of set1) {
        if (set2.has(item)) {
            intersectionSize++;
        }
    }

    const unionSize = set1.size + set2.size - intersectionSize;
    
    return unionSize > 0 ? intersectionSize / unionSize : 0;
};

/**
 * Calculates similarity for simple text fields (e.g., skillLevel, availability).
 * Uses exact match (1.0) or no match (0.0). Handles null/undefined inputs.
 */
const textSimilarity = (text1: string | null, text2: string | null): number => {
    const t1 = (text1 || '').trim().toLowerCase();
    const t2 = (text2 || '').trim().toLowerCase();
    
    // If both are empty/null/whitespace, consider it a match (1.0)
    if (!t1 && !t2) return 1.0; 
    // If one is empty and the other is not, consider it a non-match (0.0)
    if (!t1 || !t2) return 0.0; 

    // Exact match comparison
    return t1 === t2 ? 1.0 : 0.0;
};

/**
 * Calculates similarity for boolean fields stored as text (e.g., 'true' or 'false').
 */
const booleanSimilarity = (bool1: string | null, bool2: string | null): number => {
    // Standardize to a boolean type for comparison
    const b1 = (bool1 || '').toLowerCase() === 'true';
    const b2 = (bool2 || '').toLowerCase() === 'true';
    
    // Check if the boolean states match
    return b1 === b2 ? 1.0 : 0.0;
};


// ==============================================================================
// 3. MAIN SIMILARITY ALGORITHM
// ==============================================================================

/**
 * Calculates a final weighted similarity score between two users.
 * This is a composite score that combines set-based similarity (Jaccard)
 * and exact text matching, weighted by importance.
 * @param userA - The first user's profile data.
 * @param userB - The second user's profile data.
 * @returns A similarity score between 0.0 and 1.0.
 */
export const calculateUserSimilarity = (userA: UserProfile, userB: UserProfile): number => {
    let totalWeightedScore = 0;

    // --- Core Sports Matching Fields (High Weight) ---

    // 1. Interests (Set-based Jaccard Index)
    const interestsSim = jaccardSimilarity(userA.interests, userB.interests);
    totalWeightedScore += interestsSim * FIELD_WEIGHTS.interests;

    // 2. Skill Level (Exact Match)
    const skillLevelSim = textSimilarity(userA.skillLevel, userB.skillLevel);
    totalWeightedScore += skillLevelSim * FIELD_WEIGHTS.skillLevel;
    
    // 3. Availability (Exact Match)
    const availabilitySim = textSimilarity(userA.availability, userB.availability);
    totalWeightedScore += availabilitySim * FIELD_WEIGHTS.availability;

    // --- Work Information Fields (Lower Weight) ---

    // 4. Company, Position, Experience (Exact Match)
    const companySim = textSimilarity(userA.company, userB.company);
    totalWeightedScore += companySim * FIELD_WEIGHTS.company;
    
    const positionSim = textSimilarity(userA.position, userB.position);
    totalWeightedScore += positionSim * FIELD_WEIGHTS.position;
    
    const experienceSim = textSimilarity(userA.experience, userB.experience);
    totalWeightedScore += experienceSim * FIELD_WEIGHTS.experience;
    
    // 5. isHiring (Boolean Match)
    const isHiringSim = booleanSimilarity(userA.isHiring, userB.isHiring);
    totalWeightedScore += isHiringSim * FIELD_WEIGHTS.isHiring;

    // --- Misc Fields ---
    
    // 6. resumeUrl (Exact Match - usually only if both are present and identical)
    const resumeUrlSim = textSimilarity(userA.resumeUrl, userB.resumeUrl);
    totalWeightedScore += resumeUrlSim * FIELD_WEIGHTS.resumeUrl;

    // 7. Data (Custom JSON - Placeholder for custom logic)
    // For simplicity, we'll assign 0.0 unless both 'data' fields are empty/null.
    const dataEmpty = !userA.data && !userB.data;
    const dataSim = dataEmpty ? 1.0 : 0.0; 
    totalWeightedScore += dataSim * FIELD_WEIGHTS.data;

    // The result is already normalized between 0.0 and 1.0 because weights sum to 1.0.
    return totalWeightedScore;
};

/**
 * Calculates similarity between two users and returns both the total score and field-level similarities.
 * @param userA - The first user's profile data.
 * @param userB - The second user's profile data.
 * @returns An object containing the total similarity score and field-level similarities.
 */
export const calculateUserSimilarityWithFields = (userA: UserProfile, userB: UserProfile): {
    totalSimilarity: number;
    fieldSimilarities: Array<{
        field: keyof UserProfile;
        similarity: number;
        weight: number;
        weightedScore: number;
    }>;
} => {
    const fieldSimilarities: Array<{
        field: keyof UserProfile;
        similarity: number;
        weight: number;
        weightedScore: number;
    }> = [];

    let totalWeightedScore = 0;

    // --- Core Sports Matching Fields (High Weight) ---

    // 1. Interests (Set-based Jaccard Index)
    const interestsSim = jaccardSimilarity(userA.interests, userB.interests);
    const interestsWeighted = interestsSim * FIELD_WEIGHTS.interests;
    fieldSimilarities.push({
        field: 'interests',
        similarity: interestsSim,
        weight: FIELD_WEIGHTS.interests,
        weightedScore: interestsWeighted,
    });
    totalWeightedScore += interestsWeighted;

    // 2. Skill Level (Exact Match)
    const skillLevelSim = textSimilarity(userA.skillLevel, userB.skillLevel);
    const skillLevelWeighted = skillLevelSim * FIELD_WEIGHTS.skillLevel;
    fieldSimilarities.push({
        field: 'skillLevel',
        similarity: skillLevelSim,
        weight: FIELD_WEIGHTS.skillLevel,
        weightedScore: skillLevelWeighted,
    });
    totalWeightedScore += skillLevelWeighted;
    
    // 3. Availability (Exact Match)
    const availabilitySim = textSimilarity(userA.availability, userB.availability);
    const availabilityWeighted = availabilitySim * FIELD_WEIGHTS.availability;
    fieldSimilarities.push({
        field: 'availability',
        similarity: availabilitySim,
        weight: FIELD_WEIGHTS.availability,
        weightedScore: availabilityWeighted,
    });
    totalWeightedScore += availabilityWeighted;

    // --- Work Information Fields (Lower Weight) ---

    // 4. Company, Position, Experience (Exact Match)
    const companySim = textSimilarity(userA.company, userB.company);
    const companyWeighted = companySim * FIELD_WEIGHTS.company;
    fieldSimilarities.push({
        field: 'company',
        similarity: companySim,
        weight: FIELD_WEIGHTS.company,
        weightedScore: companyWeighted,
    });
    totalWeightedScore += companyWeighted;
    
    const positionSim = textSimilarity(userA.position, userB.position);
    const positionWeighted = positionSim * FIELD_WEIGHTS.position;
    fieldSimilarities.push({
        field: 'position',
        similarity: positionSim,
        weight: FIELD_WEIGHTS.position,
        weightedScore: positionWeighted,
    });
    totalWeightedScore += positionWeighted;
    
    const experienceSim = textSimilarity(userA.experience, userB.experience);
    const experienceWeighted = experienceSim * FIELD_WEIGHTS.experience;
    fieldSimilarities.push({
        field: 'experience',
        similarity: experienceSim,
        weight: FIELD_WEIGHTS.experience,
        weightedScore: experienceWeighted,
    });
    totalWeightedScore += experienceWeighted;
    
    // 5. isHiring (Boolean Match)
    const isHiringSim = booleanSimilarity(userA.isHiring, userB.isHiring);
    const isHiringWeighted = isHiringSim * FIELD_WEIGHTS.isHiring;
    fieldSimilarities.push({
        field: 'isHiring',
        similarity: isHiringSim,
        weight: FIELD_WEIGHTS.isHiring,
        weightedScore: isHiringWeighted,
    });
    totalWeightedScore += isHiringWeighted;

    // --- Misc Fields ---
    
    // 6. resumeUrl (Exact Match - usually only if both are present and identical)
    const resumeUrlSim = textSimilarity(userA.resumeUrl, userB.resumeUrl);
    const resumeUrlWeighted = resumeUrlSim * FIELD_WEIGHTS.resumeUrl;
    fieldSimilarities.push({
        field: 'resumeUrl',
        similarity: resumeUrlSim,
        weight: FIELD_WEIGHTS.resumeUrl,
        weightedScore: resumeUrlWeighted,
    });
    totalWeightedScore += resumeUrlWeighted;

    // 7. Data (Custom JSON - Placeholder for custom logic)
    const dataEmpty = !userA.data && !userB.data;
    const dataSim = dataEmpty ? 1.0 : 0.0;
    const dataWeighted = dataSim * FIELD_WEIGHTS.data;
    fieldSimilarities.push({
        field: 'data',
        similarity: dataSim,
        weight: FIELD_WEIGHTS.data,
        weightedScore: dataWeighted,
    });
    totalWeightedScore += dataWeighted;

    return {
        totalSimilarity: totalWeightedScore,
        fieldSimilarities,
    };
};

// --- Optional check for weights ---
const totalWeight = Object.values(FIELD_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.0001) {
    console.warn(`\nWARNING: Total weight is ${totalWeight.toFixed(2)}, not 1.0. The score is still weighted but not mathematically normalized across all fields.`);
}