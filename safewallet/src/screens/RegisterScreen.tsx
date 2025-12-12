// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase, createUserProfile } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const { refreshProfile } = useAuth();

  const handleRegister = async () => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        Alert.alert('Error', 'Email y contraseña son requeridos');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirm) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        return;
      }

      setLoading(true);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) {
        console.error('[Register] signUp error', signUpError);
        Alert.alert('Error al registrarse', signUpError.message ?? 'No se pudo crear la cuenta.');
        setLoading(false);
        return;
      }

      const user = signUpData?.user ?? null;
      console.log('[Register] signUp result user:', user?.id);

      if (user && user.id) {
        try {
          const created = await createUserProfile({
            id: user.id,
            email: normalizedEmail,
            name: name || null,
            phone: phone || null,
            budget: 0,
          });
          console.log('[Register] createUserProfile result', created);
        } catch (e) {
          console.warn('[Register] createUserProfile failed', e);
        }
      }

      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          console.warn('[Register] auto signIn failed', signInError);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          setLoading(false);
          Alert.alert('Registro completado', 'Revisa tu correo para confirmar la cuenta (si aplica). Inicia sesión después.');
          return;
        }

        console.log('[Register] auto signIn success:', signInData?.user?.id);

        try {
          await refreshProfile();
          console.log('[Register] refreshProfile OK');
        } catch (e) {
          console.warn('[Register] refreshProfile failed', e);
        }

        navigation.reset({ index: 0, routes: [{ name: 'AppTabs' }] });
      } catch (e) {
        console.error('[Register] signIn exception', e);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } catch (e) {
      console.error('[Register] unexpected error', e);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Crear cuenta</Text>

        <TextInput placeholder="Nombre (opcional)" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Teléfono (opcional)" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TextInput placeholder="Contraseña (min 6)" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
        <TextInput placeholder="Confirmar contraseña" secureTextEntry value={confirm} onChangeText={setConfirm} style={styles.input} />

        <TouchableOpacity onPress={handleRegister} style={[styles.button, loading ? { opacity: 0.7 } : null]} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}> Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 16, flex: 1, justifyContent: 'center' },
  title: { fontSize: 22, marginBottom: 16, textAlign: 'center', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 12, borderRadius: 6 },
  button: { backgroundColor: '#1976d2', marginTop: 6, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  link: { color: '#1976d2', fontWeight: '700' },
});
