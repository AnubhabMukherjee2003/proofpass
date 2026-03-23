// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DecentralizedTicketRegistry.sol";

contract DeployScript is Script {
    function run() external {
        // Start broadcasting transactions with the provided private key
        vm.startBroadcast();

        // Deploy the contract
        DecentralizedTicketRegistry registry = new DecentralizedTicketRegistry();

        // Log the deployed contract address
        console.log("DecentralizedTicketRegistry deployed to:", address(registry));

        vm.stopBroadcast();
    }
}
