import { StyleSheet, Text, TextProps } from 'react-native';
import { Fonts } from '../../theme/fonts';

export default function CaptionText(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.italic,
    fontSize: 12,
    color: '#6e6e6e',
    letterSpacing: 0.25,
  },
});
