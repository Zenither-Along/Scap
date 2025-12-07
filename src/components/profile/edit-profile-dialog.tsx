"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Link as LinkIcon, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    bio?: string;
    location?: string;
    website?: string;
  };
  onSave: (data: any) => void;
}

export function EditProfileDialog({ isOpen, onClose, initialData, onSave }: EditProfileDialogProps) {
  const [bio, setBio] = useState(initialData.bio || "");
  const [location, setLocation] = useState(initialData.location || "");
  const [website, setWebsite] = useState(initialData.website || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, location, website }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updatedUser = await res.json();
      onSave(updatedUser.user);
      onClose();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-md pointer-events-auto overflow-hidden shadow-2xl relative">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                <button 
                    onClick={onClose} 
                    className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* Bio */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <FileText size={12} /> Bio
                    </label>
                    <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell the world about yourself..."
                        rows={3}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
                    />
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <MapPin size={12} /> Location
                    </label>
                    <input 
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Tokyo, Japan"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    />
                </div>

                {/* Website */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <LinkIcon size={12} /> Website
                    </label>
                    <input 
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    />
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="px-6 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>

              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
