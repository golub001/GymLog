import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import AnimatedCard from "../../components/AnimatedCard";
import { UserProfile, DiaryDay } from "../../dto/nutrition";
import { WorkoutDetail } from "../../dto/workout";
import { WeightEntry } from "../../dto/weight";
import { getProfile, getDiary } from "../../services/nutrition";
import { getWorkoutsByDate } from "../../services/workout";
import { getWeights } from "../../services/weight";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function round(n: number): number {
  return Math.round(n);
}

function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [diary, setDiary] = useState<DiaryDay | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutDetail[]>([]);
  const [weight, setWeight] = useState<WeightEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      const today = todayIso();
      getProfile().then(setProfile);
      getDiary(today).then(setDiary);
      getWorkoutsByDate(today).then(setWorkouts);
      getWeights().then((w) => setWeight(w.length ? w[w.length - 1] : null));
    }, [])
  );

  const calorieGoal = profile?.dailyCalorieGoal ?? 0;
  const consumed = diary ? round(diary.totalKcal) : 0;
  const remaining = calorieGoal > 0 ? Math.max(calorieGoal - consumed, 0) : 0;
  const caloriePct =
    calorieGoal > 0 ? Math.min((consumed / calorieGoal) * 100, 100) : 0;
  const over = calorieGoal > 0 && consumed > calorieGoal;

  const trainedToday = workouts.length > 0;
  const totalSets = workouts.reduce(
    (s, w) => s + w.exercises.reduce((a, e) => a + e.sets.length, 0),
    0
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedCard delay={0}>
          <Text style={styles.greeting}>
            Hello{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </Text>
          <Text style={styles.subGreeting}>Here's your day at a glance.</Text>
        </AnimatedCard>

        {/* Calories */}
        <AnimatedCard delay={80} style={styles.card}>
          <Pressable onPress={() => router.push("/nutrition" as any)}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="flame" size={18} color={colors.orange} />
                <Text style={styles.cardTitle}>Calories</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
            <View style={styles.calorieRow}>
              <Text style={styles.bigNumber}>{consumed}</Text>
              <Text style={styles.bigUnit}>
                {calorieGoal > 0 ? `/ ${calorieGoal} kcal` : "kcal"}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${caloriePct}%`,
                    backgroundColor: over ? colors.orange : colors.accent,
                  },
                ]}
              />
            </View>
            {calorieGoal > 0 && (
              <Text style={styles.cardFootnote}>
                {over
                  ? `${consumed - calorieGoal} kcal over goal`
                  : `${remaining} kcal left`}
              </Text>
            )}
          </Pressable>
        </AnimatedCard>

        {/* Training */}
        <AnimatedCard delay={160} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="barbell" size={18} color={colors.accent} />
              <Text style={styles.cardTitle}>Training</Text>
            </View>
          </View>
          {trainedToday ? (
            <View style={styles.trainingDone}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.accent}
              />
              <Text style={styles.trainingDoneText}>
                Workout logged · {totalSets} sets
              </Text>
            </View>
          ) : (
            <Text style={styles.trainingEmpty}>No workout logged yet today.</Text>
          )}
          <Pressable
            style={styles.cardButton}
            onPress={() => router.push("/log-workout" as any)}
          >
            <Ionicons name="add" size={18} color={colors.bg} />
            <Text style={styles.cardButtonText}>Log Workout</Text>
          </Pressable>
        </AnimatedCard>

        {/* Weight */}
        <AnimatedCard delay={240} style={styles.card}>
          <Pressable onPress={() => router.push("/weight" as any)}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="scale" size={18} color={colors.accent2} />
                <Text style={styles.cardTitle}>Weight</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
            <Text style={styles.bigNumber}>
              {weight ? `${formatWeight(weight.weightKg)} ` : "—"}
              <Text style={styles.bigUnit}>{weight ? "kg" : ""}</Text>
            </Text>
          </Pressable>
        </AnimatedCard>

        {/* Muscle map */}
        <AnimatedCard delay={320} style={styles.card}>
          <Pressable onPress={() => router.push("/muscle-map" as any)}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="body" size={18} color={colors.accent} />
                <Text style={styles.cardTitle}>Muscle Map</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
            <Text style={styles.muscleHint}>
              See which muscles you've trained this week.
            </Text>
          </Pressable>
        </AnimatedCard>

        {/* Quick actions */}
        <AnimatedCard delay={400}>
          <View style={styles.quickRow}>
            <QuickAction
              icon="restaurant"
              label="Add Food"
              onPress={() => router.push("/nutrition" as any)}
            />
            <QuickAction
              icon="scale-outline"
              label="Weigh In"
              onPress={() => router.push("/weight" as any)}
            />
          </View>
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.accent} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 40 },
  greeting: { color: colors.text, fontSize: 26, fontWeight: "800" },
  subGreeting: { color: colors.muted, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  bigNumber: { color: colors.text, fontSize: 30, fontWeight: "800" },
  bigUnit: { color: colors.muted, fontSize: 15, fontWeight: "600" },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    overflow: "hidden",
    marginTop: 12,
  },
  fill: { height: 8, borderRadius: 4 },
  cardFootnote: { color: colors.muted, fontSize: 12, marginTop: 8 },
  trainingDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  trainingDoneText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  trainingEmpty: { color: colors.muted, fontSize: 14, marginTop: 12 },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 11,
    paddingVertical: 12,
    marginTop: 14,
  },
  cardButtonText: { color: colors.bg, fontSize: 14, fontWeight: "700" },
  quickRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 18,
    alignItems: "center",
    gap: 8,
  },
  quickLabel: { color: colors.text, fontSize: 13, fontWeight: "600" },
  muscleHint: { color: colors.muted, fontSize: 14, marginTop: 10 },
});
