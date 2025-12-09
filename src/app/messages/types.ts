export interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  lastMessage: string | null;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  replied_to?: {
    id: string;
    content: string;
    sender_id: string;
  };
}

export interface SearchUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_following: boolean;
}
