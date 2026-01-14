import React, { useEffect, useState, useRef } from 'react';
import { Code2, Copy, Check, Edit2 } from 'lucide-react';
import Prism from 'prismjs';

interface CodePreviewProps {
  code: string;
  onChange?: (newCode: string) => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, onChange }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalCode(code);
    } else {
       // Only sync if significantly different to avoid cursor jumps during edits
       if (Math.abs(code.length - localCode.length) > 5) {
           setLocalCode(code);
       }
    }
  }, [code, isEditing]);

  useEffect(() => {
    if (!isEditing && localCode) {
      Prism.highlightAll();
    }
  }, [localCode, isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalCode(newVal);
    if (onChange) {
        onChange(newVal);
    }
  };

  // Generate line numbers
  const lineNumbers = localCode.split('\n').map((_, i) => i + 1).join('\n');

  return (
    <div className="bg-white dark:bg-gray-950 flex flex-col h-full font-mono text-sm md:border-r border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 h-10">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden xs:inline">TypeScript</span>
          {onChange && (
             <span className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${isEditing ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                {isEditing ? 'Editing' : 'Read-Only'}
             </span>
          )}
        </div>
        <div className="flex items-center gap-2">
            <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors border ${
                isEditing 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-transparent'
            }`}
            >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isEditing ? 'Done' : 'Edit'}</span>
            </button>
            
            <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-transparent"
            >
            {copied ? (
                <>
                <Check className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 hidden xs:inline">Copied</span>
                </>
            ) : (
                <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Copy</span>
                </>
            )}
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto relative group bg-editor flex">
        {!localCode ? (
          <div className="w-full flex flex-col items-center justify-center text-gray-500">
            <p className="opacity-50">Empty Buffer</p>
          </div>
        ) : (
          <>
             {/* Line Numbers - Dark theme forced to match editor bg */}
             <div className="hidden sm:block shrink-0 p-4 pr-3 text-right text-gray-500 bg-[#21252b] border-r border-[#181a1f] select-none leading-relaxed min-w-[3rem]">
                 <pre className="!bg-transparent !m-0 !p-0 !text-gray-500 text-xs font-mono opacity-50">{lineNumbers}</pre>
             </div>

             <div className="relative flex-1 min-w-0">
                {/* Textarea for editing */}
                <textarea
                    ref={textareaRef}
                    value={localCode}
                    onChange={handleChange}
                    className={`absolute inset-0 w-full h-full p-4 font-mono text-[13px] sm:text-sm leading-relaxed bg-transparent text-transparent caret-white outline-none resize-none z-10 whitespace-pre ${isEditing ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                />
                
                {/* Prism Highlighted View */}
                <pre className={`language-typescript !bg-transparent !m-0 !p-4 h-full text-[13px] sm:text-sm font-mono leading-relaxed overflow-visible pointer-events-none ${isEditing ? 'opacity-80' : 'opacity-100'}`}>
                    <code className="language-typescript">{localCode}</code>
                </pre>
             </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CodePreview;