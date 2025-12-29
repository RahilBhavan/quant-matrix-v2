/**
 * Historical Data Service
 * 
 * Coordinates subgraph queries to provide historical price and rate data
 * for the backtesting engine. Pre-fetches data for the entire backtest
 * date range to minimize API calls during simulation.
 */

import { uniswapService } from '../src/services/subgraph/uniswapService';
import { aaveService } from '../src/services/subgraph/aaveService';
import { PoolDayData } from '../types';

// Token to Uniswap pool address mapping (Sepolia testnet)
// These are WETH/USDC and other major pools
export const TOKEN_POOL_MAPPING: Record<string, string> = {
    // Sepolia pools - replace with actual pool addresses
    WETH: '0x0000000000000000000000000000000000000000', // Placeholder - needs real pool
    WBTC: '0x0000000000000000000000000000000000000000',
    DAI: '0x0000000000000000000000000000000000000000',
    // Stablecoins are always $1
    USDC: 'STABLECOIN',
    USDT: 'STABLECOIN',
};

// Fallback prices for when subgraph data is unavailable
const FALLBACK_PRICES: Record<string, number> = {
    USDC: 1.0,
    USDT: 1.0,
    DAI: 1.0,
    WETH: 2300, // Reasonable current price
    WBTC: 43000,
};

// Fallback APY rates
const FALLBACK_APY: Record<string, { supply: number; borrow: number }> = {
    USDC: { supply: 3.5, borrow: 5.2 },
    WETH: { supply: 1.8, borrow: 3.4 },
    DAI: { supply: 3.2, borrow: 4.8 },
};

interface PricePoint {
    date: Date;
    price: number;
}

interface APYPoint {
    date: Date;
    supplyAPY: number;
    borrowAPY: number;
}

export class HistoricalDataService {
    private priceCache: Map<string, PricePoint[]> = new Map();
    private apyCache: Map<string, APYPoint[]> = new Map();
    private prefetchComplete = false;
    private useRealData = true; // Set to false for development/testing

    /**
     * Pre-fetch all historical data needed for the backtest
     * This minimizes API calls during the simulation loop
     */
    async prefetchData(
        startDate: Date,
        endDate: Date,
        tokens: string[]
    ): Promise<void> {
        console.log(`[HistoricalDataService] Prefetching data for ${tokens.length} tokens from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Fetch price data for each token
        for (const token of tokens) {
            if (TOKEN_POOL_MAPPING[token] === 'STABLECOIN') {
                // Stablecoins don't need price fetching
                this.priceCache.set(token, []);
                continue;
            }

            try {
                const poolAddress = TOKEN_POOL_MAPPING[token];
                if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
                    console.warn(`[HistoricalDataService] No pool mapping for ${token}, using fallback`);
                    continue;
                }

                if (this.useRealData) {
                    const poolHistory = await uniswapService.getPoolHistory(poolAddress, startDate, endDate);

                    const pricePoints: PricePoint[] = poolHistory.map((data: PoolDayData) => ({
                        date: new Date(data.date * 1000),
                        price: parseFloat(data.token0Price),
                    }));

                    this.priceCache.set(token, pricePoints);
                    console.log(`[HistoricalDataService] Fetched ${pricePoints.length} price points for ${token}`);
                }
            } catch (error) {
                console.error(`[HistoricalDataService] Failed to fetch price data for ${token}:`, error);
                // Will use fallback prices
            }
        }

        // Fetch APY data for lending assets
        const lendingAssets = ['USDC', 'WETH', 'DAI'];
        for (const asset of lendingAssets) {
            try {
                if (this.useRealData) {
                    const rateHistory = await aaveService.getRateHistory(asset, startDate, endDate);

                    const apyPoints: APYPoint[] = rateHistory.map((data) => ({
                        date: new Date(data.timestamp * 1000),
                        supplyAPY: parseFloat(data.liquidityRate) / 1e27 * 100,
                        borrowAPY: parseFloat(data.variableBorrowRate) / 1e27 * 100,
                    }));

                    this.apyCache.set(asset, apyPoints);
                    console.log(`[HistoricalDataService] Fetched ${apyPoints.length} APY points for ${asset}`);
                }
            } catch (error) {
                console.error(`[HistoricalDataService] Failed to fetch APY data for ${asset}:`, error);
                // Will use fallback APY
            }
        }

        this.prefetchComplete = true;
    }

    /**
     * Get token prices at a specific timestamp
     * Uses cached data from prefetch, falls back to interpolation or defaults
     */
    getPricesAtTimestamp(timestamp: Date): Map<string, number> {
        const prices = new Map<string, number>();

        for (const [token, poolId] of Object.entries(TOKEN_POOL_MAPPING)) {
            if (poolId === 'STABLECOIN') {
                prices.set(token, 1.0);
                continue;
            }

            const cachedPrices = this.priceCache.get(token);

            if (cachedPrices && cachedPrices.length > 0) {
                // Find the closest price point
                const price = this.interpolatePrice(cachedPrices, timestamp);
                prices.set(token, price);
            } else {
                // Use fallback price
                prices.set(token, FALLBACK_PRICES[token] || 1.0);
            }
        }

        return prices;
    }

    /**
     * Get Aave APY at a specific timestamp
     */
    getAPYAtTimestamp(asset: string, timestamp: Date): { supplyAPY: number; borrowAPY: number } {
        const cachedAPY = this.apyCache.get(asset);

        if (cachedAPY && cachedAPY.length > 0) {
            return this.interpolateAPY(cachedAPY, timestamp);
        }

        // Use fallback APY
        return FALLBACK_APY[asset] || { supplyAPY: 3.0, borrowAPY: 5.0 };
    }

    /**
     * Interpolate price at a specific timestamp from cached data
     */
    private interpolatePrice(pricePoints: PricePoint[], timestamp: Date): number {
        if (pricePoints.length === 0) {
            return 0;
        }

        const targetTime = timestamp.getTime();

        // Find the two closest points
        let before: PricePoint | null = null;
        let after: PricePoint | null = null;

        for (const point of pricePoints) {
            const pointTime = point.date.getTime();

            if (pointTime <= targetTime) {
                before = point;
            } else if (pointTime > targetTime && !after) {
                after = point;
                break;
            }
        }

        // If we only have one point, return it
        if (!before && after) return after.price;
        if (before && !after) return before.price;
        if (!before && !after) return pricePoints[0]?.price || 0;

        // Linear interpolation between the two points
        const beforeTime = before!.date.getTime();
        const afterTime = after!.date.getTime();
        const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);

        return before!.price + ratio * (after!.price - before!.price);
    }

    /**
     * Interpolate APY at a specific timestamp from cached data
     */
    private interpolateAPY(
        apyPoints: APYPoint[],
        timestamp: Date
    ): { supplyAPY: number; borrowAPY: number } {
        if (apyPoints.length === 0) {
            return { supplyAPY: 0, borrowAPY: 0 };
        }

        const targetTime = timestamp.getTime();

        // Find the closest point (APY doesn't need interpolation as precisely)
        let closest = apyPoints[0];
        let closestDiff = Math.abs(closest.date.getTime() - targetTime);

        for (const point of apyPoints) {
            const diff = Math.abs(point.date.getTime() - targetTime);
            if (diff < closestDiff) {
                closest = point;
                closestDiff = diff;
            }
        }

        return {
            supplyAPY: closest.supplyAPY,
            borrowAPY: closest.borrowAPY,
        };
    }

    /**
     * Check if prefetch is complete
     */
    isPrefetchComplete(): boolean {
        return this.prefetchComplete;
    }

    /**
     * Clear all cached data
     */
    clearCache(): void {
        this.priceCache.clear();
        this.apyCache.clear();
        this.prefetchComplete = false;
    }

    /**
     * Enable/disable real data fetching (useful for testing)
     */
    setUseRealData(useReal: boolean): void {
        this.useRealData = useReal;
    }
}

// Singleton instance
export const historicalDataService = new HistoricalDataService();
