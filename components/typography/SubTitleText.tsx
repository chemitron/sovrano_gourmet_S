import { StyleSheet, Text, TextProps } from 'react-native';
import { Fonts } from '../../theme/fonts';

export default function SubTitleText(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.bold,
    fontSize: 23,
    color: '#3c2f2f',
    letterSpacing: 0.5,
  },
});
