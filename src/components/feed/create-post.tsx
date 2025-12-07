"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Send, Code, Smile, X, Loader2 } from "lucide-react";
import { useSupabase } from "@/lib/supabase";

export function CreatePost({ onPostCreated }: { onPostCreated: (post: any) => void }) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const supabase = useSupabase();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsExpanded(true);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && !codeSnippet.trim() && !imageFile) || isLoading) return;

    setIsLoading(true);
    try {
      let mediaUrls: string[] = [];

      // Upload Image if selected
      if (imageFile) {
         const fileExt = imageFile.name.split('.').pop();
         const fileName = `${user.id}-${Date.now()}.${fileExt}`;
         
         const { data: uploadData, error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(fileName, imageFile);

         if (uploadError) throw uploadError;
         
         const { data: { publicUrl } } = supabase.storage
            .from('post_images')
            .getPublicUrl(fileName);
            
         mediaUrls.push(publicUrl);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            content,
            media_urls: mediaUrls,
            media_type: mediaUrls.length > 0 ? 'image' : 'none',
            code_snippet: showCodeInput ? codeSnippet : undefined,
            language: showCodeInput ? language : undefined
        }),
      });

      if (!res.ok) throw new Error("Failed to post");

      const data = await res.json();
      onPostCreated(data.post);
      
      // Reset form
      setContent("");
      setCodeSnippet("");
      setShowCodeInput(false);
      setIsExpanded(false);
      removeImage();
    } catch (error) {
      console.error(error);
      alert("Failed to post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mb-8 relative z-20">
      <motion.div 
        layout
        className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md"
      >
        <div className="p-4 md:p-6">
            <div className="flex gap-4">
                <img 
                    src={user.imageUrl} 
                    className="w-10 h-10 rounded-full object-cover border border-white/10" 
                    alt="avatar" 
                />
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        placeholder="What's on your mind?"
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none min-h-[40px]"
                        rows={isExpanded ? 3 : 1}
                    />

                    <AnimatePresence>
                        {showCodeInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-muted-foreground uppercase">Code Snippet</span>
                                    <button onClick={() => setShowCodeInput(false)} className="text-muted-foreground hover:text-white"><X size={14}/></button>
                                </div>
                                <input 
                                    type="text" 
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    placeholder="Language (e.g. javascript, python)"
                                    className="w-full bg-black/20 rounded-lg px-3 py-2 text-sm text-white border border-white/5 focus:border-primary/50 outline-none"
                                />
                                <textarea
                                    value={codeSnippet}
                                    onChange={(e) => setCodeSnippet(e.target.value)}
                                    placeholder="// Paste your code here..."
                                    className="w-full bg-black/50 rounded-xl p-4 font-mono text-xs text-green-400 border border-white/5 focus:border-primary/50 outline-none resize-y min-h-[100px]"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Image Preview */}
                    <AnimatePresence>
                        {previewUrl && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative mt-4 rounded-xl overflow-hidden group"
                            >
                                <img src={previewUrl} className="w-full max-h-[300px] object-cover rounded-xl" alt="Preview"/>
                                <button onClick={removeImage} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"><X size={16}/></button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between pt-4 mt-2 border-t border-white/5"
                    >
                        <div className="flex gap-2">
                            <label className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors cursor-pointer">
                                <ImageIcon size={20} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </label>
                            <button 
                                onClick={() => setShowCodeInput(!showCodeInput)}
                                className={`p-2 rounded-full hover:bg-white/5 transition-colors ${showCodeInput ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white'}`}
                            >
                                <Code size={20} />
                            </button>
                            <button className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                                <Smile size={20} />
                            </button>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={(!content && !codeSnippet && !imageFile) || isLoading}
                            className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm tracking-wide hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Post
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
