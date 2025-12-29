/**
 * Blockchain Error Parser
 * 
 * Translates cryptic blockchain hex codes and error messages into 
 * human-readable text for better UX.
 */

// Common Ethereum error selectors (first 4 bytes of keccak256 hash)
const ERROR_SELECTORS: Record<string, string> = {
    // ERC20 errors
    '0x13be252b': 'Insufficient balance',
    '0xfb8f41b2': 'Insufficient allowance',
    '0x8b6f1e5c': 'Transfer failed',

    // Uniswap errors
    '0x4e487b71': 'Arithmetic overflow/underflow',
    '0x0dc1fad1': 'Too little received (slippage too high)',
    '0x39462e3e': 'Too much requested',
    '0x1a2f4f15': 'Price limit exceeded',
    '0x5e5c5172': 'Not enough liquidity',
    '0x29d3e7ae': 'Pool not initialized',
    '0x1c7e8f66': 'Invalid pool key',

    // Aave errors  
    '0x2d9d5ec1': 'Insufficient collateral',
    '0x8c9e3c3c': 'Health factor below threshold',
    '0x35278d12': 'Amount exceeds collateral',
    '0xbe156e35': 'Not enough liquidity in reserve',
    '0x8f83e6d1': 'Borrowing not enabled',
    '0xf2c2ed50': 'Reserve is frozen',
    '0x9a3851ee': 'Reserve is paused',
    '0x3bc5b10d': 'Invalid amount',
    '0x4c5e8bce': 'No debt of selected type',

    // General errors
    '0x08c379a0': 'Error with reason', // Standard revert with reason string
    '0x4e487b71': 'Panic error',
};

// Common error message patterns to translate
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
    // Metamask/wallet errors
    { pattern: /user rejected/i, message: 'Transaction was rejected by user' },
    { pattern: /user denied/i, message: 'Transaction was denied by user' },
    { pattern: /insufficient funds/i, message: 'Insufficient funds for gas + value' },
    { pattern: /nonce too low/i, message: 'Transaction nonce too low. Try again.' },
    { pattern: /replacement.*underpriced/i, message: 'Gas price too low to replace pending transaction' },
    { pattern: /transaction underpriced/i, message: 'Gas price too low. Increase gas price.' },

    // Network errors
    { pattern: /network error/i, message: 'Network connection error. Check your internet.' },
    { pattern: /timeout/i, message: 'Transaction timed out. Network congested?' },
    { pattern: /could not detect network/i, message: 'Unable to detect network. Check Metamask.' },

    // Contract errors
    { pattern: /execution reverted/i, message: 'Transaction reverted by contract' },
    { pattern: /call revert exception/i, message: 'Contract call failed' },
    { pattern: /missing revert data/i, message: 'Transaction failed (no error message)' },
    { pattern: /out of gas/i, message: 'Transaction ran out of gas' },
    { pattern: /gas limit/i, message: 'Gas limit too low for transaction' },

    // ERC20 specific
    { pattern: /transfer amount exceeds balance/i, message: 'Insufficient token balance' },
    { pattern: /transfer amount exceeds allowance/i, message: 'Token approval needed' },
    { pattern: /approve from non-zero/i, message: 'Reset approval to 0 first' },

    // Uniswap specific
    { pattern: /STF/i, message: 'Swap failed: Slippage too high' },
    { pattern: /TF/i, message: 'Transfer failed' },
    { pattern: /deadline/i, message: 'Transaction deadline exceeded' },
    { pattern: /price slippage/i, message: 'Price moved beyond slippage tolerance' },

    // Aave specific
    { pattern: /health factor/i, message: 'Health factor too low for this action' },
    { pattern: /not enough collateral/i, message: 'Insufficient collateral for borrow' },
    { pattern: /reserve is frozen/i, message: 'This asset is currently frozen' },
    { pattern: /reserve is paused/i, message: 'This asset is currently paused' },
];

// Protocol-specific error codes
const AAVE_ERROR_CODES: Record<string, string> = {
    '1': 'Pool is paused',
    '2': 'Invalid amount',
    '3': 'No debt of selected type',
    '4': 'No explicit amount to repay set',
    '5': 'No stable rate loan in progress',
    '6': 'Borrowing not enabled for this reserve',
    '7': 'Stable borrowing not enabled',
    '8': 'Not enough liquidity to borrow',
    '9': 'Supply cap exceeded',
    '10': 'Borrow cap exceeded',
    '11': 'Collateral balance is 0',
    '12': 'Health factor lower than liquidation threshold',
    '13': 'Collateral cannot be liquidated',
    '14': 'No bad debt',
    '15': 'Borrow cap exceeded',
    '27': 'Reserve frozen',
    '28': 'Reserve paused',
    '29': 'Withdrawing not paused',
    '30': 'Borrowing not paused',
    '33': 'Price oracle sentinel check failed',
    '34': 'Asset not borrowable in isolation mode',
    '35': 'Asset not borrowed in isolation mode',
    '36': 'Total debt ceiling exceeded',
};

/**
 * Parse blockchain error into human-readable message
 */
export function parseBlockchainError(error: any): string {
    // If it's already a clear string, might be from our own checks
    if (typeof error === 'string' && !error.includes('0x')) {
        return error;
    }

    const errorStr = error?.message || error?.reason || String(error);

    // Check for error selector (hex prefix)
    const selectorMatch = errorStr.match(/0x[a-fA-F0-9]{8}/);
    if (selectorMatch) {
        const selector = selectorMatch[0].toLowerCase();
        if (ERROR_SELECTORS[selector]) {
            return ERROR_SELECTORS[selector];
        }
    }

    // Check for Aave error codes
    const aaveCodeMatch = errorStr.match(/error (\d+)/i);
    if (aaveCodeMatch) {
        const code = aaveCodeMatch[1];
        if (AAVE_ERROR_CODES[code]) {
            return `Aave: ${AAVE_ERROR_CODES[code]}`;
        }
    }

    // Check against pattern matches
    for (const { pattern, message } of ERROR_PATTERNS) {
        if (pattern.test(errorStr)) {
            return message;
        }
    }

    // Try to extract revert reason from standard Solidity error format
    const reasonMatch = errorStr.match(/reverted with reason string '([^']+)'/);
    if (reasonMatch) {
        return `Contract error: ${reasonMatch[1]}`;
    }

    // Try to extract custom error name
    const customErrorMatch = errorStr.match(/reverted with custom error '([^']+)'/);
    if (customErrorMatch) {
        return `Error: ${customErrorMatch[1]}`;
    }

    // Extract any quoted strings as potential error messages
    const quotedMatch = errorStr.match(/"([^"]+)"/);
    if (quotedMatch && quotedMatch[1].length > 3) {
        return quotedMatch[1];
    }

    // If error is too long (raw hex), truncate and add generic message
    if (errorStr.length > 100 && errorStr.includes('0x')) {
        const shortStr = errorStr.substring(0, 100);
        return `Transaction failed: ${shortStr}...`;
    }

    // Return original if we can't parse it, but clean it up
    return cleanErrorMessage(errorStr);
}

/**
 * Clean up error message formatting
 */
function cleanErrorMessage(message: string): string {
    return message
        // Remove common prefixes
        .replace(/^Error: /, '')
        .replace(/^Uncaught /, '')
        // Remove transaction hash mentions
        .replace(/\(transactionHash: "[^"]+"\)/g, '')
        // Remove address mentions if they don't add value
        .replace(/address [a-fA-F0-9]{40}/g, 'address')
        // Trim and limit length
        .trim()
        .substring(0, 200);
}

/**
 * Get user-friendly action suggestion based on error
 */
export function getErrorSuggestion(error: string): string | null {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('insufficient') && lowerError.includes('balance')) {
        return 'Try getting tokens from a Sepolia faucet';
    }
    if (lowerError.includes('allowance') || lowerError.includes('approval')) {
        return 'Approve the token first before swapping';
    }
    if (lowerError.includes('slippage')) {
        return 'Try increasing slippage tolerance';
    }
    if (lowerError.includes('gas')) {
        return 'Try increasing gas limit or gas price';
    }
    if (lowerError.includes('health factor')) {
        return 'Repay some debt or add more collateral';
    }
    if (lowerError.includes('rejected') || lowerError.includes('denied')) {
        return 'Transaction cancelled. Retry when ready.';
    }
    if (lowerError.includes('deadline')) {
        return 'Transaction took too long. Submit again.';
    }

    return null;
}

/**
 * Format error with suggestion for UI display
 */
export function formatErrorForUI(error: any): { message: string; suggestion: string | null } {
    const message = parseBlockchainError(error);
    const suggestion = getErrorSuggestion(message);

    return { message, suggestion };
}
