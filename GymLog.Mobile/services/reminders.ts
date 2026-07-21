import * as Notifications from "expo-notifications";
import { getSessions } from "./sessions";

const PREFIX = "session-";
const REMINDER_MINUTES = 30;

export async function syncSessionReminders(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const sessions = await getSessions();
    const now = Date.now();

    const wanted = sessions.filter((s) => {
      if (s.myStatus !== "Accepted") return false;
      const remindAt =
        new Date(s.scheduledAt).getTime() - REMINDER_MINUTES * 60 * 1000;
      return remindAt > now;
    });

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const sessionNotifs = scheduled.filter((n) =>
      n.identifier.startsWith(PREFIX)
    );

    for (const notif of sessionNotifs) {
      const stillWanted = wanted.some(
        (s) => `${PREFIX}${s.id}` === notif.identifier
      );
      if (!stillWanted) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    for (const session of wanted) {
      const identifier = `${PREFIX}${session.id}`;
      const exists = sessionNotifs.some((n) => n.identifier === identifier);
      if (exists) continue;

      const startAt = new Date(session.scheduledAt);
      const remindAt = new Date(
        startAt.getTime() - REMINDER_MINUTES * 60 * 1000
      );

      const time = startAt.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      const locationPart = session.locationName
        ? ` · 📍 ${session.locationName}`
        : "";
      const who = session.isHost ? "friends" : session.hostName;

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "Workout in 30 minutes 💪",
          body: `Training with ${who} at ${time}${locationPart}. Get ready!`,
          sound: "default",
          data: { type: "session" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: remindAt,
        },
      });
    }
  } catch (err) {
    console.log("Reminder sync failed:", err);
  }
}
