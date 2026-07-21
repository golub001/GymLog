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
import Body, { Slug, ExtendedBodyPart } from "react-native-body-highlighter";
import { colors } from "../theme/colors";
import { MuscleStat } from "../dto/workout";
import { getMuscleStats } from "../services/workout";

const MUSCLE_MAP: Record<string, Slug[]> = {
  Chest: ["chest"],
  Back: ["upper-back", "lower-back", "trapezius"],
  Shoulders: ["deltoids"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Legs: ["quadriceps", "hamstring", "calves", "gluteal"],
  Core: ["abs", "obliques"],
};

const GROUP_ORDER = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Core",
];

const INTENSITY_COLORS = ["#C4F82A55", "#C4F82AAA", "#C4F82A"];

function intensityFor(stat: MuscleStat): number {
  if (stat.targetSets > 0) {
    const pct = stat.setCount / stat.targetSets;
    if (pct >= 0.8) return 3;
    if (pct >= 0.4) return 2;
    if (pct > 0) return 1;
    return 0;
  }
  if (stat.setCount >= 10) return 3;
  if (stat.setCount >= 5) return 2;
  if (stat.setCount > 0) return 1;
  return 0;
}

export default function MuscleMap() {
  const router = useRouter();
  const [stats, setStats] = useState<MuscleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<"front" | "back">("front");

  useFocusEffect(
    useCallback(() => {
      getMuscleStats().then((s) => {
        setStats(s);
        setLoading(false);
      });
    }, [])
  );

  const hasPlan = stats.some((s) => s.targetSets > 0);

  const bodyData: ExtendedBodyPart[] = [];
  for (const stat of stats) {
    const slugs = MUSCLE_MAP[stat.muscleGroup] ?? [];
    const intensity = intensityFor(stat);
    if (intensity === 0) continue;
    for (const slug of slugs) {
      bodyData.push({ slug, intensity });
    }
  }

  const statFor = (group: string) =>
    stats.find((s) => s.muscleGroup === group) ?? null;

  const totalSets = stats.reduce((s, m) => s + m.setCount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Muscle Map</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>
            This week · {totalSets} sets
            {hasPlan ? " · vs plan target" : ""}
          </Text>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggle, side === "front" && styles.toggleActive]}
              onPress={() => setSide("front")}
            >
              <Text
                style={[
                  styles.toggleText,
                  side === "front" && styles.toggleTextActive,
                ]}
              >
                Front
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggle, side === "back" && styles.toggleActive]}
              onPress={() => setSide("back")}
            >
              <Text
                style={[
                  styles.toggleText,
                  side === "back" && styles.toggleTextActive,
                ]}
              >
                Back
              </Text>
            </Pressable>
          </View>

          <View style={styles.bodyWrap}>
            <Body
              data={bodyData}
              side={side}
              gender="male"
              scale={1.1}
              colors={INTENSITY_COLORS}
              defaultFill={colors.surface2}
              border={colors.line}
            />
          </View>

          <Text style={styles.sectionLabel}>
            {hasPlan ? "Progress vs plan" : "This week"}
          </Text>
          {(hasPlan
            ? GROUP_ORDER.filter((g) => (statFor(g)?.targetSets ?? 0) > 0)
            : GROUP_ORDER
          ).map((group) => {
            const stat = statFor(group);
            const count = stat?.setCount ?? 0;
            const target = stat?.targetSets ?? 0;
            const intensity = stat ? intensityFor(stat) : 0;
            return (
              <View key={group} style={styles.statRow}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        intensity > 0
                          ? INTENSITY_COLORS[intensity - 1]
                          : colors.surface2,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statName,
                    count === 0 && { color: colors.muted },
                  ]}
                >
                  {group}
                </Text>
                <Text style={styles.statCount}>
                  {hasPlan && target > 0
                    ? `${count} / ${target} sets`
                    : `${count} ${count === 1 ? "set" : "sets"}`}
                </Text>
              </View>
            );
          })}

          {hasPlan &&
            GROUP_ORDER.some(
              (g) =>
                (statFor(g)?.targetSets ?? 0) === 0 &&
                (statFor(g)?.setCount ?? 0) > 0
            ) && (
              <>
                <Text style={styles.sectionLabel}>Also trained</Text>
                {GROUP_ORDER.filter(
                  (g) =>
                    (statFor(g)?.targetSets ?? 0) === 0 &&
                    (statFor(g)?.setCount ?? 0) > 0
                ).map((group) => {
                  const stat = statFor(group);
                  const count = stat?.setCount ?? 0;
                  const intensity = stat ? intensityFor(stat) : 0;
                  return (
                    <View key={group} style={styles.statRow}>
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              intensity > 0
                                ? INTENSITY_COLORS[intensity - 1]
                                : colors.surface2,
                          },
                        ]}
                      />
                      <Text style={styles.statName}>{group}</Text>
                      <Text style={styles.statCount}>
                        {count} {count === 1 ? "set" : "sets"}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}

          {totalSets === 0 && (
            <Text style={styles.emptyText}>
              No sets logged this week. Log a workout to light up your map.
            </Text>
          )}
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
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  content: { padding: 18, paddingBottom: 50, alignItems: "center" },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
    gap: 4,
    marginBottom: 10,
  },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 26,
    borderRadius: 7,
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  toggleTextActive: { color: colors.bg },
  bodyWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  sectionLabel: {
    alignSelf: "flex-start",
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    width: "100%",
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  statName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "500" },
  statCount: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },
});
