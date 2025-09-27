#!/bin/bash

# Compile the similarity circuit using Mopro-compatible tools

echo "🔧 Compiling Similarity ZK Circuit..."

# Create build directory
mkdir -p build

# Compile the circuit
echo "📦 Compiling Circom circuit..."
circom similarity.circom --r1cs --wasm --sym -o build/

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ Circuit compiled successfully!"
    echo "📁 Output files:"
    echo "   - build/similarity.r1cs (R1CS constraint system)"
    echo "   - build/similarity_js/ (WASM witness generator)"
    echo "   - build/similarity.sym (Symbol file)"
else
    echo "❌ Circuit compilation failed!"
    exit 1
fi

# Generate trusted setup (for testing - use ceremony keys in production)
echo "🔐 Generating trusted setup..."
cd build

# Generate ceremony parameters (Powers of Tau)
if [ ! -f "pot_final.ptau" ]; then
    echo "📊 Generating Powers of Tau ceremony..."
    snarkjs powersoftau new bn128 14 pot_0000.ptau -v
    snarkjs powersoftau contribute pot_0000.ptau pot_0001.ptau --name="First contribution" -v -e="random text"
    snarkjs powersoftau prepare phase2 pot_0001.ptau pot_final.ptau -v
fi

# Generate circuit-specific setup
echo "🎯 Generating circuit-specific setup..."
snarkjs groth16 setup similarity.r1cs pot_final.ptau similarity_0000.zkey
snarkjs zkey contribute similarity_0000.zkey similarity_0001.zkey --name="1st Contributor Name" -v -e="Another random entropy"
snarkjs zkey export verificationkey similarity_0001.zkey verification_key.json

echo "✅ Trusted setup completed!"
echo "📁 Generated files:"
echo "   - similarity_0001.zkey (Proving key)"
echo "   - verification_key.json (Verification key)"

cd ..

echo "🚀 Circuit ready for Mopro integration!"

