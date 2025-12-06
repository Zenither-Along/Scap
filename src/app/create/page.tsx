"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Video, X, Code, FileText } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function CreatePost() {
  const { user } = useUser();
  const supabase = useSupabase();
  const [activeTab, setActiveTab] = useState<"text" | "code">("text");
  
  const [content, setContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("javascript");
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const { error } = await supabase.from("posts").insert({
        user_id: user?.id,
        content,
        code_snippet: activeTab === "code" ? codeSnippet : null,
        language: activeTab === "code" ? language : null,
        media_urls: mediaUrl ? [mediaUrl] : [],
        media_type: mediaType,
      });

      if (error) throw error;

      setContent("");
      setCodeSnippet("");
      removeMedia();
      alert("Post created!"); 
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="glass p-6 rounded-2xl border border-border/50">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
           <span>Create</span>
           <span className="text-primary">Snippet</span>
        </h2>
        
        <div className="flex gap-4">
          <img src={user?.imageUrl} alt="User" className="w-12 h-12 rounded-full border border-border" />
          
          <div className="flex-1 space-y-4">
            {/* Mode Switcher */}
            <div className="flex gap-4 border-b border-border/50 pb-2">
               <button 
                  onClick={() => setActiveTab("text")}
                  className={cn("flex items-center gap-2 text-sm font-medium pb-1 transition-colors", activeTab === "text" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
               >
                 <FileText size={16} /> Standard
               </button>
               <button 
                  onClick={() => setActiveTab("code")}
                  className={cn("flex items-center gap-2 text-sm font-medium pb-1 transition-colors", activeTab === "code" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
               >
                 <Code size={16} /> Code Snippet
               </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Description or context..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-base px-0 placeholder:text-muted-foreground min-h-[60px]"
            />

            <AnimatePresence>
              {activeTab === "code" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                   <div className="flex justify-end">
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-secondary text-xs rounded px-2 py-1 border border-border focus:outline-none"
                      >
                         <option value="javascript">JavaScript</option>
                         <option value="typescript">TypeScript</option>
                         <option value="tsx">React (TSX)</option>
                         <option value="css">CSS</option>
                         <option value="python">Python</option>
                         <option value="html">HTML</option>
                      </select>
                   </div>
                   <textarea
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="// Paste your amazing code here..."
                    className="w-full bg-[#1e1e1e] p-4 rounded-xl font-mono text-sm text-gray-300 resize-none min-h-[200px] border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    spellCheck={false}
                   />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Media Preview (Keep existing logic) */}
            {mediaPreview && (
              <div className="relative rounded-xl overflow-hidden mb-4 bg-secondary/30 max-h-96">
                 {/* ... preview logic ... */}
                  <img src={mediaPreview} className="w-full h-full object-contain" />
                  <button onClick={removeMedia} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"><X size={16}/></button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"><ImageIcon size={20}/></button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? "Posting..." : "Post Snippet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
