import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Terminal, AlertCircle, CheckCircle, Info, AlertTriangle, Wrench, Loader2, XCircle } from 'lucide-react';

interface LogsPanelProps {
  logs: LogEntry[];
  onAutoFix?: () => void;
  validationErrors?: string[];
  isProcessing?: boolean;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onAutoFix, validationErrors = [], isProcessing = false }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'success': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      default: return <Info className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const errorCount = validationErrors.length;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden max-h-56">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-200 dark:bg-gray-750 border-b border-gray-300 dark:border-gray-700 shrink-0">
        <div className="flex items-center">
            <Terminal className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">System Logs</span>
        </div>
        {errorCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="w-3 h-3 text-yellow-600 dark:text-yellow-500" />
                <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400">{errorCount} Issues</span>
            </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto font-mono text-xs bg-gray-50 dark:bg-[#1a202c] relative scroll-smooth">
        {/* Active Validation Warnings - Sticky Header */}
        {errorCount > 0 && (
            <div className="sticky top-0 z-20 bg-gray-50 dark:bg-[#1a202c] border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
                <div className="p-3">
                    <div className="p-3 bg-yellow-50/80 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" /> 
                                <span>Code Validation</span>
                            </div>
                            
                            {onAutoFix && (
                                <button 
                                    onClick={onAutoFix}
                                    disabled={isProcessing}
                                    className={`
                                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm
                                        ${isProcessing 
                                            ? 'bg-yellow-200/50 text-yellow-700/50 cursor-not-allowed' 
                                            : 'bg-white dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/60 border border-yellow-200 dark:border-yellow-800/50 active:scale-95'
                                        }
                                    `}
                                    title="Attempt to automatically fix detected issues"
                                >
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                                    <span>Auto Fix</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-1.5 pl-1 max-h-[100px] overflow-y-auto pr-1">
                            {validationErrors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-yellow-700/90 dark:text-yellow-400/90 leading-relaxed">
                                    <XCircle className="w-3 h-3 mt-0.5 shrink-0 opacity-70" />
                                    <span>{err}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Historical Logs */}
        <div className="p-3 pt-2 space-y-2">
            {logs.length === 0 && errorCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-40">
                  <Terminal className="w-8 h-8 mb-2" />
                  <p className="italic">Ready for output...</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <span className="text-gray-400 dark:text-gray-600 opacity-60 shrink-0 w-14 text-[10px] pt-0.5">
                    {log.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                  <div className="mt-0.5 shrink-0">{getIcon(log.type)}</div>
                  <span className={`${getColor(log.type)} break-all leading-relaxed`}>{log.message}</span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default LogsPanel;