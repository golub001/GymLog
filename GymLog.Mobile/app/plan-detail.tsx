import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { PlanDetail, weekdayName } from "../dto/plan";
import {
  getPlanById,
  useTemplate,
  activatePlan,
  deletePlan,
  addPlanExercise,
  removePlanExercise,
  updatePlanExercise,
} from "../services/plan";
import { ExerciseSearchItem } from "../dto/workout";
import { searchExercises } from "../services/workout";

export default function PlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState<{ open: boolean; dayId: number | null }>(
    { open: false, dayId: null }
  );

  const numId = parseInt(String(id), 10);

  function reload() {
    return getPlanById(numId).then(setPlan);
  }

  useFocusEffect(
    useCallback(() => {
      if (isNaN(numId)) {
        setLoading(false);
        return;
      }
      getPlanById(numId).then((p) => {
        setPlan(p);
        setLoading(false);
      });
    }, [numId])
  );

  function patchLocal(peId: number, sets: number, reps: number) {
    setPlan((p) =>
      p
        ? {
            ...p,
            days: p.days.map((d) => ({
              ...d,
              exercises: d.exercises.map((e) =>
                e.id === peId
                  ? { ...e, targetSets: sets, targetReps: reps }
                  : e
              ),
            })),
          }
        : p
    );
  }

  function changeSets(ex: { id: number; targetSets: number; targetReps: number }, delta: number) {
    const sets = Math.max(1, Math.min(10, ex.targetSets + delta));
    patchLocal(ex.id, sets, ex.targetReps);
    updatePlanExercise(ex.id, sets, ex.targetReps);
  }

  function changeReps(ex: { id: number; targetSets: number; targetReps: number }, delta: number) {
    const reps = Math.max(1, Math.min(100, ex.targetReps + delta));
    patchLocal(ex.id, ex.targetSets, reps);
    updatePlanExercise(ex.id, ex.targetSets, reps);
  }

  function removeEx(peId: number) {
    setPlan((p) =>
      p
        ? {
            ...p,
            days: p.days.map((d) => ({
              ...d,
              exercises: d.exercises.filter((e) => e.id !== peId),
            })),
          }
        : p
    );
    removePlanExercise(peId);
  }

  async function addEx(exercise: ExerciseSearchItem) {
    if (picker.dayId == null) return;
    await addPlanExercise(picker.dayId, exercise.id, 3, 10);
    setPicker({ open: false, dayId: null });
    reload();
  }

  async function handleUse() {
    setBusy(true);
    const newId = await useTemplate(numId);
    setBusy(false);
    if (newId != null) router.back();
    else Alert.alert("Error", "Could not use this plan.");
  }

  async function handleActivate() {
    setBusy(true);
    const ok = await activatePlan(numId);
    setBusy(false);
    if (ok) router.back();
  }

  function handleDelete() {
    Alert.alert("Delete plan", "Are you sure you want to delete this plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          const ok = await deletePlan(numId);
          setBusy(false);
          if (ok) router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {plan?.name ?? "Plan"}
        </Text>
        {plan && !plan.isTemplate ? (
          <Pressable onPress={() => setEditing((e) => !e)} hitSlop={10}>
            <Text style={styles.editBtn}>{editing ? "Done" : "Edit"}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : !plan ? (
        <Text style={styles.empty}>Plan not found.</Text>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.name}>{plan.name}</Text>
            {plan.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE PLAN</Text>
              </View>
            )}
            {plan.description ? (
              <Text style={styles.desc}>{plan.description}</Text>
            ) : null}

            {(() => {
              const renderTrainingDay = (day: PlanDetail["days"][number]) => (
                <View key={day.id} style={styles.dayCard}>
                  {day.dayOfWeek > 0 && (
                    <Text style={styles.dayWeekday}>
                      {weekdayName(day.dayOfWeek)}
                    </Text>
                  )}
                  <Text style={styles.dayName}>{day.name}</Text>
                  {day.exercises.map((ex) => (
                    <View key={ex.id} style={styles.exRow}>
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() =>
                          router.push({
                            pathname: "/exercise-detail",
                            params: { id: String(ex.exerciseId) },
                          } as any)
                        }
                      >
                        <Text style={styles.exName} numberOfLines={1}>
                          {ex.exerciseName}
                        </Text>
                        <Text style={styles.exMeta}>{ex.muscleGroup}</Text>
                      </Pressable>
                      {editing ? (
                        <View style={styles.editControls}>
                          <Stepper
                            value={ex.targetSets}
                            unit="sets"
                            onMinus={() => changeSets(ex, -1)}
                            onPlus={() => changeSets(ex, 1)}
                          />
                          <Stepper
                            value={ex.targetReps}
                            unit="reps"
                            onMinus={() => changeReps(ex, -1)}
                            onPlus={() => changeReps(ex, 1)}
                          />
                          <Pressable onPress={() => removeEx(ex.id)} hitSlop={8}>
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color={colors.danger}
                            />
                          </Pressable>
                        </View>
                      ) : (
                        <Text style={styles.exSets}>
                          {ex.targetSets} × {ex.targetReps}
                        </Text>
                      )}
                    </View>
                  ))}

                  {editing && (
                    <Pressable
                      style={styles.addExBtn}
                      onPress={() => setPicker({ open: true, dayId: day.id })}
                    >
                      <Ionicons name="add" size={18} color={colors.accent} />
                      <Text style={styles.addExText}>Add exercise</Text>
                    </Pressable>
                  )}
                </View>
              );

              const hasWeekdays = plan.days.some((d) => d.dayOfWeek > 0);
              if (!hasWeekdays) return plan.days.map(renderTrainingDay);

              return [1, 2, 3, 4, 5, 6, 7].map((dow) => {
                const day = plan.days.find((d) => d.dayOfWeek === dow);
                if (day) return renderTrainingDay(day);
                return (
                  <View key={`rest-${dow}`} style={styles.restCard}>
                    <Text style={styles.dayWeekday}>{weekdayName(dow)}</Text>
                    <Text style={styles.restText}>Rest day</Text>
                  </View>
                );
              });
            })()}
          </ScrollView>

          <View style={styles.footer}>
            {plan.isTemplate ? (
              <Pressable
                style={styles.primaryBtn}
                onPress={handleUse}
                disabled={busy}
              >
                <Text style={styles.primaryBtnText}>
                  {busy ? "Adding…" : "Use this plan"}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.ownActions}>
                {!plan.isActive && (
                  <Pressable
                    style={[styles.primaryBtn, { flex: 1 }]}
                    onPress={handleActivate}
                    disabled={busy}
                  >
                    <Text style={styles.primaryBtnText}>Set as active</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.deleteBtn, plan.isActive && { flex: 1 }]}
                  onPress={handleDelete}
                  disabled={busy}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>

          <AddExercisePicker
            visible={picker.open}
            onClose={() => setPicker({ open: false, dayId: null })}
            onSelect={addEx}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function Stepper({
  value,
  unit,
  onMinus,
  onPlus,
}: {
  value: number;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} hitSlop={6} style={styles.stepBtn}>
        <Ionicons name="remove" size={16} color={colors.text} />
      </Pressable>
      <View style={styles.stepValue}>
        <Text style={styles.stepNum}>{value}</Text>
        <Text style={styles.stepUnit}>{unit}</Text>
      </View>
      <Pressable onPress={onPlus} hitSlop={6} style={styles.stepBtn}>
        <Ionicons name="add" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

function AddExercisePicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (e: ExerciseSearchItem) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ExerciseSearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const h = setTimeout(async () => {
      setResults(await searchExercises(q));
      setSearching(false);
    }, 300);
    return () => clearTimeout(h);
  }, [term]);

  function close() {
    setTerm("");
    setResults([]);
    onClose();
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
          keyExtractor={(i) => String(i.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 18 }}
          renderItem={({ item }) => (
            <Pressable style={styles.resultRow} onPress={() => onSelect(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.resultMeta}>
                  {item.muscleGroup}
                  {item.equipment ? ` · ${item.equipment}` : ""}
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.accent} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.pickerEmpty}>
              {term.trim().length < 2
                ? "Type at least 2 letters."
                : "No exercises found."}
            </Text>
          }
        />
      </SafeAreaView>
    </Modal>
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
  content: { padding: 18, paddingBottom: 30 },
  name: { color: colors.text, fontSize: 22, fontWeight: "800" },
  activeBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  activeBadgeText: { color: colors.bg, fontSize: 10, fontWeight: "800" },
  desc: { color: colors.muted, fontSize: 14, marginTop: 10, lineHeight: 20 },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginTop: 16,
  },
  dayWeekday: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  restCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    padding: 14,
    marginTop: 16,
  },
  restText: { color: colors.muted, fontSize: 14, marginTop: 4 },
  dayName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  exName: { color: colors.text, fontSize: 14, fontWeight: "500" },
  exMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  exSets: { color: colors.accent, fontSize: 14, fontWeight: "700" },
  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  ownActions: { flexDirection: "row", gap: 12 },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  deleteBtnText: { color: colors.danger, fontSize: 15, fontWeight: "700" },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  editBtn: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  editControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: 8,
  },
  stepBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  stepValue: { alignItems: "center", minWidth: 34 },
  stepNum: { color: colors.text, fontSize: 14, fontWeight: "700" },
  stepUnit: { color: colors.muted, fontSize: 9 },
  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 6,
  },
  addExText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
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
  resultName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  resultMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pickerEmpty: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 40,
  },
});
