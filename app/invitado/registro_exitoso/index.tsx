import { router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Button_style2 from '../../../components/Button_style2';
import GradientBackground from '../../../components/GradientBackground';
import Logo from '../../../components/Logo';
import BodyBoldText from '../../../components/typography/BodyBoldText';
import BodyText from '../../../components/typography/BodyText';
import SubTitleText from '../../../components/typography/SubTitleText';

export default function Registro_exitosoIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;

  // Read params from the URL
  const { username, email, autoNumber } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen 
      options={{ 
        title: "Registro Exitoso", 
        headerBackVisible: false, 
        }} 
      />
    <GradientBackground>
      <View style={styles.container}>
        <View style={{ paddingHorizontal: 24, gap: 10 }}>
          <Logo />
          <View style={{ marginLeft: 24 }}>
            <SubTitleText>Gracias por registrarte</SubTitleText>
          </View>

          <BodyBoldText>
            Por favor usa el enlace enviado a tu correo electronico para verificacion de tu cuenta
          </BodyBoldText>

          <BodyBoldText>
            Mira tu folder de correo no deseado si no lo encuentras
          </BodyBoldText>

          <View style={styles.inlineText}>
            <BodyBoldText>Nombre: </BodyBoldText>
            <BodyText>{username}</BodyText>
          </View>

          <View style={styles.inlineText}>
            <BodyBoldText>Correo electronico: </BodyBoldText>
            <BodyText>{email}</BodyText>
          </View>

          <View style={styles.inlineText}>
            <BodyBoldText>Usuario ID: </BodyBoldText>
            <BodyText>{autoNumber}</BodyText>
          </View>

          <View style={{ padding: 24 }}>
            <Button_style2
              title="Vuelve al inicio"
              onPress={() =>
                router.replace("/login")
              }
            />
          </View>
        </View>
      </View>
    </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  inlineText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
