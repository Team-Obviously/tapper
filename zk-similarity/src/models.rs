use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub interests: Option<Vec<String>>,
    pub skill_level: Option<String>,
    pub availability: Option<String>,
    pub company: Option<String>,
    pub position: Option<String>,
    pub experience: Option<String>,
    pub is_hiring: Option<String>,
    pub resume_url: Option<String>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitmentRequest {
    pub profile: UserProfile,
    pub salt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitmentResponse {
    pub commitment_id: Uuid,
    pub commitment_hash: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SimilarityProofRequest {
    pub commitment_id_1: Uuid,
    pub commitment_id_2: Uuid,
    pub similarity_threshold: f64,
    pub salt_1: String,
    pub salt_2: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SimilarityProofResponse {
    pub proof: String,
    pub public_signals: Vec<String>,
    pub similarity_score: f64,
    pub is_match: bool,
    pub proof_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnonymousMatch {
    pub commitment_id: Uuid,
    pub commitment_hash: String,
    pub estimated_similarity: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct StoredCommitment {
    pub commitment_hash: String,
    pub profile: UserProfile,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProofVerificationRequest {
    pub proof: String,
    pub public_signals: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProofVerificationResponse {
    pub valid: bool,
    pub verified_at: DateTime<Utc>,
    pub verification_details: Option<serde_json::Value>,
}

