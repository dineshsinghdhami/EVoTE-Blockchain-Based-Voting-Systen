// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

/**
 * @title EVoTEForwarder
 * @notice Trusted forwarder used for gasless EVoTE transactions.
 *
 * Users sign requests with MetaMask.
 * The EVoTE backend relayer submits those signed requests
 * and pays the Sepolia gas fee.
 */
contract EVoTEForwarder is ERC2771Forwarder {
    constructor()
        ERC2771Forwarder("EVoTEForwarder")
    {}
}