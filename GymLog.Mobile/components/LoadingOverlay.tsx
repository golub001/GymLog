import { useEffect, useRef, useState } from "react";
import { Animated, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function LoadingOverlay({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.logo}>
        Gym<Text style={{ color: colors.accent }}>Log</Text>
      </Text>
      <ActivityIndicator
        size="large"
        color={colors.accent}
        style={{ marginTop: 22 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  logo: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.text,
  },
});
