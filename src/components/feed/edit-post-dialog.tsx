import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface EditPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    code_snippet?: string;
    language?: string;
  };
  onSuccess: (updatedPost: any) => void;
}

export function EditPostDialog({ isOpen, onClose, post, onSuccess }: EditPostDialogProps) {
  const [content, setContent] = useState(post.content);
  const [codeSnippet, setCodeSnippet] = useState(post.code_snippet || "");
  const [language, setLanguage] = useState(post.language || "javascript");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !codeSnippet.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts?id=${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          code_snippet: codeSnippet.trim() || null,
          language: codeSnippet.trim() ? language : null,
        })
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.post);
        onClose();
      } else {
        toast.error("Failed to update post");
      }
    } catch (error) {
      console.error("Edit post error:", error);
      toast.error("Failed to update post");
    } finally {
      setIsSubmitting(false);
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Edit Post</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Post Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    />
                  </div>

                  {/* Code Snippet */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Code Snippet (Optional)
                    </label>
                    <div className="space-y-2">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="jsx">JSX</option>
                        <option value="tsx">TSX</option>
                        <option value="json">JSON</option>
                        <option value="sql">SQL</option>
                      </select>
                      <textarea
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.target.value)}
                        placeholder="Paste your code here..."
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-neutral-500 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-full border border-white/10 text-neutral-300 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (!content.trim() && !codeSnippet.trim())}
                    className="px-6 py-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
