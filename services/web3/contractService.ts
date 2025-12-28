/**
 * ContractService - Smart contract interaction
 */

import { ethers } from 'ethers';
import { walletService } from './walletService';

// Sepolia testnet contract addresses
const CONTRACTS = {
  // Uniswap V3 SwapRouter on Sepolia
  UNISWAP_ROUTER: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  // Aave V3 Pool on Sepolia
  AAVE_POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
  // Compound V3 USDC Comet on Sepolia (placeholder - may not exist)
  COMPOUND_COMET: '0x0000000000000000000000000000000000000000',
};

// Common ERC20 token addresses on Sepolia
export const TOKENS = {
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
  USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
};

// Simplified ABIs - only essential methods
const UNISWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

const AAVE_POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external',
  'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)',
  'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
  'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

// Type definitions for contract parameters
export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  slippageTolerance: number; // percentage (e.g., 0.5 for 0.5%)
  deadline?: number; // unix timestamp, defaults to 20 minutes from now
}

export interface AaveSupplyParams {
  asset: string;
  amount: bigint;
  onBehalfOf?: string; // defaults to connected address
}

export interface AaveBorrowParams {
  asset: string;
  amount: bigint;
  interestRateMode: 1 | 2; // 1 = stable, 2 = variable
  onBehalfOf?: string; // defaults to connected address
}

export interface AaveRepayParams {
  asset: string;
  amount: bigint;
  interestRateMode: 1 | 2;
  onBehalfOf?: string;
}

export class ContractService {
  private getContract(address: string, abi: string[]): ethers.Contract {
    const signer = walletService.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    return new ethers.Contract(address, abi, signer);
  }

  async executeSwap(params: SwapParams): Promise<ethers.TransactionReceipt> {
    const signer = walletService.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const router = this.getContract(CONTRACTS.UNISWAP_ROUTER, UNISWAP_ROUTER_ABI);
    const tokenInContract = this.getContract(params.tokenIn, ERC20_ABI);

    // Check allowance and approve if needed
    const signerAddress = await signer.getAddress();
    const allowance = await tokenInContract.allowance(signerAddress, CONTRACTS.UNISWAP_ROUTER);

    if (allowance < params.amountIn) {
      const approveTx = await tokenInContract.approve(
        CONTRACTS.UNISWAP_ROUTER,
        ethers.MaxUint256
      );
      await approveTx.wait();
    }

    // Calculate minimum amount out based on slippage
    // Note: In production, you'd fetch current price from pool
    const amountOutMinimum = 0n; // For now, accept any amount (high slippage)

    // Set deadline (20 minutes from now if not specified)
    const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1200;

    // Execute swap
    const swapParams = {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      fee: 3000, // 0.3% fee tier
      recipient: signerAddress,
      deadline,
      amountIn: params.amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0, // No price limit
    };

    const tx = await router.exactInputSingle(swapParams);
    return await tx.wait();
  }

  async supplyToAave(params: AaveSupplyParams): Promise<ethers.TransactionReceipt> {
    const signer = walletService.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const pool = this.getContract(CONTRACTS.AAVE_POOL, AAVE_POOL_ABI);
    const assetContract = this.getContract(params.asset, ERC20_ABI);

    // Get signer address
    const signerAddress = await signer.getAddress();
    const onBehalfOf = params.onBehalfOf || signerAddress;

    // Check allowance and approve if needed
    const allowance = await assetContract.allowance(signerAddress, CONTRACTS.AAVE_POOL);

    if (allowance < params.amount) {
      const approveTx = await assetContract.approve(CONTRACTS.AAVE_POOL, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Supply to Aave
    const tx = await pool.supply(
      params.asset,
      params.amount,
      onBehalfOf,
      0 // referral code (0 = no referral)
    );

    return await tx.wait();
  }

  async borrowFromAave(params: AaveBorrowParams): Promise<ethers.TransactionReceipt> {
    const signer = walletService.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const pool = this.getContract(CONTRACTS.AAVE_POOL, AAVE_POOL_ABI);
    const signerAddress = await signer.getAddress();
    const onBehalfOf = params.onBehalfOf || signerAddress;

    // Borrow from Aave
    const tx = await pool.borrow(
      params.asset,
      params.amount,
      params.interestRateMode,
      0, // referral code
      onBehalfOf
    );

    return await tx.wait();
  }

  async repayToAave(params: AaveRepayParams): Promise<ethers.TransactionReceipt> {
    const signer = walletService.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const pool = this.getContract(CONTRACTS.AAVE_POOL, AAVE_POOL_ABI);
    const assetContract = this.getContract(params.asset, ERC20_ABI);
    const signerAddress = await signer.getAddress();
    const onBehalfOf = params.onBehalfOf || signerAddress;

    // Approve if needed
    const allowance = await assetContract.allowance(signerAddress, CONTRACTS.AAVE_POOL);
    if (allowance < params.amount) {
      const approveTx = await assetContract.approve(CONTRACTS.AAVE_POOL, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Repay
    const tx = await pool.repay(params.asset, params.amount, params.interestRateMode, onBehalfOf);
    return await tx.wait();
  }

  async withdrawFromAave(asset: string, amount: bigint): Promise<ethers.TransactionReceipt> {
    const signer = walletService.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const pool = this.getContract(CONTRACTS.AAVE_POOL, AAVE_POOL_ABI);
    const signerAddress = await signer.getAddress();

    const tx = await pool.withdraw(asset, amount, signerAddress);
    return await tx.wait();
  }

  async getAaveUserData(address: string): Promise<{
    totalCollateralBase: bigint;
    totalDebtBase: bigint;
    availableBorrowsBase: bigint;
    currentLiquidationThreshold: bigint;
    ltv: bigint;
    healthFactor: bigint;
  }> {
    const provider = walletService.getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const pool = new ethers.Contract(CONTRACTS.AAVE_POOL, AAVE_POOL_ABI, provider);
    const userData = await pool.getUserAccountData(address);

    return {
      totalCollateralBase: userData[0],
      totalDebtBase: userData[1],
      availableBorrowsBase: userData[2],
      currentLiquidationThreshold: userData[3],
      ltv: userData[4],
      healthFactor: userData[5],
    };
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<bigint> {
    const provider = walletService.getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return await token.balanceOf(userAddress);
  }

  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint = ethers.MaxUint256
  ): Promise<ethers.TransactionReceipt> {
    const token = this.getContract(tokenAddress, ERC20_ABI);
    const tx = await token.approve(spenderAddress, amount);
    return await tx.wait();
  }

  getContractAddresses() {
    return CONTRACTS;
  }

  getTokenAddresses() {
    return TOKENS;
  }
}

export const contractService = new ContractService();
