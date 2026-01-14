
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PromptTemplate, LogEntry, ModelConfig } from './types';
import TaskPanel from './components/TaskPanel';
import CodePreview from './components/CodePreview';
import LivePreview from './components/LivePreview';
import StylePanel from './components/StylePanel';
import LogsPanel from './components/LogsPanel';
import SettingsModal from './components/SettingsModal';
import { generateContent, refactorCode, fixCode } from './lib/gemini';
import { validateReactCode } from './lib/validator';
import { MODEL_CONFIGS } from './constants';
// @ts-ignore
import JSZip from 'jszip';
import { Sun, Moon, Download, Settings, Code, Eye, Trash2, Menu, X, CheckCircle, AlertCircle, Info, Undo2, Redo2, SidebarClose, SidebarOpen, Laptop, Sparkles, Wrench, Save, Github } from 'lucide-react';

// --- Toast Component (Internal) ---
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  return (
    <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-xl p-4 rounded-2xl animate-slide-up min-w-[300px] max-w-[90vw] pointer-events-auto z-[200]">
      {icons[toast.type]}
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{toast.message}</span>
    </div>
  );
};

function App() {
  // --- State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [code, setCode] = useState<string>(''); 
  const [lastSavedCode, setLastSavedCode] = useState<string>('');

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  
  // Validation State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Refs
  const taskPanelRef = useRef<{ focus: () => void } | null>(null);

  // --- Effects ---
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('gemini-ide-theme') as 'light' | 'dark' | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else {
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(sysDark ? 'dark' : 'light');
    }

    const savedCode = localStorage.getItem('gemini-ide-code');
    if (savedCode) {
        setCode(savedCode);
        setLastSavedCode(savedCode);
        setHistory([savedCode]);
        setHistoryIndex(0);
        const result = validateReactCode(savedCode);
        setValidationErrors(result.messages);
        addLog("Project loaded from local storage", 'success');
    } else {
        addLog("Welcome to Gemini IDE. Ready to craft.", 'info');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gemini-ide-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (code) {
        const result = validateReactCode(code);
        setValidationErrors(result.messages);
    } else {
        setValidationErrors([]);
    }
  }, [code]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (code && code !== lastSavedCode) {
        localStorage.setItem('gemini-ide-code', code);
        setLastSavedCode(code);
        addLog("Auto-saved workspace", 'success');
        const result = validateReactCode(code);
        setValidationErrors(result.messages);
      }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [code, lastSavedCode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) handleRedo(); else handleUndo();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            localStorage.setItem('gemini-ide-code', code);
            setLastSavedCode(code);
            showToast("Saved manually", 'success');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, code]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const updateCodeWithHistory = (newCode: string) => {
      if (newCode === code) return;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newCode);
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCode(newCode);
      localStorage.setItem('gemini-ide-code', newCode);
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCode(history[newIndex]);
          localStorage.setItem('gemini-ide-code', history[newIndex]);
          showToast("Undo", 'info');
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCode(history[newIndex]);
          localStorage.setItem('gemini-ide-code', history[newIndex]);
          showToast("Redo", 'info');
      }
  };

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  const logValidationErrors = (codeToValidate: string) => {
      const result = validateReactCode(codeToValidate);
      if (!result.valid) {
          addLog("Validation Issues Found:", 'warning');
          result.messages.forEach(msg => addLog(msg, 'warning'));
      }
  };

  const handleStartBuilding = () => {
    if (taskPanelRef.current) taskPanelRef.current.focus();
  };

  const handleGenerate = async (prompt: string, image?: string, modelConfig: ModelConfig = MODEL_CONFIGS.SMART) => {
    setIsProcessing(true);
    addLog(`Using ${modelConfig.name}...`, 'info');
    setActiveTab('preview');

    try {
      let effectivePrompt = prompt;
      if (image) {
          effectivePrompt = `
          **STRICT IMAGE RECONSTRUCTION & LOGIC TASK**
          You are rebuilding the UI from the attached image.
          1. **VISUALS**: Match colors, spacing, borders, and layout exactly.
          2. **INTERACTIVITY**: Make it functional.
          3. **CONTENT**: Use the text visible in the image.
          User Note: ${prompt}
          `;
          addLog("Analyzing image & creating logic...", 'info');
      }

      const generated = await generateContent('', effectivePrompt, modelConfig, image);
      updateCodeWithHistory(generated);
      addLog("Generation complete", 'success');
      showToast("UI Generated Successfully", 'success');
      logValidationErrors(generated);

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Generation Failed: ${msg}`, 'error');
      showToast("Generation failed", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStyleUpdate = async (instruction: string) => {
    setIsProcessing(true);
    addLog(`Refactoring...`, 'info');
    setIsMobileMenuOpen(false); 
    
    try {
      const updated = await refactorCode('', code, instruction);
      updateCodeWithHistory(updated);
      addLog("Refactor complete", 'success');
      showToast("Design updated", 'success');
      logValidationErrors(updated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Refactor Failed: ${msg}`, 'error');
      showToast("Update failed", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoFix = async () => {
      if (validationErrors.length === 0) return;
      setIsProcessing(true);
      addLog("Auto-fixing issues...", 'info');
      try {
          const fixed = await fixCode('', code, validationErrors);
          updateCodeWithHistory(fixed);
          addLog("Auto-fix complete", 'success');
          showToast("Code repaired", 'success');
          const result = validateReactCode(fixed);
          if (result.valid) addLog("All issues resolved.", 'success');
          else logValidationErrors(fixed);
      } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          addLog(`Fix Failed: ${msg}`, 'error');
          showToast("Fix failed", 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownload = () => {
    if (!code) return;
    const fileContent = `/**\n * Generated by Gemini AI Agent IDE\n */\n\n${code}`;
    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'App.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("File exported (App.tsx)", 'success');
  };

  const handleGithubExport = async () => {
    if (!code) return;
    setIsProcessing(true);
    addLog("Packaging project for GitHub...", 'info');
    try {
        const zip = new JSZip();
        zip.file("package.json", JSON.stringify({
            name: "gemini-generated-project", private: true, version: "0.0.0", type: "module",
            scripts: { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
            dependencies: { "lucide-react": "^0.294.0", "react": "^18.2.0", "react-dom": "^18.2.0", "recharts": "^2.12.0", "clsx": "^2.0.0", "tailwind-merge": "^2.0.0" },
            devDependencies: { "@types/react": "^18.2.43", "@types/react-dom": "^18.2.17", "@vitejs/plugin-react": "^4.2.1", "autoprefixer": "^10.4.16", "postcss": "^8.4.32", "tailwindcss": "^3.4.0", "typescript": "^5.2.2", "vite": "^5.0.8" }
        }, null, 2));
        zip.file("vite.config.ts", `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })`);
        zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */\nexport default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [] }`);
        zip.file("postcss.config.js", `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`);
        zip.file("README.md", `# Gemini Generated Project\n\n## Getting Started\n1. Install: \`npm install\`\n2. Run: \`npm run dev\``);
        zip.file("index.html", `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Gemini Project</title></head><body><div id="root"></div><script type="module" src="/src/index.tsx"></script></body></html>`);
        const src = zip.folder("src");
        src?.file("index.tsx", `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.tsx'\nimport './index.css'\nReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)`);
        src?.file("index.css", `@tailwind base;\n@tailwind components;\n@tailwind utilities;`);
        src?.file("App.tsx", code);
        zip.file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2020", lib: ["ES2020", "DOM", "DOM.Iterable"], module: "ESNext", skipLibCheck: true, moduleResolution: "bundler", jsx: "react-jsx", strict: true }, include: ["src"] }, null, 2));
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "gemini-project.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addLog("Project exported successfully.", 'success');
        showToast("Project downloaded!", 'success');
    } catch (e) {
        addLog("Failed to export project.", 'error');
        showToast("Failed to create ZIP", 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleClear = () => {
    if (window.confirm("Clear workspace?")) {
        updateCodeWithHistory('');
        showToast("Workspace cleared", 'info');
    }
  };

  return (
    <div className="h-dvh flex flex-col font-sans bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden">
      <div className="fixed top-2 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      <nav className="h-14 shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-[40] px-3 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"><Menu className="w-5 h-5" /></button>
             <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                {isSidebarCollapsed ? <SidebarOpen className="w-5 h-5" /> : <SidebarClose className="w-5 h-5" />}
             </button>
             <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-1.5 rounded-lg text-white"><Laptop className="w-4 h-4" /></div>
                <h1 className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-tight hidden xs:block">Gemini <span className="text-blue-600 dark:text-blue-400">IDE</span></h1>
             </div>
          </div>
          <div className="flex items-center gap-1">
             <div className="flex items-center gap-0.5 mr-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-0.5">
                 <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 text-gray-500 hover:text-gray-800 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
                 <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-gray-500 hover:text-gray-800 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
             </div>
          </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} />}
          <div className={`fixed top-0 bottom-0 left-0 z-[100] w-[85vw] max-w-[300px] bg-white dark:bg-gray-900 md:static md:z-auto md:h-full md:border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'md:w-0 md:border-r-0 md:overflow-hidden' : 'md:w-[320px]'}`}>
             <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 md:hidden shrink-0">
                <div className="flex items-center gap-2 font-bold text-lg text-gray-800 dark:text-white"><Sparkles className="w-5 h-5 text-blue-500" /><span>Menu</span></div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settings</div>
                    <button onClick={toggleTheme} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                </div>
                <div><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tools</div><StylePanel onUpdate={handleStyleUpdate} isProcessing={isProcessing} hasCode={!!code} /></div>
                <LogsPanel logs={logs} onAutoFix={handleAutoFix} validationErrors={validationErrors} isProcessing={isProcessing} />
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
                     <button onClick={handleGithubExport} disabled={!code || isProcessing} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold disabled:opacity-50"><Github className="w-4 h-4" /><span>Download Project (Zip)</span></button>
                     <div className="flex gap-2">
                        <button onClick={handleDownload} disabled={!code} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 text-sm"><Download className="w-4 h-4" /><span>.tsx</span></button>
                        <button onClick={handleClear} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-red-600 border border-transparent"><Trash2 className="w-4 h-4" /><span>Clear</span></button>
                     </div>
                </div>
             </div>
          </div>

          <main className="flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-gray-950 relative h-full">
             <div className="shrink-0 p-2 md:px-4 md:py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-10 gap-4">
                 <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center w-full max-w-[240px]">
                    <button onClick={() => setActiveTab('preview')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold ${activeTab === 'preview' ? 'bg-white dark:bg-gray-800 text-blue-600' : 'text-gray-500'}`}><Eye className="w-3.5 h-3.5" /> Preview</button>
                    <button onClick={() => setActiveTab('code')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold ${activeTab === 'code' ? 'bg-white dark:bg-gray-800 text-blue-600' : 'text-gray-500'}`}><Code className="w-3.5 h-3.5" /> Code</button>
                 </div>
                 {validationErrors.length > 0 && (
                    <button onClick={handleAutoFix} disabled={isProcessing} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-lg text-xs font-medium animate-pulse"><Wrench className="w-3.5 h-3.5" /><span className="hidden sm:inline">Auto Fix</span></button>
                 )}
             </div>
             <div className="flex-1 overflow-hidden relative">
                 <div className={`absolute inset-0 ${activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><LivePreview code={code} isProcessing={isProcessing} onStart={handleStartBuilding} /></div>
                 <div className={`absolute inset-0 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><CodePreview code={code} onChange={updateCodeWithHistory} /></div>
             </div>
             <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30 pb-[env(safe-area-inset-bottom)]">
                 <div className="p-2 md:p-4 max-w-4xl mx-auto w-full"><TaskPanel ref={taskPanelRef} selectedTemplate={null} onRun={handleGenerate} isProcessing={isProcessing} /></div>
             </div>
          </main>
      </div>
    </div>
  );
}

export default App;
