"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface SafePreviewProps {
  code: string;
  language: string; // 'html' | 'css' | 'javascript' | 'tsx' (treated as js/html)
}

export function SafePreview({ code, language }: SafePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // Basic template
    let finalHtml = "";
    
    // Simple heuristic to detect if it's just CSS or JS or full HTML
    if (language === 'html' || code.trim().startsWith('<')) {
        finalHtml = code;
    } else if (language === 'css') {
        finalHtml = `<html><head><style>${code}</style></head><body><div class="demo-box">CSS Preview</div></body></html>`;
    } else if (['javascript', 'typescript', 'tsx'].includes(language)) {
         // Naive script injection - potentially unsafe but okay for MVP/Demo on own machine
         // We wrap in a try-catch for basic error handling
         finalHtml = `
            <html>
                <head>
                    <style>
                        body { background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    </style>
                </head>
                <body>
                    <div id="root"></div>
                    <script>
                        // Console implementation
                        console.log = function(msg) { document.getElementById('root').innerHTML += '<div>> ' + msg + '</div>'; }
                        try {
                           ${code}
                        } catch(e) {
                           document.body.innerHTML = '<div style="color:red">Runtime Error: ' + e.message + '</div>';
                        }
                    </script>
                </body>
            </html>
         `;
    }

    doc.open();
    doc.write(finalHtml);
    doc.close();

  }, [code, language]);

  return (
    <div className="w-full h-64 bg-white rounded-xl overflow-hidden border border-border/50 relative">
      <iframe 
        ref={iframeRef} 
        className="w-full h-full"
        sandbox="allow-scripts" // Allow scripts but strictly isolated
        title="Live Preview"
      />
    </div>
  );
}
