import { api } from "./api";
import { Session } from "../dto/sessions";

export async function getSessions(): Promise<Session[]> {
  try {
    const response = await api.get<Session[]>("/sessions");
    return response.data;
  } catch {
    return [];
  }
}

export async function createSession(
  friendUserIds: number[],
  scheduledAt: string,
  note?: string,
  location?: { name?: string; lat: number; lng: number }
): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.post("/sessions", {
      friendUserIds,
      scheduledAt,
      note,
      locationName: location?.name,
      locationLat: location?.lat,
      locationLng: location?.lng,
    });
    return { ok: true };
  } catch (err: any) {
    const message =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not send invite.";
    return { ok: false, error: message };
  }
}

export async function acceptSession(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.post(`/sessions/${id}/accept`);
    return { ok: true };
  } catch (err: any) {
    const message =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not accept the invite.";
    return { ok: false, error: message };
  }
}

export async function declineSession(id: number): Promise<boolean> {
  try {
    await api.post(`/sessions/${id}/decline`);
    return true;
  } catch {
    return false;
  }
}

export async function cancelSession(id: number): Promise<boolean> {
  try {
    await api.delete(`/sessions/${id}`);
    return true;
  } catch {
    return false;
  }
}
