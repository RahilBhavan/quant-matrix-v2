/**
 * Live Execution Service
 *
 * Executes DeFi strategies on Sepolia testnet in real-time.
 * Tracks transaction status and maintains execution history.
 */

import { LegoBlock } from '../types';
import { walletService } from './web3/walletService';
import { contractService, TOKENS } from './web3/contractService';
import { ethers } from 'ethers';

export interface ExecutionTransaction {
  id: string;
  blockType: string;
  protocol: string;
  status: 'PENDING' | 'CONFIRMING' | 'SUCCESS' | 'FAILED';
  txHash?: string;
  error?: string;
  timestamp: Date;
  details: any;
  gasCost?: string; // ETH
}

export interface LiveExecutionResult {
  success: boolean;
  transaction?: ExecutionTransaction;
  error?: string;
}

class LiveExecutionService {
  private transactions: ExecutionTransaction[] = [];
  private txIdCounter = 1;

  /**
   * Execute a DeFi block on Sepolia testnet
   */
  async executeBlock(block: LegoBlock): Promise<LiveExecutionResult> {
    // Check wallet connection
    if (!walletService.isConnected()) {
      return {
        success: false,
        error: 'Wallet not connected. Please connect MetaMask first.',
      };
    }

    // Check Sepolia network
    const isOnSepolia = await walletService.isOnSepolia();
    if (!isOnSepolia) {
      return {
        success: false,
        error: 'Please switch to Sepolia testnet to execute transactions.',
      };
    }

    // Create transaction record
    const transaction: ExecutionTransaction = {
      id: `TX${this.txIdCounter++}`,
      blockType: block.type,
      protocol: block.protocol.toString(),
      status: 'PENDING',
      timestamp: new Date(),
      details: block.params,
    };

    this.transactions.push(transaction);

    try {
      // Execute based on block type
      switch (block.type) {
        case 'UNISWAP_SWAP':
          return await this.executeSwap(block, transaction);

        case 'AAVE_SUPPLY':
          return await this.executeAaveSupply(block, transaction);

        case 'AAVE_BORROW':
          return await this.executeAaveBorrow(block, transaction);

        case 'REPAY_DEBT':
          return await this.executeRepayDebt(block, transaction);

        default:
          transaction.status = 'FAILED';
          transaction.error = `Block type ${block.type} not supported for live execution`;
          return {
            success: false,
            error: transaction.error,
            transaction,
          };
      }
    } catch (error: any) {
      transaction.status = 'FAILED';
      transaction.error = error.message || 'Unknown error';
      return {
        success: false,
        error: transaction.error,
        transaction,
      };
    }
  }

  /**
   * Execute Uniswap swap
   */
  private async executeSwap(
    block: LegoBlock,
    transaction: ExecutionTransaction
  ): Promise<LiveExecutionResult> {
    const { tokenIn, tokenOut, amount, slippage } = block.params || {};

    if (!tokenIn || !tokenOut || !amount) {
      throw new Error('Missing required parameters: tokenIn, tokenOut, amount');
    }

    // Get token addresses
    const tokenInAddress = TOKENS[tokenIn as keyof typeof TOKENS];
    const tokenOutAddress = TOKENS[tokenOut as keyof typeof TOKENS];

    if (!tokenInAddress || !tokenOutAddress) {
      throw new Error(`Token not found: ${tokenIn} or ${tokenOut}`);
    }

    // Convert amount to wei (assuming 6 decimals for USDC, 18 for ETH)
    const decimals = tokenIn === 'USDC' || tokenIn === 'USDT' ? 6 : 18;
    const amountIn = ethers.parseUnits(amount.toString(), decimals);

    transaction.status = 'CONFIRMING';

    try {
      const receipt = await contractService.executeSwap({
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn,
        slippageTolerance: slippage || 0.5,
      });

      transaction.status = 'SUCCESS';
      transaction.txHash = receipt.hash;
      transaction.gasCost = ethers.formatEther(
        receipt.gasUsed * receipt.gasPrice
      );

      return {
        success: true,
        transaction,
      };
    } catch (error: any) {
      transaction.status = 'FAILED';
      transaction.error = error.message;
      throw error;
    }
  }

  /**
   * Execute Aave supply
   */
  private async executeAaveSupply(
    block: LegoBlock,
    transaction: ExecutionTransaction
  ): Promise<LiveExecutionResult> {
    const { asset, supplyAmount } = block.params || {};

    if (!asset || !supplyAmount) {
      throw new Error('Missing required parameters: asset, supplyAmount');
    }

    const assetAddress = TOKENS[asset as keyof typeof TOKENS];
    if (!assetAddress) {
      throw new Error(`Asset not found: ${asset}`);
    }

    const decimals = asset === 'USDC' || asset === 'USDT' ? 6 : 18;
    const amount = ethers.parseUnits(supplyAmount.toString(), decimals);

    transaction.status = 'CONFIRMING';

    try {
      const receipt = await contractService.supplyToAave({
        asset: assetAddress,
        amount,
      });

      transaction.status = 'SUCCESS';
      transaction.txHash = receipt.hash;
      transaction.gasCost = ethers.formatEther(
        receipt.gasUsed * receipt.gasPrice
      );

      return {
        success: true,
        transaction,
      };
    } catch (error: any) {
      transaction.status = 'FAILED';
      transaction.error = error.message;
      throw error;
    }
  }

  /**
   * Execute Aave borrow
   */
  private async executeAaveBorrow(
    block: LegoBlock,
    transaction: ExecutionTransaction
  ): Promise<LiveExecutionResult> {
    const { asset, borrowAmount } = block.params || {};

    if (!asset || !borrowAmount) {
      throw new Error('Missing required parameters: asset, borrowAmount');
    }

    const assetAddress = TOKENS[asset as keyof typeof TOKENS];
    if (!assetAddress) {
      throw new Error(`Asset not found: ${asset}`);
    }

    const decimals = asset === 'USDC' || asset === 'USDT' ? 6 : 18;
    const amount = ethers.parseUnits(borrowAmount.toString(), decimals);

    transaction.status = 'CONFIRMING';

    try {
      const receipt = await contractService.borrowFromAave({
        asset: assetAddress,
        amount,
        interestRateMode: 2, // Variable rate
      });

      transaction.status = 'SUCCESS';
      transaction.txHash = receipt.hash;
      transaction.gasCost = ethers.formatEther(
        receipt.gasUsed * receipt.gasPrice
      );

      return {
        success: true,
        transaction,
      };
    } catch (error: any) {
      transaction.status = 'FAILED';
      transaction.error = error.message;
      throw error;
    }
  }

  /**
   * Execute Aave repay
   */
  private async executeRepayDebt(
    block: LegoBlock,
    transaction: ExecutionTransaction
  ): Promise<LiveExecutionResult> {
    const { asset, amount } = block.params || {};

    if (!asset || !amount) {
      throw new Error('Missing required parameters: asset, amount');
    }

    const assetAddress = TOKENS[asset as keyof typeof TOKENS];
    if (!assetAddress) {
      throw new Error(`Asset not found: ${asset}`);
    }

    const decimals = asset === 'USDC' || asset === 'USDT' ? 6 : 18;
    const repayAmount = ethers.parseUnits(amount.toString(), decimals);

    transaction.status = 'CONFIRMING';

    try {
      const receipt = await contractService.repayToAave({
        asset: assetAddress,
        amount: repayAmount,
        interestRateMode: 2,
      });

      transaction.status = 'SUCCESS';
      transaction.txHash = receipt.hash;
      transaction.gasCost = ethers.formatEther(
        receipt.gasUsed * receipt.gasPrice
      );

      return {
        success: true,
        transaction,
      };
    } catch (error: any) {
      transaction.status = 'FAILED';
      transaction.error = error.message;
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(): ExecutionTransaction[] {
    return [...this.transactions].reverse(); // Most recent first
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): ExecutionTransaction | undefined {
    return this.transactions.find(tx => tx.id === id);
  }

  /**
   * Clear transaction history
   */
  clearHistory(): void {
    this.transactions = [];
    this.txIdCounter = 1;
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): ExecutionTransaction[] {
    return this.transactions.filter(
      tx => tx.status === 'PENDING' || tx.status === 'CONFIRMING'
    );
  }

  /**
   * Get transaction count by status
   */
  getTransactionStats(): {
    total: number;
    pending: number;
    success: number;
    failed: number;
  } {
    return {
      total: this.transactions.length,
      pending: this.transactions.filter(tx => tx.status === 'PENDING' || tx.status === 'CONFIRMING').length,
      success: this.transactions.filter(tx => tx.status === 'SUCCESS').length,
      failed: this.transactions.filter(tx => tx.status === 'FAILED').length,
    };
  }
}

export const liveExecutionService = new LiveExecutionService();
