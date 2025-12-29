/**
 * Chain Configuration
 * 
 * Central registry of all supported blockchain networks with their
 * chain IDs, RPC URLs, contract addresses, and token addresses.
 */

// Chain IDs
export enum ChainId {
    SEPOLIA = 11155111,
    ETHEREUM = 1,
    ARBITRUM = 42161,
    OPTIMISM = 10,
    BASE = 8453,
    // Testnets
    ARBITRUM_SEPOLIA = 421614,
    OPTIMISM_SEPOLIA = 11155420,
    BASE_SEPOLIA = 84532,
}

export interface ChainConfig {
    chainId: ChainId;
    name: string;
    shortName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls: string[];
    iconColor: string; // For UI
    isTestnet: boolean;
}

// Supported chain configurations
export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
    [ChainId.SEPOLIA]: {
        chainId: ChainId.SEPOLIA,
        name: 'Sepolia Testnet',
        shortName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://rpc.sepolia.org'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        iconColor: '#627EEA',
        isTestnet: true,
    },
    [ChainId.ETHEREUM]: {
        chainId: ChainId.ETHEREUM,
        name: 'Ethereum Mainnet',
        shortName: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://eth.llamarpc.com'],
        blockExplorerUrls: ['https://etherscan.io'],
        iconColor: '#627EEA',
        isTestnet: false,
    },
    [ChainId.ARBITRUM]: {
        chainId: ChainId.ARBITRUM,
        name: 'Arbitrum One',
        shortName: 'Arbitrum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io'],
        iconColor: '#28A0F0',
        isTestnet: false,
    },
    [ChainId.OPTIMISM]: {
        chainId: ChainId.OPTIMISM,
        name: 'Optimism',
        shortName: 'Optimism',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.optimism.io'],
        blockExplorerUrls: ['https://optimistic.etherscan.io'],
        iconColor: '#FF0420',
        isTestnet: false,
    },
    [ChainId.BASE]: {
        chainId: ChainId.BASE,
        name: 'Base',
        shortName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org'],
        iconColor: '#0052FF',
        isTestnet: false,
    },
    [ChainId.ARBITRUM_SEPOLIA]: {
        chainId: ChainId.ARBITRUM_SEPOLIA,
        name: 'Arbitrum Sepolia',
        shortName: 'Arb Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://sepolia.arbiscan.io'],
        iconColor: '#28A0F0',
        isTestnet: true,
    },
    [ChainId.OPTIMISM_SEPOLIA]: {
        chainId: ChainId.OPTIMISM_SEPOLIA,
        name: 'Optimism Sepolia',
        shortName: 'OP Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.optimism.io'],
        blockExplorerUrls: ['https://sepolia-optimism.etherscan.io'],
        iconColor: '#FF0420',
        isTestnet: true,
    },
    [ChainId.BASE_SEPOLIA]: {
        chainId: ChainId.BASE_SEPOLIA,
        name: 'Base Sepolia',
        shortName: 'Base Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.base.org'],
        blockExplorerUrls: ['https://sepolia.basescan.org'],
        iconColor: '#0052FF',
        isTestnet: true,
    },
};

// Contract addresses per chain
export interface ChainContracts {
    UNISWAP_ROUTER: string;
    AAVE_POOL: string;
    WETH: string;
    USDC: string;
    DAI: string;
    USDT: string;
}

export const CHAIN_CONTRACTS: Partial<Record<ChainId, ChainContracts>> = {
    [ChainId.SEPOLIA]: {
        UNISWAP_ROUTER: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
        AAVE_POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
        WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
        USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
        USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    },
    [ChainId.ARBITRUM]: {
        UNISWAP_ROUTER: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        AAVE_POOL: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
    [ChainId.OPTIMISM]: {
        UNISWAP_ROUTER: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        AAVE_POOL: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        WETH: '0x4200000000000000000000000000000000000006',
        USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    },
    [ChainId.BASE]: {
        UNISWAP_ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e481',
        AAVE_POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
        WETH: '0x4200000000000000000000000000000000000006',
        USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
        USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    },
};

// Helper functions
export function getChainConfig(chainId: ChainId): ChainConfig {
    return CHAIN_CONFIGS[chainId];
}

export function getChainContracts(chainId: ChainId): ChainContracts | null {
    return CHAIN_CONTRACTS[chainId] || null;
}

export function getChainIdHex(chainId: ChainId): string {
    return `0x${chainId.toString(16)}`;
}

export function isSupportedChain(chainId: number): chainId is ChainId {
    return chainId in CHAIN_CONFIGS;
}

export function getSupportedChains(includeTestnets: boolean = true): ChainConfig[] {
    return Object.values(CHAIN_CONFIGS).filter(
        config => includeTestnets || !config.isTestnet
    );
}

// Default chain for new users
export const DEFAULT_CHAIN_ID = ChainId.SEPOLIA;
