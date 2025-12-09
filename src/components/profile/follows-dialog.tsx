"use client";

import { useEffect, useState } from "react";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FollowsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    initialTab?: "followers" | "following";
}

interface User {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
}

export function FollowsDialog({ isOpen, onClose, userId, initialTab = "followers" }: FollowsDialogProps) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUsers();
        }
    }, [isOpen, userId, activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/follows?user_id=${userId}&type=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-[#1f2937] rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex-1 text-center font-bold text-lg text-white">
                                {activeTab === 'followers' ? 'Followers' : 'Following'}
                            </div>
                            <button onClick={onClose} className="absolute right-4 p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/5">
                            <button
                                onClick={() => setActiveTab('followers')}
                                className={cn(
                                    "flex-1 py-3 text-sm font-medium transition-colors relative",
                                    activeTab === 'followers' ? "text-white" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                Followers
                                {activeTab === 'followers' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('following')}
                                className={cn(
                                    "flex-1 py-3 text-sm font-medium transition-colors relative",
                                    activeTab === 'following' ? "text-white" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                Following
                                {activeTab === 'following' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                                )}
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No users found
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {users.map((user) => (
                                        <Link 
                                            key={user.id} 
                                            href={`/user/${user.username}`}
                                            onClick={onClose}
                                            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group"
                                        >
                                            <img 
                                                src={user.avatar_url || '/default-avatar.png'} 
                                                alt={user.full_name} 
                                                className="w-10 h-10 rounded-full bg-neutral-800 object-cover"
                                            />
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="font-semibold text-white truncate">{user.full_name}</div>
                                                <div className="text-sm text-gray-500 truncate">@{user.username}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
