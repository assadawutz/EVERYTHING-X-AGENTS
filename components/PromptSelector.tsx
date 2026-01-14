import React, { useState, useRef, useEffect } from 'react';
import { PROMPT_TEMPLATES } from '../constants';
import { PromptTemplate } from '../types';
import { MonitorPlay, ShoppingBag, Grid3X3, ChevronUp, Check } from 'lucide-react';

interface PromptSelectorProps {
  onSelect: (template: PromptTemplate) => void;
  selectedId: string | null;
}

const getIcon = (id: string) => {
    switch(id) {
        case 'ui-component': return <MonitorPlay className="w-4 h-4" />;
        case 'full-page': return <ShoppingBag className="w-4 h-4" />;
        case 'grid-layout': return <Grid3X3 className="w-4 h-4" />;
        default: return <MonitorPlay className="w-4 h-4" />;
    }
}

const PromptSelector: React.FC<PromptSelectorProps> = ({ onSelect, selectedId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Find selected template object
  const selectedTemplate = PROMPT_TEMPLATES.find(t => t.id === selectedId) || PROMPT_TEMPLATES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative mb-3" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        Select Mode
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl px-3 py-2.5 shadow-sm transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${
                selectedTemplate.id === 'ui-component' ? 'bg-blue-100 text-blue-600' :
                selectedTemplate.id === 'full-page' ? 'bg-purple-100 text-purple-600' :
                'bg-green-100 text-green-600'
            }`}>
                {getIcon(selectedTemplate.id)}
            </div>
            <div className="text-left min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {selectedTemplate.name}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 hidden xs:block truncate">
                    {selectedTemplate.description}
                </div>
            </div>
        </div>
        <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up max-h-[300px] overflow-y-auto">
            <div className="p-1">
            {PROMPT_TEMPLATES.map((template) => (
                <button
                    key={template.id}
                    onClick={() => {
                        onSelect(template);
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg text-left mb-0.5 last:mb-0"
                >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                         template.id === 'ui-component' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                         template.id === 'full-page' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                         'bg-green-100 dark:bg-green-900/30 text-green-600'
                    }`}>
                        {getIcon(template.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                            {template.name}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {template.description}
                        </div>
                    </div>
                    {selectedId === template.id && (
                        <Check className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                </button>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default PromptSelector;