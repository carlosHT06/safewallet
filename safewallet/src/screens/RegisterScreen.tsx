import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Error', 'Email y contraseña son requeridos');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      // 1) Crear usuario en Auth (Supabase)
      console.log('[Register] Signing up user:', normalizedEmail);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      console.log('[Register] signUp response:', signUpData, signUpError);
      if (signUpError) {
        throw signUpError;
      }

      const authUser = signUpData.user ?? null;

      // Si no hay `user` devuelto, probablemente está activada la verificación por correo.
      // En ese caso, no intentamos insertar el perfil porque no tenemos authUser.id.
      if (!authUser) {
        Alert.alert(
          'Registrado - confirma tu correo',
          'Tu cuenta fue creada. Revisa tu correo y confirma tu cuenta antes de iniciar sesión.'
        );
        // Opcional: podrías guardar temporalmente los datos en localStorage para insertar después de confirmar.
        navigation.goBack();
        return;
      }

      // 2) Insertar en tabla public.users (perfil)
      console.log('[Register] Inserting profile into users table for id:', authUser.id);
      const insertPayload = {
        id: authUser.id,
        email: normalizedEmail,
        name: name?.trim() ?? null,
        phone: phone?.trim() ?? null,
      };

      const insertResp = await supabase.from('users').insert(insertPayload);
      console.log('[Register] insertResp:', insertResp);

      if (insertResp.error) {
        // Si falla el insert, podríamos considerar borrar el usuario de Auth o notificar,
        // pero aquí lanzamos el error para que el catch lo maneje.
        throw insertResp.error;
      }
     
     Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada.');
      navigation.goBack(); // volver al Login (o navigation.replace('AppTabs') si quieres entrar directo)
    } catch (err: any) {
      console.log('Register error:', err);
      // Algunos errores de supabase vienen en err.message o err.error_description
      const msg = err?.message ?? err?.error_description ?? 'No se pudo registrar.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        style={styles.input}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Teléfono"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TextInput
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleRegister}
        style={[styles.button, loading ? { opacity: 0.7 } : null]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      {/* --- BOTÓN PARA VOLVER AL LOGIN --- */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>← Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, justifyContent: 'center', backgroundColor: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
  title: { fontSize: 22, marginBottom: 16, textAlign: 'center', fontWeight: '700' },
  backButton: { marginTop: 16, alignSelf: 'center' },
  backButtonText: { color: '#1976d2', fontSize: 14, fontWeight: '600' },
  button: {
    backgroundColor: '#4caf50',
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
