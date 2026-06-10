import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import LoadingOverlay from "../components/LoadingOverlay";
import { generatePlan } from "../services/plan";

const EQUIPMENT = [
  "Body weight",
  "Dumbbell",
  "Barbell",
  "Cable",
  "Kettlebell",
  "Smith machine",
  "Leverage machine",
];

const DAY_OPTIONS = [3, 4, 5, 6];

export default function GeneratePlan() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [days, setDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEquip(e: string) {
    setEquipment((cur) =>
      cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]
    );
  }

  async function handleGenerate() {
    if (prompt.trim().length < 5) {
      setError("Describe what you want (at least a few words).");
      return;
    }
    setError(null);
    setLoading(true);
    const id = await generatePlan(prompt.trim(), equipment, days);
    setLoading(false);
    if (id == null) {
      setError("Couldn't generate a plan. Please try again.");
      return;
    }

    router.replace({
      pathname: "/plan-detail",
      params: { id: String(id) },
    } as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Generate Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>What do you want?</Text>
        <TextInput
          style={styles.promptInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g. 4-day plan for muscle gain, I have knee pain so go easy on squats, more upper body…"
          placeholderTextColor={colors.muted}
          multiline
        />

        <Text style={styles.label}>Equipment you have</Text>
        <View style={styles.chipWrap}>
          {EQUIPMENT.map((e) => {
            const active = equipment.includes(e);
            return (
              <Pressable
                key={e}
                onPress={() => toggleEquip(e)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {e}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Leave empty to allow any equipment.</Text>

        <Text style={styles.label}>Days per week</Text>
        <View style={styles.chipWrap}>
          {DAY_OPTIONS.map((d) => {
            const active = days === d;
            return (
              <Pressable
                key={d}
                onPress={() => setDays(active ? null : d)}
                style={[styles.dayChip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.generateBtn} onPress={handleGenerate}>
          <Ionicons name="sparkles" size={18} color={colors.bg} />
          <Text style={styles.generateText}>Generate Plan</Text>
        </Pressable>
        <Text style={styles.note}>
          The AI builds a plan using exercises from the catalog. You can edit it
          afterwards.
        </Text>
      </ScrollView>

      <LoadingOverlay visible={loading} />
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
  content: { padding: 18, paddingBottom: 50 },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  promptInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    minHeight: 90,
    textAlignVertical: "top",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayChip: {
    width: 48,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.bg },
  hint: { color: colors.muted, fontSize: 12, marginTop: 8 },
  error: { color: colors.danger, fontSize: 13, marginTop: 18 },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 26,
  },
  generateText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  note: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 17,
  },
});
