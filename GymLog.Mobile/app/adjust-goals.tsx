import { useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { UserProfile } from "../dto/nutrition";
import {
  OnboardingData,
  PlanOption,
  ActivityLevel,
  GoalType,
} from "../dto/onboarding";
import { getProfile } from "../services/nutrition";
import { calculatePlan, updateGoals } from "../services/user";

const GOALS: { id: GoalType; label: string }[] = [
  { id: "LoseWeight", label: "Lose" },
  { id: "Maintain", label: "Maintain" },
  { id: "GainMass", label: "Gain" },
];

const ACTIVITIES: { id: ActivityLevel; label: string }[] = [
  { id: "Sedentary", label: "Low" },
  { id: "Moderate", label: "Moderate" },
  { id: "Active", label: "High" },
];

function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export default function AdjustGoals() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [goal, setGoal] = useState<GoalType>("Maintain");
  const [activity, setActivity] = useState<ActivityLevel>("Moderate");

  const [protein, setProtein] = useState<number>(0);
  const [options, setOptions] = useState<PlanOption[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      if (p?.goalType) setGoal(p.goalType);
      if (p?.activityLevel) setActivity(p.activityLevel);
      setLoading(false);
    });
  }, []);

  const weight = profile?.latestWeightKg ?? null;
  const canCalc =
    profile?.sex != null &&
    profile.birthDate != null &&
    profile.heightCm != null &&
    weight != null;

  // recompute whenever goal/activity change: clear stale options
  useEffect(() => {
    setOptions([]);
    setSelected(null);
  }, [goal, activity]);

  async function handleCalculate() {
    if (!profile || !canCalc || weight == null) return;
    const data: OnboardingData = {
      sex: profile.sex!,
      birthDate: profile.birthDate!,
      heightCm: profile.heightCm!,
      weightKg: weight,
      activityLevel: activity,
      goalType: goal,
    };
    setCalculating(true);
    const result = await calculatePlan(data);
    setCalculating(false);
    if (result) {
      setProtein(result.protein);
      setOptions(result.options);
      setSelected(result.options.length === 1 ? 0 : null);
    } else {
      Alert.alert("Error", "Could not calculate. Try again.");
    }
  }

  async function handleSave() {
    if (!profile || selected == null || weight == null) return;
    const chosen = options[selected];
    const data: OnboardingData = {
      sex: profile.sex!,
      birthDate: profile.birthDate!,
      heightCm: profile.heightCm!,
      weightKg: weight,
      activityLevel: activity,
      goalType: goal,
    };
    setSaving(true);
    const ok = await updateGoals(data, chosen.calories);
    setSaving(false);
    if (ok) {
      Alert.alert("Goals updated", "Your daily targets have been updated. 💪", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Error", "Could not save. Try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Adjust Goals</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Current daily target</Text>
            <Text style={styles.currentValue}>
              {profile?.dailyCalorieGoal ?? "—"}{" "}
              <Text style={styles.currentUnit}>kcal</Text>
            </Text>
            <Text style={styles.currentSub}>
              {profile?.dailyProteinGoal
                ? `${profile.dailyProteinGoal} g protein`
                : ""}
            </Text>
          </View>

          {!canCalc ? (
            <Text style={styles.warn}>
              Add a body-weight entry first so we can recalculate your targets.
            </Text>
          ) : (
            <>
              <View style={styles.weightRow}>
                <Ionicons name="scale-outline" size={18} color={colors.accent2} />
                <Text style={styles.weightText}>
                  Using your latest weight:{" "}
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {formatWeight(weight!)} kg
                  </Text>
                </Text>
              </View>

              <Text style={styles.label}>Goal</Text>
              <View style={styles.segment}>
                {GOALS.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[
                      styles.segOption,
                      goal === g.id && styles.segOptionActive,
                    ]}
                    onPress={() => setGoal(g.id)}
                  >
                    <Text
                      style={[
                        styles.segText,
                        goal === g.id && styles.segTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Activity</Text>
              <View style={styles.segment}>
                {ACTIVITIES.map((a) => (
                  <Pressable
                    key={a.id}
                    style={[
                      styles.segOption,
                      activity === a.id && styles.segOptionActive,
                    ]}
                    onPress={() => setActivity(a.id)}
                  >
                    <Text
                      style={[
                        styles.segText,
                        activity === a.id && styles.segTextActive,
                      ]}
                    >
                      {a.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {options.length === 0 ? (
                <Pressable
                  style={styles.calcBtn}
                  onPress={handleCalculate}
                  disabled={calculating}
                >
                  {calculating ? (
                    <ActivityIndicator color={colors.accentText} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="calculator-outline"
                        size={18}
                        color={colors.accentText}
                      />
                      <Text style={styles.calcBtnText}>Calculate</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <>
                  <Text style={styles.label}>Choose a target</Text>
                  {options.map((opt, i) => (
                    <Pressable
                      key={i}
                      style={[
                        styles.optionCard,
                        selected === i && styles.optionCardActive,
                      ]}
                      onPress={() => setSelected(i)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                        {opt.weeklyChangeKg > 0 && (
                          <Text style={styles.optionSub}>
                            {goal === "LoseWeight" ? "−" : "+"}
                            {opt.weeklyChangeKg} kg / week
                          </Text>
                        )}
                      </View>
                      <Text style={styles.optionKcal}>{opt.calories}</Text>
                      <Text style={styles.optionKcalUnit}>kcal</Text>
                    </Pressable>
                  ))}
                  <Text style={styles.proteinNote}>
                    Protein target: {protein} g / day
                  </Text>

                  <Pressable
                    style={[
                      styles.saveBtn,
                      (selected == null || saving) && { opacity: 0.5 },
                    ]}
                    onPress={handleSave}
                    disabled={selected == null || saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.accentText} size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save new target</Text>
                    )}
                  </Pressable>
                </>
              )}
            </>
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
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  content: { padding: 18, paddingBottom: 50 },
  currentCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    alignItems: "center",
  },
  currentLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentValue: {
    color: colors.text,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 6,
  },
  currentUnit: { color: colors.muted, fontSize: 16, fontWeight: "600" },
  currentSub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  warn: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 30,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accent2Dim,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  weightText: { color: colors.muted, fontSize: 13, flex: 1 },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },
  segment: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
  },
  segOption: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  segOptionActive: { backgroundColor: colors.accent },
  segText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  segTextActive: { color: colors.accentText, fontWeight: "700" },
  calcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 30,
  },
  calcBtnText: { color: colors.accentText, fontSize: 15, fontWeight: "700" },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 10,
  },
  optionCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  optionLabel: { color: colors.text, fontSize: 15, fontWeight: "700" },
  optionSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  optionKcal: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  optionKcalUnit: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  proteinNote: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 22,
  },
  saveBtnText: { color: colors.accentText, fontSize: 15, fontWeight: "700" },
});
