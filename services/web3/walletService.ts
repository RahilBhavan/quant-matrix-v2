/**
 * WalletService - MetaMask connection and management
 */

import { ethers } from 'ethers';

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(): Promise<string> {
    // TODO: Implement MetaMask connection
    // TODO: Switch to Sepolia testnet
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    return await this.signer.getAddress();
  }

  async getBalance(address: string): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getBalance(address);
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }
}

// Singleton instance
export const walletService = new WalletService();
