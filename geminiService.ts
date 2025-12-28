import { GoogleGenAI } from "@google/genai";
import { LegoBlock } from "./types";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("No API KEY found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const auditStrategy = async (blocks: LegoBlock[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "DEMO MODE: API Key missing. Strategy assumes valid logic but requires manual review.";
  }

  try {
    const ai = getAI();

    const strategyDescription = blocks.map((b, i) => {
      const params = b.params
        ? Object.entries(b.params).map(([k, v]) => `${k}=${v}`).join(', ')
        : '';
      return `${i + 1}. [${b.protocol}] ${b.label}${params ? ` (${params})` : ''}`;
    }).join('\n');

    const prompt = `
You are a quantitative trading strategist auditing a paper trading strategy.

STRATEGY BLOCKS:
${strategyDescription}

TASK:
1. Identify logical errors (e.g., selling before buying, missing exit conditions)
2. Assess risk level (Low/Medium/High) based on stop losses and position sizing
3. Provide a concise "Verdict" in 1-2 sentences
4. Suggest ONE improvement

Keep response stark, professional, under 100 words. Plain text only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "AUDIT_FAILURE: No response generated.";
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return "CONNECTION_ERROR: Unable to reach AI audit service.";
  }
};

export const analyzeStrategy = async (blocks: LegoBlock[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI analysis unavailable in demo mode.";
  }

  try {
    const ai = getAI();

    const strategyDescription = blocks.map(b => `${b.label} (${b.description})`).join(' → ');

    const prompt = `
Analyze this trading strategy: ${strategyDescription}

Provide:
1. Strategy type (trend-following, mean reversion, breakout, etc.)
2. Strengths (2-3 bullet points)
3. Weaknesses (2-3 bullet points)
4. Market conditions where it excels

Keep under 150 words. Use bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Strategy Analysis Error:", error);
    return "Analysis service unavailable.";
  }
};

export const suggestBlocks = async (currentBlocks: LegoBlock[]): Promise<string[]> => {
  if (!process.env.API_KEY || currentBlocks.length === 0) {
    return [];
  }

  try {
    const ai = getAI();

    const blockTypes = currentBlocks.map(b => b.type).join(', ');

    const prompt = `
Current strategy blocks: ${blockTypes}

Suggest 2-3 missing block types that would improve this strategy.
Return ONLY block type names (like STOP_LOSS, RSI_SIGNAL), one per line, no explanations.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return (response.text || '').split('\n').filter(s => s.trim().length > 0);
  } catch (error) {
    console.error("Suggestion Error:", error);
    return [];
  }
};

export const explainBlock = async (block: LegoBlock): Promise<string> => {
  if (!process.env.API_KEY) {
    return block.description;
  }

  try {
    const ai = getAI();

    const prompt = `
Explain the trading block "${block.label}" to a beginner trader in 2-3 sentences.
Include when to use it and typical parameter values.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || block.description;
  } catch (error) {
    console.error("Explanation Error:", error);
    return block.description;
  }
};
