/**
 * WalletService - MetaMask connection and management
 */

import { ethers } from 'ethers';

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

interface SepoliaNetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

const SEPOLIA_CONFIG: SepoliaNetworkConfig = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private connectedAddress: string | null = null;

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

      // Switch to Sepolia if not already on it
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        await this.switchToSepolia();
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

  async switchToSepolia(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Sepolia network to MetaMask');
        }
      } else {
        throw new Error(`Failed to switch to Sepolia: ${error.message}`);
      }
    }
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
    if (!this.provider) return false;
    const network = await this.getNetwork();
    return network.chainId === SEPOLIA_CHAIN_ID;
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
