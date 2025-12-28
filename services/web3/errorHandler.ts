/**
 * Web3ErrorHandler - User-friendly error messages
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  recoverable: boolean;
  action?: string;
  shouldRetry?: boolean;
}

export class Web3ErrorHandler {
  handleTransactionError(error: any): UserFriendlyError {
    // MetaMask user rejection
    if (error.code === 4001) {
      return {
        title: 'Transaction Rejected',
        message: 'You cancelled the transaction in MetaMask.',
        recoverable: true,
      };
    }

    // Insufficient gas
    if (error.code === -32000 || error.message?.includes('insufficient funds')) {
      return {
        title:
 'Insufficient ETH for Gas',
        message: 'You need more ETH to pay for transaction gas.',
        recoverable: true,
        action: 'Get testnet ETH from Sepolia faucet',
      };
    }

    // Generic fallback
    return {
      title: 'Transaction Failed',
      message: error.message || 'Unknown error occurred',
      recoverable: false,
    };
  }
}

export const errorHandler = new Web3ErrorHandler();
