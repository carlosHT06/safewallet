import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name) newErrors.name = 'El nombre es obligatorio';

    if (!phone) newErrors.phone = 'El teléfono es obligatorio';
    else if (!/^\d{8}$/.test(phone)) newErrors.phone = 'Debe tener 8 dígitos';

    if (!email) newErrors.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Correo inválido';

    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (confirm !== password) newErrors.confirm = 'Las contraseñas no coinciden';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;

    Alert.alert('Cuenta creada', 'Tu usuario de SafeWallet ha sido registrado.', [
      {
        text: 'Ir al login',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <CustomInput
        label="Nombre completo"
        placeholder="Carlos Herrera"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />

      <CustomInput
        label="Teléfono"
        placeholder="88888888"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
      />

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

      <CustomInput
        label="Confirmar contraseña"
        placeholder="******"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
      />

      <CustomButton title="Registrarme" onPress={handleRegister} />

      <CustomButton
        title="Ya tengo cuenta"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#ffffff' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
});

export default RegisterScreen;
