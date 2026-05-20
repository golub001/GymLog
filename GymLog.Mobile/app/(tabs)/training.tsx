import { Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function Training() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>
        Training
      </Text>
    </View>
  );
}