import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) newErrors.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Correo inválido';

    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validate()) return;

    Alert.alert('Bienvenido', 'Inicio de sesión exitoso', [
      {
        text: 'Continuar',
        onPress: () => navigation.replace('AppTabs'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* imagen local (usa la que ya trae Expo) */}
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>SafeWallet</Text>

      <CustomInput
        label="Correo"
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />

      <CustomInput
        label="Contraseña"
        placeholder="******"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <CustomButton title="Ingresar" onPress={handleLogin} />

      <CustomButton
        title="Crear cuenta"
        variant="secondary"
        onPress={() => navigation.navigate('Register')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#ffffff' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginVertical: 20 },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 8 },
});

export default LoginScreen;
