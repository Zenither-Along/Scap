"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AlertTriangle, CheckCircle, Loader2, Copy, Check, Play } from "lucide-react";
import { transform } from "sucrase";

interface LivePreviewProps {
  code: string;
  language: string;
  compiledCode?: string;
}

type PreviewStatus = "idle" | "loading" | "success" | "error";

// Check if language needs React
function isReactLanguage(lang: string): boolean {
  return ["jsx", "tsx", "react", "javascript", "typescript"].includes(lang.toLowerCase());
}

// Transpile React/JSX using Sucrase
function transpileCode(code: string): { success: boolean; code?: string; error?: string } {
  try {
    // 1. Remove imports (we shim them globally for now)
    let wrappedCode = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    
    // 2. Wrap for rendering if needed
    if (wrappedCode.includes('<') && wrappedCode.includes('>')) {
      if (!wrappedCode.includes('function') && !wrappedCode.includes('const') && !wrappedCode.includes('class')) {
        wrappedCode = `render(${wrappedCode});`;
      } else if (wrappedCode.includes('export default')) {
        wrappedCode = wrappedCode.replace(/export\s+default\s+/, '') + '\nrender(<App />);';
      } else {
        const componentMatch = wrappedCode.match(/(?:function|const)\s+(\w+)/);
        if (componentMatch) {
          wrappedCode = wrappedCode + `\nrender(<${componentMatch[1]} />);`;
        }
      }
    }
    const result = transform(wrappedCode, { transforms: ["jsx", "typescript"], jsxRuntime: "classic" });
    return { success: true, code: result.code };
  } catch (e: any) {
    return { success: false, error: e.message || "Transpilation error" };
  }
}

// React iframe HTML
function generateReactHTML(transpiledCode: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;scrollbar-width:none;-ms-overflow-style:none}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}
body{background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
#root{width:100%;overflow:auto;scrollbar-width:none;-ms-overflow-style:none}
#root::-webkit-scrollbar{display:none}
button{cursor:pointer;border:none;font-family:inherit}
.error{background:#1a0000;border:1px solid #7f1d1d;border-radius:8px;padding:16px;color:#fca5a5;font-family:monospace;font-size:12px}
</style>
</head>
<body>
<div id="root"></div>
<script>
const{createElement,useState,useEffect,useRef,Fragment}=React;
const{render:reactRender}=ReactDOM;
const{motion,AnimatePresence}=window.Motion;
function render(e){reactRender(e,document.getElementById('root'))}
window.onerror=function(m){document.getElementById('root').innerHTML='<div class="error">'+m+'</div>';window.parent.postMessage({type:'error',error:m},'*');return true};
try{${transpiledCode};window.parent.postMessage({type:'success'},'*')}catch(e){document.getElementById('root').innerHTML='<div class="error">'+e.message+'</div>';window.parent.postMessage({type:'error',error:e.message},'*')}
</script>
</body>
</html>`;
}

// HTML preview (no React needed)
function generateHTMLPreview(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;scrollbar-width:none;-ms-overflow-style:none}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}
body{background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;padding:16px}
</style>
</head>
<body>
${code}
<script>window.parent.postMessage({type:'success'},'*')</script>
</body>
</html>`;
}

// CSS preview with demo element
function generateCSSPreview(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;scrollbar-width:none;-ms-overflow-style:none}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}
body{background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
${code}
</style>
</head>
<body>
<div class="demo">
  <div class="box">CSS Preview</div>
  <button class="btn">Button</button>
  <div class="card">
    <h2>Card Title</h2>
    <p>Card content goes here.</p>
  </div>
</div>
<script>window.parent.postMessage({type:'success'},'*')</script>
</body>
</html>`;
}

// JavaScript console output
function generateJSPreview(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box}
html,body{overflow:hidden;scrollbar-width:none;-ms-overflow-style:none}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}
body{background:#0a0a0a;color:#22c55e;font-family:monospace;padding:16px;font-size:14px}
.log{padding:4px 0;border-bottom:1px solid #1a1a1a}
.error{color:#ef4444}
</style>
</head>
<body>
<div id="output"></div>
<script>
const o=document.getElementById('output');
console.log=function(...a){o.innerHTML+='<div class="log">> '+a.join(' ')+'</div>'};
console.error=function(...a){o.innerHTML+='<div class="log error">> '+a.join(' ')+'</div>'};
try{${code};window.parent.postMessage({type:'success'},'*')}catch(e){o.innerHTML='<div class="error">Error: '+e.message+'</div>';window.parent.postMessage({type:'error',error:e.message},'*')}
</script>
</body>
</html>`;
}

export function LivePreview({ code, language, compiledCode }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Resizable height state
  const [height, setHeight] = useState(320); // Default h-80 = 320px
  const [isResizing, setIsResizing] = useState(false);
  const MIN_HEIGHT = 200;
  const MAX_HEIGHT = 700;

  const lang = language.toLowerCase();

  // Lazy loading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { rootMargin: "50px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default only if necessary, but for scrolling we might want to be careful.
    // However, for a resize handle, we usually want to prevent scrolling while dragging.
    if (e.type === 'mousedown') e.preventDefault();
    
    setIsResizing(true);
    // @ts-ignore
    const startY = e.clientY || e.touches?.[0]?.clientY;
    const startHeight = height;
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      // Prevent scrolling while dragging on touch
      if (moveEvent.type === 'touchmove') {
          moveEvent.preventDefault();
      }

      // @ts-ignore
      const clientY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;
      if (!clientY) return;
      
      const delta = clientY - startY;
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta));
      setHeight(newHeight);
    };
    
    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [height]);

  // Generate preview HTML based on language
  const previewHTML = useMemo(() => {
    if (lang === "html" || code.trim().startsWith("<!") || code.trim().startsWith("<html")) {
      return { html: generateHTMLPreview(code), type: "html" };
    }
    if (lang === "css") {
      return { html: generateCSSPreview(code), type: "css" };
    }
    if (lang === "python" || lang === "sql" || lang === "json") {
      return { html: null, type: "unsupported" }; // Can't run these
    }
    // React/JSX/JS
    if (compiledCode) {
      return { html: generateReactHTML(compiledCode), type: "react" };
    }
    const transpiled = transpileCode(code);
    if (!transpiled.success) {
      return { html: null, error: transpiled.error, type: "error" };
    }
    return { html: generateReactHTML(transpiled.code!), type: "react" };
  }, [code, lang, compiledCode]);

  // Load preview
  useEffect(() => {
    if (!isVisible || !iframeRef.current) return;
    
    setStatus("loading");
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'success') setStatus("success");
      if (e.data.type === 'error') { setStatus("error"); setError(e.data.error); }
    };
    window.addEventListener('message', handleMessage);

    if (previewHTML.type === "unsupported") {
      setStatus("idle");
      return () => window.removeEventListener('message', handleMessage);
    }

    if (previewHTML.type === "error" || !previewHTML.html) {
      setStatus("error");
      setError(previewHTML.error || "Failed to compile");
      return () => window.removeEventListener('message', handleMessage);
    }

    iframeRef.current.srcdoc = previewHTML.html;
    
    return () => window.removeEventListener('message', handleMessage);
  }, [isVisible, previewHTML]);

  // Get label for language type
  const typeLabel = previewHTML.type === "html" ? "HTML" : previewHTML.type === "css" ? "CSS" : previewHTML.type === "react" ? "React" : lang.toUpperCase();

  return (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          {status === "idle" && <span className="text-xs text-muted-foreground">{previewHTML.type === "unsupported" ? `${typeLabel} - No preview` : "Ready"}</span>}
          {status === "loading" && <><Loader2 size={12} className="animate-spin text-primary" /><span className="text-xs text-muted-foreground">Loading...</span></>}
          {status === "success" && <><CheckCircle size={12} className="text-green-500" /><span className="text-xs text-green-500">{typeLabel}</span></>}
          {status === "error" && <><AlertTriangle size={12} className="text-red-500" /><span className="text-xs text-red-500">Error</span></>}
        </div>
        <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
          {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
        {previewHTML.type === "unsupported" ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
            <span className="text-2xl">📄</span>
            <span>{typeLabel} preview not available</span>
          </div>
        ) : isVisible ? (
          <iframe 
            ref={iframeRef} 
            className="w-full h-full bg-[#0a0a0a]" 
            sandbox="allow-scripts" 
            title="Preview"
            style={{ 
              border: 'none', 
              scrollbarWidth: 'none',
              pointerEvents: isResizing ? 'none' : 'auto'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            <Play size={16} className="mr-2" /> Scroll to load
          </div>
        )}
      </div>
      
      {/* Resize Handle */}
      <div 
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className={`w-full h-3 flex items-center justify-center cursor-ns-resize hover:bg-white/10 transition-colors ${isResizing ? 'bg-primary/30' : 'bg-white/5'}`}
      >
        <div className="w-10 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
