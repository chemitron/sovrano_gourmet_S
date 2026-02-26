import { LinearGradient } from 'expo-linear-gradient';
import { ColorValue, Pressable, StyleSheet, ViewStyle } from 'react-native';
import ButtonText from '../components/typography/ButtonText';

interface ButtonStyle2Props {
  title: string;
  onPress: () => void;
  gradientColors?: [ColorValue, ColorValue, ...ColorValue[]];
  textColor?: string;
  style?: ViewStyle;
  disabled?: boolean;   // ✅ new prop
}

export default function Button_style2({
  title,
  onPress,
  gradientColors = ['#c2b280', '#a68f5b'],
  textColor = '#000000',
  style = {},
  disabled = false,     // ✅ default false
}: ButtonStyle2Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}   // ✅ block presses when disabled
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrapper,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabledWrapper,      // ✅ add disabled style
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#d3d3d3', '#a9a9a9'] : gradientColors} // ✅ grey gradient when disabled
        style={styles.gradient}
      >
        <ButtonText style={{ color: disabled ? '#888' : textColor, fontWeight: '500' }}>
          {title}
        </ButtonText>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabledWrapper: {
    opacity: 0.6,   // ✅ visually dim the whole button
    shadowOpacity: 0.1,
  },
});
