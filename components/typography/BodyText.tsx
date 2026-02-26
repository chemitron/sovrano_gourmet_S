import { StyleSheet, Text, TextProps } from 'react-native';
import { Fonts } from '../../theme/fonts';

export default function BodyText(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
});
