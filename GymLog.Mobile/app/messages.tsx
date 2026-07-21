import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { Conversation } from "../dto/messages";
import { getConversations, onMessage } from "../services/chat";
import { useEmbedded } from "../components/embedded";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function MessagesScreen() {
  const router = useRouter();
  const embedded = useEmbedded();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getConversations().then((data) => {
      setConversations(data);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const unsubscribe = onMessage(() => load());
      return unsubscribe;
    }, [load])
  );

  return (
    <SafeAreaView
      style={styles.safe}
      edges={embedded ? [] : ["top", "bottom"]}
    >
      {!embedded && (
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Open a friend on the Friends screen and start a chat.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {conversations.map((c) => (
            <Pressable
              key={c.friendUserId}
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/chat",
                  params: {
                    friendUserId: String(c.friendUserId),
                    friendName: c.friendName,
                  },
                } as any)
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {c.friendName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{c.friendName}</Text>
                <Text
                  style={[
                    styles.rowPreview,
                    c.unreadCount > 0 && styles.rowPreviewUnread,
                  ]}
                  numberOfLines={1}
                >
                  {c.lastMessage}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowTime}>{formatWhen(c.lastSentAt)}</Text>
                {c.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{c.unreadCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  content: { padding: 18, paddingBottom: 50 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accent, fontSize: 17, fontWeight: "800" },
  rowName: { color: colors.text, fontSize: 14, fontWeight: "700" },
  rowPreview: { color: colors.muted, fontSize: 13, marginTop: 2 },
  rowPreviewUnread: { color: colors.text, fontWeight: "600" },
  rowRight: { alignItems: "flex-end", gap: 5 },
  rowTime: { color: colors.muted, fontSize: 11 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: colors.bg, fontSize: 11, fontWeight: "800" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
