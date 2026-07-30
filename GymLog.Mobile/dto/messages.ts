export type ChatMessage = {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  content: string;
  sentAt: string;
};

export type Conversation = {
  friendUserId: number;
  friendName: string;
  friendAvatarUrl: string | null;
  lastMessage: string;
  lastSentAt: string;
  unreadCount: number;
};
