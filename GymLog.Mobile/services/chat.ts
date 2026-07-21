import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import * as SecureStore from "expo-secure-store";
import { api, API_HOST } from "./api";
import { ChatMessage, Conversation } from "../dto/messages";

export type SessionUpdate = {
  kind: "invite" | "accepted" | "declined" | "cancelled";
  name: string;
  scheduledAt?: string;
  locationName?: string | null;
};

export type FriendUpdate = {
  kind: "request" | "accepted";
  name: string;
};

let connection: HubConnection | null = null;
const messageListeners = new Set<(msg: ChatMessage) => void>();
const sessionListeners = new Set<(update: SessionUpdate) => void>();
const friendListeners = new Set<(update: FriendUpdate) => void>();

export function onSessionUpdate(
  listener: (update: SessionUpdate) => void
): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function onFriendUpdate(
  listener: (update: FriendUpdate) => void
): () => void {
  friendListeners.add(listener);
  return () => friendListeners.delete(listener);
}
let activeChatFriendId: number | null = null;

export function setActiveChatFriend(friendUserId: number | null): void {
  activeChatFriendId = friendUserId;
}

export function getActiveChatFriend(): number | null {
  return activeChatFriendId;
}

export function onMessage(listener: (msg: ChatMessage) => void): () => void {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
}

export async function startChatConnection(): Promise<void> {
  if (
    connection &&
    connection.state !== HubConnectionState.Disconnected
  ) {
    return;
  }

  try {
    await api.get("/users/me");
  } catch {
    return;
  }

  connection = new HubConnectionBuilder()
    .withUrl(`${API_HOST}/hubs/chat`, {
      accessTokenFactory: async () =>
        (await SecureStore.getItemAsync("authToken")) ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("ReceiveMessage", (msg: ChatMessage) => {
    messageListeners.forEach((l) => l(msg));
  });

  connection.on("SessionUpdate", (update: SessionUpdate) => {
    sessionListeners.forEach((l) => l(update));
  });

  connection.on("FriendUpdate", (update: FriendUpdate) => {
    friendListeners.forEach((l) => l(update));
  });

  try {
    await connection.start();
  } catch (err) {
    console.log("Chat connection failed:", err);
  }
}

export async function stopChatConnection(): Promise<void> {
  if (connection) {
    const c = connection;
    connection = null;
    try {
      await c.stop();
    } catch {}
  }
}

export async function sendMessage(
  friendUserId: number,
  content: string
): Promise<{ ok: boolean; message?: ChatMessage; error?: string }> {
  if (connection && connection.state === HubConnectionState.Connected) {
    try {
      const message = await connection.invoke<ChatMessage | null>(
        "SendMessage",
        friendUserId,
        content
      );
      if (message) return { ok: true, message };
    } catch {}
  }

  try {
    const response = await api.post<ChatMessage>(`/messages/${friendUserId}`, {
      content,
    });
    return { ok: true, message: response.data };
  } catch (err: any) {
    const message =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not send message.";
    return { ok: false, error: message };
  }
}

export async function getConversation(
  friendUserId: number,
  beforeId?: number
): Promise<ChatMessage[]> {
  try {
    const response = await api.get<ChatMessage[]>(`/messages/${friendUserId}`, {
      params: { take: 50, beforeId },
    });
    return response.data;
  } catch {
    return [];
  }
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const response = await api.get<Conversation[]>("/messages/conversations");
    return response.data;
  } catch {
    return [];
  }
}

export async function markConversationRead(friendUserId: number): Promise<void> {
  try {
    await api.post(`/messages/${friendUserId}/read`);
  } catch {}
}

export async function getUnreadCount(): Promise<number> {
  try {
    const response = await api.get<{ count: number }>("/messages/unread-count");
    return response.data.count;
  } catch {
    return 0;
  }
}
