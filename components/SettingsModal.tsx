
import React from 'react';
import { Info, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string; // Kept for prop signature
  onSave: (key: string) => void; // Kept for prop signature
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-zoom-in relative overflow-hidden">
        
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Workspace Info</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
             <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
               🚀 Secure Environment Active
             </p>
             <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
               The application is pre-configured with a secure API connection. No manual key entry is required in this environment.
             </p>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p>• Models: Gemini 3.0 Pro & Flash Lite</p>
            <p>• Framework: React + TailwindCSS v4</p>
            <p>• UI Icons: Lucide React</p>
            <p>• Storage: Persistent local workspace</p>
          </div>
        </div>

        <div className="p-4 md:p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-semibold transition-all active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
