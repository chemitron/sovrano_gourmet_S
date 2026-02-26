import { StyleSheet, Text, TextProps } from 'react-native';
import { Fonts } from '../../theme/fonts';

export default function ButtonText(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#3e3e3e',
    letterSpacing: 0.5,
    textAlign: 'center',
    width: '100%',
  },
});
