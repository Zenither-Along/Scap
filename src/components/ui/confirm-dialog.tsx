"use client";

import { create } from 'zustand';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDanger: boolean;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

const useConfirmDialogStore = create<ConfirmDialogState & {
  showConfirm: (config: Partial<ConfirmDialogState>) => Promise<boolean>;
  close: () => void;
}>((set: any) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDanger: false,
  onConfirm: null,
  onCancel: null,
  showConfirm: (config: Partial<ConfirmDialogState>) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title: config.title || 'Confirm',
        message: config.message || '',
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        isDanger: config.isDanger || false,
        onConfirm: () => {
          resolve(true);
          set({ isOpen: false });
        },
        onCancel: () => {
          resolve(false);
          set({ isOpen: false });
        },
      });
    });
  },
  close: () => set({ isOpen: false }),
}));

export function ConfirmDialog() {
  const state = useConfirmDialogStore();

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={state.onCancel || undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">{state.title}</h2>
                <button
                  onClick={state.onCancel || undefined}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-neutral-300 leading-relaxed">{state.message}</p>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={state.onCancel || undefined}
                  className="px-4 py-2 rounded-full border border-white/10 text-neutral-300 hover:bg-white/5 transition-colors font-medium"
                >
                  {state.cancelText}
                </button>
                <button
                  onClick={state.onConfirm || undefined}
                  className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                    state.isDanger
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {state.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export const useConfirm = () => {
  const showConfirm = useConfirmDialogStore((state: any) => state.showConfirm);
  return showConfirm;
};
