import { StyleSheet, Text, TextProps } from 'react-native';

export default function PlayfairText(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Playfair-Normal',
    fontSize: 18,
    color: '#3c2f2f',
  },
});
