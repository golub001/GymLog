import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import LoadingOverlay from "../components/LoadingOverlay";
import { ExerciseSearchItem, WorkoutSetInput } from "../dto/workout";
import { searchExercises, insertWorkout } from "../services/workout";
import { PlanDetail, weekdayName, todayDayOfWeek } from "../dto/plan";
import { getActivePlan } from "../services/plan";

type SetRow = { weight: string; reps: string };
type ExerciseEntry = { exercise: ExerciseSearchItem; sets: SetRow[] };

type DayOption = { iso: string; label: string };

function lastSevenDays(): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    const label =
      i === 0
        ? "Today"
        : i === 1
        ? "Yesterday"
        : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    days.push({ iso, label });
  }
  return days;
}

export default function LogWorkout() {
  const router = useRouter();
  const { planDayId: paramDayId } = useLocalSearchParams<{ planDayId?: string }>();
  const days = lastSevenDays();

  const [selectedIso, setSelectedIso] = useState(days[0].iso);
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<PlanDetail | null>(null);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [planDayId, setPlanDayId] = useState<number | null>(null);

  useEffect(() => {
    getActivePlan().then((p) => {
      setActivePlan(p);
      if (p && paramDayId) {
        const day = p.days.find((d) => d.id === Number(paramDayId));
        if (day) applyDay(day);
      }
    });
  }, []);

  function defaultWeight(equipment: string | null): string {
    return equipment === "Body weight" ? "0" : "";
  }

  function applyDay(day: PlanDetail["days"][number]) {
    setEntries(
      day.exercises.map((pe) => ({
        exercise: {
          id: pe.exerciseId,
          name: pe.exerciseName,
          muscleGroup: pe.muscleGroup,
          equipment: pe.equipment,
          imageUrl: pe.imageUrl,
        },
        sets: Array.from({ length: Math.max(pe.targetSets, 1) }, () => ({
          weight: defaultWeight(pe.equipment),
          reps: String(pe.targetReps),
        })),
      }))
    );
    setPlanDayId(day.id);
    setPlanPickerOpen(false);
  }

  function loadPlanDay(dayId: number) {
    const day = activePlan?.days.find((d) => d.id === dayId);
    if (day) applyDay(day);
  }

  function addExercise(exercise: ExerciseSearchItem) {
    setEntries((prev) => [
      ...prev,
      { exercise, sets: [{ weight: defaultWeight(exercise.equipment), reps: "" }] },
    ]);
    setPickerOpen(false);
  }

  function removeExercise(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function addSet(entryIndex: number) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === entryIndex
          ? {
              ...e,
              sets: [
                ...e.sets,
                { weight: defaultWeight(e.exercise.equipment), reps: "" },
              ],
            }
          : e
      )
    );
  }

  function removeSet(entryIndex: number, setIndex: number) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === entryIndex
          ? { ...e, sets: e.sets.filter((_, s) => s !== setIndex) }
          : e
      )
    );
  }

  function updateSet(
    entryIndex: number,
    setIndex: number,
    field: keyof SetRow,
    value: string
  ) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === entryIndex
          ? {
              ...e,
              sets: e.sets.map((s, si) =>
                si === setIndex ? { ...s, [field]: value } : s
              ),
            }
          : e
      )
    );
  }

  async function handleSave() {
    if (entries.length === 0) {
      setError("Add at least one exercise.");
      return;
    }

    const workoutSets: WorkoutSetInput[] = [];
    for (const entry of entries) {
      for (const s of entry.sets) {
        const rawWeight = s.weight.trim();
        const w = rawWeight === "" ? 0 : parseFloat(rawWeight.replace(",", "."));
        const r = parseInt(s.reps, 10);
        if (isNaN(w) || w < 0 || w > 600) {
          setError(`Check the weight for ${entry.exercise.name}.`);
          return;
        }
        if (isNaN(r) || r < 1 || r > 1000) {
          setError(`Check the reps for ${entry.exercise.name}.`);
          return;
        }
        workoutSets.push({
          exerciseId: entry.exercise.id,
          weightKg: w,
          reps: r,
        });
      }
    }

    if (workoutSets.length === 0) {
      setError("Add at least one set.");
      return;
    }

    setError(null);
    setLoading(true);
    const id = await insertWorkout({
      workoutSets,
      notes: notes.trim() || null,
      date: selectedIso,
      planDayId,
    });
    setLoading(false);

    if (id == null) {
      setError("Failed to save workout. Please try again.");
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Log Workout</Text>
        <Pressable onPress={handleSave} hitSlop={10}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {days.map((d) => {
              const active = d.iso === selectedIso;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => setSelectedIso(d.iso)}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      active && styles.dateChipTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {activePlan && entries.length === 0 && (() => {
            const todayDay = activePlan.days.find(
              (d) => d.dayOfWeek === todayDayOfWeek()
            );
            return (
              <Pressable
                style={styles.planBanner}
                onPress={() =>
                  todayDay ? loadPlanDay(todayDay.id) : setPlanPickerOpen(true)
                }
              >
                <Ionicons name="clipboard-outline" size={20} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.planBannerTitle}>
                    {todayDay
                      ? `Today's workout: ${todayDay.name}`
                      : `Start from ${activePlan.name}`}
                  </Text>
                  <Text style={styles.planBannerSub}>
                    {todayDay
                      ? "Tap to pre-fill · or pick another day"
                      : "Pre-fill exercises from your plan"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setPlanPickerOpen(true)}
                  hitSlop={10}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="list" size={20} color={colors.muted} />
                </Pressable>
              </Pressable>
            );
          })()}

          {planDayId != null && (
            <Text style={styles.fromPlanNote}>
              Logging from plan ·{" "}
              {activePlan?.days.find((d) => d.id === planDayId)?.name}
            </Text>
          )}

          {entries.map((entry, ei) => (
            <View key={`${entry.exercise.id}-${ei}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Pressable
                  style={styles.exerciseTitleBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/exercise-detail",
                      params: { id: String(entry.exercise.id) },
                    } as any)
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>
                      {entry.exercise.name}
                    </Text>
                    <Text style={styles.exerciseMeta}>
                      {entry.exercise.muscleGroup}
                      {entry.exercise.equipment
                        ? ` · ${entry.exercise.equipment}`
                        : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
                <Pressable onPress={() => removeExercise(ei)} hitSlop={8}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
                </Pressable>
              </View>

              <View style={styles.setHeaderRow}>
                <Text style={[styles.setHeaderText, { width: 36 }]}>Set</Text>
                <Text style={[styles.setHeaderText, styles.flexCol]}>Kg</Text>
                <Text style={[styles.setHeaderText, styles.flexCol]}>Reps</Text>
                <View style={{ width: 28 }} />
              </View>

              {entry.sets.map((s, si) => (
                <View key={si} style={styles.setRow}>
                  <Text style={styles.setIndex}>{si + 1}</Text>
                  <TextInput
                    style={[styles.setInput, styles.flexCol]}
                    value={s.weight}
                    onChangeText={(t) => updateSet(ei, si, "weight", t)}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={[styles.setInput, styles.flexCol]}
                    value={s.reps}
                    onChangeText={(t) => updateSet(ei, si, "reps", t)}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                  />
                  <Pressable
                    onPress={() => removeSet(ei, si)}
                    hitSlop={8}
                    style={styles.setRemove}
                    disabled={entry.sets.length === 1}
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={22}
                      color={
                        entry.sets.length === 1 ? colors.line : colors.muted
                      }
                    />
                  </Pressable>
                </View>
              ))}

              <Pressable onPress={() => addSet(ei)} style={styles.addSetBtn}>
                <Ionicons name="add" size={18} color={colors.accent} />
                <Text style={styles.addSetText}>Add set</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => setPickerOpen(true)}
            style={styles.addExerciseBtn}
          >
            <Ionicons name="add" size={20} color={colors.bg} />
            <Text style={styles.addExerciseText}>Add exercise</Text>
          </Pressable>

          <Text style={[styles.label, { marginTop: 22 }]}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes about this workout…"
            placeholderTextColor={colors.muted}
            multiline
          />

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addExercise}
      />

      <Modal
        visible={planPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPlanPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPlanPickerOpen(false)}
        >
          <Pressable style={styles.planSheet}>
            <Text style={styles.planSheetTitle}>{activePlan?.name}</Text>
            <Text style={styles.planSheetSub}>Pick the day you trained</Text>
            {activePlan?.days.map((d) => {
              const isToday = d.dayOfWeek === todayDayOfWeek();
              return (
                <Pressable
                  key={d.id}
                  style={styles.planDayRow}
                  onPress={() => loadPlanDay(d.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planDayName}>
                      {d.name}
                      {isToday ? "  · Today" : ""}
                    </Text>
                    <Text style={styles.planDayMeta}>
                      {d.dayOfWeek > 0 ? `${weekdayName(d.dayOfWeek)} · ` : ""}
                      {d.exercises.length} exercises
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <LoadingOverlay visible={loading} />
    </SafeAreaView>
  );
}

function ExercisePicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseSearchItem) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ExerciseSearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const data = await searchExercises(q);
      setResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [term]);

  function close() {
    setTerm("");
    setResults([]);
    onClose();
  }

  function pick(exercise: ExerciseSearchItem) {
    setTerm("");
    setResults([]);
    onSelect(exercise);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={close} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Exercise</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={term}
            onChangeText={setTerm}
            placeholder="Search exercises…"
            placeholderTextColor={colors.muted}
            autoFocus
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={colors.accent} />}
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 18 }}
          renderItem={({ item }) => (
            <Pressable style={styles.resultRow} onPress={() => pick(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultMeta}>
                  {item.muscleGroup}
                  {item.equipment ? ` · ${item.equipment}` : ""}
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.accent} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {term.trim().length < 2
                ? "Type at least 2 letters to search."
                : searching
                ? "Searching…"
                : "No exercises found."}
            </Text>
          }
        />
      </SafeAreaView>
    </Modal>
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
  saveText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    padding: 18,
    paddingBottom: 60,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dateRow: {
    gap: 8,
    paddingBottom: 4,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dateChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dateChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  dateChipTextActive: {
    color: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  exerciseTitleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  setHeaderText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  flexCol: {
    flex: 1,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  setIndex: {
    width: 36,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  setInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
  },
  setRemove: {
    width: 28,
    alignItems: "center",
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    marginTop: 2,
  },
  addSetText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  addExerciseText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: "700",
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: "top",
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 16,
    textAlign: "center",
  },
  planBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  planBannerTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  planBannerSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  fromPlanNote: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  planSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    paddingBottom: 34,
  },
  planSheetTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  planSheetSub: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: 14 },
  planDayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  planDayName: { color: colors.text, fontSize: 16, fontWeight: "600" },
  planDayMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 18,
    marginVertical: 14,
    paddingHorizontal: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  resultName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  resultMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 40,
  },
});
