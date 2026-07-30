import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import Input from "../components/Input";
import { changePassword } from "../services/user";

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (current.length === 0) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    if (next === current) {
      setError("New password must be different from the current one.");
      return;
    }

    setSaving(true);
    const result = await changePassword(current, next);
    setSaving(false);

    if (result.ok) {
      Alert.alert("Done", "Your password has been changed.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      setError(result.error ?? "Could not change password.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Current password</Text>
        <Input
          placeholder="Current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
        />

        <Text style={styles.label}>New password</Text>
        <Input
          placeholder="New password"
          value={next}
          onChangeText={setNext}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm new password</Text>
        <Input
          placeholder="Repeat new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.accentText} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Change password</Text>
          )}
        </Pressable>
      </ScrollView>
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
  content: { padding: 18 },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 14,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 28,
  },
  saveBtnText: { color: colors.accentText, fontSize: 15, fontWeight: "700" },
});
