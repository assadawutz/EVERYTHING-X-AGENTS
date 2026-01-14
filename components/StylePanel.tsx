
import React, { useState } from 'react';
import { Paintbrush, Send, Zap, Palette } from 'lucide-react';

interface StylePanelProps {
  onUpdate: (instruction: string) => void;
  isProcessing: boolean;
  hasCode: boolean;
}

const PRESETS = [
  { 
    name: 'Modern Clean', 
    prompt: 'Update the UI styling to be Modern & Clean: Use generous whitespace, consistent padding, subtle shadows (shadow-sm), rounded-lg corners, and a high-contrast neutral palette with one primary accent color.' 
  },
  { 
    name: 'Glassmorphism', 
    prompt: 'Update the UI styling to use Glassmorphism: Add backdrop-blur-md, bg-white/10 or bg-black/10, white/20 borders, and subtle gradients. Ensure text remains readable.' 
  },
  { 
    name: 'Dark Mode Fix', 
    prompt: 'Fix Dark Mode styling: Ensure all text colors have dark mode alternates (text-gray-900 dark:text-white), backgrounds are dark (dark:bg-[#0B0F19]), and borders are subtle (dark:border-gray-800).' 
  },
  { 
    name: 'Thai Font Fix', 
    prompt: 'Update typography: Ensure the font-family is set to "font-sans" (Sarabun). Translate all placeholder text and labels to professional Thai language.' 
  },
];

const StylePanel: React.FC<StylePanelProps> = ({ onUpdate, isProcessing, hasCode }) => {
  const [instruction, setInstruction] = useState('');

  const handleUpdate = () => {
    if (!instruction.trim() || !hasCode) return;
    onUpdate(instruction);
    setInstruction(''); 
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Paintbrush className="w-4 h-4 text-pink-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Style & UX Refinement</h2>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 gap-2 mb-3">
            {PRESETS.map((preset) => (
                <button
                    key={preset.name}
                    onClick={() => onUpdate(preset.prompt)}
                    disabled={isProcessing || !hasCode}
                    className="text-left px-2 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-pink-500 dark:hover:border-pink-500 transition-all disabled:opacity-50 active:scale-95"
                >
                    <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-0.5">{preset.name}</div>
                </button>
            ))}
      </div>

      {/* Manual Instruction */}
      <div className="relative">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={!hasCode}
          placeholder={hasCode ? "e.g., Make buttons larger, Fix padding..." : "Generate UI first..."}
          className="w-full h-20 p-2.5 pr-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-pink-500 outline-none resize-none text-sm text-gray-800 dark:text-gray-200 disabled:opacity-50"
          onKeyDown={(e) => {
             if(e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleUpdate();
             }
          }}
        />
        <button
          onClick={handleUpdate}
          disabled={isProcessing || !instruction.trim() || !hasCode}
          className={`
            absolute bottom-2 right-2 p-1.5 rounded-md text-white transition-all shadow-sm active:scale-90
            ${isProcessing || !instruction.trim() ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}
          `}
        >
          {isProcessing ? <Zap className="w-3.5 h-3.5 animate-pulse" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export default StylePanel;
