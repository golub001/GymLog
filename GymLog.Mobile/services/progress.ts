import { api } from "./api";
import { ProgressPhoto } from "../dto/progress";

export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  try {
    const response = await api.get<ProgressPhoto[]>("/progress-photos");
    return response.data;
  } catch {
    return [];
  }
}

export type UploadPhotoResult =
  | { ok: true; photo: ProgressPhoto }
  | { ok: false; error: string };

export async function uploadProgressPhoto(
  uri: string,
  takenAt: string,
  note?: string
): Promise<UploadPhotoResult> {
  try {
    const form = new FormData();
    const name = uri.split("/").pop() ?? "photo.jpg";
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    form.append("file", { uri, name, type } as any);
    form.append("takenAt", takenAt);
    if (note) form.append("note", note);

    const response = await api.post<ProgressPhoto>("/progress-photos", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ok: true, photo: response.data };
  } catch (err: any) {
    const serverMessage =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not upload the photo. Try again.";
    return { ok: false, error: serverMessage };
  }
}

export async function deleteProgressPhoto(id: number): Promise<boolean> {
  try {
    await api.delete(`/progress-photos/${id}`);
    return true;
  } catch {
    return false;
  }
}
