import { useEffect, useRef } from "react";
import { Animated, ViewStyle, StyleProp } from "react-native";

type AnimatedCardProps = {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Wraps content with a subtle fade + slide-up entrance animation.
 * Runs once on mount. Pass `delay` to stagger multiple cards.
 */
export default function AnimatedCard({
  children,
  delay = 0,
  style,
}: AnimatedCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
