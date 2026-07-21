import { api } from "./api";
import { Friend, FriendRequest, UserSearchResult } from "../dto/friends";

export async function getFriends(): Promise<Friend[]> {
  try {
    const response = await api.get<Friend[]>("/friends");
    return response.data;
  } catch {
    return [];
  }
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  try {
    const response = await api.get<FriendRequest[]>("/friends/requests");
    return response.data;
  } catch {
    return [];
  }
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  try {
    const response = await api.get<UserSearchResult[]>("/friends/search", {
      params: { query },
    });
    return response.data;
  } catch {
    return [];
  }
}

export async function sendFriendRequest(
  targetUserId: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.post(`/friends/request/${targetUserId}`);
    return { ok: true };
  } catch (err: any) {
    const message =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not send request.";
    return { ok: false, error: message };
  }
}

export async function acceptFriendRequest(
  friendshipId: number
): Promise<boolean> {
  try {
    await api.post(`/friends/accept/${friendshipId}`);
    return true;
  } catch {
    return false;
  }
}

export async function removeFriendship(friendshipId: number): Promise<boolean> {
  try {
    await api.delete(`/friends/${friendshipId}`);
    return true;
  } catch {
    return false;
  }
}
