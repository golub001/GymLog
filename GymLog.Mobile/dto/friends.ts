export type Friend = {
  friendshipId: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type FriendRequest = {
  friendshipId: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type FriendSearchStatus =
  | "none"
  | "friends"
  | "pending_sent"
  | "pending_received";

export type UserSearchResult = {
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: FriendSearchStatus;
  friendshipId: number | null;
};
