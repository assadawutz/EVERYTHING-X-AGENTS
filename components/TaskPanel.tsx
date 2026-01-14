import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { PromptTemplate, ModelConfig } from '../types';
import { MODEL_CONFIGS, PROMPT_TEMPLATES } from '../constants';
import PromptSelector from './PromptSelector';
import { Play, Loader2, Image as ImageIcon, X, Zap, Send, Paperclip, ChevronRight, Calculator, Cpu, Gauge } from 'lucide-react';

interface TaskPanelProps {
  selectedTemplate: PromptTemplate | null;
  onRun: (prompt: string, image?: string, modelConfig?: ModelConfig) => void;
  isProcessing: boolean;
  // We handle selection internally now, but can sync up if needed
}

const TaskPanel = forwardRef<{ focus: () => void }, TaskPanelProps>(({ selectedTemplate: initialTemplate, onRun, isProcessing }, ref) => {
  const [taskDetails, setTaskDetails] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODEL_CONFIGS.SMART);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  // Local template state if we want TaskPanel to be self-contained for selection
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate>(initialTemplate || PROMPT_TEMPLATES[0]);

  useEffect(() => {
    if (initialTemplate) {
        setCurrentTemplate(initialTemplate);
    }
  }, [initialTemplate]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.parentElement?.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => inputRef.current?.parentElement?.classList.remove('ring-2', 'ring-blue-500'), 1000);
        }
    }
  }));

  const handleRun = () => {
    if (isProcessing) return;
    
    if (!taskDetails.trim() && !selectedImage) return;

    const detailsToUse = taskDetails.trim() || "Clone this UI exactly as seen in the image.";
    const templateStr = currentTemplate.template || "Create a React component: {{TASK}}";
    const finalPrompt = templateStr.replace('{{TASK}}', detailsToUse);
    
    onRun(finalPrompt, selectedImage || undefined, selectedModel);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRun();
    }
  };

  const calculateCost = () => {
      const THB_USD = 35; 
      const textTokens = taskDetails.length * 0.25 + 500; 
      const imageTokens = selectedImage ? 258 : 0; 
      const inputTokens = textTokens + imageTokens;
      const codeTokens = 2000;
      const thinkingTokens = selectedModel.thinkingBudget;
      const outputTokens = codeTokens + thinkingTokens;
      const inputCost = (inputTokens / 1000000) * selectedModel.inputCostPer1M * THB_USD;
      const outputCost = (outputTokens / 1000000) * selectedModel.outputCostPer1M * THB_USD;
      const total = inputCost + outputCost;
      return total < 0.01 ? "< 0.01" : total.toFixed(2);
  };

  const isReady = !isProcessing && (!!taskDetails.trim() || !!selectedImage);

  // Dynamic placeholder based on template
  const getPlaceholder = () => {
      if (selectedImage) return "Describe what to change in this image...";
      switch (currentTemplate.id) {
          case 'ui-component': return "e.g., Pricing cards with 3 plans...";
          case 'full-page': return "e.g., Dashboard with sidebar and charts...";
          case 'grid-layout': return "e.g., Photo gallery with masonry layout...";
          default: return "Describe your UI...";
      }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none z-20 sticky bottom-0 md:relative md:border md:rounded-2xl md:shadow-sm">
      
      {/* 1. Prompt Selector (Mode Switcher) */}
      <PromptSelector 
        selectedId={currentTemplate.id} 
        onSelect={setCurrentTemplate} 
      />

      {/* Image Preview */}
      {selectedImage && (
        <div className="relative inline-block mb-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <img src={selectedImage} alt="Reference" className="h-20 w-auto object-cover opacity-90" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                <button 
                    onClick={clearImage}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
              REF
            </div>
        </div>
      )}

      {/* 2. Main Input Area */}
      <div className="flex gap-2 items-end">
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`
            p-3 rounded-xl transition-all duration-200 shrink-0 flex items-center justify-center h-[48px] w-[48px]
            ${selectedImage 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
          title="Upload Reference Image"
        >
           <Paperclip className="w-5 h-5" />
           <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
           />
        </button>

        <div className="flex-1 relative bg-gray-100 dark:bg-gray-950 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all transition-duration-300">
            <textarea
                ref={inputRef}
                value={taskDetails}
                onChange={(e) => setTaskDetails(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                placeholder={getPlaceholder()}
                className="w-full max-h-32 min-h-[48px] py-3 px-4 bg-transparent border-none focus:ring-0 resize-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 leading-relaxed"
                rows={1}
                style={{ height: 'auto', minHeight: '48px' }} 
                onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                }}
            />
        </div>

        <button
          onClick={handleRun}
          disabled={!isReady}
          className={`
            p-3 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 shadow-sm h-[48px] w-[48px]
            ${!isReady
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30 active:scale-95'
            }
          `}
        >
           {isProcessing ? (
               <Loader2 className="w-5 h-5 animate-spin" />
           ) : (
               <Send className="w-5 h-5 ml-0.5" />
           )}
        </button>
      </div>

      {/* 3. Footer: Model Selector & Stats */}
      <div className="mt-2 flex items-center justify-between px-1">
          <div className="relative">
             <button 
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
             >
                {selectedModel.tier === 'fast' && <Zap className="w-3.5 h-3.5 text-yellow-500" />}
                {selectedModel.tier === 'smart' && <Cpu className="w-3.5 h-3.5 text-blue-500" />}
                {selectedModel.tier === 'ultra' && <Gauge className="w-3.5 h-3.5 text-purple-500" />}
                <span>{selectedModel.name}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${showModelMenu ? '-rotate-90' : 'rotate-90'}`} />
             </button>

             {/* Model Selector Dropdown */}
             {showModelMenu && (
                 <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Select Intelligence Level</h4>
                        </div>
                        <div className="p-1">
                            {Object.values(MODEL_CONFIGS).map((model) => (
                                <button
                                    key={model.id + model.tier}
                                    onClick={() => {
                                        setSelectedModel(model);
                                        setShowModelMenu(false);
                                    }}
                                    className={`w-full text-left p-2 rounded-lg text-xs flex items-start gap-3 transition-colors ${selectedModel.tier === model.tier ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <div className={`mt-0.5 p-1 rounded-md ${
                                        model.tier === 'fast' ? 'bg-yellow-100 text-yellow-600' :
                                        model.tier === 'smart' ? 'bg-blue-100 text-blue-600' :
                                        'bg-purple-100 text-purple-600'
                                    }`}>
                                        {model.tier === 'fast' && <Zap className="w-3 h-3" />}
                                        {model.tier === 'smart' && <Cpu className="w-3 h-3" />}
                                        {model.tier === 'ultra' && <Gauge className="w-3 h-3" />}
                                    </div>
                                    <div>
                                        <div className={`font-semibold ${selectedModel.tier === model.tier ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {model.name}
                                        </div>
                                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                            {model.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                 </>
             )}
          </div>

          <div className="flex items-center gap-3">
              {isProcessing && (
                  <span className="text-[10px] text-blue-500 font-medium animate-pulse flex items-center gap-1">
                      Thinking... <span className="hidden sm:inline">(Model: {selectedModel.name})</span>
                  </span>
              )}
              {!isProcessing && (taskDetails || selectedImage) && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <Calculator className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-mono text-gray-600 dark:text-gray-300">
                        Est: ฿{calculateCost()}
                      </span>
                  </div>
              )}
          </div>
      </div>

    </div>
  );
});

export default TaskPanel;