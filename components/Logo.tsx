import { Image, Platform, StatusBar, StyleSheet, View } from 'react-native';

export default function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
      },
      
      logo: {
        width: 100,
        height: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
});
