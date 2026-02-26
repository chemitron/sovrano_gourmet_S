import { LinearGradient } from 'expo-linear-gradient';
import { ColorValue, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]]; // ✅ tuple type
};

export default function GradientBackground({ children, style, colors }: Props) {
  return (
    <LinearGradient
      colors={colors ?? ['#E9E4D4', '#D1B380']}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
