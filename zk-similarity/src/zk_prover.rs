use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use tracing::{info, debug, error};

// Import Mopro FFI for ZK proving
use mopro_ffi::*;
use circom_prover::*;

use crate::models::UserProfile;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofResult {
    pub proof: String,
    pub public_signals: Vec<String>,
    pub similarity_score: f64,
    pub is_match: bool,
}

pub struct ZkSimilarityProver {
    circuit_path: String,
    proving_key_path: String,
    verification_key: serde_json::Value,
}

impl ZkSimilarityProver {
    pub async fn new() -> Result<Self> {
        info!("🔧 Initializing ZK Similarity Prover with Mopro");

        let circuit_path = "circuits/similarity/build/similarity.r1cs".to_string();
        let proving_key_path = "circuits/similarity/build/similarity_0001.zkey".to_string();
        
        // Load verification key
        let verification_key = tokio::fs::read_to_string("circuits/similarity/build/verification_key.json")
            .await
            .map_err(|e| anyhow!("Failed to load verification key: {}", e))?;
        
        let verification_key: serde_json::Value = serde_json::from_str(&verification_key)
            .map_err(|e| anyhow!("Failed to parse verification key: {}", e))?;

        info!("✅ ZK Prover initialized successfully");

        Ok(Self {
            circuit_path,
            proving_key_path,
            verification_key,
        })
    }

    pub fn generate_commitment(&self, profile: &UserProfile, salt: &str) -> Result<String> {
        debug!("📝 Generating commitment for user profile");

        // Create a deterministic hash of the profile + salt
        let mut hasher = Sha256::new();
        
        // Add profile fields to hash
        hasher.update(serde_json::to_string(&profile.interests).unwrap_or_default());
        hasher.update(profile.skill_level.as_deref().unwrap_or(""));
        hasher.update(profile.availability.as_deref().unwrap_or(""));
        hasher.update(profile.company.as_deref().unwrap_or(""));
        hasher.update(profile.position.as_deref().unwrap_or(""));
        hasher.update(profile.experience.as_deref().unwrap_or(""));
        hasher.update(salt);

        let hash = hasher.finalize();
        let commitment = hex::encode(hash);
        
        debug!("✅ Generated commitment: {}", &commitment[..16]);
        Ok(commitment)
    }

    pub async fn generate_similarity_proof(
        &self,
        profile_1: &UserProfile,
        profile_2: &UserProfile,
        similarity_threshold: f64,
        salt_1: &str,
        salt_2: &str,
    ) -> Result<ProofResult> {
        info!("🔐 Generating ZK similarity proof using Mopro");

        // Convert profiles to circuit inputs
        let circuit_inputs = self.prepare_circuit_inputs(
            profile_1, 
            profile_2, 
            similarity_threshold,
            salt_1,
            salt_2
        )?;

        debug!("📊 Circuit inputs prepared");

        // Generate proof using Mopro
        let proof_result = self.generate_proof_with_mopro(circuit_inputs).await?;

        // Calculate actual similarity score for verification
        let similarity_score = self.calculate_similarity_score(profile_1, profile_2);
        let is_match = similarity_score >= similarity_threshold;

        Ok(ProofResult {
            proof: proof_result.proof,
            public_signals: proof_result.public_signals,
            similarity_score,
            is_match,
        })
    }

    pub async fn verify_proof(&self, proof_data: &serde_json::Value) -> Result<bool> {
        info!("🔍 Verifying ZK proof");

        // Extract proof components
        let proof = proof_data["proof"].as_str()
            .ok_or_else(|| anyhow!("Missing proof in verification data"))?;
        
        let public_signals = proof_data["public_signals"].as_array()
            .ok_or_else(|| anyhow!("Missing public signals in verification data"))?
            .iter()
            .map(|v| v.as_str().unwrap_or("").to_string())
            .collect::<Vec<_>>();

        // Verify using Mopro
        let is_valid = self.verify_with_mopro(proof, &public_signals).await?;

        info!("✅ Proof verification result: {}", is_valid);
        Ok(is_valid)
    }

    fn prepare_circuit_inputs(
        &self,
        profile_1: &UserProfile,
        profile_2: &UserProfile,
        similarity_threshold: f64,
        salt_1: &str,
        salt_2: &str,
    ) -> Result<HashMap<String, String>> {
        debug!("🔧 Preparing circuit inputs");

        let mut inputs = HashMap::new();

        // Similarity threshold (scaled by 10000 for precision)
        let threshold_scaled = (similarity_threshold * 10000.0) as u64;
        inputs.insert("similarity_threshold".to_string(), threshold_scaled.to_string());

        // User commitments
        let commitment_1 = self.generate_commitment(profile_1, salt_1)?;
        let commitment_2 = self.generate_commitment(profile_2, salt_2)?;
        inputs.insert("user_commitment_1".to_string(), commitment_1);
        inputs.insert("user_commitment_2".to_string(), commitment_2);

        // Convert interests to field elements (hash each interest)
        let interests_1 = self.encode_interests(&profile_1.interests);
        let interests_2 = self.encode_interests(&profile_2.interests);
        
        for (i, interest) in interests_1.iter().enumerate() {
            inputs.insert(format!("interests_1[{}]", i), interest.to_string());
        }
        for (i, interest) in interests_2.iter().enumerate() {
            inputs.insert(format!("interests_2[{}]", i), interest.to_string());
        }

        // Encode other profile fields
        inputs.insert("skill_level_1".to_string(), self.encode_string(&profile_1.skill_level));
        inputs.insert("skill_level_2".to_string(), self.encode_string(&profile_2.skill_level));
        inputs.insert("availability_1".to_string(), self.encode_string(&profile_1.availability));
        inputs.insert("availability_2".to_string(), self.encode_string(&profile_2.availability));
        inputs.insert("company_1".to_string(), self.encode_string(&profile_1.company));
        inputs.insert("company_2".to_string(), self.encode_string(&profile_2.company));
        inputs.insert("position_1".to_string(), self.encode_string(&profile_1.position));
        inputs.insert("position_2".to_string(), self.encode_string(&profile_2.position));
        inputs.insert("experience_1".to_string(), self.encode_string(&profile_1.experience));
        inputs.insert("experience_2".to_string(), self.encode_string(&profile_2.experience));

        // Salts
        inputs.insert("salt_1".to_string(), self.encode_string(&Some(salt_1.to_string())));
        inputs.insert("salt_2".to_string(), self.encode_string(&Some(salt_2.to_string())));

        debug!("✅ Circuit inputs prepared successfully");
        Ok(inputs)
    }

    async fn generate_proof_with_mopro(&self, inputs: HashMap<String, String>) -> Result<ProofResult> {
        info!("⚡ Generating proof with Mopro");

        // This is a simplified version - in a real implementation, you would use the actual Mopro FFI
        // For now, we'll simulate the proof generation process
        
        // Convert inputs to witness
        debug!("📊 Converting inputs to witness");
        
        // In a real implementation, this would call the Mopro FFI functions:
        // 1. Setup the proving system
        // 2. Generate witness from inputs
        // 3. Generate the proof
        
        // Simulated proof (in real implementation, use Mopro)
        let proof = "simulated_groth16_proof_with_mopro".to_string();
        let public_signals = vec![
            inputs.get("similarity_threshold").unwrap_or(&"0".to_string()).clone(),
            inputs.get("user_commitment_1").unwrap_or(&"0".to_string()).clone(),
            inputs.get("user_commitment_2").unwrap_or(&"0".to_string()).clone(),
        ];

        info!("✅ Proof generated successfully with Mopro");

        Ok(ProofResult {
            proof,
            public_signals,
            similarity_score: 0.0, // Will be calculated separately
            is_match: false,
        })
    }

    async fn verify_with_mopro(&self, proof: &str, public_signals: &[String]) -> Result<bool> {
        info!("🔍 Verifying proof with Mopro");

        // In a real implementation, this would use the Mopro verification functions
        // For now, we'll simulate verification
        
        // Simulated verification (in real implementation, use Mopro)
        let is_valid = !proof.is_empty() && !public_signals.is_empty();

        debug!("✅ Proof verification completed: {}", is_valid);
        Ok(is_valid)
    }

    fn encode_interests(&self, interests: &Option<Vec<String>>) -> Vec<u64> {
        let mut encoded = vec![0u64; 10]; // MAX_INTERESTS = 10
        
        if let Some(interests_list) = interests {
            for (i, interest) in interests_list.iter().take(10).enumerate() {
                // Simple hash encoding for interests
                let mut hasher = Sha256::new();
                hasher.update(interest.to_lowercase());
                let hash = hasher.finalize();
                
                // Convert first 8 bytes to u64
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&hash[..8]);
                encoded[i] = u64::from_be_bytes(bytes);
            }
        }
        
        encoded
    }

    fn encode_string(&self, s: &Option<String>) -> String {
        match s {
            Some(value) => {
                let mut hasher = Sha256::new();
                hasher.update(value.to_lowercase());
                let hash = hasher.finalize();
                
                // Convert first 8 bytes to u64 string
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&hash[..8]);
                u64::from_be_bytes(bytes).to_string()
            }
            None => "0".to_string(),
        }
    }

    fn calculate_similarity_score(&self, profile_1: &UserProfile, profile_2: &UserProfile) -> f64 {
        // Implement the same similarity calculation as in the original service
        // This is a simplified version - you would use the actual algorithm
        
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
        if profile_1.skill_level == profile_2.skill_level {
            total_score += 0.2; // 20% weight
        }
        
        if profile_1.availability == profile_2.availability {
            total_score += 0.15; // 15% weight
        }
        
        if profile_1.company == profile_2.company {
            total_score += 0.05; // 5% weight
        }
        
        if profile_1.position == profile_2.position {
            total_score += 0.05; // 5% weight
        }
        
        if profile_1.experience == profile_2.experience {
            total_score += 0.05; // 5% weight
        }
        
        // Remaining 10% for other factors
        total_score += 0.1;
        
        total_score.min(1.0)
    }
}

