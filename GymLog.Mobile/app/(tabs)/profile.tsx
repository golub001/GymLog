import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { WeightEntry } from "../../dto/weight";
import { getWeights } from "../../services/weight";

function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export default function Profile() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<WeightEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      getWeights().then(setEntries);
    }, [])
  );

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const change =
    entries.length > 1
      ? entries[entries.length - 1].weightKg - entries[0].weightKg
      : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Profile</Text>

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

      <View style={{ marginTop: 30 }}>
        <Button title="Log out" onPress={signOut} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  title: { color: colors.text, fontSize: 24, fontWeight: "bold" },
  weightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 24,
  },
  weightIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface2,
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
});
