use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tracing::{debug, info};

use crate::models::{UserProfile, StoredCommitment, AnonymousMatch};

pub struct CommitmentStore {
    commitments: HashMap<Uuid, StoredCommitment>,
}

impl CommitmentStore {
    pub fn new() -> Self {
        Self {
            commitments: HashMap::new(),
        }
    }

    pub fn store_commitment(
        &mut self,
        commitment_id: Uuid,
        commitment_hash: String,
        profile: UserProfile,
    ) {
        let stored_commitment = StoredCommitment {
            commitment_hash,
            profile,
            created_at: Utc::now(),
        };

        self.commitments.insert(commitment_id, stored_commitment);
        info!("📝 Stored commitment: {}", commitment_id);
    }

    pub fn get_commitment(&self, commitment_id: &Uuid) -> Option<&StoredCommitment> {
        self.commitments.get(commitment_id)
    }

    pub fn find_potential_matches(
        &self,
        target_commitment_id: &Uuid,
        min_similarity: f64,
    ) -> Vec<AnonymousMatch> {
        debug!("🔍 Finding potential matches for: {}", target_commitment_id);

        let target_commitment = match self.commitments.get(target_commitment_id) {
            Some(commitment) => commitment,
            None => return vec![],
        };

        let mut matches = Vec::new();

        for (commitment_id, stored_commitment) in &self.commitments {
            // Skip self
            if commitment_id == target_commitment_id {
                continue;
            }

            // Calculate rough similarity estimate (without ZK proof)
            let estimated_similarity = self.estimate_similarity(
                &target_commitment.profile,
                &stored_commitment.profile,
            );

            if estimated_similarity >= min_similarity {
                matches.push(AnonymousMatch {
                    commitment_id: *commitment_id,
                    commitment_hash: stored_commitment.commitment_hash.clone(),
                    estimated_similarity,
                    created_at: stored_commitment.created_at,
                });
            }
        }

        // Sort by similarity score (highest first)
        matches.sort_by(|a, b| b.estimated_similarity.partial_cmp(&a.estimated_similarity).unwrap());

        info!("✅ Found {} potential matches", matches.len());
        matches
    }

    pub fn cleanup_expired_commitments(&mut self, max_age_hours: i64) {
        let cutoff_time = Utc::now() - chrono::Duration::hours(max_age_hours);
        
        let initial_count = self.commitments.len();
        self.commitments.retain(|_, commitment| commitment.created_at > cutoff_time);
        let final_count = self.commitments.len();

        if initial_count != final_count {
            info!("🧹 Cleaned up {} expired commitments", initial_count - final_count);
        }
    }

    fn estimate_similarity(&self, profile_1: &UserProfile, profile_2: &UserProfile) -> f64 {
        let mut total_score = 0.0;
        
        // Interest similarity (Jaccard)
        if let (Some(interests_1), Some(interests_2)) = (&profile_1.interests, &profile_2.interests) {
            let set_1: std::collections::HashSet<_> = interests_1.iter().collect();
            let set_2: std::collections::HashSet<_> = interests_2.iter().collect();
            
            let intersection = set_1.intersection(&set_2).count() as f64;
            let union = set_1.union(&set_2).count() as f64;
            
            let jaccard = if union > 0.0 { intersection / union } else { 1.0 };
            total_score += jaccard * 0.4; // 40% weight
        }
        
        // Exact matches for other fields
        if profile_1.skill_level == profile_2.skill_level && profile_1.skill_level.is_some() {
            total_score += 0.2; // 20% weight
        }
        
        if profile_1.availability == profile_2.availability && profile_1.availability.is_some() {
            total_score += 0.15; // 15% weight
        }
        
        if profile_1.company == profile_2.company && profile_1.company.is_some() {
            total_score += 0.05; // 5% weight
        }
        
        if profile_1.position == profile_2.position && profile_1.position.is_some() {
            total_score += 0.05; // 5% weight
        }
        
        if profile_1.experience == profile_2.experience && profile_1.experience.is_some() {
            total_score += 0.05; // 5% weight
        }
        
        // Base similarity for having profiles
        total_score += 0.1; // 10% base score
        
        total_score.min(1.0)
    }

    pub fn get_commitment_count(&self) -> usize {
        self.commitments.len()
    }

    pub fn list_commitment_ids(&self) -> Vec<Uuid> {
        self.commitments.keys().cloned().collect()
    }
}

