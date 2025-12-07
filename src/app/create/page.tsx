"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Video, X, Code, FileText, ChevronDown, Check, Eye } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/feed/code-block";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "tsx", label: "React (TSX)" },
  { id: "css", label: "CSS" },
  { id: "python", label: "Python" },
  { id: "html", label: "HTML" },
  { id: "sql", label: "SQL" },
  { id: "json", label: "JSON" },
];

export default function CreatePost() {
  const { user } = useUser();
  const supabase = useSupabase();
  const [activeTab, setActiveTab] = useState<"text" | "code">("text");
  
  // Split View State
  const [showPreview, setShowPreview] = useState(false);

  // Form State
  const [content, setContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("javascript");
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [codeSnippet, activeTab]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !codeSnippet.trim() && !mediaFile) || isLoading) return;

    setIsLoading(true);

    try {
      let mediaUrl = null;
      let mediaType = "none";

      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("posts").upload(filePath, mediaFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("posts").getPublicUrl(filePath);
        mediaUrl = data.publicUrl;
        mediaType = mediaFile.type.startsWith("image/") ? "image" : "video";
      }

      console.log("Submitting post...", { content, codeSnippet, language, mediaType });

      const { error } = await supabase.from("posts").insert({
        user_id: user?.id,
        content,
        code_snippet: activeTab === "code" ? codeSnippet : null,
        language: activeTab === "code" ? language : null,
        media_urls: mediaUrl ? [mediaUrl] : [],
        media_type: mediaType,
      });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      };

      setContent("");
      setCodeSnippet("");
      removeMedia();
      alert("Post created successfully!"); 
    } catch (error: any) {
      console.error("Error creating post:", error);
      if (error.message?.includes("column \"code_snippet\" of relation \"posts\" does not exist")) {
         alert("Database Error: You haven't run the SQL update yet! The 'code_snippet' column is missing.");
      } else {
         alert(`Failed to create post: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8 min-h-[calc(100vh-100px)] relative">
      
      {/* MOBILE PREVIEW OVERLAY */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-4 md:hidden flex flex-col"
          >
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Preview Post</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 bg-secondary rounded-full">
                  <X size={20} />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto">
                <PreviewCard 
                  content={content} 
                  codeSnippet={activeTab === 'code' ? codeSnippet : ''} 
                  language={language} 
                  mediaPreview={mediaPreview} 
                />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT: Editor Area */}
      <div className="flex-1 space-y-6">
        <div className="glass p-1.5 rounded-2xl border border-white/10 flex items-center justify-between px-2 bg-black/20">
            <div className="flex gap-2 relative">
               {/* Animated Background Pill */}
               <motion.div 
                 layoutId="activeTabPill"
                 className="absolute inset-0 bg-primary/20 rounded-xl"
                 initial={false}
                 transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 style={{ 
                   width: activeTab === 'text' ? '128px' : '138px', // approx widths
                   left: activeTab === 'text' ? '0' : '136px'
                 }}
               />
               
               <button 
                  onClick={() => setActiveTab("text")}
                  className={cn("relative z-10 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2", activeTab === "text" ? "text-primary shadow-sm" : "text-muted-foreground hover:text-white")}
               >
                 <FileText size={16} /> Review / Text
               </button>
               <button 
                  onClick={() => setActiveTab("code")}
                  className={cn("relative z-10 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2", activeTab === "code" ? "text-primary shadow-sm" : "text-muted-foreground hover:text-white")}
               >
                 <Code size={16} /> Code Editor
               </button>
            </div>
            
            <button 
              onClick={() => setShowPreview(true)} 
              className="md:hidden text-primary p-2 hover:bg-white/5 rounded-full transition-colors"
            >
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold uppercase tracking-wider">Preview</span>
                   <Eye size={20} />
                </div>
            </button>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6 space-y-6 min-h-[500px] flex flex-col shadow-2xl bg-gradient-to-b from-white/5 to-transparent">
            {/* Top Bar for Code: Custom Dropdown */}
            <AnimatePresence mode="popLayout">
            {activeTab === "code" && (
                <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}} className="relative z-20">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Code size={12}/> Snippet Language
                      </span>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setIsLangOpen(!isLangOpen)}
                          className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white hover:border-primary/50 transition-colors min-w-[140px] justify-between"
                        >
                           <span className="capitalize">{LANGUAGES.find(l => l.id === language)?.label}</span>
                           <ChevronDown size={12} className={cn("transition-transform", isLangOpen && "rotate-180")} />
                        </button>
                        
                        <AnimatePresence>
                          {isLangOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar"
                            >
                                {LANGUAGES.map((lang) => (
                                  <button
                                    key={lang.id}
                                    onClick={() => { setLanguage(lang.id); setIsLangOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-xs hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-between"
                                  >
                                    {lang.label}
                                    {language === lang.id && <Check size={12} />}
                                  </button>
                                ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col gap-4">
                 {/* Main Content Input */}
                 <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your code or thoughts here..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none text-lg px-0 placeholder:text-muted-foreground/50 min-h-[80px]"
                />
                
                {activeTab === "code" && (
                     <div className="flex-1 relative group min-h-[300px]">
                        <div className="absolute inset-0 bg-primary/5 rounded-xl -z-10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <textarea
                            ref={textareaRef}
                            value={codeSnippet}
                            onChange={(e) => setCodeSnippet(e.target.value)}
                            placeholder="// Start typing your code..."
                            className="w-full h-full bg-[#0d0d0d] p-6 rounded-2xl font-mono text-sm text-gray-300 resize-none border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary outline-none leading-relaxed custom-scrollbar overflow-hidden"
                            spellCheck={false}
                        />
                     </div>
                )}

                 {/* Media Uploader */}
                 {activeTab === "text" && (
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group min-h-[200px]"
                     >
                        {mediaPreview ? (
                             <div className="relative w-full h-full p-4">
                                <img src={mediaPreview} className="w-full h-full object-contain rounded-xl" />
                                <button onClick={(e) => { e.stopPropagation(); removeMedia(); }} className="absolute top-6 right-6 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 transition-colors">
                                    <X size={16} />
                                </button>
                             </div>
                        ) : (
                            <>
                                <div className="p-4 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors mb-4">
                                    <ImageIcon size={32} />
                                </div>
                                <p className="text-sm text-muted-foreground">Click to upload Image/Video</p>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
                     </div>
                 )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                 <div className="text-xs text-muted-foreground font-mono">
                    {activeTab === "code" ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> 
                        {codeSnippet.length} chars
                      </span>
                    ) : "Ready to share?"}
                 </div>
                 <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-8 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:scale-105 active:scale-95"
                  >
                    {isLoading ? "Deploying..." : "Post Update"}
                  </button>
            </div>
        </div>
      </div>

      {/* RIGHT: Live Preview (Desktop Only - always visible) */}
      <div className="hidden md:block w-[400px] xl:w-[450px] space-y-6">
         <div className="flex items-center gap-2 mb-2 px-2">
            <Eye size={16} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Preview</span>
         </div>

         <PreviewCard 
            content={content} 
            codeSnippet={activeTab === 'code' ? codeSnippet : ''} 
            language={language} 
            mediaPreview={mediaPreview} 
         />
      </div>

    </div>
  );
}

// Subcomponent for Preview to reuse in Mobile/Desktop
function PreviewCard({ content, codeSnippet, language, mediaPreview }: any) {
  return (
    <div className="glass border border-white/10 rounded-2xl overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
      <div className="p-4 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 border border-white/10" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-700 rounded" />
                <div className="h-3 w-16 bg-gray-800 rounded" />
            </div>
      </div>
      <div className="px-4 pb-4">
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{content || "Your post content will appear here..."}</p>
            
            {codeSnippet && (
              <div className="mt-4 transform scale-100 origin-top-left">
                  <CodeBlock code={codeSnippet} language={language} />
              </div>
            )}

            {mediaPreview && (
                <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <img src={mediaPreview} className="w-full h-auto" />
                </div>
            )}
      </div>
    </div>
  );
}
