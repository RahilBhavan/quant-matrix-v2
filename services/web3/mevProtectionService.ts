/**
 * MevProtectionService - Flashbots RPC integration for MEV protection
 *
 * Provides private transaction submission to protect swaps from
 * sandwich attacks and frontrunning.
 */

import { ethers } from 'ethers';

// Flashbots Protect RPC endpoints
export const FLASHBOTS_RPC = {
    mainnet: 'https://rpc.flashbots.net',
    sepolia: 'https://rpc-sepolia.flashbots.net',
} as const;

export interface MevProtectionConfig {
    enabled: boolean;
    privateTransaction: boolean;
    maxPriorityFeePerGas?: bigint; // wei
}

export class MevProtectionService {
    private config: MevProtectionConfig = {
        enabled: false,
        privateTransaction: true,
    };

    private flashbotsProvider: ethers.JsonRpcProvider | null = null;

    /**
     * Enable or disable MEV protection
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        if (enabled) {
            this.initFlashbotsProvider();
        } else {
            this.flashbotsProvider = null;
        }
    }

    /**
     * Check if MEV protection is currently enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Update MEV protection configuration
     */
    updateConfig(config: Partial<MevProtectionConfig>): void {
        this.config = { ...this.config, ...config };
        if (config.enabled !== undefined) {
            this.setEnabled(config.enabled);
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): MevProtectionConfig {
        return { ...this.config };
    }

    /**
     * Initialize Flashbots RPC provider
     */
    private initFlashbotsProvider(): void {
        // Use Sepolia for testnet, mainnet for production
        const rpcUrl = FLASHBOTS_RPC.sepolia;
        this.flashbotsProvider = new ethers.JsonRpcProvider(rpcUrl);
    }

    /**
     * Get protected provider for transaction submission
     * Returns Flashbots provider if enabled, otherwise null
     */
    getProtectedProvider(): ethers.JsonRpcProvider | null {
        if (!this.config.enabled) {
            return null;
        }
        if (!this.flashbotsProvider) {
            this.initFlashbotsProvider();
        }
        return this.flashbotsProvider;
    }

    /**
     * Submit a transaction through Flashbots protect RPC
     * This ensures the transaction is not visible in the public mempool
     */
    async submitPrivateTransaction(
        signedTx: string
    ): Promise<{ hash: string; success: boolean }> {
        if (!this.config.enabled) {
            throw new Error('MEV protection is not enabled');
        }

        const provider = this.getProtectedProvider();
        if (!provider) {
            throw new Error('Flashbots provider not initialized');
        }

        try {
            // Submit signed transaction to Flashbots
            const hash = await provider.send('eth_sendRawTransaction', [signedTx]);

            return {
                hash,
                success: true,
            };
        } catch (error: any) {
            console.error('Flashbots submission failed:', error);
            throw new Error(`MEV protection submission failed: ${error.message}`);
        }
    }

    /**
     * Check transaction status through Flashbots
     */
    async getTransactionStatus(
        txHash: string
    ): Promise<'pending' | 'included' | 'failed' | 'unknown'> {
        const provider = this.getProtectedProvider();
        if (!provider) {
            return 'unknown';
        }

        try {
            const receipt = await provider.getTransactionReceipt(txHash);
            if (receipt) {
                return receipt.status === 1 ? 'included' : 'failed';
            }
            return 'pending';
        } catch {
            return 'unknown';
        }
    }
}

// Singleton instance
export const mevProtectionService = new MevProtectionService();
