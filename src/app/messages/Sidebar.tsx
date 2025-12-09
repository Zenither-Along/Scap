"use client";

import { useState } from "react";
import { Search, UserPlus, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation, SearchUser } from "./types";

interface SidebarProps {
  conversations: Conversation[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onStartChat: (userId: string) => void;
  loading: boolean;
  activeConversation: Conversation | undefined;
}

export function Sidebar({ 
  conversations, 
  activeChat, 
  onSelectChat, 
  onStartChat,
  loading 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search logic within component for simplicity, or could be passed down
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={cn(
        "w-full md:w-80 border-r border-white/5 bg-black/20 flex flex-col transition-all duration-300",
        activeChat !== null ? "hidden md:flex" : "flex"
      )}>
         <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Messages</h1>
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showSearch ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {showSearch ? <X size={18} /> : <UserPlus size={18} />}
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearch(e.target.value);
                    if (e.target.value.length >= 2) setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  placeholder={showSearch ? "Search users to message..." : "Search chats..."} 
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 text-sm focus:outline-none focus:bg-white/10 transition-colors"
                />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {/* User Search Results */}
            {showSearch && searchQuery.length >= 2 && (
              <div className="mb-4">
                <p className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">Users</p>
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">No users found</div>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onStartChat(u.id);
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="w-full p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-white/5 text-left"
                    >
                      <img 
                        src={u.avatar_url || '/default-avatar.png'} 
                        className="w-10 h-10 rounded-full object-cover" 
                        alt={u.username}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm text-gray-200 block">{u.full_name}</span>
                        <span className="text-xs text-muted-foreground">@{u.username}</span>
                      </div>
                      <MessageCircle size={16} className="text-muted-foreground" />
                    </button>
                  ))
                )}
                <div className="h-px bg-white/5 my-2 mx-4" />
                <p className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">Conversations</p>
              </div>
            )}
            
            {/* Conversations List */}
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 && !showSearch ? (
              <div className="text-center p-8 text-muted-foreground">
                <MessageCircle size={32} className="mx-auto mb-3 opacity-50" />
                <p className="mb-2">No conversations yet</p>
                <button 
                  onClick={() => setShowSearch(true)}
                  className="text-primary text-sm hover:underline"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              conversations.map((chat) => (
                <button
                   key={chat.id}
                   onClick={() => onSelectChat(chat.id)}
                   className={cn(
                      "w-full p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-white/5 text-left group",
                      activeChat === chat.id && "bg-white/10"
                   )}
                >
                    <div className="relative">
                        <img 
                          src={chat.user.avatar_url || '/default-avatar.png'} 
                          className="w-12 h-12 rounded-full object-cover" 
                          alt={chat.user.username}
                        />
                        {chat.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-black">
                            {chat.unreadCount}
                          </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-sm text-gray-200">{chat.user.full_name || chat.user.username}</span>
                            <span className="text-xs font-normal text-muted-foreground opacity-70 ml-2 whitespace-nowrap">{formatTime(chat.lastMessageTime)}</span>
                        </div>
                        <p className={cn("text-xs truncate", chat.unreadCount > 0 ? "text-white font-medium" : "text-muted-foreground")}>
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                    </div>
                </button>
              ))
            )}
         </div>
      </div>
  );
}
