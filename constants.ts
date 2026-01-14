
import { PromptTemplate, ModelConfig } from './types';

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  FAST: {
    id: 'gemini-flash-lite-latest',
    tier: 'fast',
    name: 'Flash Lite (Speed)',
    description: 'เร็วสุด ประหยัดสุด เหมาะสำหรับแก้โค้ดเล็กน้อย',
    thinkingBudget: 0,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30
  },
  SMART: {
    id: 'gemini-3-pro-preview',
    tier: 'smart',
    name: 'Pro 3.0 (Balanced)',
    description: 'สมดุลระหว่างความฉลาดและราคา (แนะนำ)',
    thinkingBudget: 2048, 
    inputCostPer1M: 3.50,
    outputCostPer1M: 10.50
  },
  ULTRA: {
    id: 'gemini-3-pro-preview',
    tier: 'ultra',
    name: 'Pro 3.0 (Max Thinking)',
    description: 'ฉลาดที่สุด คิดลึกซึ้ง เหมาะกับงานซับซ้อน',
    thinkingBudget: 16384, 
    inputCostPer1M: 3.50,
    outputCostPer1M: 10.50
  }
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'ui-component',
    name: 'UI Component',
    description: 'Interactive units (Cards, Forms, Buttons)',
    template: `Create a React UI component.

Component description:
{{TASK}}

Requirements:
- TailwindCSS v4 only
- Use container
- Mobile-first
- Responsive grid
- Clean and readable JSX
- Good UX spacing and hierarchy

Output:
JSX only`
  },
  {
    id: 'full-page',
    name: 'Full Page / Feature',
    description: 'Complete screens (Dashboard, Landing, Settings)',
    template: `Create a full page UI.

Feature:
{{TASK}}

Rules:
- TailwindCSS v4
- container layout
- Mobile-first
- Responsive grid
- Section-based layout
- Good UX and visual hierarchy

Output:
JSX only`
  },
  {
    id: 'grid-layout',
    name: 'Grid / Layout',
    description: 'Responsive structures and lists',
    template: `Create a responsive grid layout.

Requirements:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Use Tailwind container
- Card-based UI
- Good spacing and shadow

Content:
{{TASK}}

Output:
JSX only`
  }
];
