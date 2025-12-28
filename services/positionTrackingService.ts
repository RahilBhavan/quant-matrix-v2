/**
 * Position Tracking Service
 *
 * Tracks user's DeFi positions across protocols.
 * Queries on-chain data and subgraph for live positions.
 */

import { walletService } from './web3/walletService';
import { contractService, TOKENS } from './web3/contractService';
import { uniswapService } from './subgraph/uniswapService';
import { aaveService } from './subgraph/aaveService';
import { ethers } from 'ethers';

export interface TokenPosition {
  token: string;
  balance: string; // Formatted amount
  balanceUSD: number;
  price: number;
}

export interface AavePosition {
  protocol: 'Aave';
  type: 'SUPPLY' | 'BORROW';
  asset: string;
  amount: string;
  amountUSD: number;
  apy: number;
  healthFactor?: number;
}

export interface UniswapPosition {
  protocol: 'Uniswap';
  type: 'LP';
  poolAddress: string;
  token0: string;
  token1: string;
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  valueUSD: number;
  feesEarned: { token0: string; token1: string };
}

export type DeFiPosition = AavePosition | UniswapPosition;

export interface ProtocolStats {
  protocol: string;
  totalValueUSD: number;
  positionCount: number;
  apy?: number;
}

export interface PortfolioSummary {
  totalValueUSD: number;
  tokenBalances: TokenPosition[];
  defiPositions: DeFiPosition[];
  protocolStats: ProtocolStats[];
}

class PositionTrackingService {
  /**
   * Get complete portfolio summary
   */
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    if (!walletService.isConnected()) {
      return this.getEmptyPortfolio();
    }

    const address = walletService.getConnectedAddress();
    if (!address) {
      return this.getEmptyPortfolio();
    }

    try {
      // Get token balances
      const tokenBalances = await this.getTokenBalances(address);

      // Get DeFi positions
      const defiPositions = await this.getDeFiPositions(address);

      // Calculate protocol stats
      const protocolStats = this.calculateProtocolStats(defiPositions);

      // Calculate total value
      const tokenValue = tokenBalances.reduce((sum, t) => sum + t.balanceUSD, 0);
      const defiValue = defiPositions.reduce((sum, p) => {
        if (p.protocol === 'Aave') {
          return sum + (p.type === 'SUPPLY' ? p.amountUSD : -p.amountUSD);
        }
        return sum + p.valueUSD;
      }, 0);

      return {
        totalValueUSD: tokenValue + defiValue,
        tokenBalances,
        defiPositions,
        protocolStats,
      };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return this.getEmptyPortfolio();
    }
  }

  /**
   * Get token balances for common tokens
   */
  private async getTokenBalances(address: string): Promise<TokenPosition[]> {
    const balances: TokenPosition[] = [];
    const tokens = ['WETH', 'USDC', 'DAI', 'USDT'];

    // Get ETH balance
    try {
      const ethBalance = await walletService.getBalance(address);
      const ethFormatted = ethers.formatEther(ethBalance);
      const ethPrice = 2000; // Mock price

      if (parseFloat(ethFormatted) > 0) {
        balances.push({
          token: 'ETH',
          balance: parseFloat(ethFormatted).toFixed(4),
          balanceUSD: parseFloat(ethFormatted) * ethPrice,
          price: ethPrice,
        });
      }
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
    }

    // Get ERC20 balances
    for (const token of tokens) {
      try {
        const tokenAddress = TOKENS[token as keyof typeof TOKENS];
        if (!tokenAddress) continue;

        const balance = await contractService.getTokenBalance(tokenAddress, address);
        const decimals = token === 'USDC' || token === 'USDT' ? 6 : 18;
        const formatted = ethers.formatUnits(balance, decimals);

        if (parseFloat(formatted) > 0) {
          const price = token === 'USDC' || token === 'USDT' || token === 'DAI' ? 1 : 2000;

          balances.push({
            token,
            balance: parseFloat(formatted).toFixed(decimals === 6 ? 2 : 4),
            balanceUSD: parseFloat(formatted) * price,
            price,
          });
        }
      } catch (error) {
        console.error(`Error fetching ${token} balance:`, error);
      }
    }

    return balances;
  }

  /**
   * Get DeFi positions across protocols
   */
  private async getDeFiPositions(address: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    // Get Aave positions
    try {
      const aavePositions = await this.getAavePositions(address);
      positions.push(...aavePositions);
    } catch (error) {
      console.error('Error fetching Aave positions:', error);
    }

    // Note: Uniswap LP position querying requires NFT position manager
    // This would need the position NFT IDs which we don't have in this simple implementation

    return positions;
  }

  /**
   * Get Aave positions (supplies and borrows)
   */
  private async getAavePositions(address: string): Promise<AavePosition[]> {
    const positions: AavePosition[] = [];

    try {
      const userData = await contractService.getAaveUserData(address);

      // Check if user has any Aave positions
      if (userData.totalCollateralBase > 0n || userData.totalDebtBase > 0n) {
        // Get health factor
        const healthFactor = Number(userData.healthFactor) / 1e18;

        // For each token, check if there's a supply/borrow position
        const tokens = ['USDC', 'DAI', 'WETH'];

        for (const token of tokens) {
          try {
            const rates = await aaveService.getCurrentRates(
              TOKENS[token as keyof typeof TOKENS]
            );

            // Mock position amounts - in production, query reserves for user
            // This is simplified as we'd need to query the Aave protocol contracts
            // for actual user positions

            // For demo purposes, if they have collateral, assume USDC supply
            if (userData.totalCollateralBase > 0n && token === 'USDC') {
              const amount = Number(userData.totalCollateralBase) / 1e8; // Convert from base units

              positions.push({
                protocol: 'Aave',
                type: 'SUPPLY',
                asset: token,
                amount: amount.toFixed(2),
                amountUSD: amount,
                apy: rates.supplyAPY,
                healthFactor,
              });
            }

            // If they have debt, assume WETH borrow
            if (userData.totalDebtBase > 0n && token === 'WETH') {
              const amount = Number(userData.totalDebtBase) / 1e8 / 2000; // Convert and estimate

              positions.push({
                protocol: 'Aave',
                type: 'BORROW',
                asset: token,
                amount: amount.toFixed(4),
                amountUSD: amount * 2000,
                apy: rates.borrowAPY,
                healthFactor,
              });
            }
          } catch (error) {
            console.error(`Error fetching rates for ${token}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Aave user data:', error);
    }

    return positions;
  }

  /**
   * Calculate protocol statistics
   */
  private calculateProtocolStats(positions: DeFiPosition[]): ProtocolStats[] {
    const stats = new Map<string, ProtocolStats>();

    for (const position of positions) {
      const protocol = position.protocol;

      if (!stats.has(protocol)) {
        stats.set(protocol, {
          protocol,
          totalValueUSD: 0,
          positionCount: 0,
        });
      }

      const stat = stats.get(protocol)!;
      stat.positionCount++;

      if (position.protocol === 'Aave') {
        if (position.type === 'SUPPLY') {
          stat.totalValueUSD += position.amountUSD;
          stat.apy = position.apy; // Use last seen APY
        } else {
          stat.totalValueUSD -= position.amountUSD; // Borrow is negative
        }
      } else if (position.protocol === 'Uniswap') {
        stat.totalValueUSD += position.valueUSD;
      }
    }

    return Array.from(stats.values());
  }

  /**
   * Get empty portfolio
   */
  private getEmptyPortfolio(): PortfolioSummary {
    return {
      totalValueUSD: 0,
      tokenBalances: [],
      defiPositions: [],
      protocolStats: [],
    };
  }

  /**
   * Refresh portfolio data
   */
  async refreshPortfolio(): Promise<PortfolioSummary> {
    return await this.getPortfolioSummary();
  }
}

export const positionTrackingService = new PositionTrackingService();
