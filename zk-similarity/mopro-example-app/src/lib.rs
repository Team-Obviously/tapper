// Here we're calling a macro exported with Uniffi. This macro will
// write some functions and bind them to FFI type.
// These functions include:
// - `generate_circom_proof`
// - `verify_circom_proof`
// - `generate_halo2_proof`
// - `verify_halo2_proof`
// - `generate_noir_proof`
// - `verify_noir_proof`
mopro_ffi::app!();

// Include our similarity circuit module
mod similarity_circuit;

/// You can also customize the bindings by #[uniffi::export]
/// Reference: https://mozilla.github.io/uniffi-rs/latest/proc_macro/index.html
#[uniffi::export]
fn mopro_uniffi_hello_world() -> String {
    "Hello, World!".to_string()
}

// --- User Similarity ZK Proof Functions ---

#[uniffi::export]
fn generate_user_similarity_proof(
    profile1_json: String,
    profile2_json: String,
    threshold: f64,
) -> Result<String, String> {
    use similarity_circuit::*;
    use serde_json::Value;

    // Parse profile data from JSON
    let profile1_data: Value = serde_json::from_str(&profile1_json)
        .map_err(|e| format!("Failed to parse profile1 JSON: {}", e))?;
    let profile2_data: Value = serde_json::from_str(&profile2_json)
        .map_err(|e| format!("Failed to parse profile2 JSON: {}", e))?;

    // Extract interests arrays
    let interests1 = profile1_data["interests"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.as_str())
        .map(|s| s.to_string())
        .collect::<Vec<String>>();

    let interests2 = profile2_data["interests"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.as_str())
        .map(|s| s.to_string())
        .collect::<Vec<String>>();

    // Create UserProfile structs
    let profile1 = UserProfile {
        interests: interests1,
        skill_level: profile1_data["skillLevel"].as_str().unwrap_or("").to_string(),
        availability: profile1_data["availability"].as_str().unwrap_or("").to_string(),
        company: profile1_data["company"].as_str().unwrap_or("").to_string(),
        position: profile1_data["position"].as_str().unwrap_or("").to_string(),
        experience: profile1_data["experience"].as_str().unwrap_or("").to_string(),
        is_hiring: profile1_data["isHiring"].as_str().unwrap_or("false") == "true",
    };

    let profile2 = UserProfile {
        interests: interests2,
        skill_level: profile2_data["skillLevel"].as_str().unwrap_or("").to_string(),
        availability: profile2_data["availability"].as_str().unwrap_or("").to_string(),
        company: profile2_data["company"].as_str().unwrap_or("").to_string(),
        position: profile2_data["position"].as_str().unwrap_or("").to_string(),
        experience: profile2_data["experience"].as_str().unwrap_or("").to_string(),
        is_hiring: profile2_data["isHiring"].as_str().unwrap_or("false") == "true",
    };

    // Generate similarity proof
    let proof = generate_similarity_proof(&profile1, &profile2, threshold)
        .map_err(|e| format!("Failed to generate similarity proof: {}", e))?;

    // Return proof as JSON
    let result = serde_json::json!({
        "proof": proof.proof,
        "public_signals": proof.public_signals,
        "similarity_score": proof.similarity_score,
        "is_match": proof.is_match,
    });

    Ok(result.to_string())
}

#[uniffi::export]
fn verify_user_similarity_proof(
    proof: String,
    public_signals_json: String,
    expected_threshold: f64,
) -> Result<bool, String> {
    use similarity_circuit::*;
    use serde_json::Value;

    // Parse public signals from JSON
    let public_signals_data: Value = serde_json::from_str(&public_signals_json)
        .map_err(|e| format!("Failed to parse public signals JSON: {}", e))?;

    let public_signals = public_signals_data["public_signals"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.as_str())
        .map(|s| s.to_string())
        .collect::<Vec<String>>();

    // Verify the proof
    verify_similarity_proof(&proof, &public_signals, expected_threshold)
        .map_err(|e| format!("Failed to verify similarity proof: {}", e))
}

#[uniffi::export]
fn calculate_user_similarity_score(
    profile1_json: String,
    profile2_json: String,
) -> Result<f64, String> {
    use similarity_circuit::*;
    use serde_json::Value;

    // Parse profile data from JSON
    let profile1_data: Value = serde_json::from_str(&profile1_json)
        .map_err(|e| format!("Failed to parse profile1 JSON: {}", e))?;
    let profile2_data: Value = serde_json::from_str(&profile2_json)
        .map_err(|e| format!("Failed to parse profile2 JSON: {}", e))?;

    // Extract interests arrays
    let interests1 = profile1_data["interests"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.as_str())
        .map(|s| s.to_string())
        .collect::<Vec<String>>();

    let interests2 = profile2_data["interests"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.as_str())
        .map(|s| s.to_string())
        .collect::<Vec<String>>();

    // Create UserProfile structs
    let profile1 = UserProfile {
        interests: interests1,
        skill_level: profile1_data["skillLevel"].as_str().unwrap_or("").to_string(),
        availability: profile1_data["availability"].as_str().unwrap_or("").to_string(),
        company: profile1_data["company"].as_str().unwrap_or("").to_string(),
        position: profile1_data["position"].as_str().unwrap_or("").to_string(),
        experience: profile1_data["experience"].as_str().unwrap_or("").to_string(),
        is_hiring: profile1_data["isHiring"].as_str().unwrap_or("false") == "true",
    };

    let profile2 = UserProfile {
        interests: interests2,
        skill_level: profile2_data["skillLevel"].as_str().unwrap_or("").to_string(),
        availability: profile2_data["availability"].as_str().unwrap_or("").to_string(),
        company: profile2_data["company"].as_str().unwrap_or("").to_string(),
        position: profile2_data["position"].as_str().unwrap_or("").to_string(),
        experience: profile2_data["experience"].as_str().unwrap_or("").to_string(),
        is_hiring: profile2_data["isHiring"].as_str().unwrap_or("false") == "true",
    };

    // Calculate similarity score
    Ok(calculate_similarity_score(&profile1, &profile2))
}

// --- Circom Example of using groth16 proving and verifying circuits ---

// Module containing the Circom circuit logic (Multiplier2)

rust_witness::witness!(multiplier2);

mopro_ffi::set_circom_circuits! {
    ("multiplier2_final.zkey", mopro_ffi::witness::WitnessFn::RustWitness(multiplier2_witness))
}

#[cfg(test)]
mod circom_tests {
    use super::*;

    #[test]
    fn test_multiplier2() {
        let zkey_path = "./test-vectors/circom/multiplier2_final.zkey".to_string();
        let circuit_inputs = "{\"a\": 2, \"b\": 3}".to_string();
        let result = generate_circom_proof(zkey_path.clone(), circuit_inputs, ProofLib::Arkworks);
        assert!(result.is_ok());
        let proof = result.unwrap();
        assert!(verify_circom_proof(zkey_path, proof, ProofLib::Arkworks).is_ok());
    }
}


// --- Halo2 Example of using Plonk proving and verifying circuits ---

// Module containing the Halo2 circuit logic (FibonacciMoproCircuit)

mopro_ffi::set_halo2_circuits! {
    ("plonk_fibonacci_pk.bin", plonk_fibonacci::prove, "plonk_fibonacci_vk.bin", plonk_fibonacci::verify),
    ("hyperplonk_fibonacci_pk.bin", hyperplonk_fibonacci::prove, "hyperplonk_fibonacci_vk.bin", hyperplonk_fibonacci::verify),
    ("gemini_fibonacci_pk.bin", gemini_fibonacci::prove, "gemini_fibonacci_vk.bin", gemini_fibonacci::verify),
}

#[cfg(test)]
mod halo2_tests {
    use std::collections::HashMap;

    use super::*;

    #[test]
    fn test_plonk_fibonacci() {
        let srs_path = "./test-vectors/halo2/plonk_fibonacci_srs.bin".to_string();
        let pk_path = "./test-vectors/halo2/plonk_fibonacci_pk.bin".to_string();
        let vk_path = "./test-vectors/halo2/plonk_fibonacci_vk.bin".to_string();
        let mut circuit_inputs = HashMap::new();
        circuit_inputs.insert("out".to_string(), vec!["55".to_string()]);
        let result = generate_halo2_proof(srs_path.clone(), pk_path.clone(), circuit_inputs);
        assert!(result.is_ok());
        let halo2_proof_result = result.unwrap();
        let valid = verify_halo2_proof(
            srs_path,
            vk_path,
            halo2_proof_result.proof,
            halo2_proof_result.inputs,
        );
        assert!(valid.is_ok());
        assert!(valid.unwrap());
    }

    #[test]
    fn test_hyperplonk_fibonacci() {
        let srs_path = "./test-vectors/halo2/hyperplonk_fibonacci_srs.bin".to_string();
        let pk_path = "./test-vectors/halo2/hyperplonk_fibonacci_pk.bin".to_string();
        let vk_path = "./test-vectors/halo2/hyperplonk_fibonacci_vk.bin".to_string();
        let mut circuit_inputs = HashMap::new();
        circuit_inputs.insert("out".to_string(), vec!["55".to_string()]);
        let result = generate_halo2_proof(srs_path.clone(), pk_path.clone(), circuit_inputs);
        assert!(result.is_ok());
        let halo2_proof_result = result.unwrap();
        let valid = verify_halo2_proof(
            srs_path,
            vk_path,
            halo2_proof_result.proof,
            halo2_proof_result.inputs,
        );
        assert!(valid.is_ok());
        assert!(valid.unwrap());
    }

    #[test]
    fn test_gemini_fibonacci() {
        let srs_path = "./test-vectors/halo2/gemini_fibonacci_srs.bin".to_string();
        let pk_path = "./test-vectors/halo2/gemini_fibonacci_pk.bin".to_string();
        let vk_path = "./test-vectors/halo2/gemini_fibonacci_vk.bin".to_string();
        let mut circuit_inputs = HashMap::new();
        circuit_inputs.insert("out".to_string(), vec!["55".to_string()]);
        let result = generate_halo2_proof(srs_path.clone(), pk_path.clone(), circuit_inputs);
        assert!(result.is_ok());
        let halo2_proof_result = result.unwrap();
        let valid = verify_halo2_proof(
            srs_path,
            vk_path,
            halo2_proof_result.proof,
            halo2_proof_result.inputs,
        );
        assert!(valid.is_ok());
        assert!(valid.unwrap());
    }
}


#[cfg(test)]
mod noir_tests {
    use super::*;

    #[test]
    fn test_noir_multiplier2() {
        let srs_path = "./test-vectors/noir/noir_multiplier2.srs".to_string();
        let circuit_path = "./test-vectors/noir/noir_multiplier2.json".to_string();
        let circuit_inputs = vec!["3".to_string(), "5".to_string()];
        let result = generate_noir_proof(
            circuit_path.clone(),
            Some(srs_path.clone()),
            circuit_inputs.clone(),
        );
        assert!(result.is_ok());
        let proof = result.unwrap();
        let result = verify_noir_proof(circuit_path.clone(), proof);
        assert!(result.is_ok());
        let valid = result.unwrap();
        assert!(valid);
    }
}


#[cfg(test)]
mod uniffi_tests {
    use super::*;

    #[test]
    fn test_mopro_uniffi_hello_world() {
        assert_eq!(mopro_uniffi_hello_world(), "Hello, World!");
    }
}
