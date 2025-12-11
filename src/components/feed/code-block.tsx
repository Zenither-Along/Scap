"use client";

import { Highlight, themes } from "prism-react-renderer";
import { Copy, Terminal } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(320); // Default height
  const [isResizing, setIsResizing] = useState(false);
  const MIN_HEIGHT = 100;
  const MAX_HEIGHT = 800;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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

  return (
    <div className="relative rounded-xl overflow-hidden my-4 border border-white/10 shadow-2xl bg-[#0d0d0d]">
      <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
           <div className="flex gap-1.5">
             <div className="w-3 h-3 rounded-full bg-red-500/80" />
             <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
             <div className="w-3 h-3 rounded-full bg-green-500/80" />
           </div>
           <span className="ml-3 text-xs text-muted-foreground font-mono flex items-center gap-1">
             <Terminal size={10} /> {language || 'text'}
           </span>
        </div>
        <button 
          onClick={copyCode}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <Copy size={12} /> {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div style={{ height: `${height}px` }} className="overflow-auto custom-scrollbar bg-[#0d0d0d]">
          <Highlight
            theme={themes.vsDark}
            code={code}
            language={language || 'tsx'}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre 
                className="p-4 md:p-6 text-sm md:text-base font-mono leading-relaxed min-w-max" 
                style={{ ...style, backgroundColor: 'transparent', margin: 0 }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })} className="table-row">
                     <span className="table-cell select-none text-right pr-4 text-white/20 text-xs w-8 border-r border-white/5 mr-4 bg-transparent">
                       {i + 1}
                     </span>
                     <span className="table-cell pl-4">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                     </span>
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
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
