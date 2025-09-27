use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::{info, warn, error};
use uuid::Uuid;

mod zk_prover;
mod models;
mod commitment_store;

use zk_prover::ZkSimilarityProver;
use models::{UserProfile, SimilarityProofRequest, SimilarityProofResponse, CommitmentRequest, CommitmentResponse};
use commitment_store::CommitmentStore;

#[derive(Clone)]
struct AppState {
    prover: Arc<ZkSimilarityProver>,
    commitments: Arc<RwLock<CommitmentStore>>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    info!("🚀 Starting ZK Similarity Service with Mopro");

    // Initialize ZK prover
    let prover = Arc::new(ZkSimilarityProver::new().await?);
    
    // Initialize commitment store
    let commitments = Arc::new(RwLock::new(CommitmentStore::new()));

    let state = AppState {
        prover,
        commitments,
    };

    // Build the router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/commit", post(create_commitment))
        .route("/prove-similarity", post(prove_similarity))
        .route("/verify-proof", post(verify_proof))
        .route("/anonymous-match/:commitment_id", get(find_anonymous_matches))
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Start the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    info!("🔗 ZK Similarity Service listening on http://0.0.0.0:3001");
    
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "zk-similarity-service",
        "version": "0.1.0",
        "mopro_enabled": true
    }))
}

async fn create_commitment(
    State(state): State<AppState>,
    Json(request): Json<CommitmentRequest>,
) -> Result<Json<CommitmentResponse>, StatusCode> {
    info!("📝 Creating user profile commitment");

    let commitment_id = Uuid::new_v4();
    
    // Generate commitment hash for the user profile
    let commitment_hash = state.prover.generate_commitment(&request.profile, &request.salt)
        .map_err(|e| {
            error!("Failed to generate commitment: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Store the commitment
    {
        let mut store = state.commitments.write().await;
        store.store_commitment(commitment_id, commitment_hash.clone(), request.profile.clone());
    }

    info!("✅ Commitment created: {}", commitment_id);

    Ok(Json(CommitmentResponse {
        commitment_id,
        commitment_hash,
        expires_at: chrono::Utc::now() + chrono::Duration::hours(24),
    }))
}

async fn prove_similarity(
    State(state): State<AppState>,
    Json(request): Json<SimilarityProofRequest>,
) -> Result<Json<SimilarityProofResponse>, StatusCode> {
    info!("🔐 Generating ZK similarity proof between {} and {}", 
          request.commitment_id_1, request.commitment_id_2);

    // Retrieve user profiles from commitments
    let (profile_1, profile_2) = {
        let store = state.commitments.read().await;
        let commitment_1 = store.get_commitment(&request.commitment_id_1)
            .ok_or_else(|| {
                warn!("Commitment 1 not found: {}", request.commitment_id_1);
                StatusCode::NOT_FOUND
            })?;
        let commitment_2 = store.get_commitment(&request.commitment_id_2)
            .ok_or_else(|| {
                warn!("Commitment 2 not found: {}", request.commitment_id_2);
                StatusCode::NOT_FOUND
            })?;
        
        (commitment_1.profile.clone(), commitment_2.profile.clone())
    };

    // Generate ZK proof using Mopro
    let proof_result = state.prover
        .generate_similarity_proof(
            &profile_1,
            &profile_2,
            request.similarity_threshold,
            &request.salt_1,
            &request.salt_2,
        ).await
        .map_err(|e| {
            error!("Failed to generate ZK proof: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    info!("✅ ZK proof generated successfully");

    Ok(Json(SimilarityProofResponse {
        proof: proof_result.proof,
        public_signals: proof_result.public_signals,
        similarity_score: proof_result.similarity_score,
        is_match: proof_result.is_match,
        proof_id: Uuid::new_v4(),
    }))
}

async fn verify_proof(
    State(state): State<AppState>,
    Json(proof_data): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    info!("🔍 Verifying ZK similarity proof");

    let is_valid = state.prover
        .verify_proof(&proof_data)
        .await
        .map_err(|e| {
            error!("Failed to verify proof: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(serde_json::json!({
        "valid": is_valid,
        "verified_at": chrono::Utc::now(),
    })))
}

async fn find_anonymous_matches(
    Path(commitment_id): Path<Uuid>,
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    info!("🔍 Finding anonymous matches for commitment: {}", commitment_id);

    let min_similarity = params
        .get("min_similarity")
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.3);

    // Get the target commitment
    let target_profile = {
        let store = state.commitments.read().await;
        store.get_commitment(&commitment_id)
            .ok_or_else(|| {
                warn!("Commitment not found: {}", commitment_id);
                StatusCode::NOT_FOUND
            })?
            .profile.clone()
    };

    // Find potential matches by comparing with other commitments
    let matches = {
        let store = state.commitments.read().await;
        store.find_potential_matches(&commitment_id, min_similarity)
    };

    info!("✅ Found {} potential anonymous matches", matches.len());

    Ok(Json(serde_json::json!({
        "commitment_id": commitment_id,
        "potential_matches": matches,
        "match_count": matches.len(),
        "min_similarity": min_similarity,
    })))
}