import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Optional: track auth state changes for debugging
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth State] event:', event, 'session:', session);
    });
    return () => {
      try {
        // @ts-ignore
        sub?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Error', 'Email y contraseña son requeridos');
      return;
    }

    setLoading(true);
    try {
      console.log('[Login] Attempting signInWithPassword for:', normalizedEmail);

      // 1) Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      console.log('[Login] signIn response:', signInData, signInError);
      if (signInError) {
        // show friendly message
        const msg = signInError.message ?? 'Correo o contraseña incorrectos.';
        Alert.alert('Error al iniciar sesión', msg);
        setLoading(false);
        return;
      }

      const user = signInData.user ?? null;
      if (!user) {
        // If no user returned, something odd happened (maybe email confirmation required)
        Alert.alert(
          'No autenticado',
          'El inicio de sesión no devolvió un usuario. Revisa si necesitas confirmar tu correo.'
        );
        setLoading(false);
        return;
      }

      // 2) Fetch profile from public.users using authenticated context
      try {
        console.log('[Login] Fetching profile for user id:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        console.log('[Login] profile fetch result:', profile, profileError);
        if (profileError) {
          // warn but allow login
          console.warn('[Login] profile fetch error:', profileError);
        } else if (!profile) {
          console.warn('[Login] profile not found in public.users for id:', user.id);
        } else {
          // you can store profile in state/context if needed
          console.log('[Login] profile:', profile);
        }
      } catch (profileFetchErr) {
        console.warn('[Login] exception fetching profile:', profileFetchErr);
      }

      // 3) navigate to app
      navigation.replace('AppTabs');
    } catch (err: any) {
      console.error('Login error (catch):', err);
      Alert.alert('Error', err?.message ?? 'Ocurrió un error inesperado.');
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
        <Text style={styles.title}>Iniciar sesión</Text>

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

        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.button, loading ? { opacity: 0.7 } : null]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text>¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}> Crear una</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#4caf50',
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  link: { color: '#1976d2', fontWeight: '700' },
});
