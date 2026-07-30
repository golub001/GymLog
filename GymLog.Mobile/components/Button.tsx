import { useRef } from "react";
import { Pressable, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../theme/colors";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
};

export default function Button({ title, onPress, variant = "primary" }: ButtonProps) {
  const isGhost = variant === "ghost";
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }

  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.base, isGhost ? styles.ghost : styles.primary]}
      >
        <Text style={[styles.text, isGhost ? styles.ghostText : styles.primaryText]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  primaryText: {
    color: colors.accentText,
  },
  ghostText: {
    color: colors.text,
  },
});
