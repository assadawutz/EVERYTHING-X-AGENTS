
import { GoogleGenAI } from "@google/genai";
import { MODEL_CONFIGS } from '../constants';
import { ModelConfig } from '../types';

const SYSTEM_INSTRUCTION = `
You are a senior frontend engineer.
You must follow these rules strictly:

- Use TailwindCSS v4 only (modern syntax compatible)
- Mobile-first design
- Use Tailwind container as layout base
- No global CSS
- No fixed px values
- Responsive rules:
  - Mobile: grid-cols-1
  - Tablet: sm:grid-cols-2
  - Desktop: md:grid-cols-3 or layout split
- Output JSX only
- No explanation, no markdown
- Entry point: EXPORT DEFAULT function App() { ... }
- Icons: import { IconName } from 'lucide-react'
- Charts: import { ... } from 'recharts'
`;

// Helper for timeout
const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms/1000}s`)), ms));

export const generateContent = async (
  apiKeyNotUsed: string, // Kept for signature compatibility if needed, but we use process.env.API_KEY
  prompt: string,
  modelConfig: ModelConfig,
  imageData?: string, 
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Configure thinking budget based on selected tier
    const thinkingConfig = modelConfig.thinkingBudget > 0 
      ? { thinkingBudget: modelConfig.thinkingBudget } 
      : undefined;

    const parts: any[] = [{ text: prompt }];
    
    if (imageData) {
        const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        parts.push({
            inlineData: {
                mimeType: "image/jpeg", 
                data: base64Data
            }
        });
    }

    const timeoutDuration = modelConfig.tier === 'ultra' ? 300000 : (modelConfig.tier === 'smart' ? 180000 : 60000);

    const generatePromise = ai.models.generateContent({
      model: modelConfig.id,
      contents: [{
          role: 'user',
          parts: parts
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig,
        temperature: 0.7, 
      }
    });

    const response = await Promise.race([generatePromise, timeoutPromise(timeoutDuration)]) as any;

    const text = response.text;
    if (!text) throw new Error("No content generated or blocked by safety filters.");

    let cleanText = text.replace(/^```(tsx|typescript|javascript|jsx)?\n/, '').replace(/\n```$/, '');
    cleanText = cleanText.replace(/```/g, '');
    
    return cleanText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const refactorCode = async (
  apiKey: string,
  currentCode: string,
  instruction: string
): Promise<string> => {
  const prompt = `
Refactor the following JSX to improve UX and responsiveness.

Rules:
- TailwindCSS v4 only
- Mobile-first
- Better grid behavior
- Improve spacing and hierarchy
- Do not change functionality unless asked
- Instruction: "${instruction}"

Code:
${currentCode}

Output:
JSX only
  `;
  
  return generateContent(apiKey, prompt, MODEL_CONFIGS.FAST, undefined);
};

export const fixCode = async (
    apiKey: string,
    currentCode: string,
    errorMessages: string[]
  ): Promise<string> => {
    const prompt = `
    You are a senior React Debugger.
    
    TASK: Fix the specific validation errors listed below in the provided React component.
    
    ERRORS TO FIX:
    ${errorMessages.map(e => `- ${e}`).join('\n')}
    
    STRICT RULES:
    1. Fix ONLY the errors listed above.
    2. Do NOT change logical functionality or layout structure unless required by the fix.
    3. Ensure all Tailwind classes are valid v4.
    4. Maintain existing imports (lucide-react, recharts).
    5. Return ONLY the fully corrected JSX code. No markdown.
    
    SOURCE CODE:
    ${currentCode}
    `;
  
    return generateContent(apiKey, prompt, MODEL_CONFIGS.FAST, undefined);
  };
