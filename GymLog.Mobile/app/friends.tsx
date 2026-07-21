import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../theme/colors";
import { Friend, FriendRequest, UserSearchResult } from "../dto/friends";
import {
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
} from "../services/friends";
import { createSession } from "../services/sessions";
import { syncSessionReminders } from "../services/reminders";
import MapPicker from "../components/MapPicker";
import { useEmbedded } from "../components/embedded";

export default function FriendsScreen() {
  const router = useRouter();
  const embedded = useEmbedded();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inviteFriend, setInviteFriend] = useState<Friend | null>(null);
  const [inviteDate, setInviteDate] = useState<Date>(new Date());
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [inviteNote, setInviteNote] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitePin, setInvitePin] = useState<{ lat: number; lng: number } | null>(null);
  const [inviteLocName, setInviteLocName] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  function toggleSelected(userId: number) {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  const load = useCallback(() => {
    Promise.all([getFriends(), getFriendRequests()]).then(([f, r]) => {
      setFriends(f);
      setRequests(r);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchUsers(trimmed).then((r) => {
        setResults(r);
        setSearching(false);
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const refreshSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      searchUsers(trimmed).then(setResults);
    }
    load();
  };

  async function handleAdd(user: UserSearchResult) {
    const result = await sendFriendRequest(user.userId);
    if (result.ok) {
      refreshSearch();
    } else {
      Alert.alert("Could not add", result.error ?? "Try again.");
    }
  }

  async function handleAccept(friendshipId: number) {
    const ok = await acceptFriendRequest(friendshipId);
    if (ok) refreshSearch();
  }

  async function handleDecline(friendshipId: number) {
    const ok = await removeFriendship(friendshipId);
    if (ok) refreshSearch();
  }

  function openInvite(friend: Friend) {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    setInviteDate(start);
    setInviteNote("");
    setInvitePin(null);
    setInviteLocName("");
    setSelectedIds([friend.userId]);
    setInviteFriend(friend);
  }

  async function handleSendInvite() {
    if (!inviteFriend) return;
    if (selectedIds.length === 0) {
      Alert.alert("No friends selected", "Pick at least one friend.");
      return;
    }
    if (inviteDate.getTime() <= Date.now()) {
      Alert.alert("Invalid time", "Pick a time in the future.");
      return;
    }
    setSendingInvite(true);
    const result = await createSession(
      selectedIds,
      inviteDate.toISOString(),
      inviteNote.trim() || undefined,
      invitePin
        ? { ...invitePin, name: inviteLocName.trim() || undefined }
        : undefined
    );
    setSendingInvite(false);

    if (result.ok) {
      setInviteFriend(null);
      syncSessionReminders();
      Alert.alert(
        "Invites sent",
        selectedIds.length === 1
          ? "Your friend has been invited. 💪"
          : `${selectedIds.length} friends have been invited. 💪`
      );
    } else {
      Alert.alert("Could not invite", result.error ?? "Try again.");
    }
  }

  function onPickerChange(event: any, date?: Date) {
    if (Platform.OS === "android") setPickerMode(null);
    if (event.type === "dismissed" || !date) return;

    const next = new Date(inviteDate);
    if (pickerMode === "date") {
      next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    } else {
      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    }
    setInviteDate(next);
  }

  function confirmRemove(friend: Friend) {
    Alert.alert("Remove friend", `Remove ${friend.name} from your friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const ok = await removeFriendship(friend.friendshipId);
          if (ok) load();
        },
      },
    ]);
  }

  const showSearch = query.trim().length >= 2;

  function renderAction(user: UserSearchResult) {
    switch (user.status) {
      case "friends":
        return (
          <View style={[styles.actionBtn, styles.actionMuted]}>
            <Ionicons name="checkmark" size={14} color={colors.muted} />
            <Text style={styles.actionMutedText}>Friends</Text>
          </View>
        );
      case "pending_sent":
        return (
          <View style={[styles.actionBtn, styles.actionMuted]}>
            <Text style={styles.actionMutedText}>Pending</Text>
          </View>
        );
      case "pending_received":
        return (
          <Pressable
            style={[styles.actionBtn, styles.actionAccent]}
            onPress={() => user.friendshipId && handleAccept(user.friendshipId)}
          >
            <Text style={styles.actionAccentText}>Accept</Text>
          </Pressable>
        );
      default:
        return (
          <Pressable
            style={[styles.actionBtn, styles.actionAccent]}
            onPress={() => handleAdd(user)}
          >
            <Ionicons name="person-add" size={14} color={colors.bg} />
            <Text style={styles.actionAccentText}>Add</Text>
          </Pressable>
        );
    }
  }

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
          <Text style={styles.headerTitle}>Friends</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people by name or email"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {showSearch ? (
          searching ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
          ) : results.length === 0 ? (
            <Text style={styles.emptyText}>No users found.</Text>
          ) : (
            results.map((user) => (
              <View key={user.userId} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{user.name}</Text>
                  <Text style={styles.rowSub}>{user.email}</Text>
                </View>
                {renderAction(user)}
              </View>
            ))
          )
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
        ) : (
          <>
            {requests.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  Friend Requests ({requests.length})
                </Text>
                {requests.map((req) => (
                  <View key={req.friendshipId} style={styles.row}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {req.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{req.name}</Text>
                      <Text style={styles.rowSub}>{req.email}</Text>
                    </View>
                    <Pressable
                      style={[styles.actionBtn, styles.actionAccent]}
                      onPress={() => handleAccept(req.friendshipId)}
                    >
                      <Text style={styles.actionAccentText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={styles.declineBtn}
                      onPress={() => handleDecline(req.friendshipId)}
                      hitSlop={6}
                    >
                      <Ionicons name="close" size={18} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            <Text style={styles.sectionLabel}>
              My Friends {friends.length > 0 ? `(${friends.length})` : ""}
            </Text>
            {friends.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="people-outline" size={44} color={colors.muted} />
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptyText}>
                  Search for people above to send friend requests.
                </Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.friendshipId} style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {friend.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{friend.name}</Text>
                    <Text style={styles.rowSub}>{friend.email}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/chat",
                        params: {
                          friendUserId: String(friend.userId),
                          friendName: friend.name,
                        },
                      } as any)
                    }
                    hitSlop={8}
                    style={styles.chatBtn}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={17}
                      color={colors.text}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => openInvite(friend)}
                    hitSlop={8}
                    style={styles.inviteBtn}
                  >
                    <Ionicons name="barbell" size={18} color={colors.bg} />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmRemove(friend)}
                    hitSlop={8}
                    style={styles.removeBtn}
                  >
                    <Ionicons
                      name="person-remove-outline"
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={inviteFriend !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteFriend(null)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Plan a workout session</Text>

            <Text style={styles.modalLabel}>Who's coming</Text>
            <ScrollView style={styles.friendSelectList} nestedScrollEnabled>
              {friends.map((f) => {
                const checked = selectedIds.includes(f.userId);
                return (
                  <Pressable
                    key={f.userId}
                    style={styles.friendSelectRow}
                    onPress={() => toggleSelected(f.userId)}
                  >
                    <Ionicons
                      name={checked ? "checkbox" : "square-outline"}
                      size={20}
                      color={checked ? colors.accent : colors.muted}
                    />
                    <Text
                      style={[
                        styles.friendSelectName,
                        checked && { color: colors.text },
                      ]}
                    >
                      {f.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.modalLabel}>When</Text>
            <View style={styles.dateRow}>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setPickerMode("date")}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                <Text style={styles.dateBtnText}>
                  {inviteDate.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </Pressable>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setPickerMode("time")}
              >
                <Ionicons name="time-outline" size={16} color={colors.accent} />
                <Text style={styles.dateBtnText}>
                  {inviteDate.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
            </View>

            {pickerMode !== null && (
              <DateTimePicker
                value={inviteDate}
                mode={pickerMode}
                is24Hour
                minimumDate={pickerMode === "date" ? new Date() : undefined}
                onChange={onPickerChange}
              />
            )}

            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Leg day, don't be late"
              placeholderTextColor={colors.muted}
              value={inviteNote}
              onChangeText={setInviteNote}
              maxLength={100}
            />

            <Text style={styles.modalLabel}>Location (optional)</Text>
            {invitePin ? (
              <>
                <View style={styles.locRow}>
                  <Pressable
                    style={styles.locPicked}
                    onPress={() => setMapOpen(true)}
                  >
                    <Ionicons name="location" size={16} color={colors.accent} />
                    <Text style={styles.locPickedText}>Pinned on map</Text>
                  </Pressable>
                  <Pressable
                    style={styles.locClear}
                    onPress={() => {
                      setInvitePin(null);
                      setInviteLocName("");
                    }}
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={16} color={colors.muted} />
                  </Pressable>
                </View>
                <TextInput
                  style={[styles.noteInput, { marginTop: 8 }]}
                  placeholder="Place name, e.g. Flex Gym"
                  placeholderTextColor={colors.muted}
                  value={inviteLocName}
                  onChangeText={setInviteLocName}
                  maxLength={60}
                />
              </>
            ) : (
              <Pressable style={styles.locBtn} onPress={() => setMapOpen(true)}>
                <Ionicons name="map-outline" size={16} color={colors.accent} />
                <Text style={styles.locBtnText}>Pick on map</Text>
              </Pressable>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setInviteFriend(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSend, sendingInvite && { opacity: 0.6 }]}
                onPress={handleSendInvite}
                disabled={sendingInvite}
              >
                {sendingInvite ? (
                  <ActivityIndicator color={colors.bg} size="small" />
                ) : (
                  <Text style={styles.modalSendText}>Send invite</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <MapPicker
        visible={mapOpen}
        initial={invitePin}
        onClose={() => setMapOpen(false)}
        onPick={(pin) => {
          setInvitePin(pin);
          setMapOpen(false);
        }}
      />
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 18,
    marginTop: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 11,
  },
  content: { padding: 18, paddingBottom: 50 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accent, fontSize: 16, fontWeight: "800" },
  rowName: { color: colors.text, fontSize: 14, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionAccent: { backgroundColor: colors.accent },
  actionAccentText: { color: colors.bg, fontSize: 13, fontWeight: "700" },
  actionMuted: {
    backgroundColor: colors.surface2,
  },
  actionMutedText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  modalLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  dateRow: { flexDirection: "row", gap: 10 },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingVertical: 12,
  },
  dateBtnText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  noteInput: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
  },
  friendSelectList: { maxHeight: 150 },
  friendSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  friendSelectName: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  locBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingVertical: 12,
  },
  locBtnText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locPicked: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  locPickedText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  locClear: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: colors.surface2,
  },
  modalCancelText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  modalSend: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: colors.accent,
  },
  modalSendText: { color: colors.bg, fontSize: 14, fontWeight: "800" },
  emptyWrap: { alignItems: "center", padding: 30, gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 10,
  },
});
