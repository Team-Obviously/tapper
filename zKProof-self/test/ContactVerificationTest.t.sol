// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {ContactVerificationTest} from "../ContactVerificationTest.sol";

/**
 * @title ContactVerificationTestTest
 * @notice Test suite for ContactVerificationTest contract
 */
contract ContactVerificationTestTest is Test {
    ContactVerificationTest public contactVerification;
    
    function setUp() public {
        // Deploy the contract
        contactVerification = new ContactVerificationTest();
    }
    
    function testDeployment() public {
        assertTrue(address(contactVerification) != address(0));
        console.log("Contract deployed at:", address(contactVerification));
    }
    
    function testSetConfig() public {
        // Create a test config
        string[] memory forbiddenCountries = new string[](1);
        forbiddenCountries[0] = "US";
        
        // Set the config
        contactVerification.setConfig("sports_meetup", 18, forbiddenCountries, false);
        
        // Verify config was set
        assertTrue(contactVerification.hasConfig("sports_meetup"));
        assertTrue(contactVerification.getConfigIdByType("sports_meetup") != bytes32(0));
        
        // Check verification config details
        ContactVerificationTest.VerificationConfig memory config = 
            contactVerification.getVerificationConfig("sports_meetup");
        assertEq(config.olderThan, 18);
        assertEq(config.forbiddenCountries.length, 1);
        assertEq(config.forbiddenCountries[0], "US");
        assertFalse(config.ofacEnabled);
        
        console.log("Config set successfully for sports_meetup");
    }
    
    function testExtractConnectionType() public {
        // Test JSON parsing
        string memory jsonData = '{"connectionType":"sports_meetup","fromUserId":"uuid1","toUserId":"uuid2","fromNfcId":"nfc1","toNfcId":"nfc2"}';
        bytes memory userDefinedData = bytes(jsonData);
        
        // Set up a config first
        string[] memory emptyForbiddenCountries = new string[](0);
        contactVerification.setConfig("sports_meetup", 18, emptyForbiddenCountries, false);
        
        // Test getConfigId with the JSON data
        bytes32 configId = contactVerification.getConfigId(
            bytes32(0),
            bytes32(0),
            userDefinedData
        );
        
        assertTrue(configId != bytes32(0));
        console.log("Connection type extracted successfully");
    }
    
    function testMultipleConfigs() public {
        // Set up multiple configs
        string[] memory emptyForbiddenCountries = new string[](0);
        
        contactVerification.setConfig("sports_meetup", 18, emptyForbiddenCountries, false);
        contactVerification.setConfig("professional_networking", 21, emptyForbiddenCountries, false);
        
        // Verify both configs exist
        assertTrue(contactVerification.hasConfig("sports_meetup"));
        assertTrue(contactVerification.hasConfig("professional_networking"));
        assertFalse(contactVerification.hasConfig("nonexistent"));
        
        // Verify different configs return different IDs
        bytes32 sportsConfigId = contactVerification.getConfigIdByType("sports_meetup");
        bytes32 professionalConfigId = contactVerification.getConfigIdByType("professional_networking");
        
        assertTrue(sportsConfigId != professionalConfigId);
        console.log("Multiple configs set successfully");
    }
    
    function testDefaultConnectionType() public {
        // Test with JSON that doesn't have connectionType
        string memory jsonData = '{"fromUserId":"uuid1","toUserId":"uuid2","fromNfcId":"nfc1","toNfcId":"nfc2"}';
        bytes memory userDefinedData = bytes(jsonData);
        
        // Set up default config
        string[] memory emptyForbiddenCountries = new string[](0);
        contactVerification.setConfig("default", 16, emptyForbiddenCountries, false);
        
        // Test getConfigId should return default config
        bytes32 configId = contactVerification.getConfigId(
            bytes32(0),
            bytes32(0),
            userDefinedData
        );
        
        assertTrue(configId != bytes32(0));
        console.log("Default connection type handled successfully");
    }
    
    function testVerificationFlow() public {
        // Set up a config
        string[] memory emptyForbiddenCountries = new string[](0);
        contactVerification.setConfig("sports_meetup", 18, emptyForbiddenCountries, false);
        
        // Test verification with mock data
        string memory jsonData = '{"connectionType":"sports_meetup","fromUserId":"user-123","toUserId":"user-456","fromNfcId":"nfc-abc","toNfcId":"nfc-def"}';
        bytes memory userDefinedData = bytes(jsonData);
        bytes memory mockProof = bytes("mock_proof_payload");
        
        // Call verification
        contactVerification.verifySelfProof(mockProof, userDefinedData);
        
        console.log("Verification flow completed successfully");
    }
    
    function testShowVerificationParameters() public {
        // Set up a config
        string[] memory emptyForbiddenCountries = new string[](0);
        contactVerification.setConfig("sports_meetup", 18, emptyForbiddenCountries, false);
        
        // Test verification with mock data
        string memory jsonData = '{"connectionType":"sports_meetup","fromUserId":"user-123","toUserId":"user-456","fromNfcId":"nfc-abc","toNfcId":"nfc-def"}';
        bytes memory userDefinedData = bytes(jsonData);
        
        // Parse connection data and show parameters
        (
            string memory connectionType,
            string memory fromUserId,
            string memory toUserId,
            string memory fromNfcId,
            string memory toNfcId,
            bytes32 configId,
            bool configExists
        ) = contactVerification.parseConnectionData(userDefinedData);
        
        console.log("=== VERIFICATION PARAMETERS ===");
        console.log("Connection Type:", connectionType);
        console.log("From User ID:", fromUserId);
        console.log("To User ID:", toUserId);
        console.log("From NFC ID:", fromNfcId);
        console.log("To NFC ID:", toNfcId);
        console.log("Config ID:", vm.toString(configId));
        console.log("Config Exists:", configExists);
        
        // Get detailed verification info
        (
            bytes32 detailedConfigId,
            uint256 olderThan,
            uint256 forbiddenCountriesCount,
            bool ofacEnabled,
            bool detailedConfigExists
        ) = contactVerification.getDetailedVerificationInfo(connectionType);
        
        console.log("=== VERIFICATION CONFIG DETAILS ===");
        console.log("Detailed Config ID:", vm.toString(detailedConfigId));
        console.log("Minimum Age Required:", olderThan);
        console.log("Forbidden Countries Count:", forbiddenCountriesCount);
        console.log("OFAC Compliance Enabled:", ofacEnabled);
        console.log("Detailed Config Exists:", detailedConfigExists);
    }
    
    function testInvalidJsonData() public {
        // Test with invalid JSON
        string memory invalidJson = "invalid json data";
        bytes memory userDefinedData = bytes(invalidJson);
        
        // Set up default config
        string[] memory emptyForbiddenCountries = new string[](0);
        contactVerification.setConfig("default", 16, emptyForbiddenCountries, false);
        
        // Should still work and return default config
        bytes32 configId = contactVerification.getConfigId(
            bytes32(0),
            bytes32(0),
            userDefinedData
        );
        
        assertTrue(configId != bytes32(0));
        console.log("Invalid JSON handled gracefully");
    }
    
    function testRealWorldScenario() public {
        // Simulate a real-world connection scenario
        string[] memory forbiddenCountries = new string[](2);
        forbiddenCountries[0] = "US";
        forbiddenCountries[1] = "CN";
        
        // Set up professional networking config
        contactVerification.setConfig("professional_networking", 21, forbiddenCountries, true);
        
        // Simulate connection data from database
        string memory connectionData = '{"connectionType":"professional_networking","fromUserId":"550e8400-e29b-41d4-a716-446655440000","toUserId":"550e8400-e29b-41d4-a716-446655440001","fromNfcId":"NFC-ABC123","toNfcId":"NFC-DEF456"}';
        bytes memory userDefinedData = bytes(connectionData);
        
        // Test verification
        bytes memory mockProof = bytes("professional_verification_proof");
        contactVerification.verifySelfProof(mockProof, userDefinedData);
        
        console.log("Real-world scenario test completed successfully");
    }
    
    function testShowRealWorldParameters() public {
        // Simulate a real-world connection scenario
        string[] memory forbiddenCountries = new string[](2);
        forbiddenCountries[0] = "US";
        forbiddenCountries[1] = "CN";
        
        // Set up professional networking config
        contactVerification.setConfig("professional_networking", 21, forbiddenCountries, true);
        
        // Simulate connection data from database
        string memory connectionData = '{"connectionType":"professional_networking","fromUserId":"550e8400-e29b-41d4-a716-446655440000","toUserId":"550e8400-e29b-41d4-a716-446655440001","fromNfcId":"NFC-ABC123","toNfcId":"NFC-DEF456"}';
        bytes memory userDefinedData = bytes(connectionData);
        
        // Parse and display all connection data
        (
            string memory connectionType,
            string memory fromUserId,
            string memory toUserId,
            string memory fromNfcId,
            string memory toNfcId,
            bytes32 configId,
            bool configExists
        ) = contactVerification.parseConnectionData(userDefinedData);
        
        console.log("=== REAL-WORLD CONNECTION SCENARIO ===");
        console.log("Raw Connection Data:", connectionData);
        console.log("Extracted Connection Type:", connectionType);
        console.log("From User ID (UUID):", fromUserId);
        console.log("To User ID (UUID):", toUserId);
        console.log("From NFC ID:", fromNfcId);
        console.log("To NFC ID:", toNfcId);
        console.log("Config ID:", vm.toString(configId));
        console.log("Config Exists:", configExists);
        
        // Get detailed verification configuration
        (
            bytes32 detailedConfigId,
            uint256 olderThan,
            uint256 forbiddenCountriesCount,
            bool ofacEnabled,
            bool detailedConfigExists
        ) = contactVerification.getDetailedVerificationInfo(connectionType);
        
        console.log("=== VERIFICATION REQUIREMENTS ===");
        console.log("Minimum Age Required:", olderThan);
        console.log("Number of Forbidden Countries:", forbiddenCountriesCount);
        console.log("OFAC Sanctions Check:", ofacEnabled);
        console.log("Verification Config Exists:", detailedConfigExists);
        
        // Get the actual forbidden countries
        ContactVerificationTest.VerificationConfig memory config = 
            contactVerification.getVerificationConfig(connectionType);
        
        console.log("=== FORBIDDEN COUNTRIES LIST ===");
        for (uint256 i = 0; i < config.forbiddenCountries.length; i++) {
            console.log("Forbidden Country", i, ":", config.forbiddenCountries[i]);
        }
    }
    
    function testDetailedParameterInspection() public {
        console.log("=== DETAILED PARAMETER INSPECTION TEST ===");
        
        // Set up multiple configs with different parameters
        string[] memory sportsForbidden = new string[](1);
        sportsForbidden[0] = "US";
        contactVerification.setConfig("sports_meetup", 18, sportsForbidden, false);
        
        string[] memory techForbidden = new string[](3);
        techForbidden[0] = "US";
        techForbidden[1] = "CN";
        techForbidden[2] = "RU";
        contactVerification.setConfig("tech_meetup", 21, techForbidden, true);
        
        string[] memory emptyForbidden = new string[](0);
        contactVerification.setConfig("casual_meetup", 16, emptyForbidden, false);
        
        // Test each connection type
        string[3] memory connectionTypes = ["sports_meetup", "tech_meetup", "casual_meetup"];
        
        for (uint256 i = 0; i < connectionTypes.length; i++) {
            string memory connType = connectionTypes[i];
            
            console.log("--- Testing Connection Type:", connType, "---");
            
            (
                bytes32 configId,
                uint256 olderThan,
                uint256 forbiddenCountriesCount,
                bool ofacEnabled,
                bool configExists
            ) = contactVerification.getDetailedVerificationInfo(connType);
            
            console.log("Config ID:", vm.toString(configId));
            console.log("Minimum Age:", olderThan);
            console.log("Forbidden Countries Count:", forbiddenCountriesCount);
            console.log("OFAC Enabled:", ofacEnabled);
            console.log("Config Exists:", configExists);
            
            // Get full config details
            ContactVerificationTest.VerificationConfig memory config = 
                contactVerification.getVerificationConfig(connType);
            
            console.log("Forbidden Countries:");
            for (uint256 j = 0; j < config.forbiddenCountries.length; j++) {
                console.log("  -", config.forbiddenCountries[j]);
            }
            console.log("");
        }
        
        console.log("Detailed parameter inspection completed");
    }
}
