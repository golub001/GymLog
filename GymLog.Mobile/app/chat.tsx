import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { ChatMessage } from "../dto/messages";
import {
  getConversation,
  sendMessage,
  markConversationRead,
  onMessage,
  startChatConnection,
  setActiveChatFriend,
} from "../services/chat";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const router = useRouter();
  const { friendUserId, friendName } = useLocalSearchParams<{
    friendUserId: string;
    friendName: string;
  }>();
  const friendId = parseInt(String(friendUserId), 10);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    startChatConnection();
    setActiveChatFriend(friendId);
    getConversation(friendId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    markConversationRead(friendId);

    const unsubscribe = onMessage((msg) => {
      if (msg.senderId === friendId) {
        setMessages((prev) => [...prev, msg]);
        markConversationRead(friendId);
      }
    });
    return () => {
      setActiveChatFriend(null);
      unsubscribe();
    };
  }, [friendId]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    const result = await sendMessage(friendId, content);
    setSending(false);

    if (result.ok && result.message) {
      setText("");
      setMessages((prev) => [...prev, result.message!]);
    } else {
      Alert.alert("Not sent", result.error ?? "Try again.");
    }
  }, [text, sending, friendId]);

  const inverted = [...messages].reverse();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(friendName ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {friendName ?? "Chat"}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={inverted}
            inverted
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const mine = item.senderId !== friendId;
              return (
                <View
                  style={[
                    styles.bubbleRow,
                    mine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.bubbleMine : styles.bubbleTheirs,
                    ]}
                  >
                    <Text
                      style={[styles.bubbleText, mine && styles.bubbleTextMine]}
                    >
                      {item.content}
                    </Text>
                    <Text
                      style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}
                    >
                      {formatTime(item.sentAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  Say hi to {friendName} 👋
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color={colors.bg} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginHorizontal: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  listContent: { padding: 16, gap: 6 },
  bubbleRow: { flexDirection: "row" },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleMine: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 19 },
  bubbleTextMine: { color: colors.bg },
  bubbleTime: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
    alignSelf: "flex-end",
  },
  bubbleTimeMine: { color: "rgba(14,15,18,0.55)" },
  emptyWrap: {
    padding: 40,
    alignItems: "center",
    transform: [{ scaleY: -1 }],
  },
  emptyText: { color: colors.muted, fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.text,
    fontSize: 14,
    maxHeight: 110,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
