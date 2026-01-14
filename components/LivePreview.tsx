import React, { useState, useEffect, useRef } from 'react';
import * as Babel from '@babel/standalone';
import { Smartphone, Tablet, Monitor, RefreshCw, Loader2, Sparkles, Command, ArrowRight, Signal, Wifi, Battery } from 'lucide-react';

interface LivePreviewProps {
  code: string;
  isProcessing: boolean;
  onStart?: () => void;
}

const LivePreview: React.FC<LivePreviewProps> = ({ code, isProcessing, onStart }) => {
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [isSmallDevice, setIsSmallDevice] = useState(false);
  const [key, setKey] = useState(0); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const checkSize = () => {
      const isSmall = window.innerWidth < 768;
      setIsSmallDevice(isSmall);
      if (isSmall) {
        setViewport('mobile');
      }
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    
    // Clock for status bar
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    return () => {
        window.removeEventListener('resize', checkSize);
        clearInterval(timer);
    };
  }, []);

  const generateSrcDoc = (rawCode: string) => {
    try {
      let lucideImports: string[] = [];
      let defaultLucideImport: string | null = null;
      let rechartsImports: string[] = [];
      let defaultRechartsImport: string | null = null;

      // Babel plugin to collect imports and handle exports
      const customPlugin = (babel: any) => {
        const { types: t } = babel;
        return {
          visitor: {
            // 1. Handle Imports
            ImportDeclaration(path: any) {
              const source = path.node.source.value;
              
              // Skip "import type"
              if (path.node.importKind === 'type') {
                 path.remove();
                 return;
              }

              // Remove React imports
              if (source === 'react' || source === 'react-dom') {
                path.remove();
                return;
              }

              // Collect Lucide imports
              if (source === 'lucide-react') {
                path.node.specifiers.forEach((specifier: any) => {
                  if (t.isImportSpecifier(specifier)) {
                     // Check for "import type" inside specifier
                     if (specifier.importKind === 'type') return;

                     const importedName = specifier.imported.name || specifier.imported.value;
                     const localName = specifier.local.name;
                     if (importedName && localName) {
                        if (importedName !== localName) {
                            lucideImports.push(`${importedName}: ${localName}`);
                        } else {
                            lucideImports.push(importedName);
                        }
                     }
                  } else if (t.isImportDefaultSpecifier(specifier) || t.isImportNamespaceSpecifier(specifier)) {
                    defaultLucideImport = specifier.local.name;
                  }
                });
                path.remove();
              }

              // Collect Recharts imports
              if (source === 'recharts') {
                 path.node.specifiers.forEach((specifier: any) => {
                   if (t.isImportSpecifier(specifier)) {
                      if (specifier.importKind === 'type') return;

                      const importedName = specifier.imported.name || specifier.imported.value;
                      const localName = specifier.local.name;
                      if (importedName && localName) {
                          if (importedName !== localName) {
                             rechartsImports.push(`${importedName}: ${localName}`);
                          } else {
                             rechartsImports.push(importedName);
                          }
                      }
                   } else if (t.isImportDefaultSpecifier(specifier) || t.isImportNamespaceSpecifier(specifier)) {
                     defaultRechartsImport = specifier.local.name;
                   }
                 });
                 path.remove();
              }
            },
            
            // 2. Handle Default Export -> window.App
            ExportDefaultDeclaration(path: any) {
              const declaration = path.node.declaration;
              
              // Case 1: export default function App() {} or class App {}
              if (t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) {
                 if (declaration.id) {
                    // Convert to declaration + assignment: 
                    // function App() {}; window.App = App;
                    path.replaceWithMultiple([
                        declaration,
                        t.expressionStatement(
                            t.assignmentExpression('=', 
                                t.memberExpression(t.identifier('window'), t.identifier('App')), 
                                declaration.id
                            )
                        )
                    ]);
                 } else {
                    // Anonymous: export default function() {}
                    // Convert to: window.App = function() {};
                    path.replaceWith(
                       t.expressionStatement(
                          t.assignmentExpression('=', 
                             t.memberExpression(t.identifier('window'), t.identifier('App')), 
                             t.toExpression(declaration)
                          )
                       )
                    );
                 }
              } else {
                 // Case 2: export default App; or export default () => {};
                 // Convert to: window.App = App;
                 path.replaceWith(
                    t.expressionStatement(
                       t.assignmentExpression('=', 
                          t.memberExpression(t.identifier('window'), t.identifier('App')), 
                          declaration
                       )
                    )
                 );
              }
            }
          }
        }
      };

      const transformResult = Babel.transform(rawCode, {
        presets: ['react', 'typescript'],
        plugins: [customPlugin],
        filename: 'component.tsx',
        retainLines: false, // Must be false to ensure clean removal
      });
      
      let jsCode = transformResult.code || '';
      
      // Construct Preamble
      let preamble = '';
      
      // Inject Lucide
      if (lucideImports.length > 0) {
        const unique = Array.from(new Set(lucideImports.filter(Boolean)));
        if (unique.length > 0) {
            preamble += `const { ${unique.join(', ')} } = window.Lucide;\n`;
        }
      }
      if (defaultLucideImport) {
          preamble += `const ${defaultLucideImport} = window.Lucide;\n`;
      }

      // Inject Recharts
      if (rechartsImports.length > 0) {
        const unique = Array.from(new Set(rechartsImports.filter(Boolean)));
        if (unique.length > 0) {
            preamble += `const { ${unique.join(', ')} } = window.Recharts;\n`;
        }
      }
      if (defaultRechartsImport) {
         preamble += `const ${defaultRechartsImport} = window.Recharts;\n`;
      }

      // Combine
      jsCode = preamble + jsCode;
      
      // Final execution
      jsCode += `\nif (window.App) { renderApp(window.App); } else { throw new Error("No default export found (window.App is undefined)"); }`;

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <script>
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: { sans: ['Sarabun', 'sans-serif'] },
                    colors: { primary: '#2563eb' }
                  }
                }
              }
            </script>
            <style>
              body { background-color: white; margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; min-height: 100vh; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
              ::-webkit-scrollbar { width: 0px; background: transparent; }
              
              /* Non-intrusive Error Overlay */
              #error-overlay {
                position: fixed;
                bottom: 16px;
                left: 16px;
                right: 16px;
                z-index: 50;
                display: none;
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              }
              @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              .error-card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(220, 38, 38, 0.2);
                padding: 16px;
                max-width: 400px;
                margin: 0 auto;
                color: #1f2937;
              }
              @media (prefers-color-scheme: dark) {
                .error-card {
                    background: #1f2937;
                    color: #f3f4f6;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(220, 38, 38, 0.5);
                }
              }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <div id="error-overlay">
                <div class="error-card">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="color: #ef4444; flex-shrink: 0;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">Runtime Error</h3>
                            <pre id="error-message" style="font-family: monospace; font-size: 11px; background: rgba(239, 68, 68, 0.1); padding: 8px; border-radius: 6px; color: #ef4444; margin: 0 0 12px 0; overflow-x: auto; white-space: pre-wrap; word-break: break-word;"></pre>
                            <button onclick="window.location.reload()" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: opacity 0.2s;">
                                Reload Preview
                            </button>
                        </div>
                        <button onclick="document.getElementById('error-overlay').style.display='none'" style="color: #9ca3af; background: none; border: none; cursor: pointer; padding: 0;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <script type="module">
              import React from 'https://esm.sh/react@18.2.0';
              import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
              import * as Lucide from 'https://esm.sh/lucide-react@0.300.0';
              import * as Recharts from 'https://esm.sh/recharts@2.12.0';
              
              window.React = React;
              window.Lucide = Lucide;
              window.Recharts = Recharts;
              
              // Common Destructuring for convenience
              const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, useLayoutEffect } = React;
              
              const showError = (msg) => {
                 const overlay = document.getElementById('error-overlay');
                 const msgEl = document.getElementById('error-message');
                 if (msgEl) msgEl.textContent = msg;
                 if (overlay) overlay.style.display = 'block';
              };
              
              window.onerror = function(message, source, lineno, colno, error) { 
                  showError(message + "\\nLine: " + lineno); 
              };
              
              window.renderApp = (Component) => {
                  try {
                    if (!Component) throw new Error("Component is undefined.");
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(React.createElement(Component));
                  } catch (e) { showError(e.message); }
              };
              
              try { 
                ${jsCode} 
              } catch (err) { 
                showError(err.message); 
              }
            </script>
          </body>
        </html>
      `;
    } catch (e: any) {
      return `<html><body><div style="color:red; padding:20px;">Build Error: ${e.message}</div></body></html>`;
    }
  };

  useEffect(() => {
    if (!code) return;
    setError(null);
    const srcDoc = generateSrcDoc(code);
    if (iframeRef.current) {
        iframeRef.current.srcdoc = srcDoc;
    }
  }, [code, key]);

  const handleRefresh = () => setKey(k => k + 1);

  const isMobileView = viewport === 'mobile';
  
  // Logic: On small native devices, force full width/height. 
  // On desktop, 'mobile' means 'simulator'.
  const getSimStyle = () => {
    if (isSmallDevice) {
        return { width: '100%', height: '100%', borderRadius: '0px', borderWidth: '0px' };
    }

    if (isMobileView) return { width: '390px', height: '844px', borderRadius: '44px', borderWidth: '8px' };
    if (viewport === 'tablet') return { width: '768px', height: '1024px', borderRadius: '24px', borderWidth: '8px' };
    return { width: '100%', height: '100%', borderRadius: '0px', borderWidth: '0px' };
  };

  const simStyle = getSimStyle();
  const showBezel = !isSmallDevice && (viewport === 'mobile' || viewport === 'tablet');

  // Skeleton Loader Component (Inside Phone)
  const SkeletonLoader = () => (
    <div className="w-full h-full bg-white p-6 flex flex-col animate-pulse">
        {/* Fake Header */}
        <div className="flex justify-between items-center mb-8">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="w-24 h-4 bg-gray-200 rounded-md"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Fake Hero */}
        <div className="w-full h-48 bg-gray-100 rounded-2xl mb-6"></div>
        <div className="w-3/4 h-6 bg-gray-200 rounded-md mb-3"></div>
        <div className="w-1/2 h-4 bg-gray-100 rounded-md mb-8"></div>

        {/* Fake List */}
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="w-full h-4 bg-gray-100 rounded-md"></div>
                        <div className="w-2/3 h-3 bg-gray-50 rounded-md"></div>
                    </div>
                </div>
            ))}
        </div>

        {/* Processing Indicator Overlay */}
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-600">Generating UI...</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-full bg-gray-100 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
         <div className="flex gap-2">
            {!isSmallDevice && (
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button onClick={() => setViewport('mobile')} className={`p-1.5 px-2.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${viewport === 'mobile' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                    <button onClick={() => setViewport('tablet')} className={`p-1.5 px-2.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${viewport === 'tablet' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Tablet className="w-3.5 h-3.5" /> Tablet
                    </button>
                    <button onClick={() => setViewport('desktop')} className={`p-1.5 px-2.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${viewport === 'desktop' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                    </button>
                </div>
            )}
            {isSmallDevice && (
                 <div className="flex items-center gap-2 px-2 text-xs font-medium text-gray-500">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <span>Native Mobile View</span>
                 </div>
            )}
         </div>
         <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Reload Preview">
                <RefreshCw className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Workspace */}
      <div className={`flex-1 flex justify-center items-center overflow-auto bg-gray-100 dark:bg-black/40 relative pattern-grid ${isSmallDevice ? 'p-0' : 'p-4 md:p-8'}`}>
         {/* Device Simulator Container */}
         <div 
            className={`
                relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-black shadow-2xl animate-zoom-in
                ${showBezel && isMobileView ? 'shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)]' : ''}
            `}
            style={{ 
                width: simStyle.width, 
                height: simStyle.height, 
                borderRadius: simStyle.borderRadius,
                border: `${simStyle.borderWidth} solid #1f1f1f`,
                boxShadow: showBezel && isMobileView ? '0 0 0 2px #333, 0 20px 40px rgba(0,0,0,0.4)' : 'none',
                maxWidth: '100%',
                maxHeight: '100%'
            }}
        >
            {/* iPhone Notch/Status Bar Extras - Only if showing bezel */}
            {showBezel && isMobileView && (
                <>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-3xl z-30 flex items-center justify-center">
                        <div className="w-16 h-4 bg-[#1a1a1a] rounded-full flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0f0]"></div>
                        </div>
                    </div>
                    <div className="absolute top-2 left-6 right-6 flex justify-between items-center text-white text-[10px] font-medium z-30 pointer-events-none mix-blend-difference">
                        <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="flex items-center gap-1.5">
                            <Signal className="w-3 h-3" /> <Wifi className="w-3 h-3" /> <Battery className="w-4 h-4" />
                        </div>
                    </div>
                    {/* Buttons */}
                    <div className="absolute top-24 -left-[10px] w-[3px] h-8 bg-[#2d2d2d] rounded-l-md"></div>
                    <div className="absolute top-36 -left-[10px] w-[3px] h-14 bg-[#2d2d2d] rounded-l-md"></div>
                    <div className="absolute top-52 -left-[10px] w-[3px] h-14 bg-[#2d2d2d] rounded-l-md"></div>
                    <div className="absolute top-40 -right-[10px] w-[3px] h-20 bg-[#2d2d2d] rounded-r-md"></div>
                </>
            )}

            {/* SCREEN CONTENT AREA */}
            <div className={`w-full h-full overflow-hidden bg-white relative z-10 ${showBezel ? 'rounded-[34px]' : ''}`}>
                
                {/* 1. Processing State */}
                {isProcessing && <SkeletonLoader />}

                {/* 2. Empty State (Start Screen) - Inside Phone */}
                {!code && !isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
                         
                         <div className="relative group">
                             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-20 group-hover:opacity-40 blur transition-opacity duration-500"></div>
                             <div className="relative w-20 h-20 bg-white dark:bg-gray-900 rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-gray-100 dark:border-gray-800">
                                <Sparkles className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                             </div>
                         </div>
                         
                         <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center tracking-tight">
                            Gemini Designer
                         </h3>
                         
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 text-center max-w-[260px] leading-relaxed">
                            Describe your UI idea or upload a wireframe to generate production-ready React code instantly.
                         </p>
                         
                         <button 
                            onClick={onStart}
                            className="group relative w-full max-w-[240px] flex items-center justify-between px-5 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-semibold text-sm shadow-xl shadow-gray-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="flex items-center gap-3">
                                <Command className="w-4 h-4 opacity-50" />
                                <span>Start Building</span>
                            </span>
                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </button>
                    </div>
                )}

                {/* 3. Result State (Iframe) */}
                {code && !isProcessing && (
                     <iframe
                        ref={iframeRef}
                        title="Live Preview"
                        className="w-full h-full border-none bg-white animate-fade-in"
                        sandbox="allow-scripts allow-same-origin"
                     />
                )}
                
                {/* Simulated Bottom Toolbar (Mobile/Tablet View Only) */}
                {(isMobileView || viewport === 'tablet') && !isProcessing && code && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/90 backdrop-blur-md z-30 flex items-center justify-between px-6 text-white/90 pointer-events-none border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold tracking-wide text-gray-300">Gemini Mobile</span>
                            <span className="w-px h-3 bg-gray-700 mx-1"></span>
                            <span className="text-[10px] font-mono text-blue-400">5G</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-90">
                            <Wifi className="w-3 h-3" />
                            <Battery className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-mono">100%</span>
                        </div>
                    </div>
                )}
                
                {/* Home Indicator (Only if bezel is showing) */}
                {showBezel && isMobileView && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-black/20 dark:bg-white/20 rounded-full z-40 pointer-events-none backdrop-blur-md"></div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;