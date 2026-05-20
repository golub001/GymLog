import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { register } from "../../services/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleRegister() {
    setError(null);
    setLoading(true);

    const result = await register({ name, email, password });

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Registration failed");
      return;
    }

    if (result.token) {
      await signIn(result.token);
    }

  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>
        Gym<Text style={{ color: colors.accent }}>Log</Text>
      </Text>
      <Text style={styles.subtitle}>Create your account</Text>

      <View style={styles.form}>
        <Input placeholder="Name" value={name} onChangeText={setName} />
        <Input placeholder="Email" value={email} onChangeText={setEmail} />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button title={loading ? "Creating..." : "Create account"} onPress={handleRegister} />
        <Link href="/login" style={styles.link}>
          Already have an account? Log in
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center" },
  logo: { fontSize: 34, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 6 },
  form: { marginTop: 40 },
  errorText: { color: colors.danger, fontSize: 13, textAlign: "center", marginBottom: 10 },
  link: { color: colors.muted, textAlign: "center", marginTop: 16, fontSize: 12 },
});