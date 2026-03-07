import { useState } from 'react';
import {
  Modal, Pressable, ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Button_style2 from '../../components/Button_style2';
import GradientBackground from '../../components/GradientBackground';
import TitleText from '../../components/typography/TitleText';

export default function PoliciesIndex() {

  const [privacyVisible, setPrivacyVisible] = useState(false);

  return (

  <GradientBackground>
  
        <Modal
    animationType="slide"
    transparent={true}
    visible={privacyVisible}
    onRequestClose={() => setPrivacyVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <TitleText>Política de Privacidad de Sovrano</TitleText>
        <ScrollView style={{ marginVertical: 10 }}>
          <Text style={styles.modalText}>
            Sovrano Gourmet respeta tu privacidad. Toda la información personal que
            compartes con nosotros se utiliza únicamente para brindarte nuestros
            servicios de gastronomia.{"\n\n"}
            No compartimos, vendemos ni transferimos tus datos a terceros bajo
            ninguna circunstancia.{"\n\n"}
            Tus datos se almacenan de manera segura y se utilizan solo para
            mejorar tu experiencia dentro de la aplicación.
          </Text>
        </ScrollView>
        <Pressable
          style={styles.modalButton}
          onPress={() => setPrivacyVisible(false)}
        >
          <Text style={{ color: "#fff" }}>Cerrar</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
          
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">         
  
        <View style={{ padding: 10 }}>
            <Button_style2
              title="Política de Privacidad"
              onPress={() => setPrivacyVisible(true)}
            />
        </View>
        </ScrollView>
      </GradientBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 0,
    justifyContent: 'flex-start',  
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inputText: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    color: '#6a4e2e', // elegant brown-gold tone
    fontFamily: 'Playfair-Bold',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'stretch',
  },
  sovranoContainer:{
    alignItems: 'center',     // centers horizontally
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  width: '85%',
  maxHeight: '70%',
},
modalText: {
  fontSize: 16,
  color: '#333',
  lineHeight: 22,
},
modalButton: {
  marginTop: 15,
  backgroundColor: '#d46b37ff',
  paddingVertical: 10,
  borderRadius: 5,
  alignItems: 'center',
},
});

