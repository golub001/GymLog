import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { colors } from "../../theme/colors";
import { EmbeddedContext } from "../../components/embedded";
import FriendsScreen from "../friends";
import MessagesScreen from "../messages";
import SessionsScreen from "../sessions";
import { getFriendRequests } from "../../services/friends";
import { getSessions } from "../../services/sessions";
import {
  getUnreadCount,
  onMessage,
  onSessionUpdate,
  onFriendUpdate,
} from "../../services/chat";

type Segment = "friends" | "chats" | "sessions";

export default function Social() {
  const [segment, setSegment] = useState<Segment>("friends");
  const [requests, setRequests] = useState(0);
  const [unread, setUnread] = useState(0);
  const [invites, setInvites] = useState(0);

  const loadCounts = useCallback(() => {
    getFriendRequests().then((r) => setRequests(r.length));
    getUnreadCount().then(setUnread);
    getSessions().then((s) =>
      setInvites(s.filter((x) => x.myStatus === "Pending").length)
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCounts();
      const u1 = onMessage(() => loadCounts());
      const u2 = onSessionUpdate(() => loadCounts());
      const u3 = onFriendUpdate(() => loadCounts());
      return () => {
        u1();
        u2();
        u3();
      };
    }, [loadCounts])
  );

  function SegmentButton({
    id,
    label,
    badge,
  }: {
    id: Segment;
    label: string;
    badge: number;
  }) {
    const active = segment === id;
    return (
      <Pressable
        style={[styles.segment, active && styles.segmentActive]}
        onPress={() => setSegment(id)}
      >
        <Text
          style={[styles.segmentText, active && styles.segmentTextActive]}
        >
          {label}
        </Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>Social</Text>

      <View style={styles.segmentRow}>
        <SegmentButton id="friends" label="Friends" badge={requests} />
        <SegmentButton id="chats" label="Chats" badge={unread} />
        <SegmentButton id="sessions" label="Sessions" badge={invites} />
      </View>

      <EmbeddedContext.Provider value={true}>
        <View style={{ flex: 1 }}>
          {segment === "friends" && <FriendsScreen />}
          {segment === "chats" && <MessagesScreen />}
          {segment === "sessions" && <SessionsScreen />}
        </View>
      </EmbeddedContext.Provider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  segmentTextActive: { color: colors.bg },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.bg, fontSize: 10, fontWeight: "800" },
});
