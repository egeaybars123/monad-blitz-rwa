// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract CarbonBlitz is ERC20, Ownable, EIP712 {
    using ECDSA for bytes32;

    // keccak256("Mint(address to,uint256 amount,address deviceAddress,uint256 nonce,uint256 deadline)")
    bytes32 private constant MINT_TYPEHASH =
        keccak256("Mint(address to,uint256 amount,address deviceAddress,uint256 nonce,uint256 deadline)");

    /// @notice Whitelisted smart devices allowed to authorize mints
    mapping(address => bool) public whitelistedSmartDevices;

    /// @notice Nonces are set to prevent replay attacks
    mapping(address => uint256) public nonces;

    event SmartDeviceWhitelisted(address indexed device);
    event SmartDeviceRemoved(address indexed device);
    event MintedWithSignature(address indexed to, uint256 amount, address indexed device, uint256 nonce);

    constructor(uint256 initialSupply)
        ERC20("CarbonBlitz", "CBLTZ")
        Ownable(msg.sender)
        EIP712("CarbonBlitz", "1")
    {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice Mint tokens authorized by a whitelisted device via EIP-712 signature.
     * @param to        Recipient of minted tokens
     * @param amount    Amount to mint
     * @param device    Whitelisted device address that signed the authorization
     * @param deadline  UTC timestamp; signature is invalid after this time
     * @param signature EIP-712 signature over (to, amount, device, nonce, deadline) with current device nonce
     */
    function mint(
        address to,
        uint256 amount,
        address device,
        uint256 deadline,
        bytes calldata signature
    ) external onlySmartDevices(device) {
        require(block.timestamp <= deadline, "Signature expired");

        uint256 nonce = nonces[device];

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                to,
                amount,
                device,
                nonce,
                deadline
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        require(signer == device, "Invalid signature");

        // Consume the nonce *after* successful verification
        unchecked { nonces[device] = nonce + 1; }

        _mint(to, amount);

        emit MintedWithSignature(to, amount, device, nonce);
    }

    /// @notice Whitelist a device address so it can authorize mints
    function whitelistSmartDevice(address device) external onlyOwner {
        whitelistedSmartDevices[device] = true;
        emit SmartDeviceWhitelisted(device);
    }

    /// @notice Batch whitelist device addresses
    function whitelistBatchSmartDevices(address[] calldata devices) external onlyOwner {
        for (uint256 i = 0; i < devices.length; i++) {
            whitelistedSmartDevices[devices[i]] = true;
            emit SmartDeviceWhitelisted(devices[i]);
        }
    }

    /// @notice Remove a device from the whitelist
    function removeSmartDevice(address device) external onlyOwner {
        whitelistedSmartDevices[device] = false;
        emit SmartDeviceRemoved(device);
    }

    // **************** MODIFIERS ****************
    modifier onlySmartDevices(address device) {
        require(whitelistedSmartDevices[device], "Device not whitelisted");
        _;
    }

    // **************** HELPER VIEWS  ****************

    /**
     * @notice Returns the digest that the device should sign for its *current* nonce.
     *         Useful for off-chain signing flows.
     */
    function currentMintDigest(
        address to,
        uint256 amount,
        address device,
        uint256 deadline
    ) external view returns (bytes32 digest, uint256 nonce) {
        nonce = nonces[device];
        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, to, amount, device, nonce, deadline)
        );
        digest = _hashTypedDataV4(structHash);
    }

    /**
     * @notice Returns the digest for an *explicit* nonce (e.g., pre-signing for a known future nonce).
     */
    function mintDigestForNonce(
        address to,
        uint256 amount,
        address device,
        uint256 nonce,
        uint256 deadline
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, to, amount, device, nonce, deadline)
        );
        return _hashTypedDataV4(structHash);
    }
}
