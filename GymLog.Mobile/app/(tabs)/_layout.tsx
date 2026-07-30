import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { colors } from "../../theme/colors";
import { registerForPushNotifications } from "../../services/push";
import {
  startChatConnection,
  stopChatConnection,
  onMessage,
  onSessionUpdate,
  onFriendUpdate,
  getActiveChatFriend,
} from "../../services/chat";
import { syncSessionReminders } from "../../services/reminders";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    registerForPushNotifications().finally(() => syncSessionReminders());
    startChatConnection();

    const unsubscribeMessages = onMessage((msg) => {
      if (getActiveChatFriend() === msg.senderId) return;
      const preview =
        msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content;
      Notifications.scheduleNotificationAsync({
        content: {
          title: msg.senderName || "New message",
          body: preview,
          sound: "default",
          data: {
            type: "message",
            friendUserId: msg.senderId,
            friendName: msg.senderName,
          },
        },
        trigger: null,
      });
    });

    const unsubscribeSessions = onSessionUpdate((update) => {
      let title = "Workout invite 💪";
      let body = "";

      if (update.kind === "invite" && update.scheduledAt) {
        const d = new Date(update.scheduledAt);
        const when =
          d.toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
          }) +
          " at " +
          d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
        const loc = update.locationName ? ` · 📍 ${update.locationName}` : "";
        body = `${update.name} invited you to train — ${when}${loc}`;
      } else if (update.kind === "accepted") {
        title = "Invite accepted ✅";
        body = `${update.name} accepted your workout invite.`;
        syncSessionReminders();
      } else if (update.kind === "cancelled") {
        title = "Session cancelled";
        body = `${update.name} cancelled the workout session.`;
        syncSessionReminders();
      } else {
        title = "Invite declined";
        body = `${update.name} can't make it this time.`;
      }

      Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: "default",
          data: { type: "session" },
        },
        trigger: null,
      });
    });

    const unsubscribeFriends = onFriendUpdate((update) => {
      const isRequest = update.kind === "request";
      Notifications.scheduleNotificationAsync({
        content: {
          title: isRequest ? "Friend request 👥" : "Request accepted ✅",
          body: isRequest
            ? `${update.name} sent you a friend request.`
            : `${update.name} accepted your friend request.`,
          sound: "default",
          data: { type: "friend" },
        },
        trigger: null,
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.type === "message" && data.friendUserId) {
          router.push({
            pathname: "/chat",
            params: {
              friendUserId: String(data.friendUserId),
              friendName: data.friendName ?? "",
            },
          } as any);
        } else if (data?.type === "session") {
          router.push("/sessions" as any);
        } else if (data?.type === "friend") {
          router.push("/friends" as any);
        }
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeSessions();
      unsubscribeFriends();
      responseSub.remove();
      stopChatConnection();
    };
  }, [token]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          paddingTop: 6,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: "Training",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "barbell" : "barbell-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: "Plans",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "clipboard" : "clipboard-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrition",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "restaurant" : "restaurant-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}