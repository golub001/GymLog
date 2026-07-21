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
import { PlanDetail, todayDayOfWeek } from "../../dto/plan";
import { Session } from "../../dto/sessions";
import { getProfile, getDiary } from "../../services/nutrition";
import { getWorkoutsByDate, getStreak } from "../../services/workout";
import { getWeights } from "../../services/weight";
import { getActivePlan } from "../../services/plan";
import { getSessions } from "../../services/sessions";

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
  const [activePlan, setActivePlan] = useState<PlanDetail | null>(null);
  const [streak, setStreak] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      const today = todayIso();
      getProfile().then(setProfile);
      getDiary(today).then(setDiary);
      getWorkoutsByDate(today).then(setWorkouts);
      getWeights().then((w) => setWeight(w.length ? w[w.length - 1] : null));
      getActivePlan().then(setActivePlan);
      getStreak().then(setStreak);
      getSessions().then(setSessions);
    }, [])
  );

  const pendingInvites = sessions.filter(
    (s) => s.myStatus === "Pending"
  ).length;
  const nextSession =
    sessions
      .filter(
        (s) =>
          s.myStatus === "Accepted" &&
          new Date(s.scheduledAt).getTime() > Date.now()
      )
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0] ?? null;

  function formatSessionShort(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return (
      d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) +
      " · " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  }

  const todayPlanDay =
    activePlan?.days.find((d) => d.dayOfWeek === todayDayOfWeek()) ?? null;

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
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                Hello{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
              </Text>
              <Text style={styles.subGreeting}>Here's your day at a glance.</Text>
            </View>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={20} color={colors.orange} />
                <Text style={styles.streakNum}>{streak}</Text>
              </View>
            )}
          </View>
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
          ) : todayPlanDay ? (
            <Text style={styles.trainingEmpty}>
              Today's plan:{" "}
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {todayPlanDay.name}
              </Text>
            </Text>
          ) : activePlan ? (
            <Text style={styles.trainingEmpty}>Rest day — no workout planned.</Text>
          ) : (
            <Text style={styles.trainingEmpty}>No workout logged yet today.</Text>
          )}
          {trainedToday ? (
            <Pressable
              style={styles.cardButtonGhost}
              onPress={() => router.push("/training" as any)}
            >
              <Text style={styles.cardButtonGhostText}>
                View in Training tab
              </Text>
              <Ionicons name="chevron-forward" size={15} color={colors.muted} />
            </Pressable>
          ) : (
            <Pressable
              style={styles.cardButton}
              onPress={() =>
                todayPlanDay
                  ? router.push({
                      pathname: "/log-workout",
                      params: { planDayId: String(todayPlanDay.id) },
                    } as any)
                  : router.push("/log-workout" as any)
              }
            >
              <Ionicons name="add" size={18} color={colors.bg} />
              <Text style={styles.cardButtonText}>
                {todayPlanDay ? `Start ${todayPlanDay.name}` : "Log Workout"}
              </Text>
            </Pressable>
          )}
        </AnimatedCard>

        {(pendingInvites > 0 || nextSession) && (
          <AnimatedCard delay={200} style={styles.card}>
            <Pressable onPress={() => router.push("/sessions" as any)}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="calendar" size={18} color={colors.accent} />
                  <Text style={styles.cardTitle}>Sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </View>
              {pendingInvites > 0 && (
                <View style={styles.sessionRow}>
                  <View style={styles.inviteBadge}>
                    <Text style={styles.inviteBadgeText}>{pendingInvites}</Text>
                  </View>
                  <Text style={styles.sessionInviteText}>
                    {pendingInvites === 1
                      ? "New workout invite — tap to respond"
                      : `${pendingInvites} workout invites — tap to respond`}
                  </Text>
                </View>
              )}
              {nextSession && (
                <View style={styles.sessionRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.sessionNextText} numberOfLines={1}>
                    Next: {formatSessionShort(nextSession.scheduledAt)}{" "}
                    {nextSession.isHost
                      ? "· your session"
                      : `with ${nextSession.hostName}`}
                    {nextSession.locationName
                      ? ` · 📍 ${nextSession.locationName}`
                      : ""}
                  </Text>
                </View>
              )}
            </Pressable>
          </AnimatedCard>
        )}

        {}
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

        {}
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

        {/* Exercise library */}
        <AnimatedCard delay={400} style={styles.card}>
          <Pressable onPress={() => router.push("/exercises" as any)}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="library" size={18} color={colors.accent} />
                <Text style={styles.cardTitle}>Exercise Library</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
            <Text style={styles.muscleHint}>
              Browse exercises by muscle and equipment.
            </Text>
          </Pressable>
        </AnimatedCard>

        {/* Quick actions */}
        <AnimatedCard delay={480}>
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
  greetingRow: { flexDirection: "row", alignItems: "center" },
  greeting: { color: colors.text, fontSize: 26, fontWeight: "800" },
  subGreeting: { color: colors.muted, fontSize: 14, marginTop: 4 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  streakNum: { color: colors.text, fontSize: 16, fontWeight: "800" },
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
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  inviteBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  inviteBadgeText: { color: colors.bg, fontSize: 11, fontWeight: "800" },
  sessionInviteText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  sessionNextText: { color: colors.muted, fontSize: 13, flex: 1 },
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
  cardButtonGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 11,
    marginTop: 14,
  },
  cardButtonGhostText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
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
