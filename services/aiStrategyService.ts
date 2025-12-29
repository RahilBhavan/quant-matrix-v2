/**
 * AI Strategy Service
 * 
 * Uses Google Gemini to generate DeFi strategy blocks from natural language prompts.
 * Converts user descriptions into structured LegoBlock arrays.
 */

import { GoogleGenAI } from '@google/genai';
import { LegoBlock, Protocol } from '../types';
import { AVAILABLE_BLOCKS, BLOCK_METADATA } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// Block type definitions for the AI prompt
const BLOCK_DEFINITIONS = `
Available DeFi Strategy Blocks:

## DEX Blocks (Protocol: UNISWAP)
1. UNISWAP_SWAP - Swap tokens on Uniswap V3
   params: { tokenIn: "USDC"|"WETH"|"DAI", tokenOut: "USDC"|"WETH"|"DAI", amount: number, slippage: number }

2. PRICE_CHECK - Check current pool price
   params: { tokenIn: string, tokenOut: string }

3. CREATE_LP_POSITION - Provide liquidity to a pool
   params: { token0: string, token1: string, feeTier: 500|3000|10000, amount: number }

4. COLLECT_FEES - Collect earned LP fees
   params: {}

## Lending Blocks (Protocol: AAVE)
5. AAVE_SUPPLY - Supply assets as collateral
   params: { asset: "USDC"|"WETH"|"DAI", supplyAmount: number }

6. AAVE_BORROW - Borrow against collateral
   params: { asset: "USDC"|"WETH"|"DAI", borrowAmount: number, collateralFactor: number }

7. REPAY_DEBT - Repay borrowed assets
   params: { asset: string, amount: number }

8. HEALTH_FACTOR_CHECK - Monitor liquidation risk
   params: { threshold: number } // e.g., 1.5 means trigger if health < 1.5

## Logic Blocks (Protocol: LOGIC)
9. IF_CONDITION - Conditional execution
   params: { condition: string } // e.g., "APY > 5"

10. GAS_CHECKER - Only execute if gas is cheap
    params: { threshold: number } // gwei

11. MEV_PROTECTION - Protect from front-running
    params: { useFlashbots: boolean, privateTransaction: boolean }

## Risk Blocks (Protocol: RISK)
12. STOP_LOSS - Exit if loss exceeds threshold
    params: { threshold: number } // negative percentage, e.g., -10

13. POSITION_SIZE - Calculate position sizing
    params: { percentage: number } // % of portfolio
`;

const SYSTEM_PROMPT = `You are a DeFi strategy architect. Convert user descriptions into structured block arrays.

${BLOCK_DEFINITIONS}

## Output Format
Return ONLY a valid JSON array of blocks. Each block must have:
- type: one of the block types listed above
- protocol: "UNISWAP" | "AAVE" | "LOGIC" | "RISK"
- label: human-readable name
- description: brief explanation
- params: object with required parameters filled in

## Example Output for "swap USDC to ETH"
[
  {
    "type": "UNISWAP_SWAP",
    "protocol": "UNISWAP",
    "label": "Swap USDC → WETH",
    "description": "Exchange USDC for WETH on Uniswap",
    "params": {
      "tokenIn": "USDC",
      "tokenOut": "WETH",
      "amount": 1000,
      "slippage": 0.5
    }
  }
]

## Rules
1. Output ONLY the JSON array, no markdown or explanation
2. Use realistic parameter values (e.g., 1000 USDC, 1 ETH, 0.5% slippage)
3. Include risk management blocks (STOP_LOSS, HEALTH_FACTOR_CHECK) when appropriate
4. Order blocks logically (setup → execution → risk management)
5. For lending strategies, always include HEALTH_FACTOR_CHECK
`;

interface GeneratedBlock {
    type: string;
    protocol: string;
    label: string;
    description: string;
    params: Record<string, any>;
}

class AIStrategyService {
    private genAI: GoogleGenAI | null = null;

    private initialize() {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            console.warn('[AIStrategyService] No API key found. Set VITE_GEMINI_API_KEY in .env');
            return false;
        }

        if (!this.genAI) {
            this.genAI = new GoogleGenAI({ apiKey });
        }

        return true;
    }

    /**
     * Generate strategy blocks from natural language prompt
     */
    async generateStrategy(prompt: string): Promise<LegoBlock[]> {
        if (!this.initialize()) {
            throw new Error('AI service not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
        }

        try {
            const response = await this.genAI!.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: `${SYSTEM_PROMPT}\n\nGenerate a strategy for: ${prompt}`,
            });

            const responseText = response.text || '';

            // Extract JSON from response (handles markdown code blocks)
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('AI did not return valid JSON');
            }

            const generatedBlocks: GeneratedBlock[] = JSON.parse(jsonMatch[0]);

            // Validate and convert to LegoBlocks
            return this.validateAndConvert(generatedBlocks);
        } catch (error: any) {
            console.error('[AIStrategyService] Generation failed:', error);

            if (error.message?.includes('API key')) {
                throw new Error('Invalid API key. Please check VITE_GEMINI_API_KEY.');
            }

            throw new Error(`Failed to generate strategy: ${error.message}`);
        }
    }

    /**
     * Validate AI output and convert to LegoBlock format
     */
    private validateAndConvert(blocks: GeneratedBlock[]): LegoBlock[] {
        const validTypes = Object.keys(BLOCK_METADATA);
        const protocolMap: Record<string, Protocol> = {
            'UNISWAP': Protocol.UNISWAP,
            'AAVE': Protocol.AAVE,
            'LOGIC': Protocol.LOGIC,
            'RISK': Protocol.RISK,
        };

        const protocolColors: Record<Protocol, string> = {
            [Protocol.UNISWAP]: '#FF007A',
            [Protocol.AAVE]: '#B6509E',
            [Protocol.COMPOUND]: '#00D395',
            [Protocol.LOGIC]: '#FFD93D',
            [Protocol.RISK]: '#6C63FF',
            [Protocol.ENTRY]: '#00FF9D',
            [Protocol.EXIT]: '#FF4444',
            [Protocol.ORDERS]: '#8247E5',
            [Protocol.INDICATORS]: '#FFD93D',
        };

        return blocks
            .filter(block => validTypes.includes(block.type))
            .map((block, index) => {
                const protocol = protocolMap[block.protocol] || Protocol.LOGIC;

                return {
                    id: uuidv4(),
                    type: block.type,
                    protocol,
                    label: block.label || block.type.replace(/_/g, ' '),
                    description: block.description || '',
                    color: protocolColors[protocol] || '#FFFFFF',
                    params: block.params || {},
                    position: { x: 0, y: index * 2, z: 0 },
                } as LegoBlock;
            });
    }

    /**
     * Get example prompts for the UI
     */
    getExamplePrompts(): string[] {
        return [
            "Create a simple ETH/USDC swap strategy",
            "Build a yield farming strategy on Aave with USDC",
            "Design a delta-neutral position: supply USDC, borrow ETH",
            "Create an LP position in the WETH/USDC pool with fee collection",
            "Build a leveraged ETH long position using Aave",
        ];
    }

    /**
     * Check if service is configured
     */
    isConfigured(): boolean {
        return !!import.meta.env.VITE_GEMINI_API_KEY;
    }
}

export const aiStrategyService = new AIStrategyService();
