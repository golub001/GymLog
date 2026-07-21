export type SessionStatus = "Pending" | "Accepted" | "Declined";

export type SessionParticipant = {
  userId: number;
  name: string;
  status: SessionStatus;
};

export type Session = {
  id: number;
  hostUserId: number;
  hostName: string;
  isHost: boolean;
  scheduledAt: string;
  note: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  myStatus: SessionStatus;
  participants: SessionParticipant[];
};
