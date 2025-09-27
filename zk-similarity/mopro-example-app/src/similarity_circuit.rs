use mopro_ffi::ProofLib;
use serde_json::json;
use std::collections::HashMap;

/// User profile data structure for similarity matching
#[derive(Debug, Clone)]
pub struct UserProfile {
    pub interests: Vec<String>,
    pub skill_level: String,
    pub availability: String,
    pub company: String,
    pub position: String,
    pub experience: String,
    pub is_hiring: bool,
}

/// Similarity proof result
#[derive(Debug)]
pub struct SimilarityProof {
    pub proof: String,
    pub public_signals: Vec<String>,
    pub similarity_score: f64,
    pub is_match: bool,
}

/// Calculate Jaccard similarity between two interest arrays
pub fn calculate_jaccard_similarity(interests1: &[String], interests2: &[String]) -> f64 {
    if interests1.is_empty() && interests2.is_empty() {
        return 1.0;
    }
    if interests1.is_empty() || interests2.is_empty() {
        return 0.0;
    }

    let set1: std::collections::HashSet<String> = interests1.iter()
        .map(|s| s.to_lowercase().trim().to_string())
        .collect();
    let set2: std::collections::HashSet<String> = interests2.iter()
        .map(|s| s.to_lowercase().trim().to_string())
        .collect();

    let intersection_size = set1.intersection(&set2).count();
    let union_size = set1.union(&set2).count();

    if union_size == 0 {
        0.0
    } else {
        intersection_size as f64 / union_size as f64
    }
}

/// Calculate weighted similarity score between two user profiles
pub fn calculate_similarity_score(profile1: &UserProfile, profile2: &UserProfile) -> f64 {
    let mut total_score = 0.0;
    let mut total_weight = 0.0;

    // Interests similarity (40% weight)
    let interests_sim = calculate_jaccard_similarity(&profile1.interests, &profile2.interests);
    total_score += interests_sim * 0.4;
    total_weight += 0.4;

    // Skill level similarity (20% weight)
    let skill_sim = if profile1.skill_level.to_lowercase() == profile2.skill_level.to_lowercase() {
        1.0
    } else {
        0.0
    };
    total_score += skill_sim * 0.2;
    total_weight += 0.2;

    // Availability similarity (15% weight)
    let availability_sim = if profile1.availability.to_lowercase() == profile2.availability.to_lowercase() {
        1.0
    } else {
        0.0
    };
    total_score += availability_sim * 0.15;
    total_weight += 0.15;

    // Company similarity (5% weight)
    let company_sim = if profile1.company.to_lowercase() == profile2.company.to_lowercase() {
        1.0
    } else {
        0.0
    };
    total_score += company_sim * 0.05;
    total_weight += 0.05;

    // Position similarity (5% weight)
    let position_sim = if profile1.position.to_lowercase() == profile2.position.to_lowercase() {
        1.0
    } else {
        0.0
    };
    total_score += position_sim * 0.05;
    total_weight += 0.05;

    // Experience similarity (5% weight)
    let experience_sim = if profile1.experience.to_lowercase() == profile2.experience.to_lowercase() {
        1.0
    } else {
        0.0
    };
    total_score += experience_sim * 0.05;
    total_weight += 0.05;

    // Hiring status similarity (5% weight)
    let hiring_sim = if profile1.is_hiring == profile2.is_hiring {
        1.0
    } else {
        0.0
    };
    total_score += hiring_sim * 0.05;
    total_weight += 0.05;

    // Normalize by total weight
    if total_weight > 0.0 {
        total_score / total_weight
    } else {
        0.0
    }
}

/// Generate a ZK proof for user similarity
pub fn generate_similarity_proof(
    profile1: &UserProfile,
    profile2: &UserProfile,
    threshold: f64,
) -> Result<SimilarityProof, String> {
    // Calculate similarity score
    let similarity_score = calculate_similarity_score(profile1, profile2);
    let is_match = similarity_score >= threshold;

    // For this example, we'll use a simplified proof generation
    // In a real implementation, this would generate actual ZK proofs
    let proof_data = json!({
        "profile1": {
            "interests": profile1.interests,
            "skill_level": profile1.skill_level,
            "availability": profile1.availability,
            "company": profile1.company,
            "position": profile1.position,
            "experience": profile1.experience,
            "is_hiring": profile1.is_hiring,
        },
        "profile2": {
            "interests": profile2.interests,
            "skill_level": profile2.skill_level,
            "availability": profile2.availability,
            "company": profile2.company,
            "position": profile2.position,
            "experience": profile2.experience,
            "is_hiring": profile2.is_hiring,
        },
        "similarity_score": similarity_score,
        "threshold": threshold,
        "is_match": is_match,
        "timestamp": chrono::Utc::now().timestamp(),
    });

    // Generate a mock proof (in real implementation, this would be a ZK proof)
    let proof = format!("zk_proof_{}", hex::encode(proof_data.to_string().as_bytes()));
    
    let public_signals = vec![
        similarity_score.to_string(),
        threshold.to_string(),
        is_match.to_string(),
    ];

    Ok(SimilarityProof {
        proof,
        public_signals,
        similarity_score,
        is_match,
    })
}

/// Verify a similarity proof
pub fn verify_similarity_proof(
    proof: &str,
    public_signals: &[String],
    expected_threshold: f64,
) -> Result<bool, String> {
    // In a real implementation, this would verify the ZK proof
    // For now, we'll do basic validation
    
    if public_signals.len() < 3 {
        return Err("Invalid public signals length".to_string());
    }

    let similarity_score: f64 = public_signals[0].parse()
        .map_err(|_| "Invalid similarity score format")?;
    let threshold: f64 = public_signals[1].parse()
        .map_err(|_| "Invalid threshold format")?;
    let is_match: bool = public_signals[2].parse()
        .map_err(|_| "Invalid match status format")?;

    // Validate that the proof is consistent
    let expected_match = similarity_score >= threshold;
    if is_match != expected_match {
        return Err("Proof inconsistency: match status doesn't match similarity score".to_string());
    }

    if threshold != expected_threshold {
        return Err("Proof threshold doesn't match expected threshold".to_string());
    }

    // Validate proof format (basic check)
    if !proof.starts_with("zk_proof_") {
        return Err("Invalid proof format".to_string());
    }

    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jaccard_similarity() {
        let interests1 = vec!["Football".to_string(), "Running".to_string()];
        let interests2 = vec!["Football".to_string(), "Basketball".to_string()];
        
        let similarity = calculate_jaccard_similarity(&interests1, &interests2);
        assert_eq!(similarity, 1.0 / 3.0); // 1 intersection / 3 union
    }

    #[test]
    fn test_similarity_score_calculation() {
        let profile1 = UserProfile {
            interests: vec!["Football".to_string(), "Running".to_string()],
            skill_level: "Expert".to_string(),
            availability: "Weekends".to_string(),
            company: "Acme Corp".to_string(),
            position: "Manager".to_string(),
            experience: "10+ years".to_string(),
            is_hiring: true,
        };

        let profile2 = UserProfile {
            interests: vec!["Football".to_string(), "Basketball".to_string()],
            skill_level: "Expert".to_string(),
            availability: "Weekends".to_string(),
            company: "Acme Corp".to_string(),
            position: "Engineer".to_string(),
            experience: "5+ years".to_string(),
            is_hiring: false,
        };

        let score = calculate_similarity_score(&profile1, &profile2);
        assert!(score > 0.0 && score < 1.0);
    }

    #[test]
    fn test_proof_generation_and_verification() {
        let profile1 = UserProfile {
            interests: vec!["Football".to_string()],
            skill_level: "Expert".to_string(),
            availability: "Weekends".to_string(),
            company: "Acme Corp".to_string(),
            position: "Manager".to_string(),
            experience: "10+ years".to_string(),
            is_hiring: true,
        };

        let profile2 = UserProfile {
            interests: vec!["Football".to_string()],
            skill_level: "Expert".to_string(),
            availability: "Weekends".to_string(),
            company: "Acme Corp".to_string(),
            position: "Manager".to_string(),
            experience: "10+ years".to_string(),
            is_hiring: true,
        };

        let threshold = 0.3;
        let proof_result = generate_similarity_proof(&profile1, &profile2, threshold);
        assert!(proof_result.is_ok());

        let proof = proof_result.unwrap();
        assert!(proof.is_match);
        assert!(proof.similarity_score >= threshold);

        let verification_result = verify_similarity_proof(
            &proof.proof,
            &proof.public_signals,
            threshold,
        );
        assert!(verification_result.is_ok());
        assert!(verification_result.unwrap());
    }
}
