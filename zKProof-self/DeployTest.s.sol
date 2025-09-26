// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ContactVerificationTest} from "./ContactVerificationTest.sol";

/**
 * @title DeployContactVerificationTest
 * @notice Deployment script for ContactVerificationTest contract
 */
contract DeployContactVerificationTest is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the contract
        ContactVerificationTest contactVerification = new ContactVerificationTest();
        
        // Set up default verification configs
        _setupDefaultConfigs(contactVerification);
        
        vm.stopBroadcast();
        
        // Log deployment information
        console.log("ContactVerificationTest deployed at:", address(contactVerification));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
    }
    
    function _setupDefaultConfigs(ContactVerificationTest contactVerification) internal {
        // Sports meetup config - verify age 18+ and forbid US
        string[] memory forbiddenCountries = new string[](1);
        forbiddenCountries[0] = "US";
        
        contactVerification.setConfig("sports_meetup", 18, forbiddenCountries, false);
        
        // Professional networking config - verify age 21+ and allow all countries
        string[] memory emptyForbiddenCountries = new string[](0);
        
        contactVerification.setConfig("professional_networking", 21, emptyForbiddenCountries, false);
        
        // Default config - basic verification
        contactVerification.setConfig("default", 16, emptyForbiddenCountries, false);
        
        // Tech meetup config - age 18+, forbid certain countries
        string[] memory techForbiddenCountries = new string[](2);
        techForbiddenCountries[0] = "US";
        techForbiddenCountries[1] = "CN";
        
        contactVerification.setConfig("tech_meetup", 18, techForbiddenCountries, true);
    }
}
