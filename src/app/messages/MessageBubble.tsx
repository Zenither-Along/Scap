"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Message, Conversation } from "./types";

interface MessageBubbleProps {
  msg: Message;
  user: any;
  activeConversation: Conversation | undefined;
  showReactionPicker: string | null;
  setShowReactionPicker: (id: string | null) => void;
  messageReactions: Record<string, {reaction: string, user_id: string}[]>;
  handleReaction: (messageId: string, reaction: string, e?: React.MouseEvent) => void;
  handleDeleteMessage: (messageId: string) => void;
  setReplyingTo: (msg: Message | null) => void;
  setForwardingMessage: (msg: Message | null) => void;
  setShowForwardModal: (show: boolean) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  handleEditMessage: (messageId: string) => void;
  hiddenMessages: Set<string>;
  setHiddenMessages: (hidden: Set<string>) => void;
}

export function MessageBubble({
  msg,
  user,
  activeConversation,
  showReactionPicker,
  setShowReactionPicker,
  messageReactions,
  handleReaction,
  handleDeleteMessage,
  setReplyingTo,
  setForwardingMessage,
  setShowForwardModal,
  editingMessageId,
  setEditingMessageId,
  editContent,
  setEditContent,
  handleEditMessage,
  hiddenMessages,
  setHiddenMessages
}: MessageBubbleProps) {

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Simplification for message time: usually just time if today
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={cn(
        "flex group relative py-1",
        msg.sender_id === user?.id ? "justify-end" : "justify-start"
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id);
      }}
    >
      <div className={cn(
        "flex flex-col max-w-[75%] relative",
        msg.sender_id === user?.id ? "items-end" : "items-start"
      )}>
        {/* Dropdown Icon (Desktop Only) */}
        <button
          onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
          className={cn(
            "hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 p-1.5 rounded hover:bg-white/10",
            msg.sender_id === user?.id ? "-left-8" : "-right-8"
          )}
          title="More options"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {/* Message Bubble */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "px-3 py-2 rounded-lg text-sm leading-relaxed relative shadow-sm",
                msg.sender_id === user?.id 
                  ? "bg-[#005c4b] text-white rounded-br-none" 
                  : "bg-[#202c33] rounded-bl-none text-gray-200"
            )}
        >
            {/* Context Menu */}
            {showReactionPicker === msg.id && (
              <div className={cn(
                "absolute top-0 bg-[#233138] rounded-lg shadow-2xl py-1 min-w-[160px] z-50 border border-white/10",
                msg.sender_id === user?.id ? "right-full mr-2" : "left-full ml-2"
              )} onClick={(e) => e.stopPropagation()}>
                {/* Reply */}
                <button
                  onClick={() => {
                    setReplyingTo(msg);
                    setShowReactionPicker(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3"
                >
                  <span>↩️</span> Reply
                </button>
                
                {/* Forward */}
                <button
                  onClick={() => {
                    setForwardingMessage(msg);
                    setShowForwardModal(true);
                    setShowReactionPicker(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3"
                >
                  <span>➡️</span> Forward
                </button>
                
                {/* Edit (only for own messages) */}
                {msg.sender_id === user?.id && (
                  <>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditContent(msg.content);
                        setShowReactionPicker(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3"
                    >
                      <span>✏️</span> Edit
                    </button>
                  </>
                )}
                
                {/* Delete */}
                {msg.sender_id === user?.id ? (
                  <button
                    onClick={() => {
                      handleDeleteMessage(msg.id);
                      setShowReactionPicker(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3 text-red-400"
                  >
                    <span>🗑️</span> Delete
                  </button>
                ) : (
                  <>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => {
                        // Local delete - persist to localStorage
                        const newHidden = new Set(hiddenMessages);
                        newHidden.add(msg.id);
                        setHiddenMessages(newHidden);
                        localStorage.setItem('hiddenMessages', JSON.stringify([...newHidden]));
                        setShowReactionPicker(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3 text-red-400"
                    >
                      <span>🗑️</span> Delete for me
                    </button>
                  </>
                )}
                
                <div className="h-px bg-white/10 my-1" />
                <div className="px-4 py-2">
                  <div className="flex gap-1">
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(msg.id, emoji, e);
                          setShowReactionPicker(null);
                        }}
                        className="text-xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Editing Mode */}
            {editingMessageId === msg.id ? (
              <div className="space-y-2 min-w-[200px]">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditMessage(msg.id);
                    if (e.key === 'Escape') {
                      setEditingMessageId(null);
                      setEditContent("");
                    }
                  }}
                  className="w-full bg-black/30 px-2 py-1 rounded text-sm border border-white/20 focus:outline-none focus:border-white/40"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditingMessageId(null);
                      setEditContent("");
                    }}
                    className="px-3 py-1 text-xs hover:bg-white/10 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditMessage(msg.id)}
                    className="px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Replied Message Quote */}
                {msg.replied_to && (
                  <div className="mb-2 pl-2 py-1 border-l-2 border-teal-400 bg-teal-950/30 rounded-sm">
                    <div className="text-xs font-semibold text-teal-400 mb-0.5">
                      {msg.replied_to.sender_id === user?.id 
                        ? 'You' 
                        : activeConversation?.user.full_name || activeConversation?.user.username}
                    </div>
                    <div className="text-xs text-gray-300 opacity-80">
                      {msg.replied_to.content}
                    </div>
                  </div>
                )}
                
                <div>{msg.content}</div>
                
                {/* Time + Status */}
                <div className={cn(
                  "text-[10px] mt-1 opacity-60 flex items-center gap-1",
                  msg.sender_id === user?.id ? "justify-end" : "justify-start"
                )}>
                  {msg.edited_at && (
                    <span className="mr-1">edited</span>
                  )}
                  <span>{formatTime(msg.created_at)}</span>
                  {msg.sender_id === user?.id && msg.is_read && (
                    <span className="text-[#53bdeb]">✓✓</span>
                  )}
                  {msg.sender_id === user?.id && !msg.is_read && (
                    <span className="opacity-40">✓</span>
                  )}
                </div>
              </>
            )}
        </motion.div>

        {/* Reaction Display */}
        {messageReactions[msg.id] && messageReactions[msg.id].length > 0 && Object.keys(
          messageReactions[msg.id].reduce((acc: any, r) => {
            acc[r.reaction] = (acc[r.reaction] || 0) + 1;
            return acc;
          }, {})
        ).length > 0 && (
          <div className="flex gap-1 mt-1 px-2">
            {Object.entries(
              messageReactions[msg.id].reduce((acc: any, r) => {
                acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(msg.id, emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-xs border border-white/10"
              >
                <span>{emoji}</span>
                <span className="text-[10px] opacity-60">{count as number}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
