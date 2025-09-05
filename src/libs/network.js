/**
 * @fileoverview
 * Centralized configuration and utility functions for managing EVM-compatible
 * blockchain networks within the dApp. Provides a single source of truth for
 * network parameters and helpers for interacting with MetaMask's
 * `wallet_switchEthereumChain` and `wallet_addEthereumChain` APIs
 * (EIP-3085 / EIP-3326 standards).
 *
 * This module enables seamless switching between networks such as
 * Ethereum Mainnet, Sepolia Testnet, and others by defining
 * supported chain parameters and handling network add/switch logic.
 */

/**
 * Map of supported blockchain networks and their required parameters
 * according to MetaMask's `wallet_addEthereumChain` specification.
 *
 * Keys are hexadecimal chain IDs (e.g., "0x1" for Ethereum Mainnet).
 *
 * @constant
 * @type {Object.<string, Object>}
 * @see https://eips.ethereum.org/EIPS/eip-3085
 */
export const CHAIN_PARAMS = {
  /** Ethereum Mainnet configuration */
  "0x1": {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.ankr.com/eth"],
    blockExplorerUrls: ["https://etherscan.io"],
  },

  /** Sepolia Testnet configuration (chainId: 11155111) */
  "0xaa36a7": {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

/**
 * Requests MetaMask to switch to a specified blockchain network.  
 * If the target network is not recognized by MetaMask, it will first
 * attempt to add the network using the parameters defined in `CHAIN_PARAMS`
 * and then perform the switch.
 *
 * @async
 * @function switchOrAddChain
 * @param {Object} provider - EIP-1193-compatible provider instance (e.g., `window.ethereum`).
 * @param {string} hexChainId - Target chain ID in hexadecimal format (e.g., "0x1").
 * @throws {Error} Throws an error if the chain cannot be switched or added.
 *
 * @example
 * // Switch to Ethereum Mainnet
 * await switchOrAddChain(window.ethereum, "0x1");
 *
 * @see https://eips.ethereum.org/EIPS/eip-3326
 */
export async function switchOrAddChain(provider, hexChainId) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (err) {
    /**
     * Error code 4902 indicates that the target network is not added to MetaMask.
     * In this case, attempt to add the network using the parameters in CHAIN_PARAMS.
     */
    if (err?.code === 4902 && CHAIN_PARAMS[hexChainId]) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [CHAIN_PARAMS[hexChainId]],
      });

      // Retry switching after successfully adding the network
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } else {
      throw err;
    }
  }
}

/**
 * Retrieves the human-readable chain name for a given chain ID.
 *
 * @function getChainName
 * @param {string} hexId - Chain ID in hexadecimal format.
 * @returns {string} Returns the network name if found; otherwise, returns the chain ID.
 *
 * @example
 * getChainName("0x1"); // Returns "Ethereum Mainnet"
 * getChainName("0xaa36a7"); // Returns "Sepolia Testnet"
 */
export function getChainName(hexId) {
  return CHAIN_PARAMS[hexId]?.chainName || hexId;
}
