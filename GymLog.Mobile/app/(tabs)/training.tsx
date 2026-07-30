import { useCallback, useRef, useState } from "react";
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
import { Calendar, DateData } from "react-native-calendars";
import { colors } from "../../theme/colors";
import { WorkoutDetail } from "../../dto/workout";
import { getActiveDays, getWorkoutsByDate } from "../../services/workout";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Training() {
  const router = useRouter();

  const [selected, setSelected] = useState(todayIso());
  const [visibleMonth, setVisibleMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutDetail[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // keep current values readable inside the focus effect without re-running it
  const visibleMonthRef = useRef(visibleMonth);
  visibleMonthRef.current = visibleMonth;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const loadActiveDays = useCallback(
    async (year: number, month: number) => {
      const days = await getActiveDays(year, month);
      setActiveDays(days);
    },
    []
  );

  const loadWorkouts = useCallback(async (date: string) => {
    setLoadingDetail(true);
    const data = await getWorkoutsByDate(date);
    setWorkouts(data);
    setLoadingDetail(false);
  }, []);

  // runs only when the screen (re)gains focus — not on month/day changes
  useFocusEffect(
    useCallback(() => {
      loadActiveDays(visibleMonthRef.current.year, visibleMonthRef.current.month);
      loadWorkouts(selectedRef.current);
    }, [loadActiveDays, loadWorkouts])
  );

  function handleDayPress(day: DateData) {
    setSelected(day.dateString);
    loadWorkouts(day.dateString);
  }

  function handleMonthChange(month: DateData) {
    setVisibleMonth({ year: month.year, month: month.month });
    loadActiveDays(month.year, month.month);
  }

  const markedDates: Record<string, any> = {};
  for (const d of activeDays) {
    markedDates[d] = { marked: true, dotColor: colors.accent };
  }
  markedDates[selected] = {
    ...(markedDates[selected] || {}),
    selected: true,
    selectedColor: colors.accent,
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Training</Text>
        <Pressable
          style={styles.logBtn}
          onPress={() => router.push("/log-workout" as any)}
        >
          <Ionicons name="add" size={20} color={colors.bg} />
          <Text style={styles.logBtnText}>Log</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Calendar
          current={selected}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          firstDay={1}
          theme={{
            calendarBackground: colors.surface,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            textSectionTitleColor: colors.muted,
            todayTextColor: colors.accent,
            selectedDayTextColor: colors.bg,
            selectedDayBackgroundColor: colors.accent,
            arrowColor: colors.accent,
            textDisabledColor: colors.line,
          }}
          style={styles.calendar}
        />

        <Text style={styles.sectionLabel}>{formatHeading(selected)}</Text>

        {loadingDetail ? (
          <ActivityIndicator
            color={colors.accent}
            style={{ marginTop: 30 }}
          />
        ) : workouts.length === 0 ? (
          <Text style={styles.emptyText}>No workout logged on this day.</Text>
        ) : (
          workouts.map((w, wi) => (
            <View key={w.id} style={styles.workoutCard}>
              {workouts.length > 1 && (
                <View style={styles.workoutHeader}>
                  <Ionicons name="barbell" size={14} color={colors.accent} />
                  <Text style={styles.workoutHeaderText}>Workout {wi + 1}</Text>
                </View>
              )}
              {w.notes ? <Text style={styles.notes}>{w.notes}</Text> : null}
              {w.exercises.map((ex) => (
                <View key={ex.exerciseId} style={styles.exerciseBlock}>
                  <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                  <Text style={styles.exerciseMeta}>{ex.muscleGroup}</Text>
                  {ex.sets.map((s) => (
                    <View key={s.setOrder} style={styles.setRow}>
                      <Text style={styles.setIndex}>{s.setOrder}</Text>
                      <Text style={styles.setText}>
                        {formatWeight(s.weightKg)} kg × {s.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(2).replace(/\.?0+$/, "");
}

function formatHeading(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
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
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  logBtnText: {
    color: colors.accentText,
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    padding: 18,
    paddingBottom: 36,
  },
  calendar: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    paddingBottom: 8,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 14,
  },
  notes: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  workoutHeaderText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exerciseBlock: {
    marginBottom: 14,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 3,
  },
  setIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
  },
  setText: {
    color: colors.text,
    fontSize: 14,
  },
});
