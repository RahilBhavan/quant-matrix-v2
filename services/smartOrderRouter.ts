/**
 * Smart Order Router (SOR)
 * 
 * Aggregates quotes from multiple DEXs and finds optimal swap routes.
 * Compares Uniswap V3, Curve, and Balancer to get best execution price.
 */

import { ethers } from 'ethers';
import { walletService } from './web3/walletService';
import { ChainId, getChainContracts } from './web3/chainConfig';

// DEX identifiers
export enum DexType {
    UNISWAP_V3 = 'UNISWAP_V3',
    CURVE = 'CURVE',
    BALANCER = 'BALANCER',
}

// Quote from a single DEX
export interface DexQuote {
    dex: DexType;
    amountOut: bigint;
    amountOutFormatted: string;
    priceImpact: number; // percentage
    gasEstimate: bigint;
    route: string[]; // token path
    poolFee?: number; // for Uniswap
}

// Optimal route (may include splits)
export interface OptimalRoute {
    quotes: DexQuote[];
    totalAmountOut: bigint;
    totalAmountOutFormatted: string;
    isSplit: boolean;
    splitPercentages?: number[]; // if split across DEXs
    savings: string; // vs worst route
    bestDex: DexType;
}

// Swap parameters
export interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    slippageTolerance: number; // percentage
}

// Simplified ABIs for quote fetching
const UNISWAP_QUOTER_ABI = [
    'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
];

// DEX contract addresses per chain
const DEX_CONTRACTS: Record<ChainId, Partial<Record<DexType, string>>> = {
    [ChainId.SEPOLIA]: {
        [DexType.UNISWAP_V3]: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3', // Quoter V2
    },
    [ChainId.ARBITRUM]: {
        [DexType.UNISWAP_V3]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        [DexType.CURVE]: '0x445FE580eF8d70FF569aB36e80c647af338db351',
        [DexType.BALANCER]: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    },
    [ChainId.OPTIMISM]: {
        [DexType.UNISWAP_V3]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        [DexType.CURVE]: '0x0DCDED3545D565bA3B19E683431381007245d983',
        [DexType.BALANCER]: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    },
    [ChainId.BASE]: {
        [DexType.UNISWAP_V3]: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
        [DexType.BALANCER]: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    },
    [ChainId.ETHEREUM]: {},
    [ChainId.ARBITRUM_SEPOLIA]: {},
    [ChainId.OPTIMISM_SEPOLIA]: {},
    [ChainId.BASE_SEPOLIA]: {},
};

class SmartOrderRouter {
    /**
     * Get quotes from all available DEXs for the current chain
     */
    async getQuotes(params: SwapParams): Promise<DexQuote[]> {
        const chainId = walletService.getCurrentChainId();
        if (!chainId) {
            throw new Error('Wallet not connected');
        }

        const quotes: DexQuote[] = [];
        const dexAddresses = DEX_CONTRACTS[chainId] || {};

        // Fetch quotes in parallel
        const quotePromises = Object.entries(dexAddresses).map(async ([dexType, address]) => {
            try {
                const quote = await this.getQuoteFromDex(
                    dexType as DexType,
                    address,
                    params,
                    chainId
                );
                if (quote) {
                    quotes.push(quote);
                }
            } catch (error) {
                console.warn(`[SOR] Failed to get quote from ${dexType}:`, error);
            }
        });

        await Promise.all(quotePromises);

        // Sort by amount out (descending = best first)
        return quotes.sort((a, b) =>
            Number(b.amountOut - a.amountOut)
        );
    }

    /**
     * Get quote from a specific DEX
     */
    private async getQuoteFromDex(
        dex: DexType,
        contractAddress: string,
        params: SwapParams,
        chainId: ChainId
    ): Promise<DexQuote | null> {
        const provider = walletService.getProvider();
        if (!provider) return null;

        switch (dex) {
            case DexType.UNISWAP_V3:
                return this.getUniswapQuote(contractAddress, params, provider);
            case DexType.CURVE:
                return this.getCurveQuote(contractAddress, params, provider);
            case DexType.BALANCER:
                return this.getBalancerQuote(contractAddress, params, provider);
            default:
                return null;
        }
    }

    /**
     * Get Uniswap V3 quote
     */
    private async getUniswapQuote(
        quoterAddress: string,
        params: SwapParams,
        provider: ethers.BrowserProvider
    ): Promise<DexQuote | null> {
        try {
            const quoter = new ethers.Contract(quoterAddress, UNISWAP_QUOTER_ABI, provider);

            // Try different fee tiers
            const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
            let bestQuote: DexQuote | null = null;

            for (const fee of feeTiers) {
                try {
                    const amountOut = await quoter.quoteExactInputSingle.staticCall(
                        params.tokenIn,
                        params.tokenOut,
                        fee,
                        params.amountIn,
                        0
                    );

                    const quote: DexQuote = {
                        dex: DexType.UNISWAP_V3,
                        amountOut,
                        amountOutFormatted: ethers.formatUnits(amountOut, 18),
                        priceImpact: this.calculatePriceImpact(params.amountIn, amountOut),
                        gasEstimate: BigInt(150000), // Approximate
                        route: [params.tokenIn, params.tokenOut],
                        poolFee: fee,
                    };

                    if (!bestQuote || amountOut > bestQuote.amountOut) {
                        bestQuote = quote;
                    }
                } catch {
                    // Pool doesn't exist for this fee tier
                    continue;
                }
            }

            return bestQuote;
        } catch (error) {
            console.warn('[SOR] Uniswap quote failed:', error);
            return null;
        }
    }

    /**
     * Get Curve quote (simplified - would need actual Curve registry)
     */
    private async getCurveQuote(
        registryAddress: string,
        params: SwapParams,
        provider: ethers.BrowserProvider
    ): Promise<DexQuote | null> {
        // Curve is best for stablecoin pairs
        // This is a simplified implementation
        try {
            // Check if both tokens are stablecoins
            const stablecoins = ['USDC', 'USDT', 'DAI', 'FRAX'];
            const isStablePair = stablecoins.some(s =>
                params.tokenIn.toLowerCase().includes(s.toLowerCase()) ||
                params.tokenOut.toLowerCase().includes(s.toLowerCase())
            );

            if (!isStablePair) {
                return null; // Skip Curve for non-stable pairs
            }

            // Simulate Curve quote (in production, use actual Curve contracts)
            const amountOut = params.amountIn * BigInt(999) / BigInt(1000); // 0.1% fee

            return {
                dex: DexType.CURVE,
                amountOut,
                amountOutFormatted: ethers.formatUnits(amountOut, 18),
                priceImpact: 0.01,
                gasEstimate: BigInt(180000),
                route: [params.tokenIn, params.tokenOut],
            };
        } catch {
            return null;
        }
    }

    /**
     * Get Balancer quote (simplified)
     */
    private async getBalancerQuote(
        vaultAddress: string,
        params: SwapParams,
        provider: ethers.BrowserProvider
    ): Promise<DexQuote | null> {
        try {
            // Simulate Balancer quote (in production, use actual Balancer SDK)
            const amountOut = params.amountIn * BigInt(997) / BigInt(1000); // 0.3% fee

            return {
                dex: DexType.BALANCER,
                amountOut,
                amountOutFormatted: ethers.formatUnits(amountOut, 18),
                priceImpact: this.calculatePriceImpact(params.amountIn, amountOut),
                gasEstimate: BigInt(200000),
                route: [params.tokenIn, params.tokenOut],
            };
        } catch {
            return null;
        }
    }

    /**
     * Calculate price impact percentage
     */
    private calculatePriceImpact(amountIn: bigint, amountOut: bigint): number {
        if (amountIn === BigInt(0)) return 0;
        // Simplified: assumes 1:1 base rate
        const impact = Number(amountIn - amountOut) / Number(amountIn) * 100;
        return Math.max(0, impact);
    }

    /**
     * Find the optimal route from available quotes
     */
    async findBestRoute(params: SwapParams): Promise<OptimalRoute> {
        const quotes = await this.getQuotes(params);

        if (quotes.length === 0) {
            throw new Error('No routes available for this swap');
        }

        const bestQuote = quotes[0];
        const worstQuote = quotes[quotes.length - 1];

        // Calculate savings vs worst route
        const savingsAmount = bestQuote.amountOut - worstQuote.amountOut;
        const savingsPercent = quotes.length > 1
            ? (Number(savingsAmount) / Number(worstQuote.amountOut) * 100).toFixed(2)
            : '0';

        return {
            quotes,
            totalAmountOut: bestQuote.amountOut,
            totalAmountOutFormatted: bestQuote.amountOutFormatted,
            isSplit: false, // Future: implement split routing
            bestDex: bestQuote.dex,
            savings: savingsPercent + '%',
        };
    }

    /**
     * Get DEX display name
     */
    getDexName(dex: DexType): string {
        switch (dex) {
            case DexType.UNISWAP_V3:
                return 'Uniswap V3';
            case DexType.CURVE:
                return 'Curve';
            case DexType.BALANCER:
                return 'Balancer';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get DEX brand color
     */
    getDexColor(dex: DexType): string {
        switch (dex) {
            case DexType.UNISWAP_V3:
                return '#FF007A';
            case DexType.CURVE:
                return '#0000FF';
            case DexType.BALANCER:
                return '#1E1E1E';
            default:
                return '#FFFFFF';
        }
    }
}

export const smartOrderRouter = new SmartOrderRouter();
