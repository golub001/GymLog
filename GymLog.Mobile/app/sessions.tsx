import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { Session } from "../dto/sessions";
import {
  getSessions,
  acceptSession,
  declineSession,
  cancelSession,
} from "../services/sessions";
import { syncSessionReminders } from "../services/reminders";
import MapPicker from "../components/MapPicker";
import { useEmbedded } from "../components/embedded";

function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function SessionsScreen() {
  const router = useRouter();
  const embedded = useEmbedded();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewLocation, setViewLocation] = useState<{
    lat: number;
    lng: number;
    name: string | null;
  } | null>(null);

  function participantsLine(s: Session) {
    if (s.participants.length === 0) return null;
    const parts = s.participants.map(
      (p) =>
        `${p.name} ${
          p.status === "Accepted" ? "✓" : p.status === "Pending" ? "…" : "✗"
        }`
    );
    const prefix = s.isHost ? "" : `Host: ${s.hostName}  ·  `;
    return (
      <Text style={styles.participantsText} numberOfLines={2}>
        {prefix + parts.join("  ·  ")}
      </Text>
    );
  }

  function locationRow(s: Session) {
    if (s.locationLat == null || s.locationLng == null) return null;
    return (
      <Pressable
        style={styles.locRow}
        onPress={() =>
          setViewLocation({
            lat: s.locationLat!,
            lng: s.locationLng!,
            name: s.locationName,
          })
        }
        hitSlop={4}
      >
        <Ionicons name="location" size={13} color={colors.accent} />
        <Text style={styles.locText} numberOfLines={1}>
          {s.locationName || "View location"}
        </Text>
      </Pressable>
    );
  }

  const load = useCallback(() => {
    getSessions().then((data) => {
      setSessions(data);
      setLoading(false);
    });
    syncSessionReminders();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAccept(id: number) {
    const result = await acceptSession(id);
    if (result.ok) {
      load();
    } else {
      Alert.alert("Can't accept", result.error ?? "Try again.");
    }
  }

  async function handleDecline(id: number) {
    const ok = await declineSession(id);
    if (ok) load();
  }

  function confirmCancel(session: Session) {
    const isHost = session.isHost;
    Alert.alert(
      isHost ? "Cancel session" : "Leave session",
      isHost
        ? "Cancel this workout for everyone? All participants will be notified."
        : `Leave the workout hosted by ${session.hostName}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: isHost ? "Cancel for everyone" : "Leave",
          style: "destructive",
          onPress: async () => {
            const ok = await cancelSession(session.id);
            if (ok) load();
          },
        },
      ]
    );
  }

  const incoming = sessions.filter((s) => s.myStatus === "Pending");
  const upcoming = sessions.filter((s) => s.myStatus === "Accepted");

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
          <Text style={styles.headerTitle}>Workout Sessions</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="calendar-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No sessions</Text>
          <Text style={styles.emptyText}>
            Invite a friend to train together from the Friends screen.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {incoming.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>
                Invites for you ({incoming.length})
              </Text>
              {incoming.map((s) => (
                <View key={s.id} style={styles.card}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="barbell" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{s.hostName}</Text>
                    <Text style={styles.cardTime}>
                      {formatSessionTime(s.scheduledAt)}
                    </Text>
                    {s.note ? <Text style={styles.cardNote}>{s.note}</Text> : null}
                    {participantsLine(s)}
                    {locationRow(s)}
                  </View>
                  <Pressable
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(s.id)}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={styles.declineBtn}
                    onPress={() => handleDecline(s.id)}
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </>
          )}

          {upcoming.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Upcoming</Text>
              {upcoming.map((s) => (
                <View key={s.id} style={styles.card}>
                  <View style={styles.cardIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>
                      {s.isHost ? "Your session" : `Training with ${s.hostName}`}
                    </Text>
                    <Text style={styles.cardTime}>
                      {formatSessionTime(s.scheduledAt)}
                    </Text>
                    {s.note ? <Text style={styles.cardNote}>{s.note}</Text> : null}
                    {participantsLine(s)}
                    {locationRow(s)}
                  </View>
                  <Pressable
                    onPress={() => confirmCancel(s)}
                    hitSlop={8}
                    style={styles.cancelBtn}
                  >
                    <Ionicons
                      name={s.isHost ? "trash-outline" : "exit-outline"}
                      size={17}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>
              ))}
            </>
          )}

        </ScrollView>
      )}

      <MapPicker
        visible={viewLocation !== null}
        readOnly
        title={viewLocation?.name ?? "Location"}
        initial={
          viewLocation
            ? { lat: viewLocation.lat, lng: viewLocation.lng }
            : null
        }
        onClose={() => setViewLocation(null)}
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
  content: { padding: 18, paddingBottom: 36 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 9,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { color: colors.text, fontSize: 14, fontWeight: "700" },
  cardTime: { color: colors.accent, fontSize: 13, fontWeight: "600", marginTop: 2 },
  cardNote: { color: colors.muted, fontSize: 12, marginTop: 3 },
  participantsText: { color: colors.muted, fontSize: 12, marginTop: 4 },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  acceptBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acceptText: { color: colors.accentText, fontSize: 13, fontWeight: "700" },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
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
