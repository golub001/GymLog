import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { PersonalBest } from "../dto/workout";
import { getPersonalBests } from "../services/workout";

const MUSCLE_ORDER = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Abs",
  "Cardio",
];

function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export default function PersonalBestsScreen() {
  const router = useRouter();
  const [bests, setBests] = useState<PersonalBest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonalBests().then((data) => {
      setBests(data);
      setLoading(false);
    });
  }, []);

  const grouped = bests.reduce<Record<string, PersonalBest[]>>((acc, pb) => {
    const mg = pb.muscleGroup;
    if (!acc[mg]) acc[mg] = [];
    acc[mg].push(pb);
    return acc;
  }, {});

  const orderedGroups = [
    ...MUSCLE_ORDER.filter((mg) => grouped[mg]),
    ...Object.keys(grouped).filter((mg) => !MUSCLE_ORDER.includes(mg)),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Bests</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : bests.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="trophy-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No records yet</Text>
          <Text style={styles.emptyText}>
            Log workouts with weights to track your personal bests.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {orderedGroups.map((mg) => (
            <View key={mg} style={styles.group}>
              <Text style={styles.groupLabel}>{mg}</Text>
              {grouped[mg]
                .sort((a, b) => b.weightKg - a.weightKg)
                .map((pb) => (
                  <View key={pb.exerciseId} style={styles.row}>
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {pb.exerciseName}
                    </Text>
                    <View style={styles.badge}>
                      <Ionicons
                        name="trophy"
                        size={12}
                        color={colors.accent}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.badgeText}>
                        {formatWeight(pb.weightKg)} kg × {pb.reps}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
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
  group: { marginBottom: 24 },
  groupLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
