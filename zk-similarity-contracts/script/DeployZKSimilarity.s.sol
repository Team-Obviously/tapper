// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ZKSimilarityMatcher.sol";

contract DeployZKSimilarity is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying ZKSimilarityMatcher contract...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the ZKSimilarityMatcher contract
        // The deployer will be the initial owner
        ZKSimilarityMatcher zkSimilarityMatcher = new ZKSimilarityMatcher(deployer);

        vm.stopBroadcast();

        console.log("ZKSimilarityMatcher deployed at:", address(zkSimilarityMatcher));
        console.log("Owner:", zkSimilarityMatcher.owner());
        console.log("Escrow fee:", zkSimilarityMatcher.escrowFee());
        console.log("Similarity threshold:", zkSimilarityMatcher.SIMILARITY_THRESHOLD());

        // Verify the deployment
        console.log("\n=== Deployment Verification ===");
        console.log("Contract deployed successfully!");
        console.log("Initial configuration:");
        console.log("- Owner: ", zkSimilarityMatcher.owner());
        console.log("- Escrow Fee: ", zkSimilarityMatcher.escrowFee(), "wei");
        console.log("- Similarity Threshold: ", zkSimilarityMatcher.SIMILARITY_THRESHOLD(), "(30% * 10000)");
        console.log("- Escrow Timeout: ", zkSimilarityMatcher.ESCROW_TIMEOUT(), "seconds");
        console.log("- Commitment Validity: ", zkSimilarityMatcher.COMMITMENT_VALIDITY(), "seconds");

        console.log("\n=== Next Steps ===");
        console.log("1. Update backend service with contract address");
        console.log("2. Fund contract owner for operational expenses");
        console.log("3. Test commitment creation and proof verification");
        console.log("4. Configure frontend to interact with contract");

        // Save deployment info to a JSON file for the backend
        string memory deploymentInfo = string(abi.encodePacked(
            '{"contractAddress":"', 
            vm.toString(address(zkSimilarityMatcher)),
            '","owner":"',
            vm.toString(zkSimilarityMatcher.owner()),
            '","escrowFee":"',
            vm.toString(zkSimilarityMatcher.escrowFee()),
            '","similarityThreshold":"',
            vm.toString(zkSimilarityMatcher.SIMILARITY_THRESHOLD()),
            '","network":"',
            vm.toString(block.chainid),
            '","deployedAt":"',
            vm.toString(block.timestamp),
            '"}'
        ));

        vm.writeFile("deployment-info.json", deploymentInfo);
        console.log("\nDeployment info saved to deployment-info.json");
    }
}

