export type Friend = {
  friendshipId: number;
  userId: number;
  name: string;
  email: string;
};

export type FriendRequest = {
  friendshipId: number;
  userId: number;
  name: string;
  email: string;
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
  status: FriendSearchStatus;
  friendshipId: number | null;
};
