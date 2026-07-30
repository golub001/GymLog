import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme/colors";

type RingProps = {
  size?: number;
  stroke?: number;
  progress?: number; // 0..1
  color?: string;
  track?: string;
  children?: React.ReactNode;
};

export default function Ring({
  size = 96,
  stroke = 11,
  progress = 0,
  color = colors.accent,
  track = "rgba(255,255,255,0.06)",
  children,
}: RingProps) {
  const r = (size - stroke) / 2;
  const cir = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const half = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={half}
          cy={half}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={half}
          cy={half}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={cir}
          strokeDashoffset={cir * (1 - p)}
          transform={`rotate(-90 ${half} ${half})`}
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}
