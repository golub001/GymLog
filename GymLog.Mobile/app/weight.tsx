import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-gifted-charts";
import { colors } from "../theme/colors";
import { WeightEntry } from "../dto/weight";
import { getWeights, insertWeight } from "../services/weight";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export default function Weight() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getWeights();
    setEntries(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSave() {
    const w = parseFloat(weightInput.replace(",", "."));
    if (isNaN(w) || w < 20 || w > 500) {
      setError("Enter a weight between 20 and 500 kg.");
      return;
    }
    setError(null);
    setSaving(true);
    const id = await insertWeight(todayIso(), w);
    setSaving(false);
    if (id == null) {
      setError("Failed to save. Please try again.");
      return;
    }
    setWeightInput("");
    setModalOpen(false);
    load();
  }

  // Chart data: gifted-charts expects [{ value, label }]
  const chartData = entries.map((e, i) => ({
    value: e.weightKg,
    label:
      entries.length <= 7 || i === 0 || i === entries.length - 1
        ? shortLabel(e.date)
        : "",
  }));

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const first = entries.length > 0 ? entries[0] : null;
  const change =
    latest && first ? latest.weightKg - first.weightKg : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Weight</Text>
        <Pressable onPress={() => setModalOpen(true)} hitSlop={10}>
          <Ionicons name="add" size={26} color={colors.accent} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="scale-outline" size={56} color={colors.muted} />
          <Text style={styles.emptyText}>No weight entries yet.</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => setModalOpen(true)}
          >
            <Ionicons name="add" size={20} color={colors.bg} />
            <Text style={styles.addBtnText}>Add weight</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>
                {formatWeight(latest!.weightKg)} kg
              </Text>
            </View>
            {change !== null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Change</Text>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        change < 0
                          ? colors.accent
                          : change > 0
                          ? colors.orange
                          : colors.text,
                    },
                  ]}
                >
                  {change > 0 ? "+" : ""}
                  {formatWeight(change)} kg
                </Text>
              </View>
            )}
          </View>

          <View style={styles.chartCard}>
            <LineChart
              data={chartData}
              width={width - 100}
              height={200}
              color={colors.accent}
              thickness={2}
              dataPointsColor={colors.accent}
              startFillColor={colors.accent}
              startOpacity={0.2}
              endOpacity={0}
              areaChart
              yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
              yAxisColor={colors.line}
              xAxisColor={colors.line}
              rulesColor={colors.line}
              noOfSections={4}
            />
          </View>

          <Text style={styles.sectionLabel}>History</Text>
          {[...entries].reverse().map((e, i) => (
            <View key={`${e.date}-${i}`} style={styles.historyRow}>
              <Text style={styles.historyDate}>{e.date}</Text>
              <Text style={styles.historyWeight}>
                {formatWeight(e.weightKg)} kg
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add weight</Text>
            <Text style={styles.modalSub}>Today · {todayIso()}</Text>
            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="0.0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.kgText}>kg</Text>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setModalOpen(false);
                  setError(null);
                  setWeightInput("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    padding: 18,
    paddingBottom: 60,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  addBtnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 16,
    paddingRight: 16,
    alignItems: "center",
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  historyDate: {
    color: colors.muted,
    fontSize: 14,
  },
  historyWeight: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  modalSub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
  },
  weightInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weightInput: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  kgText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: colors.accent,
  },
  saveText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: "700",
  },
});
