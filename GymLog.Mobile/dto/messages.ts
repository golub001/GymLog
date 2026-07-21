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
  lastMessage: string;
  lastSentAt: string;
  unreadCount: number;
};
