"use client";

import { useRef, useEffect } from "react";
import { Send, MoreVertical, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, Conversation } from "./types";
import { MessageBubble } from "./MessageBubble";
import { motion } from "framer-motion";

interface ChatWindowProps {
  activeChat: string | null;
  activeConversation: Conversation | undefined;
  messages: Message[];
  user: any;
  loading: boolean;
  onBack: () => void;
  onDeleteConversation: (id: string) => void;
  // State for MessageBubble interactions
  showReactionPicker: string | null;
  setShowReactionPicker: (id: string | null) => void;
  messageReactions: Record<string, {reaction: string, user_id: string}[]>;
  handleReaction: (messageId: string, reaction: string, e?: React.MouseEvent) => void;
  handleDeleteMessage: (messageId: string) => void;
  replyingTo: Message | null;
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
  // Input props
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleSendMessage: () => void;
  sending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatWindow({
  activeChat,
  activeConversation,
  messages,
  user,
  onBack,
  onDeleteConversation,
  showReactionPicker,
  setShowReactionPicker,
  messageReactions,
  handleReaction,
  handleDeleteMessage,
  replyingTo,
  setReplyingTo,
  setForwardingMessage,
  setShowForwardModal,
  editingMessageId,
  setEditingMessageId,
  editContent,
  setEditContent,
  handleEditMessage,
  hiddenMessages,
  setHiddenMessages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  sending,
  messagesEndRef
}: ChatWindowProps) {

  // Close reaction picker logic needs to be hoisted or handled here/Sidebar?
  // The original page had a global click handler. We'll handle it via props or assume parent handles it.
  
  return (
    <div className={cn(
        "flex-1 flex-col bg-black/20 relative",
        activeChat === null ? "hidden md:flex items-center justify-center" : "flex"
     )}>
         {activeChat === null ? (
             <div className="text-center p-8 text-muted-foreground">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                     {/* Using icon placeholder as simple SVG or lucide due to imports */}
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                 </div>
                 <p>Select a conversation to start chatting</p>
             </div>
         ) : (
             <>
               {/* Chat Header */}
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                   <div className="flex items-center gap-3 flex-1 min-w-0">
                       <button onClick={onBack} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-white">
                           <ArrowLeft size={20} />
                       </button>
                       <a 
                         href={`/user/${activeConversation?.user.username}`}
                         className="flex items-center gap-3 hover:bg-white/5 rounded-xl px-2 py-1.5 -mx-2 transition-colors flex-1 min-w-0"
                       >
                         <img 
                           src={activeConversation?.user.avatar_url || '/default-avatar.png'} 
                           className="w-10 h-10 rounded-full shrink-0" 
                           alt=""
                         />
                         <div className="min-w-0">
                              <h3 className="font-bold text-sm truncate">{activeConversation?.user.full_name || activeConversation?.user.username}</h3>
                              <span className="text-xs text-muted-foreground truncate block">@{activeConversation?.user.username}</span>
                         </div>
                       </a>
                   </div>
                   <div className="relative">
                     <button 
                       onClick={() => setShowReactionPicker(showReactionPicker === 'header_menu' ? null : 'header_menu')}
                       className="p-2.5 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-white transition-colors shrink-0"
                     >
                         <MoreVertical size={18} />
                     </button>
                     {showReactionPicker === 'header_menu' && (
                       <div className="absolute right-0 top-full mt-2 w-48 bg-[#233138] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                         <button
                           onClick={() => {
                             if (activeChat) onDeleteConversation(activeChat);
                             setShowReactionPicker(null);
                           }}
                           className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                         >
                           <span>🗑️</span> Delete conversation
                         </button>
                       </div>
                     )}
                   </div>
               </div>

               {/* Messages Area */}
               <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {messages.filter(msg => !hiddenMessages.has(msg.id)).map((msg) => (
                       <MessageBubble 
                           key={msg.id}
                           msg={msg}
                           user={user}
                           activeConversation={activeConversation}
                           showReactionPicker={showReactionPicker}
                           setShowReactionPicker={setShowReactionPicker}
                           messageReactions={messageReactions}
                           handleReaction={handleReaction}
                           handleDeleteMessage={handleDeleteMessage}
                           setReplyingTo={setReplyingTo}
                           setForwardingMessage={setForwardingMessage}
                           setShowForwardModal={setShowForwardModal}
                           editingMessageId={editingMessageId}
                           setEditingMessageId={setEditingMessageId}
                           editContent={editContent}
                           setEditContent={setEditContent}
                           handleEditMessage={handleEditMessage}
                           hiddenMessages={hiddenMessages}
                           setHiddenMessages={setHiddenMessages}
                       />
                    ))}
                    <div ref={messagesEndRef} />
               </div>

               {/* Input Area */}
               <div className="bg-black/40 border-t border-white/5">
                   {/* Reply Preview */}
                   {replyingTo && (
                     <div className="px-4 pt-3 pb-2 border-b border-white/5 flex items-center justify-between bg-white/5">
                       <div className="flex-1 min-w-0">
                         <div className="text-xs text-primary font-medium mb-1">
                           Replying to {replyingTo.sender_id === user?.id ? 'yourself' : 'message'}
                         </div>
                         <div className="text-sm text-gray-400 truncate">{replyingTo.content}</div>
                       </div>
                       <button
                         onClick={() => setReplyingTo(null)}
                         className="ml-2 p-1 hover:bg-white/10 rounded"
                       >
                         <X size={16} />
                       </button>
                     </div>
                   )}
                   
                   <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 p-4">
                       <div className="flex-1 relative">
                            <input 
                              type="text" 
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type a message..." 
                              className="w-full h-full bg-white/5 rounded-xl px-4 py-3 focus:outline-none focus:bg-white/10 transition-colors"
                            />
                       </div>
                       <button 
                         type="submit"
                         disabled={!newMessage.trim() || sending}
                         className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                       >
                            <Send size={20} />
                       </button>
                   </form>
               </div>
             </>
         )}
     </div>
  );
}
