"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Message, Conversation, SearchUser } from "./types";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";

export default function MessagesPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  
  // Sync URL with activeChat
  useEffect(() => {
    const conversationId = searchParams.get('c');
    setActiveChat(conversationId);
  }, [searchParams]);

  // Helper to change chat
  const openChat = (id: string | null) => {
    if (id) {
      router.push(`/messages?c=${id}`);
    } else {
      router.push('/messages');
    }
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Message interactions
  const [messageReactions, setMessageReactions] = useState<Record<string, {reaction: string, user_id: string}[]>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [hiddenMessages, setHiddenMessages] = useState<Set<string>>(new Set());
  
  // Forward modal
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [forwardSearch, setForwardSearch] = useState("");
  const [selectedForwardChats, setSelectedForwardChats] = useState<string[]>([]);

  // Load hidden messages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('hiddenMessages');
    if (stored) {
      setHiddenMessages(new Set(JSON.parse(stored)));
    }
  }, []);

  // Start conversation with user
  const startConversation = async (userId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (res.ok) {
        const data = await res.json();
        openChat(data.conversation_id);
                      openChat(data.conversation_id);
      fetchConversations(); // Refresh list
    }
  } catch (error) {
    console.error(error);
  }
};

// Delete conversation
const handleDeleteConversation = async (conversationId: string) => {
  if (!confirm("Delete this conversation? It will be removed from your list (one-sided).")) return;

  try {
    const res = await fetch(`/api/conversations?id=${conversationId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      // If active, deselect
      if (activeChat === conversationId) {
        openChat(null);
      }
    } else {
      alert("Failed to delete conversation");
    }
  } catch (error) {
    console.error(error);
    alert("Error deleting conversation");
  }
};

// Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages?conversation_id=${conversationId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMessages(data.messages || []);
      
      // Fetch reactions for these messages
      if (data.messages && data.messages.length > 0) {
        const messageIds = data.messages.map((m: Message) => m.id).join(',');
        const reactionsRes = await fetch(`/api/messages/reactions?message_ids=${messageIds}`);
        if (reactionsRes.ok) {
          const reactionsData = await reactionsRes.json();
          // Only set reactions that actually exist (not empty arrays)
          const filteredReactions: Record<string, {reaction: string, user_id: string}[]> = {};
          Object.entries(reactionsData.reactions || {}).forEach(([msgId, reactions]) => {
            if (Array.isArray(reactions) && reactions.length > 0) {
              filteredReactions[msgId] = reactions as {reaction: string, user_id: string}[];
            }
          });
          setMessageReactions(filteredReactions);
        }
      } else {
        setMessageReactions({});
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => fetchMessages(activeChat), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showReactionPicker) {
        setShowReactionPicker(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showReactionPicker]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;
    
    setSending(true);
    const messageContent = newMessage;
    const replyToId = replyingTo?.id || null;
    setNewMessage("");
    setReplyingTo(null); // Clear reply state

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: user?.id || '',
      is_read: false,
      is_deleted: false,
      edited_at: null,
      created_at: new Date().toISOString(),
      ...(replyingTo && {
        replied_to: {
          id: replyingTo.id,
          content: replyingTo.content,
          sender_id: replyingTo.sender_id
        }
      })
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversation_id: activeChat, 
          content: messageContent,
          replied_to_message_id: replyToId
        })
      });

      if (!res.ok) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        throw new Error('Failed to send');
      }

      // Refresh messages to get real message
      fetchMessages(activeChat);
    } catch (error) {
      console.error(error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Toggle reaction on a message
  const handleReaction = async (messageId: string, reaction: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const res = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, reaction })
      });

      if (res.ok) {
        // Refresh messages to get updated reactions
        if (activeChat) fetchMessages(activeChat);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, content: editContent })
      });

      if (res.ok) {
        setEditingMessageId(null);
        setEditContent("");
        if (activeChat) fetchMessages(activeChat);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;

    try {
      const res = await fetch(`/api/messages?id=${messageId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove from UI
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeChat);

  return (
    <div className="fixed inset-0 z-40 md:static md:h-[calc(100vh-64px)] flex overflow-hidden bg-background">
      
      <Sidebar 
          conversations={conversations}
          activeChat={activeChat}
          onSelectChat={openChat}
          onStartChat={startConversation}
          loading={loading}
          activeConversation={activeConversation}
      />

      <ChatWindow 
          activeChat={activeChat}
          activeConversation={activeConversation}
          messages={messages}
          user={user}
          loading={loading}
          onBack={() => openChat(null)}
          onDeleteConversation={handleDeleteConversation}
          // Props for interactions
          showReactionPicker={showReactionPicker}
          setShowReactionPicker={setShowReactionPicker}
          messageReactions={messageReactions}
          handleReaction={handleReaction}
          handleDeleteMessage={handleDeleteMessage}
          replyingTo={replyingTo}
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
          // Input
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          sending={sending}
          messagesEndRef={messagesEndRef}
      />

      {/* Forward Modal */}
      {showForwardModal && forwardingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowForwardModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1f2937] rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold">Forward Message</h3>
              <button onClick={() => setShowForwardModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-white/10"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2">
              {conversations
                .filter(c => 
                  c.user.full_name.toLowerCase().includes(forwardSearch.toLowerCase()) ||
                  c.user.username.toLowerCase().includes(forwardSearch.toLowerCase())
                )
                .map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      if (selectedForwardChats.includes(conv.id)) {
                        setSelectedForwardChats(prev => prev.filter(id => id !== conv.id));
                      } else {
                        setSelectedForwardChats(prev => [...prev, conv.id]);
                      }
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-left",
                      selectedForwardChats.includes(conv.id) ? "bg-primary/20" : "hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                      selectedForwardChats.includes(conv.id) ? "bg-primary border-primary" : "border-white/30"
                    )}>
                      {selectedForwardChats.includes(conv.id) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <img 
                      src={conv.user.avatar_url || '/default-avatar.png'} 
                      className="w-10 h-10 rounded-full" 
                      alt="" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{conv.user.full_name}</div>
                      <div className="text-xs text-muted-foreground truncate">@{conv.user.username}</div>
                    </div>
                  </button>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={async () => {
                  if (!forwardingMessage || selectedForwardChats.length === 0) return;
                  
                  try {
                    // Send message to each selected conversation
                    for (const conversationId of selectedForwardChats) {
                      await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          conversation_id: conversationId, 
                          content: forwardingMessage.content 
                        })
                      });
                    }
                    
                    setShowForwardModal(false);
                    setSelectedForwardChats([]);
                    setForwardingMessage(null);
                    alert(`Forwarded to ${selectedForwardChats.length} chat(s)`);
                  } catch (error) {
                    console.error(error);
                  }
                }}
                disabled={selectedForwardChats.length === 0}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forward to {selectedForwardChats.length} chat{selectedForwardChats.length !== 1 ? 's' : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
