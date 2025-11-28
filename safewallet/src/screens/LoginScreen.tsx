// src/screens/LoginScreen.tsx
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { supabase, getUserByEmail } from '../services/supabase';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // opcional: escucha cambios de sesión (útil para depuración)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH EVENT]', event, session);
    });
    return () => {
      try { sub.subscription.unsubscribe(); } catch {}
    };
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Correo requerido';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Correo inválido';
    if (!password) newErrors.password = 'Contraseña requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // DEBUG: qué URL está usando el cliente
      // @ts-ignore
      console.log('DEBUG Supabase URL (client):', (supabase as any).rest?.url ?? 'unknown');

      // DEBUG: listar todas las filas en public.users (ver si la fila existe en la base que lee la app)
      try {
        const all = await supabase.from('users').select('*');
        console.log('DEBUG public.users rows:', all);
      } catch (e) {
        console.warn('DEBUG could not select users table:', e);
      }

      // 1) comprobar que exista el usuario en la tabla (evita entrar "por las buenas")
      const userRow = await getUserByEmail(email);
      console.log('BUSCANDO USUARIO EN BD:', userRow);

      if (!userRow) {
        Alert.alert('Usuario no encontrado', 'No existe una cuenta registrada con ese correo.');
        setLoading(false);
        return;
      }

      // 2) intentar autenticar con la contraseña
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Manejo exhaustivo de errores
      if (signInError) {
        console.log('[signInWithPassword] errorObject:', signInError);
        // Mensajes según tipo
        // signInError.status y signInError.message pueden ayudar
        const msg = signInError.message ?? 'Correo o contraseña incorrectos.';
        Alert.alert('Error al iniciar sesión', msg);
        setLoading(false);
        return;
      }

      console.log('SignIn success:', signInData);
      // redirigir a la app
      navigation.replace('AppTabs');
    } catch (err: any) {
      console.error('Login error (catch):', err);
      Alert.alert('Error', err?.message ?? 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => navigation.navigate('Register');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.box}>
        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((s) => ({ ...s, email: undefined }));
          }}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, errors.email && styles.inputError]}
        />
        {errors.email ? <Text style={styles.errText}>{errors.email}</Text> : null}

        <Text style={[styles.label, { marginTop: 12 }]}>Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errors.password) setErrors((s) => ({ ...s, password: undefined }));
          }}
          placeholder="********"
          secureTextEntry
          style={[styles.input, errors.password && styles.inputError]}
        />
        {errors.password ? <Text style={styles.errText}>{errors.password}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text>¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={goToRegister}>
            <Text style={styles.link}> Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  box: { backgroundColor: '#fafafa', padding: 18, borderRadius: 8, elevation: 2 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputError: { borderColor: '#f44336' },
  errText: { color: '#f44336', marginTop: 6, fontSize: 12 },
  button: {
    backgroundColor: '#4caf50',
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  link: { color: '#1976d2', fontWeight: '700' },
});
