/**
 * WalletService - MetaMask connection and management
 */

import { ethers } from 'ethers';
import {
  ChainId,
  ChainConfig,
  CHAIN_CONFIGS,
  getChainConfig,
  getChainIdHex,
  isSupportedChain,
  DEFAULT_CHAIN_ID,
} from './chainConfig';

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private connectedAddress: string | null = null;
  private currentChainId: ChainId | null = null;

  async connect(): Promise<string> {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error(
        'MetaMask is not installed. Please install MetaMask extension to continue.'
      );
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request<string[]>({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.connectedAddress = accounts[0];

      // Check current network
      const network = await this.provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Store current chain if supported, otherwise switch to default
      if (isSupportedChain(currentChainId)) {
        this.currentChainId = currentChainId as ChainId;
      } else {
        await this.switchChain(DEFAULT_CHAIN_ID);
      }

      // Set up account change listener
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));

      // Set up network change listener
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      return this.connectedAddress;
    } catch (error: any) {
      // Reset state on error
      this.provider = null;
      this.signer = null;
      this.connectedAddress = null;

      // Handle specific error cases
      if (error.code === 4001) {
        throw new Error('Connection request rejected by user');
      }

      throw error;
    }
  }

  async switchChain(chainId: ChainId): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const chainConfig = getChainConfig(chainId);
    const chainIdHex = getChainIdHex(chainId);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      this.currentChainId = chainId;
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: chainConfig.name,
              nativeCurrency: chainConfig.nativeCurrency,
              rpcUrls: chainConfig.rpcUrls,
              blockExplorerUrls: chainConfig.blockExplorerUrls,
            }],
          });
          this.currentChainId = chainId;
        } catch (addError) {
          throw new Error(`Failed to add ${chainConfig.name} to MetaMask`);
        }
      } else {
        throw new Error(`Failed to switch to ${chainConfig.name}: ${error.message}`);
      }
    }
  }

  // Legacy method for backwards compatibility
  async switchToSepolia(): Promise<void> {
    return this.switchChain(ChainId.SEPOLIA);
  }

  async disconnect(): Promise<void> {
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }

    this.provider = null;
    this.signer = null;
    this.connectedAddress = null;
  }

  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    return await this.signer.getAddress();
  }

  async getBalance(address: string): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getBalance(address);
  }

  async getNetwork(): Promise<{ chainId: number; name: string }> {
    if (!this.provider) throw new Error('Provider not initialized');
    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
    };
  }

  async isOnSepolia(): Promise<boolean> {
    return this.currentChainId === ChainId.SEPOLIA;
  }

  getCurrentChainId(): ChainId | null {
    return this.currentChainId;
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  getConnectedAddress(): string | null {
    return this.connectedAddress;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      // User disconnected wallet
      this.disconnect();
    } else {
      // User switched account
      this.connectedAddress = accounts[0];
      // Reinitialize signer with new account
      if (this.provider) {
        this.provider.getSigner().then(signer => {
          this.signer = signer;
        });
      }
    }
  }

  private handleChainChanged(): void {
    // Reload page on network change (recommended by MetaMask)
    window.location.reload();
  }
}

// Singleton instance
export const walletService = new WalletService();

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
