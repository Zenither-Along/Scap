"use client";

import { Highlight, themes } from "prism-react-renderer";
import { Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <Highlight
        theme={themes.vsDark}
        code={code}
        language={language || 'tsx'}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre 
            className="overflow-x-auto p-4 md:p-6 text-sm md:text-base font-mono leading-relaxed" 
            style={{ ...style, backgroundColor: 'transparent', margin: 0 }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                 <span className="table-cell select-none text-right pr-4 text-white/20 text-xs w-8">
                   {i + 1}
                 </span>
                 <span className="table-cell">
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
  );
}
