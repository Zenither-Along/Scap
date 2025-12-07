"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Phone, Video, MoreVertical, Image as ImageIcon, Mic, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Conversations
const CONVERSATIONS = [
  { id: 1, user: "ui_wizard", avatar: "https://i.pravatar.cc/150?u=1", lastMsg: "Did you check the new framer update?", time: "10:30 AM", unread: 2 },
  { id: 2, user: "sarah_tech", avatar: "https://i.pravatar.cc/150?u=2", lastMsg: "Code review done! ✅", time: "Yesterday", unread: 0 },
  { id: 3, user: "jordan_walke", avatar: "https://i.pravatar.cc/150?u=3", lastMsg: "Let's collaborate on that hook.", time: "Monday", unread: 0 },
  { id: 4, user: "design_system", avatar: "https://i.pravatar.cc/150?u=4", lastMsg: "Tokens updated.", time: "Sunday", unread: 5 },
];

const MESSAGES = [
  { id: 1, sender: "them", text: "Hey! Saw your recent post about Glassmorphism. Looks sick! 🔥" },
  { id: 2, sender: "me", text: "Thanks! Took me a while to get the blur just right on mobile." },
  { id: 3, sender: "them", text: "Did you use backdrop-filter or a blurred image overlay?" },
  { id: 4, sender: "me", text: "Backdrop-filter with a fallback for older browsers. Also tweaked the saturation." },
  { id: 5, sender: "them", text: "Smart. By the way, are you free for a quick call later?" },
];

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState<number | null>(null);

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex overflow-hidden">
      
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-80 border-r border-white/5 bg-black/20 flex flex-col transition-all duration-300",
        activeChat !== null ? "hidden md:flex" : "flex"
      )}>
         <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Messages</h1>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search chats..." 
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 text-sm focus:outline-none focus:bg-white/10 transition-colors"
                />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto px-2 space-y-1">
             {CONVERSATIONS.map((chat) => (
                <button
                   key={chat.id}
                   onClick={() => setActiveChat(chat.id)}
                   className={cn(
                      "w-full p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-white/5 text-left group",
                      activeChat === chat.id && "bg-primary/10"
                   )}
                >
                    <div className="relative">
                        <img src={chat.avatar} className="w-12 h-12 rounded-full object-cover" />
                        {chat.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-bold flex items-center justify-center rounded-full border border-black">{chat.unread}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-sm text-gray-200">{chat.user}</span>
                            <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                        </div>
                        <p className={cn("text-xs truncate", chat.unread > 0 ? "text-white font-medium" : "text-muted-foreground")}>{chat.lastMsg}</p>
                    </div>
                </button>
             ))}
         </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
         "flex-1 flex-col bg-linear-to-br from-black/40 to-black/60 relative",
         activeChat === null ? "hidden md:flex items-center justify-center" : "flex"
      )}>
          {activeChat === null ? (
              <div className="text-center p-8 text-muted-foreground">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <MessageCircle size={32} />
                  </div>
                  <p>Select a conversation to start chatting</p>
              </div>
          ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <img src={CONVERSATIONS.find(c => c.id === activeChat)?.avatar} className="w-10 h-10 rounded-full" />
                        <div>
                             <h3 className="font-bold text-sm">{CONVERSATIONS.find(c => c.id === activeChat)?.user}</h3>
                             <div className="flex items-center gap-1.5">
                                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                 <span className="text-[10px] text-muted-foreground">Online</span>
                             </div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <IconButton icon={Phone} />
                        <IconButton icon={Video} />
                        <IconButton icon={MoreVertical} />
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {MESSAGES.map((msg) => (
                        <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           key={msg.id}
                           className={cn(
                               "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed relative",
                               msg.sender === "me" 
                                 ? "ml-auto bg-primary text-primary-foreground rounded-tr-sm" 
                                 : "bg-white/10 backdrop-blur-md rounded-tl-sm text-gray-200"
                           )}
                        >
                            {msg.text}
                        </motion.div>
                     ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-white/5">
                    <div className="flex gap-2">
                        <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white">
                             <ImageIcon size={20} />
                        </button>
                        <div className="flex-1 relative">
                             <input 
                               type="text" 
                               placeholder="Type a message..." 
                               className="w-full h-full bg-white/5 rounded-xl px-4 py-3 focus:outline-none focus:bg-white/10 transition-colors"
                             />
                             <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-white">
                                 <Mic size={18} />
                             </button>
                        </div>
                        <button className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                             <Send size={20} />
                        </button>
                    </div>
                </div>
              </>
          )}
      </div>

    </div>
  );
}

function IconButton({ icon: Icon }: any) {
    return (
        <button className="p-2.5 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
            <Icon size={18} />
        </button>
    )
}
