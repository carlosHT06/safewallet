// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email y contraseña son requeridos');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear usuario en AUTH
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const authUser = data.user;
      if (!authUser) throw new Error("No se pudo crear el usuario.");

      // 2. Insertar en tabla public.users
      const { error: insertError } = await supabase.from('users').insert({
        id: authUser.id,
        email,
        name,
        phone,
      });

      if (insertError) throw insertError;

      Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada.');
      navigation.goBack(); // regresar al Login
    } catch (err: any) {
      console.log("Register error:", err);
      Alert.alert("Error", err.message ?? "No se pudo registrar.");
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

      <Button
        title={loading ? 'Registrando...' : 'Registrarse'}
        onPress={handleRegister}
        disabled={loading}
      />

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
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 12, borderRadius: 6 },
  title: { fontSize: 22, marginBottom: 16, textAlign: 'center', fontWeight: '700' },
  backButton: { marginTop: 16, alignSelf: 'center' },
  backButtonText: { color: '#1976d2', fontSize: 14, fontWeight: '600' },
});
