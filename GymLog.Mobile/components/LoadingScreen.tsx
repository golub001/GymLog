import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

// Prikazuje se dok aplikacija odlucuje kuda da posalje korisnika
// (provera tokena / onboarding statusa).
export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Gym<Text style={{ color: colors.accent }}>Log</Text>
      </Text>
      <ActivityIndicator
        size="large"
        color={colors.accent}
        style={{ marginTop: 22 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.text,
  },
});
