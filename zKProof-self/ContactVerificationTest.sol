// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title ContactVerificationTest
 * @notice Simplified version for testing without Self Protocol dependencies
 * @dev This is a test version that simulates the verification flow
 */
contract ContactVerificationTest {
    // Storage for verification configs
    mapping(uint256 => bytes32) public configs;
    
    // Events
    event ContactVerified(
        address indexed verifier,
        bytes32 indexed connectionId,
        string fromUserId,
        string toUserId,
        string fromNfcId,
        string toNfcId,
        uint256 timestamp
    );
    
    event ConfigSet(
        uint256 indexed configKey,
        bytes32 indexed configId,
        string description
    );
    
    event VerificationFailed(
        address indexed verifier,
        string reason,
        bytes userDefinedData
    );
    
    // New events for detailed parameter logging
    event VerificationParameters(
        address indexed verifier,
        string connectionType,
        uint256 olderThan,
        string[] forbiddenCountries,
        bool ofacEnabled,
        string fromUserId,
        string toUserId,
        string fromNfcId,
        string toNfcId,
        bytes32 configId
    );
    
    event AttestationDetails(
        address indexed verifier,
        string userDefinedDataString,
        string extractedConnectionType,
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        uint256 blockTimestamp,
        uint256 blockNumber
    );

    // Mock verification config structure
    struct VerificationConfig {
        uint256 olderThan;
        string[] forbiddenCountries;
        bool ofacEnabled;
    }
    
    mapping(uint256 => VerificationConfig) public verificationConfigs;

    /**
     * @notice Set a verification config for a specific connection type
     * @param configDesc Description of the config (e.g., "sports_meetup", "professional_networking")
     * @param olderThan Minimum age requirement
     * @param forbiddenCountries Array of forbidden country codes
     * @param ofacEnabled Whether OFAC compliance is enabled
     */
    function setConfig(
        string memory configDesc,
        uint256 olderThan,
        string[] memory forbiddenCountries,
        bool ofacEnabled
    ) public {
        // Create the key from config description
        uint256 key = uint256(keccak256(bytes(configDesc)));
        
        // Create mock config ID
        bytes32 configId = keccak256(abi.encodePacked(configDesc, block.timestamp));
        
        // Store the config
        configs[key] = configId;
        verificationConfigs[key] = VerificationConfig({
            olderThan: olderThan,
            forbiddenCountries: forbiddenCountries,
            ofacEnabled: ofacEnabled
        });
        
        emit ConfigSet(key, configId, configDesc);
    }

    /**
     * @notice Get config ID based on userDefinedData
     * @dev The userDefinedData should contain connection information in JSON format
     * Expected format: '{"connectionType":"sports_meetup","fromUserId":"uuid","toUserId":"uuid","fromNfcId":"nfc123","toNfcId":"nfc456"}'
     * @param destinationChainId The destination chain ID
     * @param userIdentifier The user identifier
     * @param userDefinedData The user defined data containing connection info
     * @return The config ID for verification
     */
    function getConfigId(
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        bytes memory userDefinedData
    ) public view virtual returns (bytes32) {
        // Parse userDefinedData to extract connection type
        string memory connectionType = _extractConnectionType(userDefinedData);
        
        // Create key from connection type
        uint256 key = uint256(keccak256(bytes(connectionType)));
        
        // Return the config ID for this connection type
        return configs[key];
    }

    /**
     * @notice Mock verification function that simulates Self Protocol verification
     * @param proofPayload The proof payload (mock)
     * @param userDefinedData The user defined data containing connection info
     */
    function verifySelfProof(bytes memory proofPayload, bytes memory userDefinedData) public {
        // Emit attestation details first
        string memory userDefinedDataString = string(userDefinedData);
        string memory extractedConnectionType = _extractConnectionType(userDefinedData);
        
        emit AttestationDetails(
            msg.sender,
            userDefinedDataString,
            extractedConnectionType,
            bytes32(0), // destinationChainId - would be provided in real implementation
            bytes32(0), // userIdentifier - would be provided in real implementation
            block.timestamp,
            block.number
        );
        
        // Parse the userDefinedData to extract connection information
        (string memory fromUserId, string memory toUserId, string memory fromNfcId, string memory toNfcId) = 
            _parseConnectionData(userDefinedData);
        
        // Get the verification config for this connection type
        uint256 configKey = uint256(keccak256(bytes(extractedConnectionType)));
        VerificationConfig memory config = verificationConfigs[configKey];
        bytes32 configId = configs[configKey];
        
        // Emit detailed verification parameters
        emit VerificationParameters(
            msg.sender,
            extractedConnectionType,
            config.olderThan,
            config.forbiddenCountries,
            config.ofacEnabled,
            fromUserId,
            toUserId,
            fromNfcId,
            toNfcId,
            configId
        );
        
        // Mock verification - in real implementation this would call Self Protocol
        // For testing, we'll just simulate a successful verification
        
        // Generate a unique connection ID
        bytes32 connectionId = keccak256(abi.encodePacked(
            fromUserId,
            toUserId,
            fromNfcId,
            toNfcId,
            block.timestamp
        ));
        
        // Emit verification success event
        emit ContactVerified(
            msg.sender,
            connectionId,
            fromUserId,
            toUserId,
            fromNfcId,
            toNfcId,
            block.timestamp
        );
    }

    /**
     * @notice Extract connection type from userDefinedData
     * @param userDefinedData The user defined data
     * @return The connection type string
     */
    function _extractConnectionType(bytes memory userDefinedData) 
        internal pure returns (string memory) {
        // Convert bytes to string
        string memory dataString = string(userDefinedData);
        
        // Simple JSON parsing to extract connectionType
        // Expected format: {"connectionType":"sports_meetup",...}
        bytes memory dataBytes = bytes(dataString);
        
        // Find "connectionType" key
        bytes memory keyBytes = bytes('"connectionType"');
        uint256 keyIndex = _findSubstring(dataBytes, keyBytes);
        
        if (keyIndex == type(uint256).max) {
            return "default"; // Default connection type if not found
        }
        
        // Find the value after the colon
        uint256 colonIndex = _findChar(dataBytes, ':', keyIndex);
        if (colonIndex == type(uint256).max) {
            return "default";
        }
        
        // Find the opening quote of the value
        uint256 valueStart = _findChar(dataBytes, '"', colonIndex);
        if (valueStart == type(uint256).max) {
            return "default";
        }
        
        // Find the closing quote of the value
        uint256 valueEnd = _findChar(dataBytes, '"', valueStart + 1);
        if (valueEnd == type(uint256).max) {
            return "default";
        }
        
        // Extract the value
        bytes memory valueBytes = new bytes(valueEnd - valueStart - 1);
        for (uint256 i = 0; i < valueBytes.length; i++) {
            valueBytes[i] = dataBytes[valueStart + 1 + i];
        }
        
        return string(valueBytes);
    }

    /**
     * @notice Parse connection data from userDefinedData
     * @param userDefinedData The user defined data
     * @return fromUserId The from user ID
     * @return toUserId The to user ID
     * @return fromNfcId The from NFC ID
     * @return toNfcId The to NFC ID
     */
    function _parseConnectionData(bytes memory userDefinedData) 
        internal pure returns (
            string memory fromUserId,
            string memory toUserId,
            string memory fromNfcId,
            string memory toNfcId
        ) {
        string memory dataString = string(userDefinedData);
        bytes memory dataBytes = bytes(dataString);
        
        fromUserId = _extractJsonValue(dataBytes, "fromUserId");
        toUserId = _extractJsonValue(dataBytes, "toUserId");
        fromNfcId = _extractJsonValue(dataBytes, "fromNfcId");
        toNfcId = _extractJsonValue(dataBytes, "toNfcId");
    }

    /**
     * @notice Extract a JSON value by key
     * @param dataBytes The JSON data as bytes
     * @param key The key to extract
     * @return The extracted value
     */
    function _extractJsonValue(bytes memory dataBytes, string memory key) 
        internal pure returns (string memory) {
        bytes memory keyBytes = bytes(string(abi.encodePacked('"', key, '"')));
        uint256 keyIndex = _findSubstring(dataBytes, keyBytes);
        
        if (keyIndex == type(uint256).max) {
            return "";
        }
        
        uint256 colonIndex = _findChar(dataBytes, ':', keyIndex);
        if (colonIndex == type(uint256).max) {
            return "";
        }
        
        uint256 valueStart = _findChar(dataBytes, '"', colonIndex);
        if (valueStart == type(uint256).max) {
            return "";
        }
        
        uint256 valueEnd = _findChar(dataBytes, '"', valueStart + 1);
        if (valueEnd == type(uint256).max) {
            return "";
        }
        
        bytes memory valueBytes = new bytes(valueEnd - valueStart - 1);
        for (uint256 i = 0; i < valueBytes.length; i++) {
            valueBytes[i] = dataBytes[valueStart + 1 + i];
        }
        
        return string(valueBytes);
    }

    /**
     * @notice Find a substring in bytes
     * @param data The data to search in
     * @param pattern The pattern to find
     * @return The index of the pattern or max uint256 if not found
     */
    function _findSubstring(bytes memory data, bytes memory pattern) 
        internal pure returns (uint256) {
        if (pattern.length > data.length) {
            return type(uint256).max;
        }
        
        for (uint256 i = 0; i <= data.length - pattern.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return i;
            }
        }
        
        return type(uint256).max;
    }

    /**
     * @notice Find a character in bytes starting from a specific index
     * @param data The data to search in
     * @param char The character to find
     * @param startIndex The index to start searching from
     * @return The index of the character or max uint256 if not found
     */
    function _findChar(bytes memory data, bytes1 char, uint256 startIndex) 
        internal pure returns (uint256) {
        for (uint256 i = startIndex; i < data.length; i++) {
            if (data[i] == char) {
                return i;
            }
        }
        return type(uint256).max;
    }

    /**
     * @notice Check if a config exists for a given connection type
     * @param connectionType The connection type to check
     * @return True if config exists, false otherwise
     */
    function hasConfig(string memory connectionType) public view returns (bool) {
        uint256 key = uint256(keccak256(bytes(connectionType)));
        return configs[key] != bytes32(0);
    }

    /**
     * @notice Get config ID for a specific connection type
     * @param connectionType The connection type
     * @return The config ID
     */
    function getConfigIdByType(string memory connectionType) public view returns (bytes32) {
        uint256 key = uint256(keccak256(bytes(connectionType)));
        return configs[key];
    }

    /**
     * @notice Get verification config for a connection type
     * @param connectionType The connection type
     * @return The verification config
     */
    function getVerificationConfig(string memory connectionType) public view returns (VerificationConfig memory) {
        uint256 key = uint256(keccak256(bytes(connectionType)));
        return verificationConfigs[key];
    }

    /**
     * @notice Get detailed verification information for a connection type
     * @param connectionType The connection type
     * @return configId The config ID
     * @return olderThan The minimum age requirement
     * @return forbiddenCountriesCount The number of forbidden countries
     * @return ofacEnabled Whether OFAC compliance is enabled
     * @return configExists Whether the config exists
     */
    function getDetailedVerificationInfo(string memory connectionType) 
        public view returns (
            bytes32 configId,
            uint256 olderThan,
            uint256 forbiddenCountriesCount,
            bool ofacEnabled,
            bool configExists
        ) {
        uint256 key = uint256(keccak256(bytes(connectionType)));
        configId = configs[key];
        configExists = configId != bytes32(0);
        
        if (configExists) {
            VerificationConfig memory config = verificationConfigs[key];
            olderThan = config.olderThan;
            forbiddenCountriesCount = config.forbiddenCountries.length;
            ofacEnabled = config.ofacEnabled;
        }
    }

    /**
     * @notice Parse and return all connection data from userDefinedData
     * @param userDefinedData The user defined data
     * @return connectionType The extracted connection type
     * @return fromUserId The from user ID
     * @return toUserId The to user ID
     * @return fromNfcId The from NFC ID
     * @return toNfcId The to NFC ID
     * @return configId The config ID for this connection type
     * @return configExists Whether the config exists
     */
    function parseConnectionData(bytes memory userDefinedData) 
        public view returns (
            string memory connectionType,
            string memory fromUserId,
            string memory toUserId,
            string memory fromNfcId,
            string memory toNfcId,
            bytes32 configId,
            bool configExists
        ) {
        connectionType = _extractConnectionType(userDefinedData);
        (fromUserId, toUserId, fromNfcId, toNfcId) = _parseConnectionData(userDefinedData);
        
        uint256 key = uint256(keccak256(bytes(connectionType)));
        configId = configs[key];
        configExists = configId != bytes32(0);
    }
}
