import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../theme/colors";
import Button from "../../components/Button";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { WeightEntry } from "../../dto/weight";
import { UserProfile } from "../../dto/nutrition";
import { getWeights } from "../../services/weight";
import { getProfile } from "../../services/nutrition";
import { uploadAvatar } from "../../services/user";

function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export default function Profile() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getWeights().then(setEntries);
      getProfile().then(setProfile);
    }, [])
  );

  async function changeAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to set a picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    const url = await uploadAvatar(result.assets[0].uri);
    setUploading(false);
    if (url) {
      setProfile((p) => (p ? { ...p, avatarUrl: url } : p));
    } else {
      Alert.alert("Error", "Could not update your picture. Try again.");
    }
  }

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const change =
    entries.length > 1
      ? entries[entries.length - 1].weightKg - entries[0].weightKg
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <Pressable onPress={changeAvatar} disabled={uploading}>
          <Avatar
            name={profile?.name ?? "?"}
            avatarUrl={profile?.avatarUrl}
            size={72}
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={13} color={colors.accentText} />
          </View>
        </Pressable>
        <Text style={styles.profileName}>{profile?.name ?? "Profile"}</Text>
        <Pressable onPress={changeAvatar} disabled={uploading}>
          <Text style={styles.changePhoto}>
            {uploading ? "Updating…" : "Change photo"}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.weightCard}
        onPress={() => router.push("/weight" as any)}
      >
        <View style={styles.weightIcon}>
          <Ionicons name="scale-outline" size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weightLabel}>Weight</Text>
          <Text style={styles.weightValue}>
            {latest ? `${formatWeight(latest.weightKg)} kg` : "No data yet"}
          </Text>
        </View>
        {change !== null && (
          <Text
            style={[
              styles.weightChange,
              { color: change < 0 ? colors.accent : change > 0 ? colors.orange : colors.muted },
            ]}
          >
            {change > 0 ? "+" : ""}
            {formatWeight(change)} kg
          </Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Pressable
        style={styles.weightCard}
        onPress={() => router.push("/personal-bests" as any)}
      >
        <View style={styles.weightIcon}>
          <Ionicons name="trophy-outline" size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weightLabel}>Personal Bests</Text>
          <Text style={styles.weightValue}>Your records</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Pressable
        style={styles.weightCard}
        onPress={() => router.push("/progress-photos" as any)}
      >
        <View style={styles.weightIcon}>
          <Ionicons name="camera-outline" size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weightLabel}>Progress Photos</Text>
          <Text style={styles.weightValue}>Track your transformation</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Pressable
        style={styles.weightCard}
        onPress={() => router.push("/adjust-goals" as any)}
      >
        <View style={styles.weightIcon}>
          <Ionicons name="options-outline" size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weightLabel}>Calorie Goal</Text>
          <Text style={styles.weightValue}>Recalculate your target</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Pressable
        style={styles.weightCard}
        onPress={() => router.push("/change-password" as any)}
      >
        <View style={styles.weightIcon}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weightLabel}>Password</Text>
          <Text style={styles.weightValue}>Change your password</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <View style={{ marginTop: 30 }}>
        <Button title="Log out" onPress={signOut} variant="ghost" />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingBottom: 40 },
  profileHeader: { alignItems: "center", marginTop: 6, marginBottom: 8 },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
  profileName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 12,
  },
  changePhoto: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  weightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 16,
  },
  weightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  weightLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  weightValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  weightChange: {
    fontSize: 14,
    fontWeight: "700",
    marginRight: 6,
  },
  requestBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  requestBadgeText: { color: colors.bg, fontSize: 12, fontWeight: "800" },
});
