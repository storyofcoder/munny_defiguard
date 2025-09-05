/**
 * @fileoverview
 * Utility functions for managing MetaMask session data (account and chain)
 * in `localStorage`. This provides a simple persistence layer so that
 * users remain connected across page reloads and browser sessions.
 *
 * These helpers handle:
 * - Saving the connected wallet address and network (chain ID)
 * - Loading the persisted session state
 * - Clearing session data on disconnect or account change
 *
 * NOTE: localStorage is used here because it is synchronous, fast,
 * and persistent until explicitly cleared by the user or application.
 */

/**
 * Key names used for storing session data in localStorage.
 *
 * @constant
 * @type {{account: string, chain: string}}
 */
const KEYS = {
  /** The connected MetaMask account address */
  account: "connectedAccount",

  /** The connected blockchain network chain ID */
  chain: "connectedChain",
};

/**
 * Saves the current wallet session to localStorage.
 *
 * @function saveSession
 * @param {string} account - The connected wallet address (e.g., 0x1234...).
 * @param {string} chainId - The connected network's chain ID in hex format (e.g., "0x1").
 *
 * @example
 * saveSession("0xAbC123...", "0x1");
 */
export function saveSession(account, chainId) {
  try {
    if (account) localStorage.setItem(KEYS.account, account);
    if (chainId) localStorage.setItem(KEYS.chain, chainId);
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

/**
 * Loads the persisted wallet session from localStorage.
 *
 * @function loadSession
 * @returns {{account: string, chainId: string}} The persisted account and chain ID.
 * If no data exists, empty strings are returned.
 *
 * @example
 * const { account, chainId } = loadSession();
 * console.log(account); // "0xAbC123..."
 */
export function loadSession() {
  try {
    return {
      account: localStorage.getItem(KEYS.account) || "",
      chainId: localStorage.getItem(KEYS.chain) || "",
    };
  } catch (err) {
    console.error("Failed to load session:", err);
    return { account: "", chainId: "" };
  }
}

/**
 * Clears the saved wallet session from localStorage.
 *
 * @function clearSession
 * @example
 * clearSession(); // Removes saved account and chain ID
 */
export function clearSession() {
  try {
    localStorage.removeItem(KEYS.account);
    localStorage.removeItem(KEYS.chain);
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}
