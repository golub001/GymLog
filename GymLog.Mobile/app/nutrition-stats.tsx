import { useCallback, useEffect, useState } from "react";
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
import { NutritionSummary, UserProfile } from "../dto/nutrition";
import { getNutritionSummary, getProfile } from "../services/nutrition";

export default function NutritionStats() {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    const s = await getNutritionSummary(d);
    setSummary(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const kcalGoal = profile?.dailyCalorieGoal ?? 0;
  const proteinGoal = profile?.dailyProteinGoal ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Averages</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, days === 7 && styles.toggleActive]}
          onPress={() => setDays(7)}
        >
          <Text style={[styles.toggleText, days === 7 && styles.toggleTextActive]}>
            Week
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggle, days === 30 && styles.toggleActive]}
          onPress={() => setDays(30)}
        >
          <Text style={[styles.toggleText, days === 30 && styles.toggleTextActive]}>
            Month
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : !summary || summary.loggedDays === 0 ? (
        <Text style={styles.empty}>
          No food logged in the last {days} days.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.basedOn}>
            Average per day · based on {summary.loggedDays} logged{" "}
            {summary.loggedDays === 1 ? "day" : "days"}
          </Text>

          <View style={styles.kcalCard}>
            <Text style={styles.kcalLabel}>Calories / day</Text>
            <Text style={styles.kcalValue}>{summary.avgKcal}</Text>
            {kcalGoal > 0 && (
              <Text style={styles.kcalGoal}>
                Goal {kcalGoal} ·{" "}
                {summary.avgKcal <= kcalGoal
                  ? `${kcalGoal - summary.avgKcal} under`
                  : `${summary.avgKcal - kcalGoal} over`}
              </Text>
            )}
          </View>

          <View style={styles.macroRow}>
            <MacroBox
              label="Protein"
              value={summary.avgProtein}
              unit="g"
              goal={proteinGoal}
              color={colors.accent2}
            />
            <MacroBox
              label="Carbs"
              value={summary.avgCarbs}
              unit="g"
              color={colors.orange}
            />
            <MacroBox
              label="Fat"
              value={summary.avgFat}
              unit="g"
              color={colors.accent}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MacroBox({
  label,
  value,
  unit,
  goal,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  goal?: number;
  color: string;
}) {
  return (
    <View style={styles.macroBox}>
      <Text style={[styles.macroValue, { color }]}>
        {value}
        <Text style={styles.macroUnit}>{unit}</Text>
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
      {goal && goal > 0 ? (
        <Text style={styles.macroGoal}>/ {goal}{unit}</Text>
      ) : null}
    </View>
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
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    margin: 18,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
  },
  toggle: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 7,
    alignItems: "center",
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  toggleTextActive: { color: colors.bg },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  basedOn: { color: colors.muted, fontSize: 13, marginBottom: 14 },
  kcalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    alignItems: "center",
  },
  kcalLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kcalValue: { color: colors.text, fontSize: 40, fontWeight: "800", marginTop: 6 },
  kcalGoal: { color: colors.muted, fontSize: 13, marginTop: 6 },
  macroRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  macroBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    alignItems: "center",
  },
  macroValue: { fontSize: 22, fontWeight: "800" },
  macroUnit: { fontSize: 13, fontWeight: "600" },
  macroLabel: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 4 },
  macroGoal: { color: colors.muted, fontSize: 11, marginTop: 2 },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
